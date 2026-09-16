import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { FileUp, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { extractResumeText } from "@/lib/resume-extract";
import { importResumeFromText } from "@/lib/resumes.functions";
import type { StructuredResume } from "@/lib/resume-schema";

interface Props {
  onImported: (content: StructuredResume, fileName: string) => void;
}

export function ResumeDropzone({ onImported }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [status, setStatus] = useState<"idle" | "reading" | "structuring">("idle");
  const structure = useServerFn(importResumeFromText);
  const busy = status !== "idle";

  async function handleFile(file: File) {
    try {
      setStatus("reading");
      const text = await extractResumeText(file);
      setStatus("structuring");
      const result = await structure({ data: { text } });
      onImported(result.structured_content, file.name);
      toast.success("Currículo importado. Revise cada seção antes de salvar.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível importar o arquivo.");
    } finally {
      setStatus("idle");
    }
  }

  return (
    <div className="space-y-3">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          if (!busy) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          if (busy) return;
          const file = event.dataTransfer.files?.[0];
          if (file) void handleFile(file);
        }}
        className={`surface-panel flex flex-col items-center justify-center gap-3 border-2 border-dashed p-8 text-center transition-colors ${
          dragging ? "border-primary bg-primary/5" : "border-border"
        }`}
      >
        {busy ? (
          <>
            <Loader2 className="size-6 animate-spin text-primary" />
            <p className="text-sm font-medium">
              {status === "reading" ? "Lendo o arquivo..." : "Organizando as seções do currículo..."}
            </p>
            <p className="text-xs text-muted-foreground">Isso pode levar alguns segundos.</p>
          </>
        ) : (
          <>
            <FileUp className="size-6 text-primary" />
            <div>
              <p className="text-sm font-medium">Arraste seu currículo aqui</p>
              <p className="text-xs text-muted-foreground">PDF, DOCX ou TXT, até 8 MB.</p>
            </div>
            <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
              Escolher arquivo
            </Button>
          </>
        )}
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,.docx,.txt"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = "";
            if (file) void handleFile(file);
          }}
        />
      </div>

      <Alert>
        <AlertTitle>Revise sempre a importação</AlertTitle>
        <AlertDescription>
          A leitura automática pode falhar em arquivos complexos. Nada é inventado: confira cada campo e
          complete o que estiver faltando antes de salvar.
        </AlertDescription>
      </Alert>
    </div>
  );
}
