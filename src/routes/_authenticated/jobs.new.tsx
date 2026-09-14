import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createJob } from "@/lib/jobs.functions";

export const Route = createFileRoute("/_authenticated/jobs/new")({
  head: () => ({
    meta: [
      { title: "Nova vaga — Vaga Match" },
      { name: "description", content: "Cadastre uma vaga e analise seus requisitos automaticamente." },
      { property: "og:title", content: "Nova vaga — Vaga Match" },
      { property: "og:description", content: "Cadastre uma vaga e analise seus requisitos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewJob,
});

function NewJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const persist = useServerFn(createJob);

  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [description, setDescription] = useState("");

  const save = useMutation({
    mutationFn: () =>
      persist({ data: { title, company, source_url: sourceUrl, description } }),
    onSuccess: (result) => {
      toast.success("Vaga cadastrada.");
      void queryClient.invalidateQueries({ queryKey: ["jobs"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      navigate({ to: "/jobs/$jobId", params: { jobId: result.id } });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a vaga."),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Nova vaga</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cole a descrição completa da vaga para uma análise mais precisa.
        </p>
      </div>

      <form
        className="surface-panel space-y-5 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          save.mutate();
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="job-title">Título da vaga</Label>
            <Input id="job-title" required value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job-company">Empresa</Label>
            <Input id="job-company" value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-url">Link da vaga (opcional)</Label>
          <Input
            id="job-url"
            type="url"
            placeholder="https://"
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="job-description">Descrição da vaga</Label>
          <Textarea
            id="job-description"
            required
            rows={14}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cole aqui o texto completo do anúncio da vaga."
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="lg" disabled={save.isPending}>
            {save.isPending ? "Salvando..." : "Salvar e continuar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
