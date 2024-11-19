import { AppBskyActorDefs, AppSCCProfile } from "@atcute/client/lexicons";
import { rpc } from "../../login";
import { idchoose } from "../blocks/id";
import { elem } from "../blocks/elem";
import { processText } from "../blocks/textprocessing";

export function header(
  profile: AppBskyActorDefs.ProfileViewDetailed,
  sccprofile?: AppSCCProfile.Record,
) {
  const atid = idchoose(profile);
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
    elem("div", { className: "stats" }, [
      elem("button", { className: "button follow", innerHTML: "+ Follow" }),
      elem("a", { href: "/profile/" + atid }, [
        elem("b", { innerHTML: profile.postsCount.toLocaleString() }),
        new Text(" Posts"),
      ]),
      elem("a", { href: "/profile/" + atid + "/following" }, [
        elem("b", { innerHTML: profile.followsCount.toLocaleString() }),
        new Text(" Following"),
      ]),
      elem("a", { href: "/profile/" + atid + "/followers" }, [
        elem("b", { innerHTML: profile.followersCount.toLocaleString() }),
        new Text(" Followers"),
      ]),
    ]),
    elem("div", { className: "header" }, [
      elem("span", {
        className: "display-name",
        innerHTML: profile.displayName,
      }),
      elem("span", { className: "handle", innerHTML: "@" + atid }),
    ]),
    elem("div", {
      className: "bio",
      innerHTML: profile.description ? processText(profile.description) : "",
    }),
  ]);
}

function navButton(name: string, atid: string, text: string, did?: string) {
  const button = elem("a", {
    href: "/profile/" + atid + (name === "posts" ? "" : "/" + name),
    innerHTML: text,
  });
  button.setAttribute("value", name);
  return button;
}

async function mediaNavButton(
  name: string,
  atid: string,
  text: string,
  did?: string,
) {
  const button = elem("a", {
    href: "/profile/" + atid + (name === "posts" ? "" : "/" + name),
    innerHTML: text,
  });
  button.setAttribute("value", name);
  const images = document.createElement("div");
  images.className = "images";
  button.append(images);
  if (did) {
    const { data } = await rpc.get("app.bsky.feed.getAuthorFeed", {
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

export async function profilePage(atid: string) {
  const container = document.getElementById("container");
  container.innerHTML = "";
  const profile = await rpc.get("app.bsky.actor.getProfile", {
    params: { actor: atid },
  });
  atid = idchoose(profile.data);
  let sccprofile: any;
  try {
    sccprofile = (
      await rpc.get("com.atproto.repo.getRecord", {
        params: {
          collection: "app.scc.profile",
          rkey: "self",
          repo: profile.data.did,
        },
      })
    )?.data.value;
  } catch (error) {}
  container.append(
    header(profile.data, sccprofile),
    elem("div", { className: "left-bar" }, [
      elem("div", { className: "side-nav" }, [
        navButton("posts", atid, "Posts"),
        navButton("replies", atid, "Posts and replies"),
        navButton("likes", atid, "Favourites"),
        navButton("following", atid, "Following"),
        navButton("followers", atid, "Followers"),
        await mediaNavButton("media", atid, "Media", profile.data.did),
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
                    atid,
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
  return profile.data.did;
}
