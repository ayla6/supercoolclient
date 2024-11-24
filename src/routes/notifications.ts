import { get } from "../elements/blocks/cache";

export async function notificationsRoute(
  currentURL: Array<string>,
  loadedState: Array<string>,
) {
  const container = document.getElementById("container");
  container.innerHTML = "";
  const content = document.createElement("div");
  content.id = "content";
  container.append(content);
  console.log(
    get("app.bsky.notification.listNotifications", { params: {} }, true),
  );
  content.innerHTML = "";
  //content.append(...items);
}
