import { statsPage } from "../elements/page/stats";
import { postCard } from "../elements/ui/post_card";

export async function quotesRoute(currentPath: string, loadedPath: string) {
  statsPage(currentPath, "Quotes", "app.bsky.feed.getQuotes", postCard);
}
