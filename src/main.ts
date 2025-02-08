import { fillMissingSettings } from "./config";
import { loadNavbar } from "./elements/ui/navbar";
import { login, manager, rpc } from "./login";
import { cleanCache, updatePage } from "./router";

document.addEventListener("click", (e) => {
  const anchor = e.target instanceof Element ? e.target.closest("a") : null;
  if (!anchor || e.ctrlKey || e.button !== 0 || anchor.hasAttribute("ignore"))
    return;

  const url = new URL(anchor.href);
  if (window.location.origin !== url.origin) return;

  e.preventDefault();

  history.pushState(null, "", url);
  updatePage(false);
});
addEventListener("popstate", () => updatePage(true));
setInterval(cleanCache, 5 * 60 * 1000);

/*const record: AppSCCProfile.Record = {
  $type: 'app.scc.profile',
  accentColor: '#f58ea9',
  pinnedSearches: ['#test']
}
rpc.call('com.atproto.repo.putRecord', {data: {record: record, collection: 'app.scc.profile',repo: sessionStorage.getItem('userdid'), rkey: 'self'}})*/

const path = window.location.pathname;
if (path.length !== 1 && path.endsWith("/")) {
  const newPath = path.slice(0, -1);
  history.replaceState(null, "", newPath);
}

fillMissingSettings();
await login();
loadNavbar();
updatePage(false);
