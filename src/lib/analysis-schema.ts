import { z } from "zod";

export const jobAnalysisSchema = z.object({
  title: z.string().default(""),
  company: z.string().default(""),
  seniority: z.string().default(""),
  location: z.string().default(""),
  work_model: z.string().default(""),
  required_requirements: z.array(z.string()).default([]),
  preferred_requirements: z.array(z.string()).default([]),
  required_skills: z.array(z.string()).default([]),
  preferred_skills: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  responsibilities: z.array(z.string()).default([]),
  competencies: z
    .object({
      languages: z.array(z.string()).default([]),
      frameworks: z.array(z.string()).default([]),
      tools: z.array(z.string()).default([]),
      databases: z.array(z.string()).default([]),
      cloud: z.array(z.string()).default([]),
      methodologies: z.array(z.string()).default([]),
      soft_skills: z.array(z.string()).default([]),
      languages_spoken: z.array(z.string()).default([]),
      certifications: z.array(z.string()).default([]),
    })
    .default({}),
  missing_information: z.array(z.string()).default([]),
});

export type JobAnalysis = z.infer<typeof jobAnalysisSchema>;

export const matchResultSchema = z.object({
  score: z.number().min(0).max(100).default(0),
  summary: z.string().default(""),
  strengths: z.array(z.string()).default([]),
  attention_points: z.array(z.string()).default([]),
  matched_keywords: z.array(z.string()).default([]),
  missing_keywords: z.array(z.string()).default([]),
  matched_skills: z.array(z.string()).default([]),
  missing_skills: z.array(z.string()).default([]),
  relevant_experiences: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
});

export type MatchResult = z.infer<typeof matchResultSchema>;
