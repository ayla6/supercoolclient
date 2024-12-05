import Hls from "hls.js";
import { AppBskyEmbedDefs, AppBskyEmbedVideo } from "@atcute/client/lexicons";
import { elem } from "../../utils/elem";
import { getProperSize } from "../../utils/get_proper_size";

function loadVideo(embed: AppBskyEmbedVideo.View, style: string) {
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
    loop: true,
  });
  hls.attachMedia(videoElem);
  const videoContainer = elem("div", { className: "video-container" }, [
    videoElem,
  ]);
  if (style) videoContainer.style.cssText = style;
  return videoContainer;
}

export function loadEmbedVideo(
  embed: AppBskyEmbedVideo.Main,
  viewEmbed: AppBskyEmbedVideo.View,
  did: string,
) {
  const thumbnail = elem("div", { className: "video-thumbnail" }, [
    elem("img", {
      src: viewEmbed.thumbnail,
    }),
    elem("div", { className: "play-button" }),
  ]);
  const mediaContainer = elem("div", { className: "media-container" }, [
    thumbnail,
  ]);

  let style: string = getProperSize(viewEmbed.aspectRatio, true);
  thumbnail.style.cssText = style;

  thumbnail.addEventListener("click", () => {
    mediaContainer.append(loadVideo(viewEmbed, style));
    thumbnail.remove();
  });

  return [mediaContainer];
}
