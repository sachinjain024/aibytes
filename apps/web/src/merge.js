// Signing in moves this browser's saves into the account (spec AIB-75v
// app-accounts): a union where the account's copy wins. Pure, so node --test
// covers it; App.jsx writes the batch and clears local storage only after it
// commits.

/** The local saves the account lacks, as stored (created_at kept), in their order. */
export function toAdd(local, account) {
  const have = new Set(account.map((save) => save.item_id));
  return local.filter((save) => !have.has(save.item_id));
}

/** The line the Saved page shows once after a merge, or null when nothing was added. */
export function mergedLine(count) {
  if (!count) return null;
  return count === 1
    ? "1 save from this browser was added to your account."
    : `${count} saves from this browser were added to your account.`;
}
