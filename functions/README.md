# Subscribe-failure alert

`aibytesReportSubscribeFailure` posts one Slack message when a newsletter subscribe fails. The webhook is the secret `AIBYTES_SLACK_WEBHOOK`, the same URL the daily runner reads from the git-ignored `.env`. It is not stored in this repo.

The publisher runs the deploy. Never a bare `firebase deploy`, never `--only functions` without the codebase, and never `--force`.

## P2

After this function is in the repo, set the secret to the runner's webhook URL:

```bash
firebase functions:secrets:set AIBYTES_SLACK_WEBHOOK --project ai-bytes-b42d2
```

## P3

Save the function list, deploy this codebase only, then compare the list.

```bash
firebase functions:list --project ai-bytes-b42d2
firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2
firebase functions:list --project ai-bytes-b42d2
```

The second list must be the first list plus `aibytesReportSubscribeFailure`. If the CLI offers to delete a function, answer no and stop the deploy.

```bash
npm test --prefix functions
```

# Extension token

`aibytesExtensionToken` (spec `docs/specs/AIB-76n-extension-auth.md`) gives a
reader signed in with Google on aibytes.io a Firebase custom token for their
own uid, which aibytes.io hands to the Chrome extension. No claims. A session
that did not come from Google (the extension's own custom-token session among
them) is refused, so it cannot mint more. The token is returned, never logged.

## IAM (ticket 2.5)

`createCustomToken` signs through IAM, so the account the functions run as
needs *Service Account Token Creator* on itself. Find the runtime account (2nd
gen functions run as the default compute account unless one is set), then
grant it:

```bash
gcloud functions describe aibytesReportSubscribeFailure --region us-central1 --project ai-bytes-b42d2 --format='value(serviceConfig.serviceAccountEmail)'
gcloud iam service-accounts add-iam-policy-binding <runtime-sa> \
  --member=serviceAccount:<runtime-sa> \
  --role=roles/iam.serviceAccountTokenCreator --project ai-bytes-b42d2
```

## Deploy (ticket 3.22)

As P3 above: save the list, deploy this codebase only, compare.

```bash
firebase functions:list --project ai-bytes-b42d2
firebase deploy --only functions:aibytes-web --project ai-bytes-b42d2
firebase functions:list --project ai-bytes-b42d2
```

The second list must be the first list plus `aibytesExtensionToken`, with
`aibytesReportSubscribeFailure` still in it. If the CLI offers to delete a
function, answer no and stop the deploy.
