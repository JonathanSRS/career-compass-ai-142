/**
 * Camada de abstração de IA.
 *
 * O restante da aplicação depende apenas da interface `AIService`.
 * Para trocar de provedor, basta criar outra implementação e alterar
 * `getAIService()` — nenhum serviço de negócio precisa mudar.
 */
import { jobAnalysisSchema, matchResultSchema, type JobAnalysis, type MatchResult } from "@/lib/analysis-schema";
import { structuredResumeSchema, type StructuredResume } from "@/lib/resume-schema";

export interface AnalyzeJobInput {
  title: string;
  company?: string | null;
  description: string;
}

export interface CalculateMatchInput {
  jobTitle: string;
  jobCompany?: string | null;
  jobDescription: string;
  jobAnalysis: JobAnalysis;
  resumeText: string;
}

export interface AIService {
  analyzeJob(input: AnalyzeJobInput): Promise<JobAnalysis>;
  calculateMatch(input: CalculateMatchInput): Promise<MatchResult>;
  parseResumeText(input: { resumeText: string }): Promise<StructuredResume>;
}

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-3.8-flash";

const BASE_RULES = `Regras invioláveis:
- Trabalhe exclusivamente com as informações fornecidas pelo usuário e pela vaga.
- Nunca invente experiências, empresas, cargos, datas, números, resultados, certificações, tecnologias, formação ou idiomas.
- Se uma informação necessária não estiver disponível, registre-a como ausente.
- Nunca recomende mentir ou incluir competências que o candidato não possui.
- Responda SEMPRE apenas com JSON válido, sem markdown e sem comentários.`;

async function callGateway(system: string, user: string): Promise<unknown> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI_PROVIDER_NOT_CONFIGURED");

  const response = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (response.status === 429) throw new Error("AI_RATE_LIMIT");
  if (response.status === 402) throw new Error("AI_CREDITS");
  if (!response.ok) {
    console.error("AI gateway error", response.status, await response.text().catch(() => ""));
    throw new Error("AI_UNAVAILABLE");
  }

  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = payload.choices?.[0]?.message?.content ?? "";
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    console.error("AI returned invalid JSON");
    throw new Error("AI_INVALID_RESPONSE");
  }
}

class LovableAIService implements AIService {
  async analyzeJob(input: AnalyzeJobInput): Promise<JobAnalysis> {
    const raw = await callGateway(
      `Você é um especialista em recrutamento técnico e sistemas ATS. Analise descrições de vagas e devolva dados estruturados em português.
${BASE_RULES}
Formato do JSON: { "title": string, "company": string, "seniority": string, "location": string, "work_model": string, "required_requirements": string[], "preferred_requirements": string[], "required_skills": string[], "preferred_skills": string[], "keywords": string[], "responsibilities": string[], "competencies": { "languages": string[], "frameworks": string[], "tools": string[], "databases": string[], "cloud": string[], "methodologies": string[], "soft_skills": string[], "languages_spoken": string[], "certifications": string[] }, "missing_information": string[] }`,
      `Vaga: ${input.title}\nEmpresa: ${input.company ?? "não informada"}\n\nDescrição:\n${input.description}`,
    );
    const parsed = jobAnalysisSchema.safeParse(raw);
    if (!parsed.success) throw new Error("AI_INVALID_RESPONSE");
    return parsed.data;
  }

  async calculateMatch(input: CalculateMatchInput): Promise<MatchResult> {
    const raw = await callGateway(
      `Você compara currículos com vagas e calcula compatibilidade para sistemas ATS. Escreva em português.
${BASE_RULES}
O score é uma estimativa de 0 a 100 baseada apenas na correspondência real entre currículo e vaga.
Em "missing_keywords" liste termos importantes da vaga ausentes no currículo, deixando claro que só devem ser incluídos se forem verdadeiros para o candidato.
Formato do JSON: { "score": number, "summary": string, "strengths": string[], "attention_points": string[], "matched_keywords": string[], "missing_keywords": string[], "matched_skills": string[], "missing_skills": string[], "relevant_experiences": string[], "recommendations": string[] }`,
      `VAGA: ${input.jobTitle} — ${input.jobCompany ?? "empresa não informada"}\n\nDESCRIÇÃO DA VAGA:\n${input.jobDescription}\n\nANÁLISE ESTRUTURADA DA VAGA:\n${JSON.stringify(input.jobAnalysis)}\n\nCURRÍCULO DO CANDIDATO:\n${input.resumeText}`,
    );
    const parsed = matchResultSchema.safeParse(raw);
    if (!parsed.success) throw new Error("AI_INVALID_RESPONSE");
    return { ...parsed.data, score: Math.max(0, Math.min(100, Math.round(parsed.data.score))) };
  }

  async parseResumeText(input: { resumeText: string }): Promise<StructuredResume> {
    const raw = await callGateway(
      `Você organiza o texto de um currículo já existente em campos estruturados, em português.
${BASE_RULES}
- Copie apenas o que está escrito no texto; não complete lacunas, não reescreva conquistas e não crie datas.
- Deixe o campo como string vazia ou lista vazia quando a informação não aparecer no texto.
- Use "current": true apenas quando o texto indicar explicitamente que é o emprego atual.
- Datas no formato MM/AAAA quando possível, mantendo exatamente o que estiver escrito se não houver como converter.
Formato do JSON: { "personal_information": { "full_name": string, "email": string, "phone": string, "location": string, "linkedin": string, "github": string, "website": string }, "summary": string, "experiences": [{ "company": string, "position": string, "start_date": string, "end_date": string, "current": boolean, "description": string, "achievements": string[] }], "education": [{ "institution": string, "degree": string, "field": string, "start_date": string, "end_date": string, "description": string }], "skills": [{ "name": string, "category": string, "proficiency": string }], "certifications": [{ "name": string, "issuer": string, "year": string }], "languages": [{ "name": string, "level": string }], "projects": [{ "name": string, "description": string, "url": string }] }`,
      `TEXTO EXTRAÍDO DO ARQUIVO DO CURRÍCULO:\n${input.resumeText}`,
    );
    const parsed = structuredResumeSchema.safeParse(raw);
    if (!parsed.success) throw new Error("AI_INVALID_RESPONSE");
    return parsed.data;
  }
}

export function getAIService(): AIService {
  return new LovableAIService();
}

/** Mensagens amigáveis; detalhes técnicos ficam nos logs do servidor. */
export function friendlyAIError(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "AI_RATE_LIMIT":
      return "Muitas análises em pouco tempo. Aguarde alguns instantes e tente novamente.";
    case "AI_CREDITS":
      return "O serviço de análise está temporariamente indisponível por limite de uso.";
    case "AI_INVALID_RESPONSE":
      return "Não conseguimos interpretar o resultado da análise. Tente novamente.";
    default:
      return "Não foi possível concluir a análise agora. Tente novamente em alguns instantes.";
  }
}
