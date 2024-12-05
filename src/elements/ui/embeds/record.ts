import { elem } from "../../utils/elem";
import { escapeHTML } from "../../utils/text_processing";
import { AppBskyEmbedRecord } from "@atcute/client/lexicons";

export function loadEmbedRecord(
  embed: AppBskyEmbedRecord.Main,
  viewEmbed: AppBskyEmbedRecord.View,
  did: string,
) {
  const uri = embed.record.uri.split("/");
  return [
    elem("a", {
      href: `/${uri[2]}/post/${uri[4]}`,
      innerHTML: escapeHTML(embed.record.uri),
      className: "record-link",
    }),
  ];
}
