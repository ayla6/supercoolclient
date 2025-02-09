export const createSwipeAction = (
  object: HTMLElement,
  action: (coords: {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  }) => void,
) => {
  let startX: number;
  let startY: number;
  let endX: number;
  let endY: number;
  let isHorizontalScroll = false;
  let isVerticalScroll = false;

  object.addEventListener(
    "touchstart",
    function (event) {
      startX = event.changedTouches[0].screenX;
      startY = event.changedTouches[0].screenY;
      isHorizontalScroll = false;
      isVerticalScroll = false;
    },
    false,
  );

  object.addEventListener(
    "touchmove",
    function (event) {
      const currentX = event.changedTouches[0].screenX;
      const currentY = event.changedTouches[0].screenY;
      const deltaX = Math.abs(currentX - startX);
      const deltaY = Math.abs(currentY - startY);

      if (!isHorizontalScroll && !isVerticalScroll) {
        if (deltaX > deltaY) {
          isHorizontalScroll = true;
        } else if (deltaY > deltaX) {
          isVerticalScroll = true;
        }
      }

      if (isHorizontalScroll) {
        event.preventDefault();
      }
    },
    { passive: false },
  );

  object.addEventListener(
    "touchend",
    function (event) {
      endX = event.changedTouches[0].screenX;
      endY = event.changedTouches[0].screenY;
      action({ startX, startY, endX, endY });
      isHorizontalScroll = false;
      isVerticalScroll = false;
    },
    false,
  );
};
