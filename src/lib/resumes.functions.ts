import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { parseStructuredResume, resumeToPlainText, structuredResumeSchema } from "@/lib/resume-schema";

export const listResumes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("resumes")
      .select("id, title, is_primary, updated_at, structured_content")
      .order("updated_at", { ascending: false });
    if (error) {
      console.error("listResumes", error);
      throw new Error("Não foi possível carregar seus currículos.");
    }
    return (data ?? []).map((r) => ({
      id: r.id,
      title: r.title,
      is_primary: r.is_primary,
      updated_at: r.updated_at,
      structured_content: parseStructuredResume(r.structured_content),
    }));
  });

export const getResume = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("resumes")
      .select("id, title, is_primary, raw_content, structured_content, updated_at")
      .eq("id", data.id)
      .maybeSingle();
    if (error) {
      console.error("getResume", error);
      throw new Error("Não foi possível carregar este currículo.");
    }
    if (!row) throw new Error("Currículo não encontrado.");
    return { ...row, structured_content: parseStructuredResume(row.structured_content) };
  });

const saveInput = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1).max(160),
  is_primary: z.boolean().default(false),
  structured_content: structuredResumeSchema,
});

export const saveResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => saveInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const payload = {
      user_id: userId,
      title: data.title,
      is_primary: data.is_primary,
      structured_content: data.structured_content,
      raw_content: resumeToPlainText(data.structured_content),
    };

    if (data.is_primary) {
      await supabase.from("resumes").update({ is_primary: false }).eq("user_id", userId);
    }

    if (data.id) {
      const { data: row, error } = await supabase
        .from("resumes")
        .update(payload)
        .eq("id", data.id)
        .select("id")
        .maybeSingle();
      if (error || !row) {
        console.error("saveResume update", error);
        throw new Error("Não foi possível salvar o currículo.");
      }
      return { id: row.id };
    }

    const { data: row, error } = await supabase.from("resumes").insert(payload).select("id").single();
    if (error) {
      console.error("saveResume insert", error);
      throw new Error("Não foi possível criar o currículo.");
    }
    return { id: row.id };
  });

/**
 * Converte o texto extraído de um arquivo (PDF/DOCX/TXT) em seções estruturadas.
 * Nada é persistido: o usuário revisa antes de salvar.
 */
export const importResumeFromText = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ text: z.string().min(40, "Texto muito curto para análise.").max(20000) }).parse(input),
  )
  .handler(async ({ data }) => {
    const { getAIService, friendlyAIError } = await import("@/lib/ai/ai-service.server");
    try {
      const structured = await getAIService().parseResumeText({ resumeText: data.text });
      return { structured_content: structured };
    } catch (error) {
      console.error("importResumeFromText", error);
      throw new Error(friendlyAIError(error));
    }
  });

export const deleteResume = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("resumes").delete().eq("id", data.id);
    if (error) {
      console.error("deleteResume", error);
      throw new Error("Não foi possível excluir o currículo.");
    }
    return { ok: true };
  });
