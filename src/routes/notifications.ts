import { hydrateNotificationFeed } from "../elements/ui/notification_feed";
import { stickyHeader } from "../elements/ui/sticky_header";
import { elem } from "../elements/utils/elem";
import { RouteOutput } from "../types";

export const notificationsRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
): RouteOutput => {
  const content = elem("div", { id: "content" });
  container.append(content);
  container.append(stickyHeader("Notifications", false), content);

  const navbar = document.getElementById("navbar");
  (
    navbar.querySelector(`a[href="/notifications"]`) as HTMLLinkElement
  ).onclick = (e) => {
    if (window.location.pathname === "/notifications")
      hydrateNotificationFeed(content, false);
  };

  const onscrollFunction = await hydrateNotificationFeed(content);

  return { onscrollFunction, title: "Notifications" };
};
