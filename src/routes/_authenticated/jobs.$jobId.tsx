import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScoreBar } from "@/components/ScoreBar";
import { analyzeJob, getJob, runMatch } from "@/lib/jobs.functions";
import { listResumes } from "@/lib/resumes.functions";

export const Route = createFileRoute("/_authenticated/jobs/$jobId")({
  head: () => ({
    meta: [
      { title: "Detalhes da vaga — Vaga Match" },
      { name: "description", content: "Requisitos, palavras-chave e compatibilidade com seu currículo." },
      { property: "og:title", content: "Detalhes da vaga — Vaga Match" },
      { property: "og:description", content: "Requisitos, palavras-chave e compatibilidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JobDetail,
});

function TagList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <Badge key={item} variant="secondary" className="font-normal">
            {item}
          </Badge>
        ))}
      </div>
    </div>
  );
}

function BulletList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-sm font-medium">{title}</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function JobDetail() {
  const { jobId } = Route.useParams();
  const queryClient = useQueryClient();
  const fetchJob = useServerFn(getJob);
  const fetchResumes = useServerFn(listResumes);
  const analyze = useServerFn(analyzeJob);
  const match = useServerFn(runMatch);

  const [resumeId, setResumeId] = useState<string>("");

  const jobQuery = useQuery({
    queryKey: ["job", jobId],
    queryFn: () => fetchJob({ data: { id: jobId } }),
  });

  const resumesQuery = useQuery({
    queryKey: ["resumes"],
    queryFn: () => fetchResumes(),
  });

  useEffect(() => {
    if (resumeId || !resumesQuery.data?.length) return;
    const primary = resumesQuery.data.find((r) => r.is_primary) ?? resumesQuery.data[0];
    setResumeId(primary.id);
  }, [resumesQuery.data, resumeId]);

  const analyzeMutation = useMutation({
    mutationFn: () => analyze({ data: { jobId } }),
    onSuccess: () => {
      toast.success("Análise da vaga concluída.");
      void queryClient.invalidateQueries({ queryKey: ["job", jobId] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Não foi possível analisar a vaga."),
  });

  const matchMutation = useMutation({
    mutationFn: () => match({ data: { jobId, resumeId } }),
    onSuccess: () => {
      toast.success("Comparação concluída.");
      void queryClient.invalidateQueries({ queryKey: ["job", jobId] });
      void queryClient.invalidateQueries({ queryKey: ["matches"] });
      void queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : "Não foi possível comparar seu currículo."),
  });

  if (jobQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (jobQuery.isError || !jobQuery.data) {
    return (
      <div className="surface-panel p-8 text-center">
        <p className="text-sm text-muted-foreground">Não foi possível carregar esta vaga.</p>
        <Button className="mt-4" onClick={() => jobQuery.refetch()}>
          Tentar novamente
        </Button>
      </div>
    );
  }

  const { job, analysis, match: matchResult } = jobQuery.data;
  const hasResumes = (resumesQuery.data?.length ?? 0) > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="page-title truncate">{job.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {job.company ?? "Empresa não informada"}
            {job.source_url ? (
              <>
                {" · "}
                <a className="underline" href={job.source_url} target="_blank" rel="noreferrer">
                  ver anúncio
                </a>
              </>
            ) : null}
          </p>
        </div>
        <Button onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
          {analyzeMutation.isPending ? "Analisando a vaga..." : analysis ? "Analisar novamente" : "Analisar vaga"}
        </Button>
      </div>

      <section className="surface-panel space-y-5 p-5">
        <h2 className="text-base font-semibold">Análise da vaga</h2>
        {analyzeMutation.isPending && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Analisando a vaga e extraindo requisitos...</p>
            <Skeleton className="h-24" />
          </div>
        )}
        {!analysis && !analyzeMutation.isPending && (
          <p className="text-sm text-muted-foreground">
            Ainda não analisada. Use o botão acima para extrair requisitos, competências e palavras-chave.
          </p>
        )}
        {analysis && !analyzeMutation.isPending && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {analysis.seniority && <Badge variant="outline">Senioridade: {analysis.seniority}</Badge>}
              {analysis.location && <Badge variant="outline">Local: {analysis.location}</Badge>}
              {analysis.work_model && <Badge variant="outline">Modalidade: {analysis.work_model}</Badge>}
            </div>
            <BulletList title="Requisitos obrigatórios" items={analysis.required_requirements} />
            <BulletList title="Requisitos desejáveis" items={analysis.preferred_requirements} />
            <BulletList title="Responsabilidades" items={analysis.responsibilities} />
            <TagList title="Palavras-chave para ATS" items={analysis.keywords} />
            <TagList title="Linguagens" items={analysis.competencies.languages} />
            <TagList title="Frameworks" items={analysis.competencies.frameworks} />
            <TagList title="Ferramentas" items={analysis.competencies.tools} />
            <TagList title="Bancos de dados" items={analysis.competencies.databases} />
            <TagList title="Cloud" items={analysis.competencies.cloud} />
            <TagList title="Metodologias" items={analysis.competencies.methodologies} />
            <TagList title="Competências comportamentais" items={analysis.competencies.soft_skills} />
            <TagList title="Idiomas" items={analysis.competencies.languages_spoken} />
            <TagList title="Certificações" items={analysis.competencies.certifications} />
            {analysis.missing_information.length > 0 && (
              <Alert>
                <AlertTitle>Informações não encontradas no anúncio</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc space-y-1 pl-5">
                    {analysis.missing_information.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </section>

      <section className="surface-panel space-y-5 p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="text-base font-semibold">Compatibilidade com seu currículo</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={resumeId} onValueChange={setResumeId} disabled={!hasResumes}>
              <SelectTrigger className="w-56">
                <SelectValue placeholder="Escolha um currículo" />
              </SelectTrigger>
              <SelectContent>
                {(resumesQuery.data ?? []).map((resume) => (
                  <SelectItem key={resume.id} value={resume.id}>
                    {resume.title}
                    {resume.is_primary ? " (principal)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              variant="secondary"
              disabled={!resumeId || matchMutation.isPending}
              onClick={() => matchMutation.mutate()}
            >
              {matchMutation.isPending ? "Comparando seu currículo..." : "Comparar"}
            </Button>
          </div>
        </div>

        {!hasResumes && (
          <p className="text-sm text-muted-foreground">
            Cadastre um currículo antes de comparar com esta vaga.
          </p>
        )}

        {matchMutation.isPending && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Comparando seu currículo e gerando recomendações...</p>
            <Skeleton className="h-24" />
          </div>
        )}

        {matchResult && !matchMutation.isPending && (
          <div className="space-y-5">
            <ScoreBar score={matchResult.score} />
            {matchResult.summary && <p className="text-sm text-muted-foreground">{matchResult.summary}</p>}
            <BulletList title="Pontos fortes" items={matchResult.strengths} />
            <BulletList title="Pontos de atenção" items={matchResult.attention_points} />
            <BulletList title="Experiências relevantes" items={matchResult.relevant_experiences} />
            <TagList title="Palavras-chave presentes" items={matchResult.matched_keywords} />
            <TagList title="Palavras-chave ausentes" items={matchResult.missing_keywords} />
            <TagList title="Competências atendidas" items={matchResult.matched_skills} />
            <TagList title="Competências não identificadas" items={matchResult.missing_skills} />
            <BulletList title="Recomendações" items={matchResult.recommendations} />
            <Alert>
              <AlertTitle>Sem invenções</AlertTitle>
              <AlertDescription>
                As lacunas apontadas devem ser preenchidas apenas com experiências que você realmente
                possui. Nunca adicione tecnologias, cargos ou certificações que você não tenha.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {!matchResult && !matchMutation.isPending && hasResumes && (
          <p className="text-sm text-muted-foreground">
            Nenhuma comparação feita para esta vaga ainda.
          </p>
        )}
      </section>

      <section className="surface-panel space-y-3 p-5">
        <h2 className="text-base font-semibold">Descrição original da vaga</h2>
        <p className="whitespace-pre-wrap text-sm text-muted-foreground">{job.description}</p>
      </section>
    </div>
  );
}
