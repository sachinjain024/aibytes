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
