import { AppBskyActorDefs, Brand } from "@atcute/client/lexicons";
import { elem } from "../blocks/elem";
import { idchoose } from "../blocks/id";
import { processText } from "../blocks/text_processing";

export function profileCard(profile: AppBskyActorDefs.ProfileView) {
  const profileDid = profile.did;
  const atId = idchoose(profile);

  return elem("div", { className: "card profile" }, [
    elem("div", { className: "pfp-holder" }, [
      elem("a", { href: "/" + profileDid }, [
        elem("img", {
          className: "pfp",
          src: profile.avatar,
          loading: "lazy",
        }),
      ]),
    ]),
    elem("div", { className: "content" }, [
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
