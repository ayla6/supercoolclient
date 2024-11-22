import { Queries } from "@atcute/client/lexicons";
import { rpc } from "../../login";

let cache: {
  [key in keyof Queries]?: { [key: string]: { [key: string]: any } };
} = {};

function noCursor(params: { [key: string]: any }) {
  const paramsWithoutCursor = { ...params.params };
  delete paramsWithoutCursor.cursor;
  return paramsWithoutCursor;
}

export async function get(
  nsid: keyof Queries,
  params: { params: any },
  forcereload: boolean = false,
) {
  const noCursorParams = JSON.stringify(noCursor(params));
  const paramsKey = JSON.stringify(params.params);
  if (forcereload && cache[nsid] && cache[nsid][noCursorParams]) {
    delete cache[nsid][noCursorParams];
  }
  if (
    !forcereload &&
    cache[nsid] &&
    cache[nsid][noCursorParams] &&
    cache[nsid][noCursorParams][paramsKey]
  ) {
    return cache[nsid][noCursorParams][paramsKey];
  } else {
    const result = await rpc.get(nsid, params);
    if (!cache[nsid]) cache[nsid] = {};
    if (!cache[nsid][noCursorParams]) cache[nsid][noCursorParams] = {};
    cache[nsid][noCursorParams][paramsKey] = result;
    return result;
  }
}

export function inCache(nsid: keyof Queries, params: any) {
  const noCursorParams = JSON.stringify(noCursor(params));
  const paramsKey = JSON.stringify(params);
  return (
    cache[nsid] &&
    cache[nsid][noCursorParams] &&
    cache[nsid][noCursorParams][paramsKey]
  );
}
