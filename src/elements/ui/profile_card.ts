import { AppBskyActorDefs, Brand } from "@atcute/client/lexicons";
import { elem } from "../utils/elem";
import { changeImageFormat, idChoose } from "../utils/link_processing.ts";

export const profileCard = (profile: AppBskyActorDefs.ProfileView) => {
  const profileDid = profile.did;
  const atId = idChoose(profile);

  const card = elem("div", { className: "card" }, undefined, [
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
      textContent: profile.description ?? "",
    }),
  ]);

  card.setAttribute("works-as-link", "");
  card.setAttribute("href", "/" + profileDid);

  return elem("div", { className: "card-holder profile" }, undefined, [
    elem(
      "div",
      { className: "avatar-holder" },
      elem(
        "a",
        { href: "/" + profileDid, onclick: (e) => e.stopPropagation() },
        elem("img", {
          className: "avatar",
          src: changeImageFormat(profile.avatar),
          loading: "lazy",
        }),
      ),
    ),
    card,
  ]);
};

export const statProfile = (stat: {
  [Brand.Type]?: string;
  actor: AppBskyActorDefs.ProfileView;
  createdAt: string;
  indexedAt: string;
}) => {
  return profileCard(stat.actor);
};
