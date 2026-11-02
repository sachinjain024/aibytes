/** The row under the Toolbar while tags or sources are selected: one pill per selection ("Agents ×"), each removing itself, then "Clear filters". Renders nothing when nothing is selected. */
export interface ActiveFiltersProps {
  filters: { tags: string[]; sources: string[] } & Record<string, unknown>;
  /** called with the whole new filters object */
  onChange: (filters: ActiveFiltersProps["filters"]) => void;
}
export declare function ActiveFilters(props: ActiveFiltersProps): JSX.Element | null;
