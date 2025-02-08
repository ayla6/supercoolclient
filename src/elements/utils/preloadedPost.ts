import { AppBskyFeedDefs } from "@atcute/client/lexicons";

export let preloadedPost: AppBskyFeedDefs.PostView;
export const setPreloaded = (post: AppBskyFeedDefs.PostView) => {
  preloadedPost = post;
};
