import {
  AppBskyActorDefs,
  AppBskyFeedDefs,
  AppBskyGraphBlock,
} from "@atcute/client/lexicons";
import { rpc, sessionData } from "../../login";
import { confirmDialog } from "../ui/dialog";
import { getRkey } from "./link_processing";
import { createTray } from "../ui/tray";

export const deletePost = async (
  post: AppBskyFeedDefs.PostView,
  postElem: HTMLDivElement,
) => {
  const result = await confirmDialog(
    "Delete this post?",
    "Delete",
    "Remember that you can't undo that!",
  );
  if (result) {
    try {
      await rpc.call("com.atproto.repo.deleteRecord", {
        data: {
          repo: sessionData.did,
          collection: "app.bsky.feed.post",
          rkey: getRkey(post.uri),
        },
      });
      postElem.remove();
    } catch {
      createTray("Failed to delete post");
    }
  }
};

export const blockUser = async (
  actor:
    | AppBskyActorDefs.ProfileView
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
) => {
  try {
    if (!actor.viewer.blocking) {
      const result = await confirmDialog(`Block ${actor.handle}?`, "Block");
      if (result) {
        rpc.call("com.atproto.repo.createRecord", {
          data: {
            repo: sessionData.did,
            collection: "app.bsky.graph.block",
            record: {
              $type: "app.bsky.graph.block",
              subject: actor.did,
              createdAt: new Date().toISOString(),
            } as AppBskyGraphBlock.Record,
          },
        });
      }
    } else {
      const result = await confirmDialog(`Unblock ${actor.handle}?`, "Unblock");
      if (result) {
        rpc.call("com.atproto.repo.deleteRecord", {
          data: {
            repo: sessionData.did,
            collection: "app.bsky.graph.block",
            rkey: getRkey(actor.viewer.blocking),
          },
        });
      }
    }
  } catch {
    createTray(
      (actor.viewer.blocking ? "Failed to block " : "Failed to unblock ") +
        actor.handle,
    );
  }
};

export const muteUser = async (
  actor:
    | AppBskyActorDefs.ProfileView
    | AppBskyActorDefs.ProfileViewBasic
    | AppBskyActorDefs.ProfileViewDetailed,
) => {
  try {
    if (!actor.viewer.muted) {
      const result = await confirmDialog(`Mute ${actor.handle}?`, "Mute");
      if (result) {
        rpc.call("app.bsky.graph.muteActor", {
          data: {
            actor: actor.did,
          },
        });
      }
    } else {
      const result = await confirmDialog(`Unmute ${actor.handle}?`, "Unmute");
      if (result) {
        rpc.call("app.bsky.graph.unmuteActor", {
          data: {
            actor: actor.did,
          },
        });
      }
    }
  } catch {
    createTray(
      (actor.viewer.muted ? "Failed to mute " : "Failed to unmute ") +
        actor.handle,
    );
  }
};
