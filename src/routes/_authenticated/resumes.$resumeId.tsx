import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { ResumeForm, createEmptyFormValue, type ResumeFormValue } from "@/components/ResumeForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { getResume, saveResume } from "@/lib/resumes.functions";

export const Route = createFileRoute("/_authenticated/resumes/$resumeId")({
  head: () => ({
    meta: [
      { title: "Editar currículo — Vaga Match" },
      { name: "description", content: "Edite as seções do seu currículo estruturado." },
      { property: "og:title", content: "Editar currículo — Vaga Match" },
      { property: "og:description", content: "Edite as seções do seu currículo estruturado." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EditResume,
});

function EditResume() {
  const { resumeId } = Route.useParams();
  const fetchResume = useServerFn(getResume);
  const persist = useServerFn(saveResume);
  const queryClient = useQueryClient();
  const [value, setValue] = useState<ResumeFormValue | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["resume", resumeId],
    queryFn: () => fetchResume({ data: { id: resumeId } }),
  });

  useEffect(() => {
    if (!data) return;
    setValue({
      title: data.title,
      is_primary: data.is_primary,
      structured_content: data.structured_content,
    });
  }, [data]);

  const save = useMutation({
    mutationFn: () => persist({ data: { id: resumeId, ...(value ?? createEmptyFormValue()) } }),
    onSuccess: () => {
      toast.success("Alterações salvas.");
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar."),
  });

  if (isLoading || (!value && !isError)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-40" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (isError || !value) {
    return (
      <div className="surface-panel p-8 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível carregar este currículo.</p>
        <Button className="mt-4" onClick={() => refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Editar currículo</h1>
        <p className="mt-1 text-sm text-muted-foreground">Todo o conteúdo aqui é seu e permanece factual.</p>
      </div>
      <ResumeForm
        value={value}
        onChange={setValue}
        onSubmit={() => save.mutate()}
        saving={save.isPending}
      />
    </div>
  );
}
