import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";

const gifClick = (e: MouseEvent) => {
  //i saw this on aglais but like this is  basically the only option right
  const video = e.currentTarget as HTMLVideoElement;

  e.stopPropagation();
  e.preventDefault();

  if (video.paused) video.play();
  else video.pause();
};

function loadVideo(videoUrl: string, style: string) {
  const videoElem = elem("video", {
    src: videoUrl,
    autoplay: true,
    loop: true,
    muted: true,
  });
  videoElem.addEventListener("click", gifClick);

  const videoContainer = elem(
    "div",
    { className: "video-container no-controls" },
    videoElem,
  );
  if (style) videoContainer.style.cssText = style;

  return videoContainer;
}

export function loadEmbedGif(url: URL) {
  const urlParams = new URLSearchParams(url.search);
  const aspectRatio = {
    width: Number(urlParams.get("ww") ?? 1600),
    height: Number(urlParams.get("hh") ?? 900),
  };
  const gifId = url.pathname.slice(1, url.pathname.indexOf("/", 2) - 2);
  const gifName = url.pathname.slice(url.pathname.lastIndexOf("/") + 1);
  const videoUrl = `https://t.gifs.bsky.app/${gifId}P3/${gifName}`;
  const thumbnailUrl = `https://t.gifs.bsky.app/${gifId}AF/${gifName}`;

  const thumbnail = elem("div", { className: "video-thumbnail" }, undefined, [
    elem("img", {
      src: thumbnailUrl,
      loading: "lazy",
    }),
    elem("div", { className: "play-button" }),
  ]);

  let style: string = getProperSize(aspectRatio);
  thumbnail.style.cssText = style;

  const mediaContainer = elem(
    "div",
    { className: "media-container" },
    thumbnail,
  );

  thumbnail.addEventListener("click", () => {
    mediaContainer.appendChild(loadVideo(videoUrl, style));
    thumbnail.remove();
  });

  return mediaContainer;
}
