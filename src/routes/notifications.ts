import { get } from "../elements/utils/cache";

export async function notificationsRoute(
  currentUrl: string,
  loadedUrl: string,
) {
  const container = document.getElementById("container");
  container.innerHTML = "";
  const content = document.createElement("div");
  content.id = "content";
  container.append(content);
  console.log(
    await get("app.bsky.notification.listNotifications", { params: {} }, true),
  );
  content.innerHTML = "";
  //content.append(...items);
}
