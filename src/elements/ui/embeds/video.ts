import Hls from "hls.js";
import { AppBskyEmbedVideo } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";

const loadVideo = (embed: AppBskyEmbedVideo.View) => {
  // stole from aglais!!
  const hls = new Hls({
    capLevelToPlayerSize: true,
    startLevel: 1,
    xhrSetup(xhr, urlString) {
      const url = new URL(urlString);

      // Just in case it fails, we'll remove `session_id` everywhere
      url.searchParams.delete("session_id");

      xhr.open("get", url.toString());
    },
  });

  hls.loadSource(
    embed.playlist.replace("video.bsky.app/watch", "video.cdn.bsky.app/hls"),
  );
  const videoElem = elem("video", {
    controls: true,
    autoplay: true,
  });
  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    videoElem.onloadedmetadata = () => {
      if (videoElem.duration <= 5) videoElem.loop = true;
      videoElem.play();
    };
  });
  hls.attachMedia(videoElem);
  const videoContainer = elem(
    "div",
    { className: "video-container" },
    videoElem,
  );
  return videoContainer;
};

export const loadEmbedVideo = (embed: AppBskyEmbedVideo.View) => {
  const thumbnail = elem("div", { className: "video-thumbnail" }, undefined, [
    elem("img", {
      src: embed.thumbnail,
    }),
    elem("div", { className: "play-button" }),
  ]);
  const mediaContainer = elem(
    "div",
    { className: "media-container has-controls" },
    thumbnail,
  );

  thumbnail.addEventListener("click", () => {
    mediaContainer.appendChild(loadVideo(embed));
    thumbnail.remove();
  });

  return mediaContainer;
};
