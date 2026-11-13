/** The eight gist reactions as toggle buttons, in a fixed order: 👍 👎 😄 🎉 😕 ❤️ 🚀 👀. A count shows beside an emoji only when it is above zero. Pressed ones are outlined. The bar knows nothing about sign-in; the app decides what a press does for a signed-out reader (it asks for Google sign-in).
 * @startingPoint section="Components" subtitle="Reaction bar" viewport="520x80"
 */
export interface ReactionBarProps {
  /** everyone else's counts, keyed by emoji; the reader's own press is added on top */
  counts?: Record<string, number>;
  /** the emoji this reader has pressed */
  mine?: string[];
  onToggle: (emoji: string) => void;
}
export declare function ReactionBar(props: ReactionBarProps): JSX.Element;
/** the eight emoji, in order */
export declare const REACTIONS: string[];
