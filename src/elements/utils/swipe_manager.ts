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

  const resetState = () => ({
    startCoords: null,
    isHorizontalScroll: false,
    isVerticalScroll: false,
    ignore: false,
  });

  const handleTouchStart = (e: TouchEvent) => {
    // Ignore multi-touch gestures
    if (e.touches.length > 1 || (e.target as HTMLElement).closest(".multi")) {
      startCoords = null;
      ignore = true;
      return;
    }

    // Check for active refresh state
    if (document.querySelector('[data-refreshing="true"]')) {
      startCoords = null;
      ignore = true;
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

    const { screenX: currentX, screenY: currentY } = e.changedTouches[0];
    const deltaX = Math.abs(currentX - startCoords.x);
    const deltaY = Math.abs(currentY - startCoords.y);

    if (!isHorizontalScroll && !isVerticalScroll) {
      isHorizontalScroll = deltaX > deltaY;
      isVerticalScroll = !isHorizontalScroll;
    }
  };

  const handleTouchEnd = (e: TouchEvent) => {
    if (ignore || !startCoords) {
      Object.assign(this, resetState());
      return;
    }

    const { screenX: endX, screenY: endY } = e.changedTouches[0];

    action(
      {
        startX: startCoords.x,
        startY: startCoords.y,
        endX,
        endY,
      },
      e,
    );

    Object.assign(this, resetState());
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
  const state = {
    startY: 0,
    currentY: 0,
    refreshing: false,
    pulling: false,
  };

  const styles = {
    spinner: `
      width: 20px;
      height: 20px;
      border: 2px solid #fff;
      border-top: 2px solid transparent;
      border-radius: 50%;
      display: block;
    `,
    indicator: `
      position: fixed;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: var(--accent-color);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s;
      color: white;
      opacity: 0;
    `,
  };

  const createSpinner = () => {
    const spinner = document.createElement("div");
    spinner.style.cssText = styles.spinner;
    return spinner;
  };

  const createPullIndicator = (spinner: HTMLElement) => {
    const indicator = document.createElement("div");
    indicator.style.cssText = styles.indicator;
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
  document.body.appendChild(pullDownIndicator);
  addSpinAnimation();

  const handleTouchStart = (e: TouchEvent) => {
    if (container.scrollTop > 0 || state.refreshing) return;

    state.startY = e.touches[0].clientY;
    state.pulling = true;

    pullDownIndicator.style.opacity = "0";
    spinner.style.animation = "none";
    spinner.style.transform = "rotate(0deg)";
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!state.pulling) return;

    state.currentY = e.touches[0].clientY;
    const pullDistance = Math.max(0, state.currentY - state.startY);
    const newDistance = Math.min(threshold, pullDistance * 0.4);

    if (newDistance > 0) {
      e.preventDefault();

      if (newDistance > showThreshold) {
        const adjustedDistance = newDistance - showThreshold;
        const rotation = (adjustedDistance / (threshold - showThreshold)) * 360;

        pullDownIndicator.style.opacity = "1";
        pullDownIndicator.style.transform = `translateX(-50%) translateY(${adjustedDistance}px)`;
        spinner.style.transform = `rotate(${rotation}deg)`;
      } else {
        pullDownIndicator.style.opacity = "0";
        pullDownIndicator.style.transform = "translateX(-50%) translateY(0)";
      }
    }
  };

  const handleTouchEnd = async () => {
    if (!state.pulling) return;
    state.pulling = false;

    const pullDistance = Math.max(0, state.currentY - state.startY) * 0.4;

    if (pullDistance > threshold && !state.refreshing) {
      state.refreshing = true;
      pullDownIndicator.dataset.refreshing = "true";
      spinner.style.animation = "spin 1s linear infinite";
      pullDownIndicator.style.transform = `translateX(-50%) translateY(${threshold - showThreshold}px)`;

      try {
        await onRefresh();
      } finally {
        state.refreshing = false;
        delete pullDownIndicator.dataset.refreshing;
        spinner.style.animation = "none";
        pullDownIndicator.style.transform = "translateX(-50%) translateY(0)";
        pullDownIndicator.style.opacity = "0";
      }
    } else {
      pullDownIndicator.style.transform = "translateX(-50%) translateY(0)";
      pullDownIndicator.style.opacity = "0";
    }
  };

  container.addEventListener("touchstart", handleTouchStart);
  container.addEventListener("touchmove", handleTouchMove, { passive: false });
  container.addEventListener("touchend", handleTouchEnd);
};
