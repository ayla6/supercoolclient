import '@atcute/client/lexicons';
declare module '@atcute/client/lexicons' {
  namespace AppSCCAccentColor {
    /** Record declaring a 'like' of a piece of subject content. */
    interface Record {
      $type: 'app.scc.profile';
      accentColor: string;
    }
  }
  interface Records {
    'app.scc.profile': AppSCCAccentColor.Record;
  }

  interface Queries {}

  interface Procedures {}
}
