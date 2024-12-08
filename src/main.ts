import { fillMissingSettings } from "./config";
import { loadNavbar } from "./elements/ui/navbar";
import { login } from "./login";
import { navigateTo, updatePage } from "./router";

document.addEventListener("click", (e) => {
  const anchor = e.target instanceof Element ? e.target.closest("a") : null;
  if (!anchor || e.ctrlKey || e.button !== 0) return;

  if (!anchor.hasAttribute("ignore")) {
    const url = new URL(anchor.href);
    if (window.location.origin !== url.origin) return;

    e.preventDefault();
    //if (anchor.hasAttribute("no-history")) history.replaceState(null, "", url);
    //else

    navigateTo(url);
  }
});

addEventListener("popstate", () => {
  updatePage();
});

/*const record: AppSCCProfile.Record = {
  $type: 'app.scc.profile',
  accentColor: '#f58ea9',
  pinnedSearches: ['#test']
}
rpc.call('com.atproto.repo.putRecord', {data: {record: record, collection: 'app.scc.profile',repo: sessionStorage.getItem('userdid'), rkey: 'self'}})*/

fillMissingSettings();
login();
loadNavbar();
updatePage();
