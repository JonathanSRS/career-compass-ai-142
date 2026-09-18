import { useState } from "react";
import { Download, Eye, FileCode2, FileText, Loader2, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ResumePreview } from "@/components/ResumePreview";
import { buildResumeDocx, downloadBlob } from "@/lib/resume-docx";
import { buildResumeHtmlDocument, resumeFileName } from "@/lib/resume-html";
import { printResumeHtml } from "@/lib/resume-print";
import type { StructuredResume } from "@/lib/resume-schema";

interface Props {
  resume: StructuredResume;
  title: string;
}

/** Exportação do currículo salvo em HTML, DOCX e PDF, com prévia A4. */
export function ResumeExportPanel({ resume, title }: Props) {
  const [exporting, setExporting] = useState<"html" | "docx" | "pdf" | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fullName = resume.personal_information.full_name;

  function exportHtml() {
    try {
      setExporting("html");
      const html = buildResumeHtmlDocument(resume, title);
      downloadBlob(
        new Blob([html], { type: "text/html;charset=utf-8" }),
        resumeFileName(title, fullName, "html"),
      );
      toast.success("Currículo exportado em HTML no padrão ATS.");
    } catch (error) {
      console.error("exportHtml", error);
      toast.error("Não foi possível gerar o arquivo HTML agora.");
    } finally {
      setExporting(null);
    }
  }

  async function exportDocx() {
    try {
      setExporting("docx");
      const blob = await buildResumeDocx(resume);
      downloadBlob(blob, resumeFileName(title, fullName, "docx"));
      toast.success("Currículo exportado em DOCX no padrão ATS.");
    } catch (error) {
      console.error("exportDocx", error);
      toast.error("Não foi possível gerar o arquivo DOCX agora.");
    } finally {
      setExporting(null);
    }
  }

  function exportPdf() {
    try {
      setExporting("pdf");
      printResumeHtml(buildResumeHtmlDocument(resume, title));
      toast.info("Escolha \"Salvar como PDF\" na janela de impressão.");
    } catch (error) {
      console.error("exportPdf", error);
      toast.error("Não foi possível preparar o PDF agora.");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-dashed px-4 py-3">
      <div>
        <p className="text-sm font-medium">Exportar currículo (padrão ATS)</p>
        <p className="text-xs text-muted-foreground">
          Coluna única, sem tabelas, gráficos ou ícones, com as seções tradicionais e datas consistentes.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogTrigger asChild>
            <Button type="button" variant="secondary">
              <Eye className="mr-2 size-4" />
              Visualizar
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Prévia do currículo</DialogTitle>
              <DialogDescription>
                Páginas A4 com zoom. A quantidade de páginas é uma estimativa e pode variar na impressão.
              </DialogDescription>
            </DialogHeader>
            <ResumePreview resume={resume} />
          </DialogContent>
        </Dialog>

        <Button type="button" variant="outline" disabled={exporting !== null} onClick={exportHtml}>
          {exporting === "html" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <FileCode2 className="mr-2 size-4" />
          )}
          Baixar HTML
        </Button>

        <Button type="button" variant="outline" disabled={exporting !== null} onClick={() => void exportDocx()}>
          {exporting === "docx" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <FileText className="mr-2 size-4" />
          )}
          Baixar DOCX
        </Button>

        <Button type="button" variant="outline" disabled={exporting !== null} onClick={exportPdf}>
          {exporting === "pdf" ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Printer className="mr-2 size-4" />
          )}
          Baixar PDF
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        <Download className="mr-1 inline size-3" />
        Os arquivos usam exatamente o conteúdo salvo no currículo — nada é criado automaticamente.
      </p>
    </div>
  );
}
