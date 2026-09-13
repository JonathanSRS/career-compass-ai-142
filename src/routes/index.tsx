import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, FileText, Sparkles, Target } from "lucide-react";

import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vaga Match — adapte seu currículo para cada vaga" },
      {
        name: "description",
        content:
          "Analise a vaga, compare com seu currículo, veja o score de compatibilidade e gere versões ATS-friendly sem inventar informações.",
      },
      { property: "og:title", content: "Vaga Match — adapte seu currículo para cada vaga" },
      {
        property: "og:description",
        content: "Análise de vagas, matchmaking e currículos otimizados para ATS.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: FileText,
    title: "Currículo estruturado",
    text: "Monte seu currículo por seções: resumo, experiências, formação, competências, idiomas e projetos.",
  },
  {
    icon: Target,
    title: "Análise da vaga",
    text: "Requisitos obrigatórios e desejáveis, competências por categoria, responsabilidades e palavras-chave ATS.",
  },
  {
    icon: Sparkles,
    title: "Score de compatibilidade",
    text: "Pontos fortes, pontos de atenção e recomendações — sempre com base no que é verdadeiro no seu currículo.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="font-display text-lg font-semibold">Vaga Match</span>
        <Button asChild variant="ghost">
          <Link to="/auth">Entrar</Link>
        </Button>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-12 pb-20 text-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Matchmaking de currículos
        </p>
        <h1 className="mt-5 text-4xl leading-tight font-semibold sm:text-5xl">
          Adapte seu currículo para cada vaga, sem inventar nada
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          Cadastre seu currículo, cole a descrição da vaga e receba uma análise clara do que combina, do
          que falta e do que pode ser melhorado.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link to="/auth">
              Começar agora <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-4 px-6 pb-24 sm:grid-cols-3">
        {features.map(({ icon: Icon, title, text }) => (
          <article key={title} className="surface-panel p-6">
            <Icon className="size-5 text-primary" />
            <h2 className="mt-4 text-base font-semibold">{title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{text}</p>
          </article>
        ))}
      </section>

      <footer className="border-t px-6 py-8 text-center text-xs text-muted-foreground">
        O score é uma estimativa e não garante aprovação em um ATS ou contratação.
      </footer>
    </main>
  );
}
