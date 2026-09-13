import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { ResumeForm, createEmptyFormValue, type ResumeFormValue } from "@/components/ResumeForm";
import { saveResume } from "@/lib/resumes.functions";

export const Route = createFileRoute("/_authenticated/resumes/new")({
  head: () => ({
    meta: [
      { title: "Novo currículo — Vaga Match" },
      { name: "description", content: "Crie um currículo estruturado por seções." },
      { property: "og:title", content: "Novo currículo — Vaga Match" },
      { property: "og:description", content: "Crie um currículo estruturado por seções." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewResume,
});

function NewResume() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const persist = useServerFn(saveResume);
  const [value, setValue] = useState<ResumeFormValue>(createEmptyFormValue);

  const save = useMutation({
    mutationFn: () => persist({ data: value }),
    onSuccess: (result) => {
      toast.success("Currículo salvo.");
      void queryClient.invalidateQueries({ queryKey: ["resumes"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/resumes/$resumeId", params: { resumeId: result.id } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Não foi possível salvar."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Novo currículo</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Preencha apenas informações verdadeiras — elas são a base de todas as análises.
        </p>
      </div>
      <ResumeForm value={value} onChange={setValue} onSubmit={() => save.mutate()} saving={save.isPending} />
    </div>
  );
}
