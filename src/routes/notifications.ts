import { elem } from "../elements/utils/elem";
import { rpc } from "../login";
import { RouteOutput } from "../types";

export const notificationsRoute = async (): RouteOutput => {
  const content = elem("div", { id: "content" });
  const container = elem("div", { id: "container" }, content);

  console.log(
    await rpc.get("app.bsky.notification.listNotifications", { params: {} }),
  );

  return [undefined, "Notifications"];
};
