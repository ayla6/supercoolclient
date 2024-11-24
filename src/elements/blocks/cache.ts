import { Queries } from "@atcute/client/lexicons";
import { rpc } from "../../login";
import { RPCOptions, XRPCResponse } from "@atcute/client";

let cache: {
  [key in keyof Queries]?: { [key: string]: { [key: string]: any } };
} = {};

function noCursor(params: { [key: string]: any }) {
  let paramsWithoutCursor: { [key: string]: any } = {};
  Object.assign(paramsWithoutCursor, params);
  if ("cursor" in paramsWithoutCursor) delete paramsWithoutCursor.cursor;
  return paramsWithoutCursor;
}

type OutputOf<T> = T extends {
  output: any;
}
  ? T["output"]
  : never;
export async function get<K extends keyof Queries>(
  nsid: K,
  params: RPCOptions<Queries[K]>,
  forceReload: boolean = false,
): Promise<XRPCResponse<OutputOf<Queries[K]>>> {
  if ("params" in params) {
    const noCursorParams = JSON.stringify(noCursor(params.params));
    const paramsKey = JSON.stringify(params.params);
    if (forceReload && cache[nsid] && cache[nsid][noCursorParams]) {
      delete cache[nsid][noCursorParams];
    }
    if (
      !forceReload &&
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
