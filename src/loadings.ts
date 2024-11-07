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
  repost: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-repeat"><path d="M4 12v-3a3 3 0 0 1 3 -3h13m-3 -3l3 3l-3 3"/><path d="M20 12v3a3 3 0 0 1 -3 3h-13m3 3l-3 -3l3 -3"/></svg>`
}

function interactionButton(type: string, post: any) {
  const button = document.createElement('a');
  button.innerHTML = interactionIcons[type]
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
      height: image.aspectRatio?.height || 1000,
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
    this.imgObj.src = 'https://cdn.bsky.app/img/feed_' +
      `${size}/plain/${did}/${image.image.ref.$link}@${this.thumbFileType}`;
    this.imgObj.title = image.alt;
    this.imgObj.alt = image.alt;
    let fullFileType = image.image.mimeType.split('/')[1]
    if (fullFileType == 'webp') fullFileType = 'png'
    this.holderObj.href =
      'https://cdn.bsky.app/img/feed_fullsize/plain/' +
      `${did}/${image.image.ref.$link}@${fullFileType}`;
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

export function feedViewPost(post: AppBskyFeedDefs.FeedViewPost) {
  const html = document.createElement('feedpost');
  html.id = post.post.cid;
  const postDate = formatDate(new Date(post.post.record.createdAt || post.post.indexedAt));
  if (!post.reply) {
    const holderPfp = document.createElement('a');
    holderPfp.className = 'pfp-holder';
    holderPfp.innerHTML = `<img class="pfp" src="${post.post.author.avatar}"></img>`;
    holderPfp.href = '/profile/' + post.post.author.handle;
    html.appendChild(holderPfp);
  } else html.className = 'thread';
  const contentDiv = document.createElement('div');
  contentDiv.className = 'content-div';
  const header = document.createElement('header');
  let headerHtml = `<a class="handle" href="/profile/${post.post.author.handle}">
    ${post.post.author.handle}</a>
    <a class="time" href="/profile/${post.post.author.handle}/post/${post.post.cid}">${postDate}</span>`;
  if (post.reason?.$type == 'app.bsky.feed.defs#reasonRepost')
    headerHtml =
      `<a class="handle" href="/profile/${post.reason.by?.handle}">
      ${post.reason.by?.handle}</a> reposted ` + headerHtml;
  header.innerHTML = headerHtml;
  contentDiv.appendChild(header);
  const content = document.createElement('content');
  if (post.post.record.text) {
    const text = document.createElement('span');
    text.innerText = post.post.record.text;
    content.appendChild(text);
  }
  if (post.post.record.embed) {
    const embeds = document.createElement('div');
    embeds.className = 'embeds';
    const embed = post.post.record.embed;
    switch (embed.$type) {
      case 'app.bsky.embed.images':
        for (const img of embed.images) {
          embeds.appendChild(new Image(img, post.post.author.did).holderObj);
        }
        break;
      default:
        break;
    }
    content.appendChild(embeds);
  }
  contentDiv.appendChild(content);
  const stats = document.createElement('stats');
  stats.appendChild(interactionButton('like', post.post));
  stats.appendChild(interactionButton('repost', post.post));
  stats.appendChild(interactionButton('reply', post.post));
  contentDiv.appendChild(stats);
  html.appendChild(contentDiv);
  return html;
}

export function profile(profile: ProfileViewDetailed) {
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
  const accountStats = document.createElement('stats');
  accountStats.innerHTML = `
  <button class="follow">+ Follow</button>
  <span><b>${profile.postsCount.toLocaleString()}</b> posts</span>
  <span><b>${profile.followsCount.toLocaleString()}</b> following</span>
  <span><b>${profile.followersCount.toLocaleString()}</b> followers</span>
  `;
  html.appendChild(accountStats);
  const header = document.createElement('header');
  header.innerHTML = `<span class="displayname">${profile.displayName}</span>
  <span class="handle">@${profile.handle}</span>`;
  html.appendChild(header);
  const bio = document.createElement('bio');
  bio.innerText = `${profile.description}`;
  html.appendChild(bio);
  return html;
}

const container = document.getElementById('page-container');
let did = '';

function navButton(name, handle, text) {
  const button = document.createElement('a');
  button.href = '/profile/' + handle + (name=='posts'?'':('/'+name));
  button.innerText = text;
  button.id = 'profile-nav-' + name
  if ((window.location.pathname.split('/')[3] || 'posts') == name) button.className = 'active'
  return button
}

export async function profilePage(handle) {
  const currentURL = window.location.pathname.split('/');
  container.innerHTML = '';
  did = await resolveHandle(handle);
  const _profile = await rpc.get('app.bsky.actor.getProfile', {params: {actor: did}});
  sessionStorage.setItem('currentProfileDID', _profile.data.did)
  container.appendChild(profile(_profile.data));
  const profileNav = document.createElement('div');
  profileNav.className = 'profile-nav';
  profileNav.appendChild(navButton('posts', handle, 'Posts'));
  profileNav.appendChild(navButton('replies', handle, 'Posts and replies'));
  profileNav.appendChild(navButton('media', handle, 'Media'));
  container.appendChild(profileNav);
  const feed = document.createElement('div');
  feed.id = 'feed';
  container.appendChild(feed);
  profileFeed(currentURL[3] || '', did);
}

const equivalents = {
  undefined: 'posts_no_replies',
  '': 'posts_no_replies',
  media: 'posts_with_media',
  replies: 'posts_with_replies',
};

export async function profileFeed(feed: string, did) {
  const {data} = await rpc.get('app.bsky.feed.getAuthorFeed', {
    params: {
      actor: did,
      filter: equivalents[feed],
      limit: 30,
    },
  });
  const {feed: postsArray, cursor: nextPage} = data;
  const feedHtml = document.getElementById('feed');
  for (const post of postsArray) {
    feedHtml.appendChild(feedViewPost(post));
  }
}
