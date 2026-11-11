// Which subscribe options a reader sees (spec AIB-140p). Pure. Options stay
// until subscribed is true, so a signed-out reader and a slow read never see
// them disappear and come back.

/** The sidebar block, the weekly-issue bar, and the archive's Subscribe link. */
export function showSubscribeOptions(subscribed) {
  return subscribed !== true;
}

export const NEWSLETTER_PRIVACY = "Signing in here does not subscribe you. If you choose Subscribe after signing in, your Google email is stored as a subscriber and added to the newsletter's list on Substack. You can unsubscribe from any issue. If subscribing fails, your email is sent to the publisher's Slack workspace so you can be added by hand.";
