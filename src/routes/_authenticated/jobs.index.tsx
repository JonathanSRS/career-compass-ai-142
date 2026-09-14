import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Briefcase, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteJob, listJobs } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/jobs/")({
  head: () => ({
    meta: [
      { title: "Minhas vagas — Vaga Match" },
      { name: "description", content: "Vagas cadastradas e prontas para análise de compatibilidade." },
      { property: "og:title", content: "Minhas vagas — Vaga Match" },
      { property: "og:description", content: "Vagas cadastradas e analisadas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobsPage,
});

function JobsPage() {
  const fetchJobs = useServerFn(listJobs);
  const removeJob = useServerFn(deleteJob);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["jobs"],
    queryFn: () => fetchJobs(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeJob({ data: { id } }),
    onSuccess: () => {
      toast.success("Vaga excluída.");
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Não foi possível excluir a vaga."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Minhas vagas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Cadastre a descrição da vaga para analisar requisitos e compatibilidade.
          </p>
        </div>
        <Button asChild>
          <Link to="/jobs/new">
            <Plus className="mr-2 size-4" /> Nova vaga
          </Link>
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      )}

      {isError && (
        <div className="surface-panel p-8 text-center">
          <p className="text-sm text-muted-foreground">Não foi possível carregar suas vagas.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="surface-panel p-10 text-center">
          <Briefcase className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Nenhuma vaga cadastrada</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Cole a descrição de uma vaga para ver requisitos, palavras-chave e compatibilidade.
          </p>
          <Button asChild className="mt-5">
            <Link to="/jobs/new">Cadastrar vaga</Link>
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((job) => (
            <li key={job.id} className="surface-panel flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{job.title}</p>
                <p className="mt-1 truncate text-xs text-muted-foreground">
                  {job.company ?? "Empresa não informada"} · criada em{" "}
                  {new Date(job.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/jobs/$jobId" params={{ jobId: job.id }}>
                    Abrir
                  </Link>
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="sm">
                      Excluir
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Excluir vaga?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A análise e as comparações desta vaga também serão removidas.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(job.id)}>Excluir</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
