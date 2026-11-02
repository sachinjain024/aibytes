/** The panel the Toolbar's Filters button opens: Reset, a tag search that narrows the list, the tags in their groups as checkboxes, then "Discovered on" with one checkbox per source. Selections apply as they are made. A popover, so it may carry a soft shadow. */
export interface FilterPanelProps {
  /** tag groups, e.g. { name: "Topics", tags: [{ name: "Agents" }] } */
  groups?: { name: string; tags: { name: string }[] }[];
  /** the selection; tags and sources are what this panel edits */
  filters: { tags: string[]; sources: string[] } & Record<string, unknown>;
  /** called with the whole new filters object */
  onChange: (filters: FilterPanelProps["filters"]) => void;
  sources?: { key: string; label: string }[];
}
export declare function FilterPanel(props: FilterPanelProps): JSX.Element;
