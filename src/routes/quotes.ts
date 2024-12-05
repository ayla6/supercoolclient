import { statsPage } from "../elements/page/stats";
import { postCard } from "../elements/ui/post_card";

export async function quotesRoute(currentUrl: string, loadedUrl: string) {
  statsPage(
    currentUrl,
    loadedUrl,
    "Quotes",
    "app.bsky.feed.getQuotes",
    postCard,
  );
}
