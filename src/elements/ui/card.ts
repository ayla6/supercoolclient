import { AppBskyFeedDefs, AppBskyFeedPost } from "@atcute/client/lexicons";
import * as embed from "./embed";
import { idchoose } from "../blocks/id";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { manager, rpc } from "../../login";
import { elem } from "../blocks/elem";
import { processRichText, processText } from "../blocks/textprocessing";
import { formatDate } from "../blocks/date";

export const icon = {
  like: '<svg class="like-icon" width="24" height="24" fill="currentColor" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m8.243 7.34-6.38 0.925-0.113 0.023a1 1 0 0 0-0.44 1.684l4.622 4.499-1.09 6.355-0.013 0.11a1 1 0 0 0 1.464 0.944l5.706-3 5.693 3 0.1 0.046a1 1 0 0 0 1.352-1.1l-1.091-6.355 4.624-4.5 0.078-0.085a1 1 0 0 0-0.633-1.62l-6.38-0.926-2.852-5.78a1 1 0 0 0-1.794 0l-2.853 5.78z"/></svg>',
  reply:
    '<svg class="reply-icon" width="24" height="24" version="1.1" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m18 3c2.2091 0 4 1.7909 4 4v8c0 2.2091-1.7909 4-4 4h-4.724l-4.762 2.857c-0.62331 0.37406-1.4248-0.020842-1.508-0.743l-6e-3 -0.114v-2h-1c-2.1314 2e-6 -3.8884-1.6713-3.995-3.8l-5e-3 -0.2v-8c0-2.2091 1.7909-4 4-4z"/></svg>',
  repost:
    '<svg class="repost-icon" width="24" height="24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" version="1.1" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="m4 12v-3a3 3 0 0 1 3-3h13m-3-3 3 3-3 3"/><path d="m20 12v3a3 3 0 0 1-3 3h-13m3 3-3-3 3-3"/></svg>',
};

function interactionButton(
  type: "reply" | "like" | "repost",
  post: AppBskyFeedDefs.PostView,
) {
  let count: number = post[type + "Count"];

  const countSpan = elem("span", { innerHTML: count.toLocaleString() });
  const button = elem(
    "button",
    { innerHTML: icon[type], className: "interaction " + type + "-button" },
    [countSpan],
  );
  button.setAttribute("role", "button");

  const updateInteraction = async (active: boolean) => {
    try {
      const collection = "app.bsky.feed." + type;
      count += active ? 1 : -1;
      countSpan.innerHTML = count.toLocaleString();
      if (active) {
        const { cid, uri } = post;
        const response = await rpc.call("com.atproto.repo.createRecord", {
          data: {
            record: {
              $type: collection,
              createdAt: new Date().toISOString(),
              subject: { cid, uri },
            },
            collection,
            repo: manager.session.did,
          },
        });
        post.viewer[type] = response.data.uri;
      } else {
        const recordUri = post.viewer[type];
        if (!recordUri) throw new Error(`No ${type} record URI found on post.`);
        const [, , did, , rkey] = recordUri.split("/");
        await rpc.call("com.atproto.repo.deleteRecord", {
          data: { rkey, collection, repo: did },
        });
        delete post.viewer[type];
      }
      post[type + "Count"] = count;
      button.classList.toggle("active", active);
    } catch (err) {
      console.error(`Failed to ${active ? "add" : "remove"} ${type}:`, err);
      // revert count if the interaction failed
      count += active ? -1 : 1;
      countSpan.innerHTML = count.toLocaleString();
    }
  };

  if (type === "like" || type === "repost") {
    let isActive = Boolean(post.viewer[type]);
    button.classList.toggle("active", isActive);

    button.addEventListener("click", async () => {
      isActive = !isActive;
      await updateInteraction(isActive);
    });
  }

  return button;
}

export function post(
  post:
    | AppBskyFeedDefs.FeedViewPost
    | AppBskyFeedDefs.PostView
    | AppBskyFeedDefs.ThreadViewPost,
  addClass?: string,
  marginLeft?: number,
) {
  const actualPost: AppBskyFeedDefs.PostView =
    "post" in post ? post.post : post;
  const postRecord = actualPost.record as AppBskyFeedPost.Record;
  const atid = idchoose(actualPost.author);
  const isRepost =
    "reason" in post && post.reason.$type === "app.bsky.feed.defs#reasonRepost";
  const repostAtid =
    isRepost && "by" in post.reason ? idchoose(post.reason.by) : undefined;
  return elem(
    "div",
    {
      className: "card post " + addClass,
      style: marginLeft ? `margin-left: ${marginLeft}px` : null,
    },
    [
      //profile picture
      elem("div", { className: "pfp-holder" }, [
        elem("a", { href: "/profile/" + atid }, [
          elem("img", {
            className: "pfp",
            src: actualPost.author.avatar,
            loading: "lazy",
          }),
        ]),
      ]),
      //content
      elem(
        "div",
        {
          className: "content",
          style: marginLeft ? `max-width: ${500 - marginLeft}px` : null,
        },
        [
          // header
          elem("div", { className: "header" }, [
            elem(
              "span",
              {
                className: "handle-area",
              },
              isRepost
                ? [
                    elem("span", {
                      className: "icon-holder",
                      innerHTML: icon.repost,
                    }),
                    elem("a", {
                      className: "handle",
                      href: "/profile/" + repostAtid,
                      innerHTML: repostAtid,
                    }),
                    new Text(" reposted "),
                    elem("a", {
                      className: "handle",
                      href: "/profile/" + atid,
                      innerHTML: atid,
                    }),
                  ]
                : [
                    elem("a", {
                      className: "handle",
                      href: "/profile/" + atid,
                      innerHTML: atid,
                    }),
                  ],
            ),
            elem("a", {
              className: "timestamp",
              href: `/profile/${atid}/post/${actualPost.uri.split("/")[4]}`,
              innerHTML: formatDate(
                new Date(postRecord.createdAt || actualPost.indexedAt),
              ),
            }),
          ]),
          // text content
          postRecord.text
            ? elem("div", {
                className: "post-content",
                innerHTML: processRichText(postRecord.text, postRecord.facets),
              })
            : "",
          // embeds
          postRecord.embed
            ? elem(
                "div",
                { className: "embeds" },
                embed.load(postRecord.embed, actualPost.author.did),
              )
            : "",
          // likes repost and comments
          actualPost.viewer
            ? elem("div", { className: "stats" }, [
                interactionButton("like", actualPost),
                interactionButton("repost", actualPost),
                interactionButton("reply", actualPost),
              ])
            : "",
        ],
      ),
    ],
  );
}

export function profile(profile: AppBskyActorDefs.ProfileView) {
  const atid =
    profile.handle === "handle.invalid" ? profile.did : profile.handle;
  return elem("div", { className: "card profile" }, [
    elem("div", { className: "pfp-holder" }, [
      elem("a", {}, [elem("img", { className: "pfp", src: profile.avatar })]),
    ]),
    elem("div", { className: "content" }, [
      elem("a", { className: "header", href: "/profile/" + atid }, [
        elem("span", { className: "handle", innerHTML: atid }),
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
