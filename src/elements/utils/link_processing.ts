export function idChoose(profile: { did: string; handle: string }) {
  return profile.handle === "handle.invalid" ? profile.did : profile.handle;
}

export function getUrlFromUri(uri: string) {
  const splitURI = uri.split("/");
  return `/${splitURI[2]}/post/${splitURI[4]}`;
}
