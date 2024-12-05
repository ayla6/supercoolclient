import { statsPage } from "../elements/page/stats";
import { profileCard, statProfile } from "../elements/ui/profile_card";

export async function repostsRoute(currentUrl: string, loadedUrl: string) {
  statsPage(
    currentUrl,
    loadedUrl,
    "Reposts",
    "app.bsky.feed.getRepostedBy",
    profileCard,
  );
}
