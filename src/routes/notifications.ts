import { get } from "../elements/blocks/cache";

export async function notificationsRoute(
  currentURL: string,
  loadedState: string,
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
