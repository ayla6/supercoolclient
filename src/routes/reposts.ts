import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/card";

export async function repostsRoute(currentURL: string, loadedState: string) {
  statsPage(
    currentURL,
    loadedState,
    "Reposts",
    "app.bsky.feed.getRepostedBy",
    statProfile,
  );
}
