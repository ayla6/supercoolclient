import { settings } from "../../settings";

export const idChoose = ({ handle, did }: { did: string; handle: string }) =>
  handle !== "handle.invalid" ? handle : did;

export const getPathFromUri = (uri: string) =>
  `/${uri.slice(5, uri.indexOf("/", 6))}/post/${uri.slice(uri.lastIndexOf("/") + 1)}`;

export const getDidFromUri = (uri: string) => uri.slice(5, uri.indexOf("/", 6));

export const changeImageFormat = (
  uri: string,
  format = settings.defaultThumbnailFormat,
) => (uri ? uri.slice(0, -4) + format : undefined);

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

export const getFediHandle = (atprotoHandle: string) => {
  if (atprotoHandle.endsWith(".ap.brid.gy")) {
    const handle = atprotoHandle.slice(0, -11);
    return handle.replace(".", "@");
  }
  return atprotoHandle;
};

// https://github.com/mary-ext/aglais/blob/2f9770a31e7fb60d1b030bc952417c74ea01aa0c/src/lib/bluemoji/render.ts#L2
export const getBluemojiCdnUrl = (
  did: string,
  cid: string,
  format = settings.defaultThumbnailFormat,
) => {
  return `https://cdn.bsky.app/img/avatar_thumbnail/plain/${did}/${cid}@${format}`;
};

export const isUrl = (text: string) => {
  const colonIndex = text.indexOf(":");
  if (text.slice(colonIndex, colonIndex + 3) !== "://") return false;
  try {
    const url = new URL(text);
    return url;
  } catch {
    return false;
  }
};

//https://codeberg.org/mary-ext/atcute/src/branch/trunk/packages/bluesky/richtext-parser

const safeUrlParse = (href: string): URL | null => {
  const url = URL.parse(href);

  if (url !== null) {
    const protocol = url.protocol;

    if (protocol === "https:" || protocol === "http:") {
      return url;
    }
  }

  return null;
};

const TRIM_HOST_RE = /^www\./;
const PATH_MAX_LENGTH = 16;

export const toShortUrl = (href: string): string => {
  const url = safeUrlParse(href);

  if (url !== null) {
    const host =
      (url.username
        ? url.username + (url.password ? ":" + url.password : "") + "@"
        : "") + url.host.replace(TRIM_HOST_RE, "");

    const path =
      (url.pathname === "/" ? "" : url.pathname) +
      (url.search.length > 1 ? url.search : "") +
      (url.hash.length > 1 ? url.hash : "");

    if (path.length > PATH_MAX_LENGTH) {
      return host + path.slice(0, PATH_MAX_LENGTH - 1) + "…";
    }

    return host + path;
  }

  return href;
};
