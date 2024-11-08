import {login} from './login.ts';
import './navigation.ts';

await login();

/*const record: AppSCCProfile.Record = {
  $type: 'app.scc.profile',
  accentColor: '#f58ea9',
  pinnedSearches: ['#test']
}
rpc.call('com.atproto.repo.putRecord', {data: {record: record, collection: 'app.scc.profile',repo: sessionStorage.getItem('userdid'), rkey: 'self'}})*/

const path = window.location.pathname;
const location = path.split('/')[1];
const script = document.createElement('script');
script.type = 'module';
script.id = 'pagescript';
switch (location) {
  case 'profile':
    if (path.split('/')[4]) {
      script.src = '/src/post.ts';
      script.setAttribute('location', 'post');
    } else {
      script.src = '/src/profile.ts';
      script.setAttribute('location', 'profile');
    }
    break;
  default:
    break;
}
document.body.appendChild(script);

document.addEventListener('DOMContentLoaded', function () {
  const links = document.querySelectorAll('a');

  links.forEach((link) => {
    link;
  });
});
