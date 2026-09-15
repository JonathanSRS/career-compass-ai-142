import { z } from "zod";

export const experienceSchema = z.object({
  company: z.string().default(""),
  position: z.string().default(""),
  start_date: z.string().default(""),
  end_date: z.string().default(""),
  current: z.boolean().default(false),
  description: z.string().default(""),
  achievements: z.array(z.string()).default([]),
});

export const educationSchema = z.object({
  institution: z.string().default(""),
  degree: z.string().default(""),
  field: z.string().default(""),
  start_date: z.string().default(""),
  end_date: z.string().default(""),
  description: z.string().default(""),
});

export const skillSchema = z.object({
  name: z.string().default(""),
  category: z.string().default(""),
  proficiency: z.string().default(""),
});

export const projectSchema = z.object({
  name: z.string().default(""),
  description: z.string().default(""),
  url: z.string().default(""),
});

export const languageSchema = z.object({
  name: z.string().default(""),
  level: z.string().default(""),
});

export const certificationSchema = z.object({
  name: z.string().default(""),
  issuer: z.string().default(""),
  year: z.string().default(""),
});

export const personalInformationSchema = z.object({
  full_name: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().default(""),
  location: z.string().default(""),
  linkedin: z.string().default(""),
  github: z.string().default(""),
  website: z.string().default(""),
});

export const structuredResumeSchema = z.object({
  personal_information: personalInformationSchema.default({}),
  summary: z.string().default(""),
  experiences: z.array(experienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(skillSchema).default([]),
  certifications: z.array(certificationSchema).default([]),
  languages: z.array(languageSchema).default([]),
  projects: z.array(projectSchema).default([]),
});

export type StructuredResume = z.infer<typeof structuredResumeSchema>;
export type ResumeExperience = z.infer<typeof experienceSchema>;

export const emptyResume = (): StructuredResume => structuredResumeSchema.parse({});

export function parseStructuredResume(value: unknown): StructuredResume {
  const result = structuredResumeSchema.safeParse(value ?? {});
  return result.success ? result.data : emptyResume();
}

/** Texto plano do currículo, usado como entrada para a análise. */
export function resumeToPlainText(resume: StructuredResume): string {
  const p = resume.personal_information;
  const lines: string[] = [];
  lines.push(p.full_name);
  lines.push([p.email, p.phone, p.location, p.linkedin, p.github, p.website].filter(Boolean).join(" | "));
  if (resume.summary) lines.push("\nRESUMO PROFISSIONAL\n" + resume.summary);
  if (resume.experiences.length) {
    lines.push("\nEXPERIÊNCIA PROFISSIONAL");
    for (const e of resume.experiences) {
      lines.push(
        `${e.position} — ${e.company} (${e.start_date} - ${e.current ? "atual (emprego atual)" : e.end_date || "não informado"})`,
      );
      if (e.description) lines.push(e.description);
      for (const a of e.achievements) lines.push(`- ${a}`);
    }
  }
  if (resume.education.length) {
    lines.push("\nFORMAÇÃO ACADÊMICA");
    for (const e of resume.education) {
      lines.push(`${e.degree} em ${e.field} — ${e.institution} (${e.start_date} - ${e.end_date})`);
      if (e.description) lines.push(e.description);
    }
  }
  if (resume.skills.length) {
    lines.push("\nCOMPETÊNCIAS");
    lines.push(resume.skills.map((s) => [s.name, s.proficiency].filter(Boolean).join(" - ")).join(", "));
  }
  if (resume.certifications.length) {
    lines.push("\nCERTIFICAÇÕES");
    for (const c of resume.certifications) lines.push([c.name, c.issuer, c.year].filter(Boolean).join(" — "));
  }
  if (resume.languages.length) {
    lines.push("\nIDIOMAS");
    lines.push(resume.languages.map((l) => `${l.name} (${l.level})`).join(", "));
  }
  if (resume.projects.length) {
    lines.push("\nPROJETOS");
    for (const pr of resume.projects) lines.push(`${pr.name}: ${pr.description} ${pr.url}`.trim());
  }
  return lines.filter((l) => l !== undefined).join("\n");
}
