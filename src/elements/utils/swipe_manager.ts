export const createSwipeAction = (
  object: HTMLElement,
  action: (
    coords: { startX: number; startY: number; endX: number; endY: number },
    e?: TouchEvent,
  ) => void,
) => {
  interface TouchCoords {
    x: number;
    y: number;
  }

  let startCoords: TouchCoords | null = null;
  let isHorizontalScroll = false;
  let isVerticalScroll = false;
  let ignore = false;

  const resetState = () => {
    startCoords = null;
    isHorizontalScroll = false;
    isVerticalScroll = false;
    ignore = false;
  };

  const handleTouchStart = (e: TouchEvent) => {
    if (e.touches.length > 1) {
      ignore = true;
      startCoords = null;
      return;
    }

    const element = e.target as HTMLElement;
    if (element.closest(".multi")) {
      ignore = true;
      startCoords = null;
      return;
    }

    // Check if any refreshing is happening
    const refreshIndicator = document.querySelector('[data-refreshing="true"]');
    if (refreshIndicator) {
      ignore = true;
      startCoords = null;
      return;
    }

    startCoords = {
      x: e.changedTouches[0].screenX,
      y: e.changedTouches[0].screenY,
    };
    ignore = false;
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (ignore || !startCoords) return;

    const currentX = e.changedTouches[0].screenX;
    const currentY = e.changedTouches[0].screenY;
    const deltaX = Math.abs(currentX - startCoords.x);
    const deltaY = Math.abs(currentY - startCoords.y);

    if (!isHorizontalScroll && !isVerticalScroll) {
      isHorizontalScroll = deltaX > deltaY;
      isVerticalScroll = deltaY > deltaX;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (ignore || !startCoords) {
      resetState();
      return;
    }

    const endCoords = {
      x: e.changedTouches[0].screenX,
      y: e.changedTouches[0].screenY,
    };

    action(
      {
        startX: startCoords.x,
        startY: startCoords.y,
        endX: endCoords.x,
        endY: endCoords.y,
      },
      e,
    );

    resetState();
  };

  object.addEventListener("touchstart", handleTouchStart, false);
  object.addEventListener("touchmove", handleTouchMove, { passive: false });
  object.addEventListener("touchend", handleTouchEnd, false);
};
export const pullToRefresh = (
  container: HTMLElement,
  threshold: number = 80,
  onRefresh: () => Promise<void>,
  showThreshold: number = 20,
) => {
  let startY = 0;
  let currentY = 0;
  let refreshing = false;
  let pulling = false;

  const margin = 40;

  const createSpinner = () => {
    const spinner = document.createElement("div");
    return spinner;
  };

  const createPullIndicator = (spinner: HTMLElement) => {
    const indicator = document.createElement("div");
    indicator.id = "pull-indicator";
    indicator.appendChild(spinner);
    return indicator;
  };

  const addSpinAnimation = () => {
    const style = document.createElement("style");
    style.textContent = `@keyframes spin{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}`;
    document.head.appendChild(style);
  };

  const spinner = createSpinner();
  const pullDownIndicator = createPullIndicator(spinner);
  container.appendChild(pullDownIndicator);
  addSpinAnimation();

  const handleTouchStart = (e: TouchEvent) => {
    if (
      (document.documentElement.scrollTop || document.body.scrollTop) > 0 ||
      refreshing
    )
      return;
    startY = e.touches[0].clientY;
    pulling = true;
    pullDownIndicator.style.opacity = "0";
    spinner.style.animation = "none";
    spinner.style.transform = "rotate(0deg)";
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!pulling) return;

    currentY = e.touches[0].clientY;
    const pullDistance = Math.max(0, currentY - startY);
    const newDistance = Math.min(threshold, pullDistance * 0.4);

    if (newDistance > 0) {
      e.preventDefault();
      if (newDistance > showThreshold) {
        pullDownIndicator.style.opacity = "1";
        const adjustedDistance = newDistance - showThreshold;
        const rotation = (adjustedDistance / (threshold - showThreshold)) * 360;
        pullDownIndicator.style.transform = `translateX(-50%) translateY(${adjustedDistance + margin}px)`;
        spinner.style.transform = `rotate(${rotation}deg)`;
      } else {
        pullDownIndicator.style.opacity = "0";
        pullDownIndicator.style.transform = "translateX(-50%) translateY(40px)";
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!pulling) return;
    pulling = false;

    const pullDistance = Math.max(0, currentY - startY) * 0.4;
    if (pullDistance > threshold && !refreshing) {
      refreshing = true;
      pullDownIndicator.dataset.refreshing = "true";
      spinner.style.animation = "spin 1s linear infinite";
      pullDownIndicator.style.transform = `translateX(-50%) translateY(${threshold - showThreshold + margin}px)`;

      try {
        await onRefresh();
      } finally {
        refreshing = false;
        delete pullDownIndicator.dataset.refreshing;
        spinner.style.animation = "none";
        pullDownIndicator.style.transform = `translateX(-50%) translateY(${margin}px)`;
        pullDownIndicator.style.opacity = "0";
      }
    } else {
      pullDownIndicator.style.transform = `translateX(-50%) translateY(${margin}px)`;
      pullDownIndicator.style.opacity = "0";
    }
  };

  container.addEventListener("touchstart", handleTouchStart);
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd);
};
