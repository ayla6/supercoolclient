//stole most stuff from here because idk how to do this... https://github.com/wesbos/blue-sky-cli
import { AtpSessionData, XRPC, CredentialManager } from "@atcute/client";
let savedSessionData: AtpSessionData;

export let manager = new CredentialManager({
  service: "https://bsky.social",
  onSessionUpdate(session) {
    savedSessionData = session;
    localStorage.setItem("session", JSON.stringify(session));
  },
});
export let rpc = new XRPC({ handler: manager });

export const login = async () => {
  if (manager.session) return manager;

  const session = localStorage.getItem("session");
  if (session) {
    savedSessionData = JSON.parse(session);
    try {
      await manager.resume(savedSessionData);
    } catch {}
    if (manager.session) return manager;
  }

  const id = prompt("user");
  if (id) {
    await manager.login({
      identifier: id,
      password: prompt("app password"),
    });
  } else {
    manager = new CredentialManager({
      service: "https://public.api.bsky.app",
    });
  }
  rpc = new XRPC({ handler: manager });
  return manager;
};
