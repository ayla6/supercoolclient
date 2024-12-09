import { statsPage } from "../elements/page/stats";
import { profileCard, statProfile } from "../elements/ui/profile_card";

export async function repostsRoute(
  currentSplitPath: string[],
  previousSplitPath: string[],
) {
  statsPage(
    currentSplitPath,
    "Reposts",
    "app.bsky.feed.getRepostedBy",
    profileCard,
  );
}
