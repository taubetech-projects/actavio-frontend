export const CONFIDENCE_STYLE: Record<"HIGH" | "MEDIUM" | "LOW", { label: string; className: string }> = {
  HIGH:   { label: "High confidence",               className: "bg-success/10 text-success" },
  MEDIUM: { label: "Medium confidence",              className: "bg-yellow-500/10 text-yellow-600" },
  LOW:    { label: "Low confidence — please review", className: "bg-destructive/10 text-destructive" },
};
