import { statsPage } from "../elements/page/stats";
import { profileCard, statProfile } from "../elements/ui/profile_card";

export async function repostsRoute(currentPath: string, loadedPath: string) {
  statsPage(currentPath, "Reposts", "app.bsky.feed.getRepostedBy", profileCard);
}
