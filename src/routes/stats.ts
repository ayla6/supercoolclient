import { hydrateFeed } from "../elements/ui/feed";
import { stickyHeader } from "../elements/ui/sticky_header";
import { elem } from "../elements/utils/elem";
import { getUriFromSplitPath } from "../elements/utils/link_processing";
import { setTitle } from "../elements/utils/title";
import { feedNSID } from "../types";

export const createStatsRoute = (
  title: string,
  nsid: feedNSID,
  func: (item: any) => HTMLDivElement,
) => {
  return async (
    currentSplitPath: string[],
    previousSplitPath: string[],
    container: HTMLDivElement,
    useCache: boolean = false,
  ) => {
    const content = elem("div", { id: "content" });

    container.appendChild(stickyHeader(title));
    const uri = getUriFromSplitPath(currentSplitPath);

    setTitle(title);

    window.onscroll = await hydrateFeed(
      content,
      nsid,
      { uri: uri },
      func,
      useCache,
    );
    container.appendChild(content);
  };
};
