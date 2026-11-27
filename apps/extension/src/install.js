// Onboarding on install (spec AIB-76n extension-popup): a fresh install opens
// the onboarding page once; an update (26.1.15 → this) opens nothing (map
// answer 4). `chrome` is injected so node --test can drive it.

export const ONBOARDING_PATH = "/extension-onboarding";

export function onInstalledHandler(chrome, site) {
  return ({ reason }) => {
    if (reason === "install") chrome.tabs.create({ url: site + ONBOARDING_PATH });
  };
}
