/** The grid view: Cards in as many columns of at least --app-card-min (300px; 360px from a 900px window) as fit, gap --grid-gap. */
export declare function CardGrid(props: { children?: React.ReactNode }): JSX.Element;
/** The list view: ListRows stacked, a border between each. */
export declare function RowList(props: { children?: React.ReactNode }): JSX.Element;
/** A one-line message where the feed would be: "Loading...", an error (role "alert"), or nowhere to go. */
export declare function StatusMessage(props: { role?: "status" | "alert"; children?: React.ReactNode }): JSX.Element;
