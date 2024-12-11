import { feedNSID, hydrateFeed } from "../elements/ui/feed";
import { stickyHeader } from "../elements/ui/sticky_header";
import { elem } from "../elements/utils/elem";
import { getUriFromSplitPath } from "../elements/utils/link_processing";
import { RouteOutput } from "../types";

export const createStatsRoute = (
  title: string,
  nsid: feedNSID,
  func: (item: any) => HTMLDivElement,
) => {
  return async (
    currentSplitPath: string[],
    previousSplitPath: string[],
    container: HTMLDivElement,
  ): RouteOutput => {
    const content = elem("div", { id: "content" });

    container.appendChild(stickyHeader(title));
    const uri = getUriFromSplitPath(currentSplitPath);
    const onscrollFunction = await hydrateFeed(
      content,
      nsid,
      { uri: uri },
      func,
    );
    container.appendChild(content);

    return [onscrollFunction, title];
  };
};
