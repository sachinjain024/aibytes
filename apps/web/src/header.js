// What the masthead shows for the reader's account (B2 in the AIB-75v design
// record), as AppHeader props. `user` is undefined while Firebase restores the
// session, and then neither control shows, so a signed-in reader never sees
// Sign in flash; null when signed out; { uid, name, photoUrl? } when signed in.

export function headerAccount(user, { signIn, signOut, openSaved }) {
  if (user === undefined) return {};
  if (!user) return { onSignIn: signIn };
  const { name, photoUrl } = user;
  return { user: photoUrl ? { name, photoUrl } : { name }, onSignOut: signOut, onSaved: openSaved };
}
