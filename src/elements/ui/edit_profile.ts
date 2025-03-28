import { AppBskyActorProfile } from "@atcute/client/lexicons";
import { manager, rpc, sessionData } from "../../login";
import { elem } from "../utils/elem";
import { popupBox } from "./dialog";

export const editProfileDialog = async () => {
  const oldRecord = (
    await rpc.get("com.atproto.repo.getRecord", {
      params: {
        collection: "app.bsky.actor.profile",
        rkey: "self",
        repo: manager.session.did,
      },
    })
  ).data.value as AppBskyActorProfile.Record;
  const displayName = elem("input", {
    type: "text",
    placeholder: "super cool person",
    value: oldRecord.displayName,
  });
  const description = elem("div", {
    className: "text-box",
    role: "textbox",
    contentEditable: "true",
    translate: false,
    ariaPlaceholder: "i'm a super cool person who loves to be cool",
    innerText: oldRecord.description,
  });
  return await new Promise<boolean>((resolve) => {
    const content = elem("div", { className: "popup" }, null, [
      elem("span", {
        className: "section-title",
        textContent: "Edit profile",
      }),
      elem("div", { className: "settings-holder" }, undefined, [
        elem("div", { className: "setting" }, undefined, [
          elem("label", {
            textContent: "Display name:",
          }),
          displayName,
        ]),
        elem("div", { className: "setting" }, undefined, [
          elem("label", {
            textContent: "Description:",
          }),
          description,
        ]),
      ]),
      elem("div", { className: "dialog-options" }, null, [
        elem("button", {
          textContent: "Cancel",
          onclick: () => {
            resolve(false);
            dialog.cleanup();
          },
        }),
        elem("button", {
          textContent: "Save",
          onclick: async () => {
            await rpc.call("com.atproto.repo.putRecord", {
              data: {
                repo: sessionData.did,
                rkey: "self",
                collection: "app.bsky.actor.profile",
                record: {
                  $type: "app.bsky.actor.profile",
                  avatar: oldRecord.avatar,
                  banner: oldRecord.banner,
                  description: description.innerText,
                  displayName: displayName.value,
                } as AppBskyActorProfile.Record,
              },
            });
            resolve(true);
            dialog.cleanup();
          },
        }),
      ]),
    ]);
    const dialog = popupBox(content, () => resolve(false));
  });
};
