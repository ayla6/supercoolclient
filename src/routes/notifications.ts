import { hydrateNotificationFeed } from "../elements/ui/notification_feed";
import { elem } from "../elements/utils/elem";
import { RouteOutput } from "../types";

export const notificationsRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const content = elem("div", { id: "content" });
  container.append(content);

  const navbar = document.getElementById("navbar");
  (
    navbar.querySelector(`a[href="/notifications"]`) as HTMLLinkElement
  ).onclick = (e) => {
    hydrateNotificationFeed(content);
  };

  const onscrollFunction = await hydrateNotificationFeed(content);

  return { onscrollFunction, title: "Notifications" };
};
