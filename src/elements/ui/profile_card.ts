import { AppBskyActorDefs, Brand } from "@atcute/client/lexicons";
import { elem } from "../utils/elem";
import { idChoose } from "../utils/link_processing.ts";

export function profileCard(profile: AppBskyActorDefs.ProfileView) {
  const profileDid = profile.did;
  const atId = idChoose(profile);

  return elem("div", { className: "card-holder profile" }, undefined, [
    elem(
      "div",
      { className: "pfp-holder" },
      elem(
        "a",
        { href: "/" + profileDid },
        elem("img", {
          className: "pfp",
          src: profile.avatar,
          loading: "lazy",
        }),
      ),
    ),
    elem("div", { className: "card" }, undefined, [
      elem("a", { className: "header", href: "/" + profileDid }, undefined, [
        elem("span", { className: "handle", textContent: atId }),
        profile.displayName
          ? elem("span", {
              className: "display-name",
              textContent: profile.displayName,
            })
          : null,
      ]),
      elem("div", {
        className: "bio",
        textContent: profile.description,
      }),
    ]),
  ]);
}

export function statProfile(stat: {
  [Brand.Type]?: string;
  actor: AppBskyActorDefs.ProfileView;
  createdAt: string;
  indexedAt: string;
}) {
  return profileCard(stat.actor);
}
