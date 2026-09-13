import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { FileText, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { deleteResume, listResumes } from "@/lib/resumes.functions";

export const Route = createFileRoute("/_authenticated/resumes/")({
  head: () => ({
    meta: [
      { title: "Meus currículos — Vaga Match" },
      { name: "description", content: "Gerencie seus currículos e escolha o principal." },
      { property: "og:title", content: "Meus currículos — Vaga Match" },
      { property: "og:description", content: "Gerencie seus currículos estruturados." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ResumesPage,
});

function ResumesPage() {
  const fetchResumes = useServerFn(listResumes);
  const removeResume = useServerFn(deleteResume);
  const queryClient = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => fetchResumes(),
  });

  const remove = useMutation({
    mutationFn: (id: string) => removeResume({ data: { id } }),
    onSuccess: () => {
      toast.success("Currículo excluído.");
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: () => toast.error("Não foi possível excluir o currículo."),
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="page-title">Meus currículos</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            O currículo principal é usado como padrão nas comparações com vagas.
          </p>
        </div>
        <Button asChild>
          <Link to="/resumes/new">
            <Plus className="mr-2 size-4" /> Novo currículo
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
          <p className="text-sm text-muted-foreground">Não foi possível carregar seus currículos.</p>
          <Button className="mt-4" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {data && data.length === 0 && (
        <div className="surface-panel p-10 text-center">
          <FileText className="mx-auto size-6 text-muted-foreground" />
          <h2 className="mt-3 text-base font-semibold">Nenhum currículo cadastrado</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Crie seu currículo estruturado para começar a comparar com vagas.
          </p>
          <Button asChild className="mt-5">
            <Link to="/resumes/new">Criar currículo</Link>
          </Button>
        </div>
      )}

      {data && data.length > 0 && (
        <ul className="space-y-3">
          {data.map((resume) => (
            <li key={resume.id} className="surface-panel flex flex-wrap items-center gap-3 p-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium">{resume.title}</p>
                  {resume.is_primary && <Badge>Principal</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {resume.structured_content.experiences.length} experiências ·{" "}
                  {resume.structured_content.skills.length} competências · atualizado em{" "}
                  {new Date(resume.updated_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/resumes/$resumeId" params={{ resumeId: resume.id }}>
                    Editar
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
                      <AlertDialogTitle>Excluir currículo?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta ação não pode ser desfeita e remove as comparações ligadas a ele.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={() => remove.mutate(resume.id)}>
                        Excluir
                      </AlertDialogAction>
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
