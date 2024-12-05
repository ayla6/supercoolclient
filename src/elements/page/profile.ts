import { AppBskyActorDefs, SCCProfile } from "@atcute/client/lexicons";
import { manager } from "../../login";
import { idchoose } from "../utils/id";
import { elem } from "../utils/elem";
import { processText } from "../utils/text_processing";
import { get } from "../utils/cache";

export function profilePage(profile: AppBskyActorDefs.ProfileViewDetailed) {
  const container = document.getElementById("container");
  container.innerHTML = "";
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
  container.append(
    header(profile, sccprofile),
    elem("div", { className: "side-bar" }, [
      elem("div", { className: "side-nav" }, [
        navButton("posts", did, "Posts"),
        navButton("replies", did, "Posts and replies"),
        manager.session?.did === profile.did
          ? navButton("likes", did, "Favourites")
          : "",
        navButton("following", did, "Following"),
        navButton("followers", did, "Followers"),
        navButton("media", did, "Media"),
        //await mediaNavButton("media", did, "Media"),
      ]),
      sccprofile?.pinnedSearches && sccprofile.pinnedSearches.length > 0
        ? elem(
            "div",
            { className: "side-nav" },
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
  const handle = idchoose(profile);
  const did = "/" + profile.did;
  let customCss = `background-image:
    url(${profile.banner?.replace("img/banner", "img/feed_fullsize")});`;
  if (sccprofile != undefined) {
    if (sccprofile.accentColor)
      customCss += "--accent-color: " + sccprofile.accentColor + ";";
  }
  document.body.style.cssText = customCss;
  return elem("div", { className: "profile-header" }, [
    elem("a", { className: "pfp-holder" }, [
      elem("img", { className: "pfp", src: profile.avatar }),
    ]),
    elem("div", { className: "header" }, [
      elem("span", {
        className: "display-name",
        innerHTML: profile.displayName,
      }),
      elem("span", { className: "handle", innerHTML: "@" + handle }),
      elem("div", {
        className: "bio",
        innerHTML: profile.description ? processText(profile.description) : "",
      }),
    ]),

    elem("div", { className: "stats" }, [
      elem("button", { className: "button follow", innerHTML: "+ Follow" }),
      elem("a", { href: did }, [
        elem("b", { innerHTML: profile.postsCount.toLocaleString() }),
        new Text(" Posts"),
      ]),
      elem("a", { href: did + "/following" }, [
        elem("b", { innerHTML: profile.followsCount.toLocaleString() }),
        new Text(" Following"),
      ]),
      elem("a", { href: did + "/followers" }, [
        elem("b", { innerHTML: profile.followersCount.toLocaleString() }),
        new Text(" Followers"),
      ]),
    ]),
  ]);
}

function navButton(name: string, did: string, text: string) {
  const button = elem("a", {
    href: `/${did}${name === "posts" ? "" : "/" + name}`,
    innerHTML: text,
  });
  button.setAttribute("value", name);
  return button;
}

async function mediaNavButton(name: string, did: string, text: string) {
  const button = elem("a", {
    href: `/${did}${name === "posts" ? "" : "/" + name}`,
    innerHTML: text,
  });
  button.setAttribute("value", name);
  const images = document.createElement("div");
  images.className = "images";
  button.append(images);
  if (did) {
    const { data } = await get("app.bsky.feed.getAuthorFeed", {
      params: {
        actor: did,
        filter: "posts_with_media",
        limit: 4,
      },
    });
    let imageCount = 0;
    for (const post of data.feed) {
      if (post.post.embed && "images" in post.post.embed)
        for (const image of post.post.embed.images) {
          const img = document.createElement("img");
          img.src = image.thumb;
          images.append(img);
          imageCount++;
          if (imageCount === 4) break;
        }
      if (imageCount === 4) break;
    }
  }
  return button;
}
