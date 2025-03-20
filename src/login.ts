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
import { env } from "./settings";
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
  let sessions =
    localStorage.getItem("session") &&
    JSON.parse(localStorage.getItem("session"));
  if (!sessions && !credentials) return;

  if (sessions) {
    if (sessions["accessJwt"]) {
      env.sessionChosen = sessions.did;
      localStorage.setItem("session-chosen", sessions.did);
      sessions = { [sessions.did]: sessions };
    }

    if (sessions[env.sessionChosen]) {
      savedSessionData = sessions[env.sessionChosen];
    }
  } else {
    sessions = {};
  }

  let serviceEndpoint = "https://bsky.social";

  if (!credentials && savedSessionData && savedSessionData.pdsUri) {
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
      sessions[session.did] = session;
      localStorage.setItem("session-chosen", session.did);
      localStorage.setItem("session", JSON.stringify(sessions));
    },
  });

  if (!credentials && savedSessionData) {
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

  env.contentLabels = preferences
    .filter((e) => {
      return e.$type === "app.bsky.actor.defs#contentLabelPref";
    })
    .reduce((acc, label) => {
      if (label.label && label.visibility) {
        acc[label.label] = label.visibility;
      }
      return acc;
    }, {});

  env.feeds = preferences?.find((e) => {
    return e.$type === "app.bsky.actor.defs#savedFeedsPrefV2";
  }).items;

  updateNotificationIcon();
  setInterval(updateNotificationIcon, 30 * 1000);
};
