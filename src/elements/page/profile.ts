import {
  AppBskyActorDefs,
  AppBskyFeedGetAuthorFeed,
  SCCProfile,
} from "@atcute/client/lexicons";
import { manager } from "../../login";
import { changeImageFormat, idChoose } from "../utils/link_processing.ts";
import { elem } from "../utils/elem";
import { processText } from "../utils/text_processing";
import { inCache } from "../utils/cache";

export function profilePage(
  profile: AppBskyActorDefs.ProfileViewDetailed,
  lastMedia: AppBskyFeedGetAuthorFeed.Output,
) {
  const container = document.getElementById("container");
  document.title = profile.handle + " — SuperCoolClient";
  const did = profile.did;
  let sccprofile: any;
  /*try {
    sccprofile = (
      await get("com.atproto.repo.getRecord", {
        params: {
          collection: "notasite.scc.profile",
          rkey: "self",
          repo: profile.data.did,
        },
      })
    )?.data.value;
    } catch (error) {}*/
  container.replaceChildren(
    header(profile, sccprofile),
    elem("div", { className: "side-bar" }, null, [
      elem("div", { className: "side-nav" }, null, [
        navButton("posts", did, "Posts"),
        navButton("replies", did, "Posts and replies"),
        manager.session?.did === profile.did
          ? navButton("likes", did, "Favourites")
          : "",
        navButton("following", did, "Following"),
        navButton("followers", did, "Followers"),
        //navButton("media", did, "Media"),
        mediaNavButton("media", did, "Media", lastMedia),
      ]),
      sccprofile?.pinnedSearches && sccprofile.pinnedSearches.length > 0
        ? elem(
            "div",
            { className: "side-nav" },
            null,
            ((): Node[] => {
              let array: Node[] = [];
              for (const search of sccprofile.pinnedSearches) {
                array.push(
                  navButton(
                    "search?" + encodeURIComponent(search),
                    did,
                    search,
                  ),
                );
              }
              return array;
            })(),
          )
        : "",
    ]),
    elem("div", { id: "content" }),
  );
  return profile.did;
}

export function header(
  profile: AppBskyActorDefs.ProfileViewDetailed,
  sccprofile?: SCCProfile.Record,
) {
  const handle = idChoose(profile);
  const did = profile.did;
  let customCss = `background-image:
    url(${profile.banner?.replace("img/banner", "img/feed_fullsize")});`;
  if (sccprofile != undefined) {
    if (sccprofile.accentColor)
      customCss += "--accent-color: " + sccprofile.accentColor + ";";
  }
  document.body.style.cssText = customCss;
  return elem("div", { className: "profile-header" }, null, [
    elem(
      "a",
      { className: "pfp-holder" },
      elem("img", { className: "pfp", src: changeImageFormat(profile.avatar) }),
    ),
    elem("div", { className: "header" }, null, [
      elem("span", {
        className: "display-name",
        textContent: profile.displayName,
      }),
      elem("span", { className: "handle", innerHTML: "@" + handle }),
      elem("div", {
        className: "bio",
        innerHTML: profile.description ? processText(profile.description) : "",
      }),
    ]),

    elem("div", { className: "stats" }, null, [
      elem("button", { className: "button follow", textContent: "+ Follow" }),
      elem("a", { href: did }, null, [
        elem("b", { textContent: profile.postsCount.toLocaleString() }),
        " Posts",
      ]),
      elem("a", { href: did + "/following" }, null, [
        elem("b", { textContent: profile.followsCount.toLocaleString() }),
        " Following",
      ]),
      elem("a", { href: did + "/followers" }, null, [
        elem("b", { textContent: profile.followersCount.toLocaleString() }),
        " Followers",
      ]),
    ]),
  ]);
}

function navButton(name: string, did: string, text: string) {
  const button = elem("a", {
    href: `/${did}${name === "posts" ? "" : "/" + name}`,
    textContent: text,
  });
  button.setAttribute("value", name);
  return button;
}

function mediaNavButton(
  name: string,
  did: string,
  text: string,
  lastMedia: AppBskyFeedGetAuthorFeed.Output,
) {
  const button = elem("a", {
    href: `/${did}${name}`,
    textContent: text,
  });
  button.setAttribute("value", name);
  const images = document.createElement("div");
  images.className = "images";
  button.append(images);
  let imageCount = 0;
  for (const post of lastMedia.feed) {
    const embed =
      post.post.embed.$type === "app.bsky.embed.recordWithMedia#view"
        ? post.post.embed.media
        : post.post.embed;
    const type = embed.$type;
    if (type === "app.bsky.embed.images#view") {
      for (const image of embed.images) {
        const img = document.createElement("img");
        img.src = changeImageFormat(image.thumb);
        images.append(img);
        if (++imageCount === 4) break;
      }
      if (imageCount === 4) break;
    } else if (embed.$type === "app.bsky.embed.video#view" && embed.thumbnail) {
      const img = document.createElement("img");
      img.src = embed.thumbnail;
      images.append(img);
      imageCount++;
    }
  }
  return button;
}
