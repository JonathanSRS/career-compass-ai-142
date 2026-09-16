/**
 * Extração de texto de arquivos de currículo (PDF, DOCX, TXT).
 * Roda apenas no navegador: as bibliotecas são carregadas sob demanda,
 * dentro das funções, para não entrarem no SSR.
 */

export const MAX_RESUME_FILE_BYTES = 8 * 1024 * 1024; // 8 MB

export type ResumeFileKind = "pdf" | "docx" | "txt";

export function detectResumeFileKind(file: File): ResumeFileKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt")) return "txt";
  return null;
}

async function extractFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  const workerModule = (await import(
    // @ts-expect-error resolvido pelo Vite como URL do worker
    "pdfjs-dist/build/pdf.worker.min.mjs?url"
  )) as { default: string };
  pdfjs.GlobalWorkerOptions.workerSrc = workerModule.default;

  const buffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const textContent = await page.getTextContent();
    const text = textContent.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+\n/g, "\n");
    pages.push(text);
  }
  await pdf.destroy();
  return pages.join("\n\n");
}

async function extractFromDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth/mammoth.browser");
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

/** Devolve o texto plano do arquivo. Lança Error com mensagem amigável. */
export async function extractResumeText(file: File): Promise<string> {
  if (file.size > MAX_RESUME_FILE_BYTES) {
    throw new Error("O arquivo é maior que 8 MB. Envie uma versão menor.");
  }
  const kind = detectResumeFileKind(file);
  if (!kind) throw new Error("Formato não suportado. Envie um arquivo PDF, DOCX ou TXT.");

  let text = "";
  try {
    if (kind === "pdf") text = await extractFromPdf(file);
    else if (kind === "docx") text = await extractFromDocx(file);
    else text = await file.text();
  } catch (error) {
    console.error("extractResumeText", error);
    throw new Error("Não foi possível ler o arquivo. Tente outro formato ou cole o texto manualmente.");
  }

  const cleaned = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  if (cleaned.length < 40) {
    throw new Error(
      "Não encontramos texto neste arquivo. Se ele for digitalizado (imagem), envie uma versão em texto.",
    );
  }
  return cleaned.slice(0, 20000);
}
