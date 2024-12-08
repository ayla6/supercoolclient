import { get } from "../elements/utils/cache";

export async function notificationsRoute(
  currentPath: string,
  loadedPath: string,
) {
  const container = document.getElementById("container");
  const content = document.createElement("div");
  content.id = "content";
  container.replaceChildren(content);
  console.log(
    await get("app.bsky.notification.listNotifications", { params: {} }, true),
  );
  //content.append(...items);
}
