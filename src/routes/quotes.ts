import { statsPage } from "../elements/page/stats";
import { postCard } from "../elements/ui/post_card";

export async function quotesRoute(currentURL: string, loadedURL: string) {
  statsPage(
    currentURL,
    loadedURL,
    "Quotes",
    "app.bsky.feed.getQuotes",
    postCard,
  );
}
