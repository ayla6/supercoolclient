import {AppBskyFeedDefs} from '@atcute/client/lexicons';
import {rpc} from './login.ts';
import {formatDate, resolveHandle} from './utils.ts';

const enum feedImageSize {
  width = 500,
  height = 250,
}
const interactionIcons = {
  like: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-star"><path d="M8.243 7.34l-6.38 .925l-.113 .023a1 1 0 0 0 -.44 1.684l4.622 4.499l-1.09 6.355l-.013 .11a1 1 0 0 0 1.464 .944l5.706 -3l5.693 3l.1 .046a1 1 0 0 0 1.352 -1.1l-1.091 -6.355l4.624 -4.5l.078 -.085a1 1 0 0 0 -.633 -1.62l-6.38 -.926l-2.852 -5.78a1 1 0 0 0 -1.794 0l-2.853 5.78z"/></svg>`,
  reply: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-message"><defs id="defs2"/><path d="m 18,3 c 2.209139,0 4,1.790861 4,4 v 8 c 0,2.209139 -1.790861,4 -4,4 H 13.276 L 8.514,21.857 C 7.8906918,22.231059 7.0891961,21.836158 7.006,21.114 L 7,21 V 19 H 6 c -2.1314014,2e-6 -3.8884299,-1.671265 -3.995,-3.8 L 2,15 V 7 C 2,4.790861 3.790861,3 6,3 Z" id="path2"/></svg>`,
  repost: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-repeat"><path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3"/><path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3"/></svg>`,
};

function interactionButton(type: string, post: any) {
  const button = document.createElement('a');
  button.innerHTML = interactionIcons[type];
  const number = document.createElement('span');
  number.innerText = post[type + 'Count'];
  button.className = 'interaction ' + type;
  let f = () => {};
  switch (type) {
    case 'like':
      let state = false;
      if (post.viewer.like) {
        button.classList.add('active');
        state = true;
      }
      f = async () => {
        if (state) {
          button.classList.remove('active');
          state = false;
        } else {
          button.classList.add('active');
          state = true;
        }
        number.innerText = post.likeCount();
      };
      break;
    case 'repost':
      break;
    default:
      break;
  }
  button.addEventListener('click', f);
  button.appendChild(number);
  return button;
}

interface EmbedImage {
  altText: string;
  source: string;
  holderObj: Element;
  imgObj: Element;
  did: string;
  thumbFileType: 'png' | 'jpeg' | 'webp';
}

class Image implements EmbedImage {
  altText;
  source;
  display = {
    height: 0,
    width: 0,
  };
  did;
  thumbFileType;
  holderObj = document.createElement('a');
  imgObj = document.createElement('img');

  constructor(image, did) {
    this.altText = image.alt;
    const ogsize = {
      width: image.aspectRatio?.width || 1000,
      height: image.aspectRatio?.height || 5000,
    };
    this.did = did;
    let width: number;
    let height: number;
    if (!(ogsize.width <= feedImageSize.width && ogsize.height <= feedImageSize.height)) {
      height = feedImageSize.height;
      width = ogsize.width * (height / ogsize.height);
      if (width > feedImageSize.width) {
        width = feedImageSize.width;
        height = ogsize.height * (width / ogsize.width);
      }
    } else {
      let n = Math.floor(feedImageSize.height / ogsize.height);
      width = n * ogsize.width;
      height = n * ogsize.height;
      if (width > feedImageSize.width) {
        n = Math.floor(feedImageSize.width / ogsize.width);
        width = n * ogsize.width;
        height = n * ogsize.height;
      }
    }
    this.setWidth(width);
    this.setHeight(height);
    this.thumbFileType = 'webp';
    let size = 'thumbnail';
    if (ogsize.height <= 1000 && ogsize.width <= 1000) {
      this.thumbFileType = image.image.mimeType.split('/')[1];
      size = 'fullsize';
      if (ogsize.height < this.display.height) {
        this.imgObj.setAttribute('style', 'image-rendering: crisp-edges;');
      }
    }
    this.imgObj.src =
      'https://cdn.bsky.app/img/feed_' + `${size}/plain/${did}/${image.image.ref.$link}@${this.thumbFileType}`;
    this.imgObj.title = image.alt;
    this.imgObj.alt = image.alt;
    this.imgObj.loading = 'lazy';
    let fullFileType = image.image.mimeType.split('/')[1];
    if (fullFileType == 'webp') fullFileType = 'png';
    this.holderObj.href =
      'https://cdn.bsky.app/img/feed_fullsize/plain/' + `${did}/${image.image.ref.$link}@${fullFileType}`;
    this.holderObj.target = ' ';
    this.holderObj.className = 'image';
    this.holderObj.appendChild(this.imgObj);
  }

