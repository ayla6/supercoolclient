export function idchoose(profile: { did: string; handle: string }) {
  return profile.handle === "handle.invalid" ? profile.did : profile.handle;
}
