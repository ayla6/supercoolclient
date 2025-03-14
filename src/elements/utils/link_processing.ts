export const idChoose = ({ handle, did }: { did: string; handle: string }) =>
  handle !== "handle.invalid" ? handle : did;

export const getPathFromUri = (uri: string) =>
  `/${uri.slice(5, uri.indexOf("/", 6))}/post/${uri.slice(uri.lastIndexOf("/") + 1)}`;

export const getDidFromUri = (uri: string) => uri.slice(5, uri.indexOf("/", 6));

export const changeImageFormat = (uri: string, format = "webp") =>
  uri ? uri.slice(0, -4) + format : undefined;

export const getUriFromSplitPath = (
  [did, , postId]: string[],
  type: string = "app.bsky.feed.post",
) => `at://${did}/${type}/${postId}`;

export const cutOutThePath = (uri: string) => {
  const slashIndex = uri.indexOf("/", 8);
  return slashIndex !== -1 ? uri.slice(8, slashIndex) : uri;
};

export const getRkey = (uri: string) => uri.slice(uri.lastIndexOf("/") + 1);

export const parseBlueskyImage = (imgUrl: string) => {
  const lastSlash = imgUrl.lastIndexOf("/");
  const cid = imgUrl.slice(lastSlash + 1, imgUrl.indexOf("@", lastSlash));
  const plainIndex = imgUrl.indexOf("/plain/");
  const nextSlash = imgUrl.indexOf("/", plainIndex + 7);
  const did = imgUrl.slice(plainIndex + 7, nextSlash);
  return { did, cid };
};

export const getFediAt = (atprotoHandle: string) => {
  if (atprotoHandle.endsWith(".ap.brid.gy")) {
    const handle = atprotoHandle.slice(0, -11);
    return handle.replace(".", "@");
  }
  return atprotoHandle;
};
