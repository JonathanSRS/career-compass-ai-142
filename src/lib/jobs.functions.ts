import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { jobAnalysisSchema, matchResultSchema } from "@/lib/analysis-schema";
import { parseStructuredResume, resumeToPlainText } from "@/lib/resume-schema";

export const listJobs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("jobs")
      .select("id, title, company, source_url, created_at, job_analysis(id), match_results(score)")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("listJobs", error);
      throw new Error("Não foi possível carregar suas vagas.");
    }
    return (data ?? []).map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company,
      source_url: j.source_url,
      created_at: j.created_at,
      analyzed: (j.job_analysis ?? []).length > 0,
      best_score: (j.match_results ?? []).reduce((acc, m) => Math.max(acc, m.score ?? 0), 0),
    }));
  });

const createJobInput = z.object({
  title: z.string().min(1).max(160),
  company: z.string().max(160).optional().default(""),
  source_url: z.string().max(500).optional().default(""),
  description: z.string().min(30, "Descreva a vaga com mais detalhes.").max(30000),
});

export const createJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createJobInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("jobs")
      .insert({
        user_id: context.userId,
        title: data.title,
        company: data.company || null,
        source_url: data.source_url || null,
        description: data.description,
      })
      .select("id")
      .single();
    if (error) {
      console.error("createJob", error);
      throw new Error("Não foi possível salvar a vaga.");
    }
    return { id: row.id };
  });

export const getJob = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const [jobRes, analysisRes, matchRes] = await Promise.all([
      supabase.from("jobs").select("*").eq("id", data.id).maybeSingle(),
      supabase
        .from("job_analysis")
        .select("*")
        .eq("job_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("match_results")
        .select("*")
        .eq("job_id", data.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (jobRes.error) {
      console.error("getJob", jobRes.error);
      throw new Error("Não foi possível carregar a vaga.");
    }
    if (!jobRes.data) throw new Error("Vaga não encontrada.");

    const analysisParsed = analysisRes.data ? jobAnalysisSchema.safeParse(analysisRes.data.analysis_json) : null;
    const matchParsed = matchRes.data ? matchResultSchema.safeParse(matchRes.data.analysis_json) : null;

    return {
      job: jobRes.data,
      analysis: analysisParsed?.success ? analysisParsed.data : null,
      match: matchParsed?.success
        ? { ...matchParsed.data, resume_id: matchRes.data?.resume_id ?? null, created_at: matchRes.data?.created_at }
        : null,
    };
  });

export const deleteJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("jobs").delete().eq("id", data.id);
    if (error) {
      console.error("deleteJob", error);
      throw new Error("Não foi possível excluir a vaga.");
    }
    return { ok: true };
  });

/** Serviço de análise da vaga: IA -> validação -> persistência. */
export const analyzeJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string }) => z.object({ jobId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: job, error } = await supabase
      .from("jobs")
      .select("id, title, company, description")
      .eq("id", data.jobId)
      .maybeSingle();
    if (error || !job) throw new Error("Vaga não encontrada.");

    const { getAIService, friendlyAIError } = await import("@/lib/ai/ai-service.server");
    let analysis;
    try {
      analysis = await getAIService().analyzeJob({
        title: job.title,
        company: job.company,
        description: job.description,
      });
    } catch (err) {
      console.error("analyzeJob ai", err);
      throw new Error(friendlyAIError(err));
    }

    await supabase.from("job_analysis").delete().eq("job_id", job.id);
    const { error: insertError } = await supabase.from("job_analysis").insert({
      job_id: job.id,
      user_id: userId,
      seniority: analysis.seniority || null,
      location: analysis.location || null,
      work_model: analysis.work_model || null,
      required_skills: analysis.required_skills,
      preferred_skills: analysis.preferred_skills,
      keywords: analysis.keywords,
      responsibilities: analysis.responsibilities,
      requirements: {
        required: analysis.required_requirements,
        preferred: analysis.preferred_requirements,
      },
      analysis_json: analysis,
    });
    if (insertError) {
      console.error("analyzeJob persist", insertError);
      throw new Error("A análise foi concluída, mas não pôde ser salva. Tente novamente.");
    }
    return analysis;
  });

/** Serviço de matchmaking: compara currículo x vaga e persiste o resultado. */
export const runMatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { jobId: string; resumeId: string }) =>
    z.object({ jobId: z.string().uuid(), resumeId: z.string().uuid() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [jobRes, resumeRes, analysisRes] = await Promise.all([
      supabase.from("jobs").select("id, title, company, description").eq("id", data.jobId).maybeSingle(),
      supabase.from("resumes").select("id, structured_content").eq("id", data.resumeId).maybeSingle(),
      supabase
        .from("job_analysis")
        .select("analysis_json")
        .eq("job_id", data.jobId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    if (!jobRes.data) throw new Error("Vaga não encontrada.");
    if (!resumeRes.data) throw new Error("Currículo não encontrado.");

    const parsedAnalysis = jobAnalysisSchema.safeParse(analysisRes.data?.analysis_json ?? {});
    const jobAnalysis = parsedAnalysis.success ? parsedAnalysis.data : jobAnalysisSchema.parse({});
    const resumeText = resumeToPlainText(parseStructuredResume(resumeRes.data.structured_content));
    if (resumeText.trim().length < 40) {
      throw new Error("Preencha seu currículo antes de comparar com a vaga.");
    }

    const { getAIService, friendlyAIError } = await import("@/lib/ai/ai-service.server");
    let match;
    try {
      match = await getAIService().calculateMatch({
        jobTitle: jobRes.data.title,
        jobCompany: jobRes.data.company,
        jobDescription: jobRes.data.description,
        jobAnalysis,
        resumeText,
      });
    } catch (err) {
      console.error("runMatch ai", err);
      throw new Error(friendlyAIError(err));
    }

    const { error: insertError } = await supabase.from("match_results").insert({
      user_id: userId,
      resume_id: data.resumeId,
      job_id: data.jobId,
      score: match.score,
      matched_keywords: match.matched_keywords,
      missing_keywords: match.missing_keywords,
      matched_skills: match.matched_skills,
      missing_skills: match.missing_skills,
      relevant_experiences: match.relevant_experiences,
      recommendations: match.recommendations,
      analysis_json: match,
    });
    if (insertError) {
      console.error("runMatch persist", insertError);
      throw new Error("A comparação foi concluída, mas não pôde ser salva. Tente novamente.");
    }
    return match;
  });

export const listMatches = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("match_results")
      .select("id, score, created_at, job_id, resume_id, jobs(title, company), resumes(title)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) {
      console.error("listMatches", error);
      throw new Error("Não foi possível carregar os matchings.");
    }
    return data ?? [];
  });

export const getDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const [resumes, jobs, versions, matches] = await Promise.all([
      supabase.from("resumes").select("id, title, is_primary, updated_at").order("updated_at", { ascending: false }),
      supabase.from("jobs").select("id, title, company, created_at").order("created_at", { ascending: false }).limit(5),
      supabase.from("resume_versions").select("id"),
      supabase
        .from("match_results")
        .select("id, score, created_at, jobs(title, company)")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const allResumes = resumes.data ?? [];
    const allMatches = matches.data ?? [];
    return {
      primaryResume: allResumes.find((r) => r.is_primary) ?? allResumes[0] ?? null,
      resumeCount: allResumes.length,
      versionCount: (versions.data ?? []).length,
      recentJobs: jobs.data ?? [],
      recentMatches: allMatches,
      bestScore: allMatches.reduce((acc, m) => Math.max(acc, m.score ?? 0), 0),
    };
  });
