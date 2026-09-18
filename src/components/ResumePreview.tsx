import { useEffect, useMemo, useRef, useState } from "react";
import { Monitor, Smartphone, ZoomIn, ZoomOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RESUME_PRINT_CSS, buildResumeBodyHtml } from "@/lib/resume-html";
import type { StructuredResume } from "@/lib/resume-schema";

const MM_TO_PX = 96 / 25.4;
const PAGE_WIDTH = Math.round(210 * MM_TO_PX);
const PAGE_HEIGHT = Math.round(297 * MM_TO_PX);
const PAGE_PADDING = Math.round(18 * MM_TO_PX);

interface Props {
  resume: StructuredResume;
}

/** Prévia em páginas A4, com zoom e alternância computador/celular. */
export function ResumePreview({ resume }: Props) {
  const [zoom, setZoom] = useState(0.8);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [pages, setPages] = useState(1);
  const contentRef = useRef<HTMLDivElement>(null);

  const body = useMemo(() => buildResumeBodyHtml(resume), [resume]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      setPages(Math.max(1, Math.ceil(el.scrollHeight / PAGE_HEIGHT)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [body]);

  const effectiveZoom = device === "mobile" ? Math.min(zoom, 0.45) : zoom;
  const totalHeight = PAGE_HEIGHT * pages;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          Prévia estimada: {pages} {pages === 1 ? "página" : "páginas"} A4
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Diminuir zoom"
            onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
          >
            <ZoomOut className="size-4" />
          </Button>
          <span className="w-12 text-center text-xs tabular-nums">{Math.round(effectiveZoom * 100)}%</span>
          <Button
            type="button"
            size="icon"
            variant="outline"
            aria-label="Aumentar zoom"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.1).toFixed(2))))}
          >
            <ZoomIn className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={device === "desktop" ? "default" : "outline"}
            aria-label="Visualizar em computador"
            onClick={() => setDevice("desktop")}
          >
            <Monitor className="size-4" />
          </Button>
          <Button
            type="button"
            size="icon"
            variant={device === "mobile" ? "default" : "outline"}
            aria-label="Visualizar em celular"
            onClick={() => setDevice("mobile")}
          >
            <Smartphone className="size-4" />
          </Button>
        </div>
      </div>

      <div className="max-h-[65vh] overflow-auto rounded-lg bg-muted p-4">
        <div
          className="mx-auto"
          style={{ width: PAGE_WIDTH * effectiveZoom, height: totalHeight * effectiveZoom }}
        >
          <div
            className="relative bg-white shadow-sm"
            style={{
              width: PAGE_WIDTH,
              height: totalHeight,
              transform: `scale(${effectiveZoom})`,
              transformOrigin: "top left",
            }}
          >
            <style>{RESUME_PRINT_CSS}</style>
            {Array.from({ length: pages - 1 }).map((_, index) => (
              <div
                key={index}
                className="absolute left-0 w-full border-t border-dashed border-muted-foreground/40"
                style={{ top: PAGE_HEIGHT * (index + 1) }}
              />
            ))}
            <div
              ref={contentRef}
              className="curriculo"
              style={{ width: PAGE_WIDTH, padding: PAGE_PADDING }}
              dangerouslySetInnerHTML={{ __html: body }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
