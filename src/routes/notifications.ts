import { hydrateNotificationFeed } from "../elements/ui/notification_feed";
import { stickyHeader } from "../elements/ui/sticky_header";
import { elem } from "../elements/utils/elem";

export const notificationsRoute = async (
  currentSplitPath: string[],
  previousSplitPath: string[],
  container: HTMLDivElement,
  useCache: boolean = false,
) => {
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

  window.onscroll = await hydrateNotificationFeed(content);
};
