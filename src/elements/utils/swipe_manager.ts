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

    if (isHorizontalScroll) {
      e.preventDefault();
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