  setWidth(width: number) {
    this.display.width = width;
    this.imgObj.width = width;
  }
  setHeight(height: number) {
    this.display.height = height;
    this.imgObj.height = height;
  }
}

export function feedViewPost(post) {
  const html = document.createElement('div');
  html.className = 'feedpost';
  const actualPost = post.post || post;
  html.id = actualPost.cid;
  const postDate = formatDate(new Date(actualPost.record.createdAt || actualPost.indexedAt));
  //if (!actualPost.reply || actualPost.reason?.$type == 'app.bsky.feed.defs#reasonRepost') {
  const holderPfp = document.createElement('div');
  holderPfp.className = 'pfp-holder';
  const linkPfp = document.createElement('a');
  linkPfp.href = '/profile/' + actualPost.author.handle;
  linkPfp.innerHTML = `<img class="pfp" src="${actualPost.author.avatar}"></img>`;
  holderPfp.appendChild(linkPfp);
  html.appendChild(holderPfp);
  //} else {html.className = 'thread';}
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content-div';
  const header = document.createElement('div');
  header.className = 'header';
  let headerHtml = `<a class="handle" href="/profile/${actualPost.author.handle}">
    ${actualPost.author.handle}</a>
    <a class="time" href="/profile/${actualPost.author.handle}/post/${
    actualPost.uri.split('/')[4]
  }">${postDate}</span>`;
  if (post.reason?.$type == 'app.bsky.feed.defs#reasonRepost')
    headerHtml =
      `${interactionIcons.repost} <a class="handle" href="/profile/${post.reason.by?.handle}">
      ${post.reason.by?.handle}</a> reposted ` + headerHtml;
  header.innerHTML = headerHtml;
  contentDiv.appendChild(header);
  if (actualPost.record.text) {
    const content = document.createElement('div');
    content.className = 'content';
    content.innerText = actualPost.record.text;
    contentDiv.appendChild(content);
  }
  if (actualPost.record.embed) {
    const embeds = document.createElement('div');
    embeds.className = 'embeds';
    const embed = actualPost.record.embed;
    switch (embed.$type) {
      case 'app.bsky.embed.images':
        for (const img of embed.images) {
          embeds.appendChild(new Image(img, actualPost.author.did).holderObj);
        }
        break;
      default:
        break;
    }
    contentDiv.appendChild(embeds);
  }
  const stats = document.createElement('div');
  stats.className = 'stats';
  stats.appendChild(interactionButton('like', actualPost));
  stats.appendChild(interactionButton('repost', actualPost));
  stats.appendChild(interactionButton('reply', actualPost));
  contentDiv.appendChild(stats);
  html.appendChild(contentDiv);
  return html;
}

export function profile(profile) {
  const html = document.createElement('profile');
  document.body.setAttribute(
    'style',
    `background-image:
    url(${profile.banner?.toString().replace('img/banner', 'img/feed_fullsize')})`
  );
  const pfpDiv = document.createElement('a');
  pfpDiv.className = 'pfp-holder';
  pfpDiv.innerHTML = `<img class="pfp" src="${profile.avatar}"></img>`;
  html.appendChild(pfpDiv);
  const accountStats = document.createElement('div');
  accountStats.className = 'stats';
  accountStats.innerHTML = `
  <button class="follow">+ Follow</button>
  <span><b>${profile.postsCount.toLocaleString()}</b> posts</span>
  <span><b>${profile.followsCount.toLocaleString()}</b> following</span>
  <span><b>${profile.followersCount.toLocaleString()}</b> followers</span>
  `;
  html.appendChild(accountStats);
  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `<span class="displayname">${profile.displayName}</span>
  <span class="handle">@${profile.handle}</span>`;
  html.appendChild(header);
  const bio = document.createElement('div');
  bio.className = 'bio';
  bio.innerText = profile.description || '';
  html.appendChild(bio);
  return html;
}

const container = document.getElementById('page-container');
let did = '';

function navButton(name, handle, text) {
  const button = document.createElement('a');
  button.href = '/profile/' + handle + (name == 'posts' ? '' : '/' + name);
  button.innerText = text;
  button.id = 'profile-nav-' + name;
  if ((window.location.pathname.split('/')[3] || 'posts') == name) button.className = 'active';
  return button;
}

