/**
 * Geração do currículo em HTML no padrão ATS.
 *
 * Regras ATS aplicadas: coluna única, HTML semântico (h1/h2/ul/li),
 * seções tradicionais, datas consistentes, nenhuma tabela, gráfico,
 * barra de habilidade ou ícone substituindo texto.
 * Nenhum conteúdo é criado aqui — apenas formatado.
 */
import type { StructuredResume } from "@/lib/resume-schema";

function esc(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function periodo(start: string, end: string, current = false): string {
  const fim = current ? "Atual" : end.trim();
  const inicio = start.trim();
  if (!inicio && !fim) return "";
  if (!fim) return inicio;
  if (!inicio) return fim;
  return `${inicio} – ${fim}`;
}

export function resumeFileName(title: string, fullName: string, extension: string): string {
  const base = (fullName || title || "curriculo").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = base.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${slug || "curriculo"}-ats.${extension}`;
}

/** Corpo do currículo (sem <html>), usado na prévia A4 e na exportação. */
export function buildResumeBodyHtml(resume: StructuredResume): string {
  const p = resume.personal_information;
  const parts: string[] = [];

  parts.push(`<h1>${esc(p.full_name || "Nome não informado")}</h1>`);
  const contato = [p.email, p.phone, p.location].filter(Boolean).map(esc).join(" | ");
  if (contato) parts.push(`<p class="contato">${contato}</p>`);
  const links = [p.linkedin, p.github, p.website].filter(Boolean).map(esc).join(" | ");
  if (links) parts.push(`<p class="contato">${links}</p>`);

  if (resume.summary.trim()) {
    parts.push(`<section><h2>Resumo profissional</h2><p>${esc(resume.summary.trim())}</p></section>`);
  }

  const experiencias = resume.experiences.filter((e) => e.position || e.company || e.description);
  if (experiencias.length) {
    const blocos = experiencias.map((exp) => {
      const linhas: string[] = [];
      const cargoEmpresa = [exp.position, exp.company].filter(Boolean).map(esc).join(" — ");
      if (cargoEmpresa) linhas.push(`<h3>${cargoEmpresa}</h3>`);
      const datas = periodo(exp.start_date, exp.end_date, exp.current);
      if (datas) linhas.push(`<p class="datas">${esc(datas)}</p>`);
      if (exp.description.trim()) linhas.push(`<p>${esc(exp.description.trim())}</p>`);
      const feitos = exp.achievements.filter((a) => a.trim());
      if (feitos.length) {
        linhas.push(`<ul>${feitos.map((a) => `<li>${esc(a.trim())}</li>`).join("")}</ul>`);
      }
      return `<article>${linhas.join("")}</article>`;
    });
    parts.push(`<section><h2>Experiência profissional</h2>${blocos.join("")}</section>`);
  }

  const formacao = resume.education.filter((e) => e.degree || e.institution || e.field);
  if (formacao.length) {
    const blocos = formacao.map((edu) => {
      const linhas: string[] = [];
      const curso = [edu.degree, edu.field].filter(Boolean).join(" em ");
      const titulo = [curso, edu.institution].filter(Boolean).map(esc).join(" — ");
      if (titulo) linhas.push(`<h3>${titulo}</h3>`);
      const datas = periodo(edu.start_date, edu.end_date);
      if (datas) linhas.push(`<p class="datas">${esc(datas)}</p>`);
      if (edu.description.trim()) linhas.push(`<p>${esc(edu.description.trim())}</p>`);
      return `<article>${linhas.join("")}</article>`;
    });
    parts.push(`<section><h2>Formação acadêmica</h2>${blocos.join("")}</section>`);
  }

  const skills = resume.skills.filter((s) => s.name.trim());
  if (skills.length) {
    const grupos = new Map<string, string[]>();
    for (const skill of skills) {
      const categoria = skill.category.trim() || "Gerais";
      const nome = skill.proficiency.trim() ? `${skill.name} (${skill.proficiency})` : skill.name;
      grupos.set(categoria, [...(grupos.get(categoria) ?? []), nome]);
    }
    const linhas = [...grupos.entries()]
      .map(([categoria, itens]) => `<p><strong>${esc(categoria)}:</strong> ${esc(itens.join(", "))}</p>`)
      .join("");
    parts.push(`<section><h2>Competências</h2>${linhas}</section>`);
  }

  const certs = resume.certifications
    .map((c) => [c.name, c.issuer, c.year].filter(Boolean).join(" — "))
    .filter(Boolean);
  if (certs.length) {
    parts.push(
      `<section><h2>Certificações</h2><ul>${certs.map((c) => `<li>${esc(c)}</li>`).join("")}</ul></section>`,
    );
  }

  const idiomas = resume.languages.map((l) => [l.name, l.level].filter(Boolean).join(" — ")).filter(Boolean);
  if (idiomas.length) {
    parts.push(
      `<section><h2>Idiomas</h2><ul>${idiomas.map((l) => `<li>${esc(l)}</li>`).join("")}</ul></section>`,
    );
  }

  const projetos = resume.projects.filter((pr) => pr.name.trim() || pr.description.trim());
  if (projetos.length) {
    const blocos = projetos.map((pr) => {
      const linhas: string[] = [];
      if (pr.name.trim()) linhas.push(`<h3>${esc(pr.name.trim())}</h3>`);
      if (pr.description.trim()) linhas.push(`<p>${esc(pr.description.trim())}</p>`);
      if (pr.url.trim()) linhas.push(`<p class="datas">${esc(pr.url.trim())}</p>`);
      return `<article>${linhas.join("")}</article>`;
    });
    parts.push(`<section><h2>Projetos</h2>${blocos.join("")}</section>`);
  }

  return parts.join("\n");
}

/** Estilos simples e imprimíveis, compatíveis com leitura por ATS. */
export const RESUME_PRINT_CSS = `
  * { box-sizing: border-box; }
  body { margin: 0; background: #ffffff; }
  .curriculo {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 11pt;
    line-height: 1.45;
    color: #111111;
    max-width: 100%;
  }
  .curriculo h1 { font-size: 18pt; margin: 0 0 4pt; }
  .curriculo h2 {
    font-size: 12pt;
    text-transform: uppercase;
    margin: 16pt 0 6pt;
    padding-bottom: 3pt;
    border-bottom: 1px solid #999999;
  }
  .curriculo h3 { font-size: 11pt; margin: 10pt 0 2pt; }
  .curriculo p { margin: 0 0 4pt; }
  .curriculo p.contato, .curriculo p.datas { color: #333333; }
  .curriculo ul { margin: 4pt 0 6pt 16pt; padding: 0; }
  .curriculo li { margin-bottom: 3pt; }
  .curriculo article { margin-bottom: 8pt; page-break-inside: avoid; }
  @page { size: A4; margin: 18mm; }
`;

/** Documento HTML completo para download/impressão. */
export function buildResumeHtmlDocument(resume: StructuredResume, title: string): string {
  const nome = resume.personal_information.full_name || title || "Currículo";
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(nome)}</title>
<style>${RESUME_PRINT_CSS}
  body { padding: 18mm; }
</style>
</head>
<body>
<main class="curriculo">
${buildResumeBodyHtml(resume)}
</main>
</body>
</html>`;
}
