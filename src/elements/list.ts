import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { rpc } from "../login";
import { processText } from "./utils";

export function profile(profile: AppBskyActorDefs.ProfileView) {
  const html = document.createElement("div");
  html.className = "card profile";
  const holderPfp = document.createElement("div");
  holderPfp.className = "pfp-holder";
  const linkPfp = document.createElement("a");
  linkPfp.href = "/profile/" + profile.handle;
  linkPfp.innerHTML = `<img class="pfp" src="${profile.avatar}"></img>`;
  holderPfp.appendChild(linkPfp);
  html.appendChild(holderPfp);
  const contentDiv = document.createElement("div");
  contentDiv.className = "content";
  const header = document.createElement("a");
  header.href = `/profile/${profile.handle}`;
  header.className = "header";
  header.innerHTML = `<span class="handle">${profile.handle}</span></a>`;
  if (profile.displayName != "")
    header.innerHTML += ` <span class="display-name">${profile.displayName}</span>`;
  contentDiv.appendChild(header);
  const bio = document.createElement("div");
  bio.className = "bio";
  bio.innerHTML =
    processText(profile.description)?.replaceAll("<br/>", " ") || "";
  contentDiv.appendChild(bio);
  html.appendChild(contentDiv);
  return html;
}

export async function profiles(
  nsid: "app.bsky.graph.getFollows" | "app.bsky.graph.getFollowers",
  params: any,
) {
  const content = document.getElementById("content");
  async function load() {
    const { data } = await rpc.get(nsid, { params: params });
    const profilesArray = "follows" in data ? data.follows : data.followers;
    const { cursor: nextPage } = data;
    for (const _profile of profilesArray) {
      content.appendChild(profile(_profile));
    }
    return nextPage;
  }
  params.cursor = await load();
  if (params.cursor != undefined) {
    window.onscroll = async function (ev) {
      if (
        window.innerHeight + Math.round(window.scrollY) >=
        document.body.offsetHeight
      ) {
        params.cursor = await load();
      }
      if (params.cursor == undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
}
