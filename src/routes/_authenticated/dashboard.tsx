import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, FileText, Plus, Target } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { getDashboard } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vaga Match" },
      { name: "description", content: "Visão geral dos seus currículos, vagas analisadas e matchings." },
      { property: "og:title", content: "Dashboard — Vaga Match" },
      { property: "og:description", content: "Currículos, vagas e scores de compatibilidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const fetchDashboard = useServerFn(getDashboard);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => fetchDashboard(),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <div className="grid gap-4 sm:grid-cols-3">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-56" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="surface-panel p-8 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível carregar seu painel agora.</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const cards = [
    { label: "Currículos", value: data.resumeCount, icon: FileText },
    { label: "Versões criadas", value: data.versionCount, icon: Plus },
    { label: "Melhor compatibilidade", value: `${data.bestScore}%`, icon: Target },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Currículo principal:{" "}
            {data.primaryResume ? data.primaryResume.title : "nenhum cadastrado ainda"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/resumes/new">Novo currículo</Link>
          </Button>
          <Button asChild>
            <Link to="/jobs/new">Nova vaga</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="surface-panel p-5">
            <Icon className="size-4 text-primary" />
            <p className="mt-3 text-sm text-muted-foreground">{label}</p>
            <p className="font-display text-2xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="surface-panel p-5">
          <h2 className="text-base font-semibold">Últimos matchings</h2>
          {data.recentMatches.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma comparação ainda. Cadastre uma vaga e compare com seu currículo.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.recentMatches.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{m.jobs?.title ?? "Vaga"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.jobs?.company ?? "—"}</p>
                  </div>
                  <Badge variant="secondary">{m.score}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="surface-panel p-5">
          <h2 className="text-base font-semibold">Vagas recentes</h2>
          {data.recentJobs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">Você ainda não cadastrou vagas.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {data.recentJobs.map((j) => (
                <li key={j.id} className="flex items-center justify-between gap-3 border-b pb-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{j.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{j.company ?? "—"}</p>
                  </div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/jobs/$jobId" params={{ jobId: j.id }}>
                      Abrir
                    </Link>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <div className="surface-panel flex flex-wrap gap-2 p-5">
        <Button asChild variant="secondary" size="sm">
          <Link to="/resumes">
            <FileText className="mr-2 size-4" /> Meus currículos
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to="/jobs">
            <Briefcase className="mr-2 size-4" /> Minhas vagas
          </Link>
        </Button>
        <Button asChild variant="secondary" size="sm">
          <Link to="/matches">
            <Target className="mr-2 size-4" /> Matchmaking
          </Link>
        </Button>
      </div>
    </div>
  );
}
