export const idChoose = ({ handle, did }: { did: string; handle: string }) =>
  handle !== "handle.invalid" ? handle : did;

export const getPathFromUri = (uri: string) =>
  `/${uri.slice(5, uri.indexOf("/", 6))}/post/${uri.slice(uri.lastIndexOf("/") + 1)}`;

export const getDidFromUri = (uri: string) => uri.slice(5, uri.indexOf("/", 6));

export const changeImageFormat = (uri: string, format = "webp") =>
  uri.slice(0, -4) + format;

export const getUriFromSplitPath = ([did, , postId]: string[]) =>
  `at://${did}/app.bsky.feed.post/${postId}`;

export const cutOutThePath = (uri: string) => {
  const slashIndex = uri.indexOf("/", 8);
  return slashIndex !== -1 ? uri.slice(8, slashIndex) : uri;
};

export const getRkey = (uri: string) => uri.slice(uri.lastIndexOf("/") + 1);
