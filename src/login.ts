//stole most stuff from here because idk how to do this... https://github.com/wesbos/blue-sky-cli
import { AtpSessionData, XRPC, CredentialManager } from "@atcute/client";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
let savedSessionData: AtpSessionData;

export let manager = new CredentialManager({
  service: "https://public.api.bsky.app",
});
export let rpc = new XRPC({ handler: manager });
export let sessionData: AppBskyActorDefs.ProfileViewDetailed;

export const login = async (credentials?: {
  identifier: string;
  password: string;
}) => {
  const session = localStorage.getItem("session");
  if (!session && !credentials) return;

  manager = new CredentialManager({
    service: "https://bsky.social",
    onSessionUpdate(session) {
      savedSessionData = session;
      localStorage.setItem("session", JSON.stringify(session));
    },
  });
  if (session) {
    savedSessionData = JSON.parse(session);
    try {
      await manager.resume(savedSessionData);
    } catch {}
  } else if (credentials) {
    await manager.login(credentials);
    window.location.reload();
  }
  rpc = new XRPC({ handler: manager });

  if (manager.session)
    sessionData = (
      await rpc.get("app.bsky.actor.getProfile", {
        params: { actor: manager.session.did },
      })
    ).data;
};
