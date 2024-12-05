import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/profile_card";

export async function likesRoute(currentUrl: string, loadedUrl: string) {
  statsPage(
    currentUrl,
    loadedUrl,
    "Likes",
    "app.bsky.feed.getLikes",
    statProfile,
  );
}
