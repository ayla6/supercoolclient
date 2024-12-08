import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/profile_card";

export async function likesRoute(
  currentPath: string,
  currentSplitPath: string[],
  previousSplitPath: string[],
) {
  statsPage(currentSplitPath, "Likes", "app.bsky.feed.getLikes", statProfile);
}
