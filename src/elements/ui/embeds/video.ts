import { AppBskyEmbedVideo } from "@atcute/client/lexicons";
import { elem } from "../../blocks/elem";

export function loadEmbedVideo(embed: AppBskyEmbedVideo.Main) {
  console.log(embed.video);
  return [elem("div", { innerHTML: "imagine a video" })];
}
