import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { listMatches } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/matches")({
  head: () => ({
    meta: [
      { title: "Matchmaking — Vaga Match" },
      { name: "description", content: "Histórico de comparações entre seus currículos e vagas." },
      { property: "og:title", content: "Matchmaking — Vaga Match" },
      { property: "og:description", content: "Histórico de comparações e scores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MatchesPage,
});

function MatchesPage() {
  const fetchMatches = useServerFn(listMatches);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["matches"],
    queryFn: () => fetchMatches(),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Matchmaking</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cada comparação mostra uma estimativa de compatibilidade — não uma garantia de aprovação.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {isError && (
        <div className="surface-panel p-8 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar as comparações.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="surface-panel p-10 text-center">
          <Target className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Nenhuma comparação ainda</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Abra uma vaga cadastrada e compare com o seu currículo.
          </p>
          <Button asChild className="mt-5">
            <Link to="/jobs">Ver minhas vagas</Link>
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((match) => (
            <li key={match.id} className="surface-panel flex flex-wrap items-center gap-3 p-4">
              <Badge variant="secondary" className="text-sm">
                {match.score}%
              </Badge>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{match.jobs?.title ?? "Vaga"}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {match.jobs?.company ?? "Empresa não informada"} ·{" "}
                  {new Date(match.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              {match.job_id && (
                <Button asChild variant="outline" size="sm">
                  <Link to="/jobs/$jobId" params={{ jobId: match.job_id }}>
                    Ver detalhes
                  </Link>
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
