import { statsPage } from "../elements/page/stats";
import { profileCard, statProfile } from "../elements/ui/profile_card";

export async function repostsRoute(currentURL: string, loadedURL: string) {
  statsPage(
    currentURL,
    loadedURL,
    "Reposts",
    "app.bsky.feed.getRepostedBy",
    profileCard,
  );
}
