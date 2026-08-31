import React from "react";
export function SectionHeading({ name, count, id }) {
  return <h2 className="ldg-section-h" id={id}>{name} <span className="ldg-count">· {count}</span></h2>;
}
