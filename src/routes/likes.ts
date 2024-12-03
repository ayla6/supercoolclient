import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/card";

export async function likesRoute(currentURL: string, loadedState: string) {
  statsPage(
    currentURL,
    loadedState,
    "Likes",
    "app.bsky.feed.getLikes",
    statProfile,
  );
}
