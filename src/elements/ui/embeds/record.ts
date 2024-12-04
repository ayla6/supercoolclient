import { elem } from "../../blocks/elem";
import { escapeHTML } from "../../blocks/text_processing";
import { AppBskyEmbedRecord } from "@atcute/client/lexicons";

export function loadEmbedRecord(embed: AppBskyEmbedRecord.Main, did: string) {
  const uri = embed.record.uri.split("/");
  return [
    elem("a", {
      href: `/${uri[2]}/post/${uri[4]}`,
      innerHTML: escapeHTML(embed.record.uri),
      className: "record-link",
    }),
  ];
}
