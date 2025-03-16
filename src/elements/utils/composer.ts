import { tokenize } from "@atcute/bluesky-richtext-parser";
import { toShortUrl } from "./link_processing";
import RichtextBuilder from "@atcute/bluesky-richtext-builder";
import { rpc } from "../../login";

export const getTextLength = (text: string) => {
  let length = 0;
  const tokens = tokenize(text);
  for (const token of tokens) {
    length += "text" in token ? token.text.length : token.raw.length;
  }
  return length;
};

export const buildRichText = async (text: string) => {
  const tokens = tokenize(text);
  const builder = new RichtextBuilder();
  for (const token of tokens) {
    switch (token.type) {
      case "text":
        builder.addText(token.text);
        break;
      case "link":
      case "autolink":
        if (!token.raw.startsWith("did:"))
          builder.addLink(
            "text" in token ? token.text : toShortUrl(token.url),
            token.url,
          );
        else builder.addText(token.url);
        break;
      case "topic":
        builder.addTag(token.name);
        break;
      case "mention":
        builder.addMention(
          token.raw,
          token.handle.startsWith("did:")
            ? (token.handle as `did:${string}`)
            : (
                await rpc.get("com.atproto.identity.resolveHandle", {
                  params: { handle: token.handle },
                })
              ).data.did,
        );
        break;
    }
  }
  return builder.build();
};