export async function feed(nsid, params) {
  let feed = document.getElementById('feed');
  if (!feed) {
    feed = document.createElement('div');
    feed.id = 'feed';
    container.appendChild(feed);
  }
  async function load() {
    const {data} = await rpc.get(nsid, {params: params});
    let {feed: postsArray, cursor: nextPage} = data;
    if (postsArray == undefined) postsArray = data.posts;
    const feedHtml = document.getElementById('feed');
    for (const post of postsArray) {
      feedHtml.appendChild(feedViewPost(post));
    }
    return nextPage;
  }
  params.cursor = await load();
  if (params.cursor != undefined) {
    window.onscroll = async function (ev) {
      if (window.innerHeight + Math.round(window.scrollY) >= document.body.offsetHeight) {
        params.cursor = await load();
      }
      if (params.cursor == undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
  return feed;
}

export function feedProfile(profile) {
  const html = document.createElement('div');
  html.className = 'feedprofile';
  const holderPfp = document.createElement('div');
  holderPfp.className = 'pfp-holder';
  const linkPfp = document.createElement('a');
  linkPfp.href = '/profile/' + profile.handle;
  linkPfp.innerHTML = `<img class="pfp" src="${profile.avatar}"></img>`;
  holderPfp.appendChild(linkPfp);
  html.appendChild(holderPfp);
  const contentDiv = document.createElement('div');
  contentDiv.className = 'data';
  const header = document.createElement('a');
  header.href = `/profile/${profile.handle}`;
  header.className = 'header';
  header.innerHTML = `<span class="display">${profile.displayName}</span><span class="handle">@${profile.handle}</span></a>`;
  contentDiv.appendChild(header);
  const bio = document.createElement('div');
  bio.className = 'bio';
  bio.innerText = profile.description || '';
  contentDiv.appendChild(bio);
  html.appendChild(contentDiv);
  return html;
}

export async function userFeed(filter: string, did) {
  filter = filter || '';
  if (filter.split('-')[0] == 'hash') {
    filter = filter.slice(5);
    return await feed('app.bsky.feed.searchPosts', {
      q: '#' + filter,
      author: did,
    });
  } else {
    let nsid;
    switch (filter) {
      case 'likes':
        nsid = 'app.bsky.feed.getActorLikes';
        break;
      default:
        nsid = 'app.bsky.feed.getAuthorFeed';
        break;
    }
    return await feed(nsid, {
      actor: did,
      filter: urlEquivalents[filter],
      limit: 30,
    });
  }
}

export async function profiles(nsid, params) {
  let feed = document.getElementById('feed');
  if (!feed) {
    feed = document.createElement('div');
    feed.id = 'feed';
    container.appendChild(feed);
  }
  async function load() {
    const {data} = await rpc.get(nsid, {params: params});
    const profilesArray = data.follows || data.followers;
    const {cursor: nextPage} = data;
    console.log(profilesArray);
    const feedHtml = document.getElementById('feed');
    for (const profile of profilesArray) {
      feedHtml.appendChild(feedProfile(profile));
    }
    return nextPage;
  }
  params.cursor = await load();
  if (params.cursor != undefined) {
    window.onscroll = async function (ev) {
      if (window.innerHeight + Math.round(window.scrollY) >= document.body.offsetHeight) {
        params.cursor = await load();
      }
      if (params.cursor == undefined) {
        window.onscroll = null;
      }
    };
  } else window.onscroll = null;
  return feed;
}

export async function userProfiles(filter, did) {
  return await profiles(filter, {
    actor: did,
    limit: 50,
  });
}

export async function profilePage(handle) {
  const currentURL = window.location.pathname.split('/');
  container.innerHTML = '';
  did = await resolveHandle(handle);
  const _profile = await rpc.get('app.bsky.actor.getProfile', {params: {actor: did}});
  sessionStorage.setItem('currentProfileDID', _profile.data.did);
  container.appendChild(profile(_profile.data));
  const profileNav = document.createElement('div');
  profileNav.className = 'profile-nav';
  profileNav.appendChild(navButton('posts', handle, 'Posts'));
  profileNav.appendChild(navButton('replies', handle, 'Posts and replies'));
  profileNav.appendChild(navButton('media', handle, 'Media'));
  profileNav.appendChild(navButton('likes', handle, 'Favourites'));
  profileNav.appendChild(navButton('following', handle, 'Following'));
  profileNav.appendChild(navButton('followers', handle, 'Followers'));
  container.appendChild(profileNav);
  switch (currentURL[3]) {
    case 'following':
    case 'followers':
      await container.appendChild(await userProfiles(urlEquivalents[currentURL[3]], did));
      break;
    default:
      await container.appendChild(await userFeed(currentURL[3], did));
      break;
  }
}

export const urlEquivalents = {
  undefined: 'posts_no_replies',
  '': 'posts_no_replies',
  media: 'posts_with_media',
  replies: 'posts_with_replies',
  likes: 'likes',
  following: 'app.bsky.graph.getFollows',
  followers: 'app.bsky.graph.getFollowers',
};
