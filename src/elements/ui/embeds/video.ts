import Hls from "hls.js";
import { AppBskyEmbedDefs, AppBskyEmbedVideo } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";
import { getProperSize, singleImageHeight } from "../../blocks/get_proper_size";

function loadVideo(embed: AppBskyEmbedVideo.View, style?: string) {
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
  if (style) videoElem.style.cssText = style;
  hls.attachMedia(videoElem);
  return videoElem;
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
  const videoContainer = elem("div", { className: "media-container" }, [
    thumbnail,
  ]);

  const aspectRatio = viewEmbed.aspectRatio;
  let style: string;
  if (aspectRatio) {
    const properSize = getProperSize(aspectRatio, singleImageHeight);
    style = `aspect-ratio: ${viewEmbed.aspectRatio.width}/${viewEmbed.aspectRatio.height}; width: ${properSize.width}px`;
    thumbnail.style.cssText = style;
  }

  thumbnail.addEventListener("click", () => {
    videoContainer.append(loadVideo(viewEmbed, style));
    thumbnail.remove();
  });

  return [videoContainer];
}
