import { feed } from "../elements/feed";

const path = window.location.pathname;
feed("app.bsky.feed.getTimeline", {});
