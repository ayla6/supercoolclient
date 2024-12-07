export function idChoose(profile: { did: string; handle: string }) {
  return profile.handle !== "handle.invalid" ? profile.handle : profile.did;
}

// i got this shit off of chatgpt   it works really well somehow
export function getUrlFromUri(uri: string) {
  return `/${uri.slice(5, uri.indexOf("/", 9))}/post/${uri.slice(uri.lastIndexOf("/") + 1)}`;
}

// unfortunately this requires the image to be a four letter format like jpeg or heic. good thing is that those are the only ones the cdn uses
export function changeToWebp(uri: string) {
  return uri.slice(0, -4) + "webp";
}
