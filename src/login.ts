//stole most stuff from here because idk how to do this... https://github.com/wesbos/blue-sky-cli
import { AtpSessionData, XRPC, CredentialManager } from "@atcute/client";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { DidDocument, getServiceEndpoint } from "@atcute/client/utils/did";
let savedSessionData: AtpSessionData;

export let manager = new CredentialManager({
  service: "https://public.api.bsky.app",
});
export let rpc = new XRPC({ handler: manager });
export let sessionData: AppBskyActorDefs.ProfileViewDetailed;
export let contentLabels = {};
export let feeds = [];
export const privateKey = localStorage.getItem("private-key");

export const login = async (credentials?: {
  identifier: string;
  password: string;
  serviceEndpoint?: string;
}) => {
  const session = localStorage.getItem("session");
  if (!session && !credentials) return;

  savedSessionData = JSON.parse(session);

  let serviceEndpoint = "https://bsky.social";

  if (session && savedSessionData.pdsUri) {
    serviceEndpoint = savedSessionData.pdsUri;
  } else if (credentials?.serviceEndpoint) {
    serviceEndpoint = credentials.serviceEndpoint;
  } else {
    const did = (
      await rpc.get("com.atproto.identity.resolveHandle", {
        params: { handle: credentials.identifier },
      })
    ).data.did;

    // thanks https://github.com/notjuliet/pdsls/blob/main/src/utils/api.ts#L10
    // i thought hmm but what if there are more ways to do than two   there are not this is fine thank god
    const didDoc = (await (
      await fetch(
        did.startsWith("did:web")
          ? `https://${did.split(":")[2]}/.well-known/did.json`
          : "https://plc.directory/" + did,
      )
    ).json()) as DidDocument;

    const didDocServiceEndpoint = didDoc.service?.[0]
      ?.serviceEndpoint as string;
    if (didDocServiceEndpoint) serviceEndpoint = didDocServiceEndpoint;
  }

  manager = new CredentialManager({
    service: serviceEndpoint,
    onSessionUpdate(session) {
      session.pdsUri = serviceEndpoint;
      savedSessionData = session;
      localStorage.setItem("session", JSON.stringify(session));
    },
  });
  if (session) {
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

  const preferences =
    sessionData && (await rpc.get("app.bsky.actor.getPreferences", {}));

  contentLabels = preferences?.data.preferences
    .filter((e) => {
      return e.$type === "app.bsky.actor.defs#contentLabelPref";
    })
    .reduce((acc, label) => {
      if (label.label && label.visibility) {
        acc[label.label] = label.visibility;
      }
      return acc;
    }, {});

  feeds = preferences?.data.preferences.find((e) => {
    return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
  }).items;
};
