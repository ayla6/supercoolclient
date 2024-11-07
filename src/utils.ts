import {rpc} from './login.ts';

export function formatDate(date) {
  const year = String(date.getFullYear()).slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export async function resolveHandle(handle) {
  return (
    await rpc.get('com.atproto.identity.resolveHandle', {
      params: {handle: handle},
    })
  ).data.did;
}
