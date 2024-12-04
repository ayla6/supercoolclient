import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/profile_card";

export async function likesRoute(currentURL: string, loadedURL: string) {
  statsPage(
    currentURL,
    loadedURL,
    "Likes",
    "app.bsky.feed.getLikes",
    statProfile,
  );
}
