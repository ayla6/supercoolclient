import "@atcute/client/lexicons";
declare module "@atcute/client/lexicons" {
  namespace SCCProfile {
    interface Record {
      $type: "notasite.scc.profile";
      accentColor: string;
      pinnedSearches: string[];
    }
  }
  interface Records {
    "notasite.scc.profile": SCCProfile.Record;
  }

  interface Queries {}

  interface Procedures {}
}
