import { XRPC } from "@atcute/client";
import { XRPCCache } from "../../types";
import { Queries } from "@atcute/client/lexicons";
import { rpc } from "../../login";
const CACHE_DURATION = 5 * 60 * 1000;
const GRACE_PERIOD = 0.1 * 60 * 1000;

export const getCacheId = (nsid: keyof Queries, params: any) => {
  return nsid + JSON.stringify(params);
};

export const cache: XRPCCache = new Map();
export const setCache = (key: string, value: any) => {
  return cache.set(key, {
    value,
    expiresAt: Date.now() + CACHE_DURATION,
  });
};
export const getCache = (key: string) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  entry.expiresAt = entry.expiresAt + CACHE_DURATION * 0.5;
  return entry.value;
};

export const request = async (
  nsid: keyof Queries,
  params: any,
  useCache: boolean = false,
  _rpc: XRPC = rpc,
  duration: number = useCache ? Infinity : CACHE_DURATION,
) => {
  const id = getCacheId(nsid, params);
  let data: any;
  const entry = cache.get(id);
  if (
    entry &&
    (useCache || entry.expiresAt - CACHE_DURATION + GRACE_PERIOD > Date.now())
  ) {
    data = entry.value;
  }
  if (!data || entry.expiresAt < Date.now()) {
    data = await _rpc.get(nsid, params);
    cache.set(id, {
      value: data,
      expiresAt: Date.now() + duration,
    });
  }
  return data;
};

export const cleanCache = () => {
  console.time("Time to clean cache");
  const now = Date.now();
  const currentPath = window.location.pathname;
  for (const [path, entry] of cache.entries()) {
    if (entry.expiresAt < now && path !== currentPath) {
      cache.delete(path);
      console.log("deleted " + path);
    } else if (entry[0] < Infinity) break;
  }
  console.timeEnd("Time to clean cache");
};
