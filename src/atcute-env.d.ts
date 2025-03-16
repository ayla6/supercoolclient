// https://codeberg.org/mary-ext/aglais/src/commit/2f9770a31e7fb60d1b030bc952417c74ea01aa0c/src/atcute-env.d.ts

import type { AppBskyRichtextFacet } from "@atcute/client/lexicons";

declare module "@atcute/client/lexicons" {
  namespace AppBskyRichtextFacet {
    type FacetFeature = Brand.Union<
      Link | Mention | Tag | BlueMojiRichtextFacet.Main
    >;

    interface Main {
      features: FacetFeature[];
    }
  }
}

declare module "@atcute/bluesky-richtext-segmenter" {
  export interface RichtextSegment {
    features: AppBskyRichtextFacet.FacetFeature[] | undefined;
  }
}
