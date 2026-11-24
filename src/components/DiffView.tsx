import { useMemo } from "react";
import { diffWords } from "../lib/diff";

interface DiffViewProps {
  before: string;
  after: string;
}

export function DiffView({ before, after }: DiffViewProps) {
  const parts = useMemo(() => diffWords(before, after), [before, after]);

  return (
    <p className="diff" aria-label="Changes between your text and the suggestion">
      {parts.map((part, index) => {
        if (part.type === "added") return <ins key={index}>{part.value}</ins>;
        if (part.type === "removed") return <del key={index}>{part.value}</del>;
        return <span key={index}>{part.value}</span>;
      })}
    </p>
  );
}
