// Tells aibytesReportSubscribeFailure that a subscribe failed (spec AIB-140p).
// Imported only after a failure, so the Functions client is not in the first
// paint or the sign-in chunk. The result is ignored: the reader already sees
// the failure line. The call carries the code and the page, never an email.

export function reportFailure(code, page, call) {
  const send = call || ((data) => import("firebase/functions").then(({ getFunctions, httpsCallable }) => (
    httpsCallable(getFunctions(), "aibytesReportSubscribeFailure")(data)
  )));
  return Promise.resolve().then(() => send({ code, page })).then(() => {}, () => {});
}
