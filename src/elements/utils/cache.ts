import { Queries } from "@atcute/client/lexicons";
import { rpc } from "../../login";
import { RPCOptions, XRPCResponse } from "@atcute/client";

export let cache: {
  [key in keyof Queries]?: { [key: string]: { [key: string]: any } | any };
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
    const specificParamsKey = JSON.stringify(params.params);
    const paramsKey =
      "cursor" in params.params
        ? JSON.stringify(noCursor(params.params))
        : specificParamsKey;
    if (forceReload && cache[nsid] && cache[nsid][paramsKey]) {
      delete cache[nsid][paramsKey];
    }
    if (
      !forceReload &&
      cache[nsid] &&
      cache[nsid][paramsKey] &&
      (specificParamsKey === paramsKey ||
        cache[nsid][paramsKey][specificParamsKey])
    ) {
      if (specificParamsKey === paramsKey) return cache[nsid][paramsKey];
      else return cache[nsid][paramsKey][specificParamsKey];
    } else {
      const result = await rpc.get(nsid, params);
      if (!cache[nsid]) cache[nsid] = {};
      if (specificParamsKey === paramsKey)
        cache[String(nsid)][specificParamsKey] = result;
      else {
        if (!cache[nsid][paramsKey]) cache[String(nsid)][paramsKey] = {};
        cache[nsid][paramsKey][specificParamsKey] = result;
      }
      return result;
    }
  }
}

export function inCache(nsid: keyof Queries, params: any) {
  const paramsKey = JSON.stringify(noCursor(params));
  const specificParamsKey = JSON.stringify(params);
  return (
    cache[nsid] &&
    cache[nsid][paramsKey] &&
    cache[nsid][paramsKey][specificParamsKey]
  );
}

export function deleteCache(nsid: keyof Queries) {
  delete cache[nsid];
}
