import React from "react";
import { loadEdition, loadIndex } from "./content.js";

// Scaffold only: proves the base path and the content fetch end to end by
// rendering the latest edition as a plain list. Ledger, routing, and the real
// layout land in the next AIB-8h phase 4 items.
export function App() {
  const [state, setState] = React.useState({ status: "loading" });

  React.useEffect(() => {
    let live = true;
    loadIndex()
      .then((index) => {
        const latest = index.editions[0];
        if (!latest) return { status: "empty" };
        return loadEdition(latest).then((edition) => ({ status: "ready", edition }));
      })
      .catch((error) => ({ status: "error", error }))
      .then((next) => live && setState(next));
    return () => {
      live = false;
    };
  }, []);

  if (state.status === "loading") return <p>Loading the latest edition...</p>;
  if (state.status === "empty") return <p>No editions published yet.</p>;
  if (state.status === "error") return <p role="alert">Could not load the edition: {state.error.message}</p>;

  const { edition } = state;
  return (
    <main>
      <h1>{edition.date}</h1>
      <p>{edition.items.length} items</p>
      <ol>
        {edition.items.map((item) => (
          <li key={item.id}>
            <a href={item.url}>{item.title}</a> <small>{item.category}</small>
            <br />
            {item.summary}
          </li>
        ))}
      </ol>
    </main>
  );
}
