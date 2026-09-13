import { cn } from "@/lib/utils";

export function ScoreBar({ score, label }: { score: number; label?: string }) {
  const tone = score >= 75 ? "bg-success" : score >= 50 ? "bg-warning" : "bg-destructive";
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <span className="text-sm text-muted-foreground">{label ?? "Compatibilidade geral"}</span>
        <span className="font-display text-2xl font-semibold">{score}%</span>
      </div>
      <div
        className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={score}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${score}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Estimativa baseada no seu currículo e na vaga. Não garante aprovação em um ATS ou contratação.
      </p>
    </div>
  );
}
