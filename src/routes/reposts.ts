import { statsPage } from "../elements/page/stats";
import { statProfile } from "../elements/ui/card";

export async function repostsRoute(currentURL: string, loadedURL: string) {
  statsPage(
    currentURL,
    loadedURL,
    "Reposts",
    "app.bsky.feed.getRepostedBy",
    statProfile,
  );
}
