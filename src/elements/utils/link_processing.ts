export function idChoose(profile: { did: string; handle: string }) {
  return profile.handle !== "handle.invalid" ? profile.handle : profile.did;
}

// i got this shit off of chatgpt   it works really well somehow
export function getPathFromUri(uri: string) {
  return `/${uri.slice(5, uri.indexOf("/", 6))}/post/${uri.slice(uri.lastIndexOf("/") + 1)}`;
}

export function getDidFromUri(uri: string) {
  return uri.slice(5, uri.indexOf("/", 6));
}

// unfortunately this requires the image to be a four letter format like jpeg or heic. good thing is that those are the only ones the cdn uses
export function changeImageFormat(uri: string, format = "webp") {
  return uri.slice(0, -4) + format;
}

export function getUriFromPath(path: string) {
  const firstSlashIndex = path.indexOf("/") + 1;
  const secondSlashIndex = path.indexOf("/", firstSlashIndex + 1);
  const thirdSlashIndex = path.indexOf("/", secondSlashIndex + 1);
  const fourthSlashIndex = path.indexOf("/", thirdSlashIndex + 1);

  return `at://${path.slice(firstSlashIndex, secondSlashIndex)}/app.bsky.feed.post/${fourthSlashIndex !== -1 ? path.slice(thirdSlashIndex + 1, fourthSlashIndex) : path.slice(thirdSlashIndex + 1)}`;
}

export function getAtIdFromPath(uri: string) {
  const secondSlashIndex = uri.indexOf("/", 1);
  return secondSlashIndex === -1
    ? uri.slice(1)
    : uri.slice(1, secondSlashIndex);
}

export function getLocationFromPath(uri: string) {
  const secondSlashIndex = uri.indexOf("/", 1) + 1;
  return secondSlashIndex === 0 ? "posts" : uri.slice(secondSlashIndex);
}

export function getFirstAndSecondSubdirs(path: string) {
  const firstSlashIndex = path.indexOf("/", 1);
  const secondSlashIndex = path.indexOf("/", firstSlashIndex) + 1;

  return firstSlashIndex !== -1
    ? [path.slice(1, firstSlashIndex), path.slice(secondSlashIndex)]
    : [path.slice(1), ""];
}
