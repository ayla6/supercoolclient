import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/profile_card";

export async function likesRoute(currentPath: string, loadedPath: string) {
  statsPage(currentPath, "Likes", "app.bsky.feed.getLikes", statProfile);
}
