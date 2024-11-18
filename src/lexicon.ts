import "@atcute/client/lexicons";
declare module "@atcute/client/lexicons" {
  namespace AppSCCProfile {
    interface Record {
      $type: "app.scc.profile";
      accentColor: string;
      pinnedSearches: string[];
    }
  }
  interface Records {
    "app.scc.profile": AppSCCProfile.Record;
  }

  interface Queries {}

  interface Procedures {}
}
