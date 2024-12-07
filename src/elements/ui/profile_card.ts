import { AppBskyActorDefs, Brand } from "@atcute/client/lexicons";
import { elem } from "../utils/elem";
import { idChoose } from "../utils/link_processing.ts";
import { processText } from "../utils/text_processing";

export function profileCard(profile: AppBskyActorDefs.ProfileView) {
  const profileDid = profile.did;
  const atId = idChoose(profile);

  return elem("div", { className: "card-holder profile" }, [
    elem("div", { className: "pfp-holder" }, [
      elem("a", { href: "/" + profileDid }, [
        elem("img", {
          className: "pfp",
          src: profile.avatar,
          loading: "lazy",
        }),
      ]),
    ]),
    elem("div", { className: "card" }, [
      elem("a", { className: "header", href: "/" + profileDid }, [
        elem("span", { className: "handle", innerHTML: atId }),
        profile.displayName
          ? elem("span", {
              className: "display-name",
              innerHTML: profile.displayName,
            })
          : "",
      ]),
      elem("div", {
        className: "bio",
        innerHTML: profile.description
          ? processText(profile.description)?.replaceAll("<br/>", " ")
          : "",
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
