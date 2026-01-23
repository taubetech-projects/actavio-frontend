import { Zap } from "lucide-react";

export default function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground">
        <Zap className="h-5 w-5 text-background" />
      </div>
      <span className="text-xl font-semibold tracking-tight text-foreground">
        TaskFlow
      </span>
    </div>
  );
}
