// The newsletter prompt's states (spec AIB-140p). Pure, so node --test covers
// every transition without React or Firebase. NewsletterPrompt.jsx renders them.

export const PROMPT_COPY = {
  heading: "You're successfully signed in.",
  lead: "Get the best of AI in your inbox every Monday",
  covers: ["New AI tools", "AI threads on HN", "Trending AI projects", "Latest AI news", "Official announcements", "Viral posts on X"],
  proof: "Read by 2,000+ developers at companies like Amazon, Google, OpenAI, Nvidia and Stripe.",
  builtBy: "Built by a former YC founder",
  subscribe: "Subscribe",
  subscribing: "Subscribing…",
  failed: "Could not subscribe. Check your connection and try again.",
  thanks: "Thank you for subscribing.",
  arrives: (email) => `aiBytes_ arrives every Monday at ${email}.`,
};

export const initialPrompt = { status: "offer" };

/** offer → saving → thanks | failed, then the countdown 3, 2, 1, closed. */
export function promptReducer(state, action) {
  switch (action.type) {
    case "subscribe":
      return state.status === "offer" || state.status === "failed" ? { status: "saving" } : state;
    case "saved":
      return state.status === "saving" ? { status: "thanks", seconds: 3 } : state;
    case "failed":
      return state.status === "saving" ? { status: "failed" } : state;
    case "tick":
      if (state.status !== "thanks") return state;
      return state.seconds > 1 ? { status: "thanks", seconds: state.seconds - 1 } : { status: "closed" };
    case "close":
      return state.status === "offer" || state.status === "failed" || state.status === "thanks" ? { status: "closed" } : state;
    default:
      return state;
  }
}
