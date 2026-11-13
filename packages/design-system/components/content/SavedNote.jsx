import React from "react";

// The line under the save control after a save: "Added to your Saved items.
// View here". It is a status message, so a screen reader announces it.
export function SavedNote({ href = "/saved" }) {
  return <p className="gist-saved" role="status">Added to your Saved items. <a href={href}>View here</a></p>;
}
