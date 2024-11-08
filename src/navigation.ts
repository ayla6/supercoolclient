// stolen from https://github.com/char/rainbow!!!

import {profilePage, urlEquivalents, userFeed, userProfiles} from './loadings';
const script = document.getElementById('script');

/*document.addEventListener("click", e => {
  if (!(e.target instanceof Element)) return;
  const anchor = e.target.closest("a");
  if (anchor === null) return;

  if (e.ctrlKey || e.button !== 0) return;

  // TODO: make sure these open in a new tab
  const url = new URL(anchor.href);
  if (window.location.origin !== url.origin) return; // open external links normally

  e.preventDefault();

  history.pushState(null, "", url);
});*/

let previousURL = window.location.pathname.split('/');
const originalPushState = history.pushState;
history.pushState = function (state, title, url) {
  previousURL = window.location.pathname.split('/');
  originalPushState.apply(history, arguments);
  updatePage();
};

function replaceScript(url, location) {
  const oldScript = document.getElementById('pagescript');
  const script = document.createElement('script');
  script.type = 'module';
  script.id = 'pagescript';
  script.src = url;
  script.setAttribute('location', location);
  document.body.appendChild(script);
  oldScript.remove();
}

export async function updatePage() {
  const currentURL = window.location.pathname.split('/');
  if (currentURL[2] != previousURL[2]) {
    document.body.setAttribute('style', '');
  }
  if (currentURL[1] == 'profile') {
    const did = sessionStorage.getItem('currentProfileDID');
    switch (currentURL[3]) {
      case 'post':
        if (previousURL[1] != 'post ') replaceScript('/src/post.ts', 'post');
        break;
      default:
        document.getElementById('feed').innerHTML = '';
        document.getElementById('profile-nav-' + (previousURL[3] || 'posts')).classList.remove('active');
        document.getElementById('profile-nav-' + (currentURL[3] || 'posts')).classList.add('active');
        if (previousURL[1] != 'profile') replaceScript('/src/profile.ts', 'profile');
        if (currentURL[2] != previousURL[2]) {
          profilePage(currentURL[2]);
        } else
          switch (currentURL[3]) {
            case 'following':
            case 'followers':
              if (currentURL[2] != previousURL[2]) {
                userProfiles;
              }
              await userProfiles(urlEquivalents[currentURL[3]], did);
              break;
            default:
              if (previousURL[3] != 'post' && currentURL[3] != 'post') {
                await userFeed(currentURL[3], did);
              }
              break;
          }
        break;
    }
  }
  previousURL = window.location.pathname.split('/');
}

document.addEventListener('click', (e) => {
  if (!(e.target instanceof Element)) return;
  const anchor = e.target.closest('a');
  if (anchor === null) return;

  if (e.ctrlKey || e.button !== 0) return;

  // TODO: make sure these open in a new tab
  const url = new URL(anchor.href);
  if (window.location.origin !== url.origin) return; // open external links normally

  e.preventDefault();

  const previousURL = window.location.pathname.split('/');
  history.pushState(null, '', url);
  updatePage();
});

addEventListener('popstate', () => {
  updatePage();
});
