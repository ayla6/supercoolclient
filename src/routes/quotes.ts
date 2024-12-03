import { statsPage } from "../elements/page/stats";
import { post } from "../elements/ui/card";

export async function quotesRoute(currentURL: string, loadedState: string) {
  statsPage(currentURL, loadedState, "Quotes", "app.bsky.feed.getQuotes", post);
}
