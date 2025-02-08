import { AppBskyEmbedVideo } from "@atcute/client/lexicons";
import { rpc } from "../../../login";

export const uploadVideo = async (input: File) =>
  ({
    $type: "app.bsky.embed.video",
    video: (await rpc.call("com.atproto.repo.uploadBlob", { data: input })).data
      .blob,
  }) as AppBskyEmbedVideo.Main;
