/**
 * Geração do currículo em DOCX no padrão ATS.
 *
 * Regras ATS aplicadas: coluna única, sem tabelas, sem gráficos, sem ícones,
 * títulos de seção tradicionais, hierarquia semântica, bullets reais,
 * datas consistentes. Nenhum conteúdo é criado aqui — apenas formatado.
 */
import type { StructuredResume } from "@/lib/resume-schema";

function periodo(start: string, end: string, current = false): string {
  const fim = current ? "Atual" : end.trim();
  const inicio = start.trim();
  if (!inicio && !fim) return "";
  if (!fim) return inicio;
  if (!inicio) return fim;
  return `${inicio} – ${fim}`;
}

export function resumeDocxFileName(title: string, fullName: string): string {
  const base = (fullName || title || "curriculo").normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const slug = base.replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
  return `${slug || "curriculo"}-ats.docx`;
}

/** Monta o DOCX e devolve um Blob (executa no navegador). */
export async function buildResumeDocx(resume: StructuredResume): Promise<Blob> {
  const {
    Document,
    Packer,
    Paragraph,
    TextRun,
    HeadingLevel,
    AlignmentType,
    BorderStyle,
    LevelFormat,
  } = await import("docx");

  const children: InstanceType<typeof Paragraph>[] = [];

  const sectionHeading = (text: string) =>
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 240, after: 120 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "999999", space: 1 } },
      children: [new TextRun({ text: text.toUpperCase(), bold: true })],
    });

  const body = (text: string, opts: { bold?: boolean; italics?: boolean } = {}) =>
    new Paragraph({
      spacing: { after: 60 },
      children: [new TextRun({ text, bold: opts.bold, italics: opts.italics })],
    });

  const bullet = (text: string) =>
    new Paragraph({
      numbering: { reference: "ats-bullets", level: 0 },
      spacing: { after: 60 },
      children: [new TextRun(text)],
    });

  const p = resume.personal_information;

  // Cabeçalho: nome e contato em texto puro
  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.LEFT,
      spacing: { after: 60 },
      children: [new TextRun({ text: p.full_name || "Nome não informado", bold: true })],
    }),
  );
  const contato = [p.email, p.phone, p.location].filter(Boolean).join(" | ");
  if (contato) children.push(body(contato));
  const links = [p.linkedin, p.github, p.website].filter(Boolean).join(" | ");
  if (links) children.push(body(links));

  if (resume.summary.trim()) {
    children.push(sectionHeading("Resumo profissional"));
    children.push(body(resume.summary.trim()));
  }

  if (resume.experiences.length) {
    children.push(sectionHeading("Experiência profissional"));
    for (const exp of resume.experiences) {
      const cargoEmpresa = [exp.position, exp.company].filter(Boolean).join(" — ");
      if (cargoEmpresa) children.push(body(cargoEmpresa, { bold: true }));
      const datas = periodo(exp.start_date, exp.end_date, exp.current);
      if (datas) children.push(body(datas));
      if (exp.description.trim()) children.push(body(exp.description.trim()));
      for (const item of exp.achievements.filter((a) => a.trim())) children.push(bullet(item.trim()));
    }
  }

  if (resume.education.length) {
    children.push(sectionHeading("Formação acadêmica"));
    for (const edu of resume.education) {
      const curso = [edu.degree, edu.field].filter(Boolean).join(" em ");
      const linha = [curso, edu.institution].filter(Boolean).join(" — ");
      if (linha) children.push(body(linha, { bold: true }));
      const datas = periodo(edu.start_date, edu.end_date);
      if (datas) children.push(body(datas));
      if (edu.description.trim()) children.push(body(edu.description.trim()));
    }
  }

  if (resume.skills.length) {
    children.push(sectionHeading("Competências"));
    const grupos = new Map<string, string[]>();
    for (const skill of resume.skills) {
      if (!skill.name.trim()) continue;
      const categoria = skill.category.trim() || "Gerais";
      const nome = skill.proficiency.trim() ? `${skill.name} (${skill.proficiency})` : skill.name;
      grupos.set(categoria, [...(grupos.get(categoria) ?? []), nome]);
    }
    for (const [categoria, itens] of grupos) {
      children.push(body(`${categoria}: ${itens.join(", ")}`));
    }
  }

  if (resume.certifications.length) {
    children.push(sectionHeading("Certificações"));
    for (const cert of resume.certifications) {
      const linha = [cert.name, cert.issuer, cert.year].filter(Boolean).join(" — ");
      if (linha) children.push(bullet(linha));
    }
  }

  if (resume.languages.length) {
    children.push(sectionHeading("Idiomas"));
    for (const lang of resume.languages) {
      const linha = [lang.name, lang.level].filter(Boolean).join(" — ");
      if (linha) children.push(bullet(linha));
    }
  }

  if (resume.projects.length) {
    children.push(sectionHeading("Projetos"));
    for (const project of resume.projects) {
      if (project.name.trim()) children.push(body(project.name.trim(), { bold: true }));
      if (project.description.trim()) children.push(body(project.description.trim()));
      if (project.url.trim()) children.push(body(project.url.trim()));
    }
  }

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 22 } } },
      paragraphStyles: [
        {
          id: "Heading1",
          name: "Heading 1",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 32, bold: true, font: "Arial" },
          paragraph: { spacing: { after: 120 }, outlineLevel: 0 },
        },
        {
          id: "Heading2",
          name: "Heading 2",
          basedOn: "Normal",
          next: "Normal",
          quickFormat: true,
          run: { size: 24, bold: true, font: "Arial" },
          paragraph: { spacing: { before: 240, after: 120 }, outlineLevel: 1 },
        },
      ],
    },
    numbering: {
      config: [
        {
          reference: "ats-bullets",
          levels: [
            {
              level: 0,
              format: LevelFormat.BULLET,
              text: "•",
              alignment: AlignmentType.LEFT,
              style: { paragraph: { indent: { left: 720, hanging: 360 } } },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 12240, height: 15840 },
            margin: { top: 1080, right: 1080, bottom: 1080, left: 1080 },
          },
        },
        children,
      },
    ],
  });

  return Packer.toBlob(doc);
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
