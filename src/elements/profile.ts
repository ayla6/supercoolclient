import { AppBskyActorDefs, AppSCCProfile } from "@atcute/client/lexicons";
import { rpc } from "../login";
import { idchoose, processText } from "./utils";

export function header(
  profile: AppBskyActorDefs.ProfileViewDetailed,
  sccprofile?: AppSCCProfile.Record,
) {
  const atid = idchoose(profile);
  const html = document.createElement("div");
  html.className = "profile-header";
  let customCss = `background-image:
    url(${profile.banner?.toString().replace("img/banner", "img/feed_fullsize")});`;
  if (sccprofile != undefined) {
    if (sccprofile.accentColor)
      customCss += "--accent-color: " + sccprofile.accentColor + ";";
  }
  document.body.style.cssText = customCss;
  const pfpDiv = document.createElement("a");
  pfpDiv.className = "pfp-holder";
  pfpDiv.innerHTML = `<img class="pfp" src="${profile.avatar}"></img>`;
  html.appendChild(pfpDiv);
  const accountStats = document.createElement("div");
  accountStats.className = "stats";
  accountStats.innerHTML = `
  <button class="button follow">+ Follow</button>
  <a href="/profile/${atid}"><b>${profile.postsCount}</b> Posts</a>
  <a href="/profile/${atid}/following"><b>${profile.followsCount}</b> Following</a>
  <a href="/profile/${atid}/followers"><b>${profile.followersCount}</b> followers</a>
  `;
  html.appendChild(accountStats);
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `<span class="display-name">${profile.displayName}</span>
  <span class="handle">@${atid}</span>`;
  html.appendChild(header);
  const bio = document.createElement("div");
  bio.className = "bio";
  bio.innerHTML = processText(profile.description) || "";
  html.appendChild(bio);
  return html;
}

function navButton(name: string, atid: string, text: string, did?: string) {
  const button = document.createElement("a");
  button.href = "/profile/" + atid + (name == "posts" ? "" : "/" + name);
  button.innerText = text;
  button.setAttribute("value", name);
  return button;
}

async function mediaNavButton(
  name: string,
  atid: string,
  text: string,
  did?: string,
) {
  const button = document.createElement("a");
  button.href = "/profile/" + atid + (name == "posts" ? "" : "/" + name);
  button.innerText = text;
  button.setAttribute("value", name);
  const images = document.createElement("div");
  images.className = "images";
  button.appendChild(images);
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
          images.appendChild(img);
          imageCount++;
          if (imageCount == 4) break;
        }
      if (imageCount == 4) break;
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
  container.appendChild(header(profile.data, sccprofile));
  const leftBar = document.createElement("div");
  leftBar.className = "left-bar";
  container.appendChild(leftBar);
  const profileNav = document.createElement("div");
  profileNav.className = "side-nav";
  profileNav.appendChild(navButton("posts", atid, "Posts"));
  profileNav.appendChild(navButton("replies", atid, "Posts and replies"));
  profileNav.appendChild(navButton("likes", atid, "Favourites"));
  profileNav.appendChild(navButton("following", atid, "Following"));
  profileNav.appendChild(navButton("followers", atid, "Followers"));
  profileNav.appendChild(
    await mediaNavButton("media", atid, "Media", profile.data.did),
  );
  leftBar.appendChild(profileNav);
  if (sccprofile?.pinnedSearches && sccprofile.pinnedSearches.length > 0) {
    const profileSearches = document.createElement("div");
    profileSearches.className = "side-nav";
    for (const search of sccprofile.pinnedSearches) {
      profileSearches.appendChild(
        navButton("search?" + encodeURIComponent(search), atid, search),
      );
    }
    leftBar.appendChild(profileSearches);
  }
  const content = document.createElement("div");
  content.id = "content";
  container.appendChild(content);
  return profile.data.did;
}
