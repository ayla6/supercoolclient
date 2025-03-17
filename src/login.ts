import { AtpSessionData, XRPC, CredentialManager } from "@atcute/client";
import { AppBskyActorDefs } from "@atcute/client/lexicons";
import { getPdsEndpoint } from "@atcute/client/utils/did";
import { updateNotificationIcon } from "./elements/ui/navbar";
import {
  AtprotoWebDidDocumentResolver,
  CompositeDidDocumentResolver,
  PlcDidDocumentResolver,
  XrpcHandleResolver,
} from "@atcute/identity-resolver";
import { settings } from "./settings";
let savedSessionData: AtpSessionData;

export let managerPublic = new CredentialManager({
  service: "https://public.api.bsky.app",
});
export let rpcPublic = new XRPC({ handler: managerPublic });

export let manager = new CredentialManager({
  service: "https://public.api.bsky.app",
});
export let rpc = new XRPC({ handler: manager });
export let sessionData: AppBskyActorDefs.ProfileViewDetailed;
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
    // https://github.com/notjuliet/pdsls/blob/main/src/utils/api.ts
    const didDocumentResolver = new CompositeDidDocumentResolver({
      methods: {
        plc: new PlcDidDocumentResolver(),
        web: new AtprotoWebDidDocumentResolver(),
      },
    });

    const handleResolver = new XrpcHandleResolver({
      serviceUrl: "https://public.api.bsky.app",
    });

    const did = credentials.identifier.startsWith("did:")
      ? credentials.identifier
      : await handleResolver.resolve(credentials.identifier as any);

    const doc = await didDocumentResolver.resolve(did as any);

    const didDocServiceEndpoint = getPdsEndpoint(doc as any);
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
    sessionData &&
    (await rpc.get("app.bsky.actor.getPreferences", {})).data.preferences;

  settings.contentLabels = preferences
    .filter((e) => {
      return e.$type === "app.bsky.actor.defs#contentLabelPref";
    })
    .reduce((acc, label) => {
      if (label.label && label.visibility) {
        acc[label.label] = label.visibility;
      }
      return acc;
    }, {});
  console.log(preferences);

  settings.feeds = preferences?.find((e) => {
    return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
  }).items;

  updateNotificationIcon();
  setInterval(updateNotificationIcon, 30 * 1000);
};
