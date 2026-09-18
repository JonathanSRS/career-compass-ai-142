/**
 * Exportação em PDF: o documento HTML do currículo é impresso em um iframe
 * isolado, usando o diálogo de impressão do navegador ("Salvar como PDF").
 * Isso mantém o texto real selecionável, exigência do padrão ATS.
 */
export function printResumeHtml(htmlDocument: string): void {
  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const cleanup = () => {
    window.setTimeout(() => iframe.remove(), 1000);
  };

  iframe.onload = () => {
    try {
      const win = iframe.contentWindow;
      if (!win) throw new Error("iframe sem contentWindow");
      win.focus();
      win.print();
    } finally {
      cleanup();
    }
  };

  iframe.srcdoc = htmlDocument;
}
