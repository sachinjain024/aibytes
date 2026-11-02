/** The actions for the current screen, in one row under the AppHeader: item count, search ("/" focuses it), Filters, Ranked | Grouped, List | Grid, then the edition date picker at the far right. No borders: it reads as the first row of the content. Each control renders only when its handler (or value) is passed.
 * @startingPoint section="Components" subtitle="Screen toolbar: count, search, filters, order, layout, date" viewport="1100x58"
 */
export interface ToolbarProps {
  /** e.g. "32 items", mono and muted, first in the row */
  count?: string;
  query?: string;
  /** the search box renders only when this is passed */
  onQuery?: (query: string) => void;
  /** the date picker at the far right: pass an <EditionBar /> */
  date?: React.ReactNode;
  mode?: "ranked" | "grouped";
  /** the Ranked | Grouped control renders only when this is passed */
  onMode?: (mode: "ranked" | "grouped") => void;
  view?: "grid" | "list";
  /** the List | Grid toggle renders only when this is passed; omit it at one column, where they look alike */
  onView?: (view: "grid" | "list") => void;
  /** selected tags + sources, shown after "Filters" */
  filterCount?: number;
  /** whether the FilterPanel is open, announced as aria-expanded */
  open?: boolean;
  /** the Filters button renders only when this is passed */
  onFilters?: () => void;
  /** disables search and Filters, e.g. until the edition has loaded */
  disabled?: boolean;
}
export declare function Toolbar(props: ToolbarProps): JSX.Element;
