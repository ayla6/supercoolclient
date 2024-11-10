import { rpc } from "../login";
import * as feed from "./feed.ts";
import * as list from "./list.ts";
import { urlEquivalents } from "./utils.ts";

export function header(profile, sccprofile?) {
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
  <button class="follow">+ Follow</button>
  <a href="/profile/${profile.handle}"><b>${profile.postsCount.toLocaleString()}</b> Posts</a>
  <a href="/profile/${profile.handle}/following"><b>${profile.followsCount.toLocaleString()}</b> Following</a>
  <a href="/profile/${profile.handle}/followers"><b>${profile.followersCount.toLocaleString()}</b> followers</a>
  `;
  html.appendChild(accountStats);
  const header = document.createElement("div");
  header.className = "header";
  header.innerHTML = `<span class="display-name">${profile.displayName}</span>
  <span class="handle">@${profile.handle}</span>`;
  html.appendChild(header);
  const bio = document.createElement("div");
  bio.className = "bio";
  bio.innerText = profile.description || "";
  html.appendChild(bio);
  return html;
}

function navButton(name: string, handle: string, text: string) {
  const button = document.createElement("a");
  button.href = "/profile/" + handle + (name == "posts" ? "" : "/" + name);
  button.innerText = text;
  button.setAttribute("value", name);
  const currentURL = window.location.pathname.split("/")[3];
  if (
    (currentURL || "posts") +
      (currentURL == "search" ? window.location.search : "") ==
    name
  )
    button.className = "active";
  return button;
}

export async function profilePage(handle: string) {
  const container = document.getElementById("container");
  const currentURL = window.location.pathname.split("/");
  container.innerHTML = "";
  const did = (
    await rpc.get("com.atproto.identity.resolveHandle", {
      params: { handle: handle },
    })
  ).data.did;
  const profile = await rpc.get("app.bsky.actor.getProfile", {
    params: { actor: did },
  });
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
  sessionStorage.setItem("currentProfileDID", profile.data.did);
  container.appendChild(header(profile.data, sccprofile));
  const leftBar = document.createElement("div");
  leftBar.className = "left-bar";
  container.appendChild(leftBar);
  const profileNav = document.createElement("div");
  profileNav.className = "profile-nav";
  profileNav.appendChild(navButton("posts", handle, "Posts"));
  profileNav.appendChild(navButton("replies", handle, "Posts and replies"));
  profileNav.appendChild(navButton("media", handle, "Media"));
  profileNav.appendChild(navButton("likes", handle, "Favourites"));
  profileNav.appendChild(navButton("following", handle, "Following"));
  profileNav.appendChild(navButton("followers", handle, "Followers"));
  leftBar.appendChild(profileNav);
  if (sccprofile?.pinnedSearches && sccprofile.pinnedSearches.length > 0) {
    const profileSearches = document.createElement("div");
    profileSearches.className = "profile-nav";
    for (const search of sccprofile.pinnedSearches) {
      profileSearches.appendChild(
        navButton("search?" + encodeURIComponent(search), handle, search),
      );
    }
    leftBar.appendChild(profileSearches);
  }
  const content = document.createElement("div");
  content.id = "content";
  container.appendChild(content);
  switch (currentURL[3]) {
    case "following":
    case "followers":
      await list.profiles(urlEquivalents[currentURL[3]], { actor: did });
      break;
    case "search":
      await feed.userFeed("search", did);
      break;
    default:
      await feed.userFeed(currentURL[3], did);
      break;
  }
}
