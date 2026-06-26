"use client";

import { useState } from "react";

interface ExpandableTextProps {
  text: string;
  maxLength?: number;
}

export function ExpandableText({ text, maxLength = 120 }: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (text.length <= maxLength) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {expanded ? text : `${text.slice(0, maxLength)}…`}
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="ml-1 text-xs text-blue-600 hover:text-blue-800 underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 rounded"
      >
        {expanded ? "Show less" : "Show more"}
      </button>
    </span>
  );
}
