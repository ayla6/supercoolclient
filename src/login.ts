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
  if (manager.session) {
    console.log("Already logged in...");
  }
  const session = localStorage.getItem("session");
  if (session) {
    console.log("Found saved session data. Resuming session...");
    savedSessionData = JSON.parse(session);
    await manager.resume(savedSessionData);
  } else {
    console.log("No saved session data. Logging in...");
    let id = prompt("user");
    if (id) {
      let password = prompt("app password");
      await manager.login({
        identifier: id,
        password: password,
      });
    } else
      manager = new CredentialManager({
        service: "https://public.api.bsky.app",
      });
    rpc = new XRPC({ handler: manager });
  }
  return manager;
};
