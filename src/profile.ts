import {profilePage} from './loadings.ts';

const path = window.location.pathname;
const location = path.split('/')[2];

profilePage(location);
