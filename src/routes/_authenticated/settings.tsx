import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Configurações — Vaga Match" },
      { name: "description", content: "Dados da sua conta no Vaga Match." },
      { property: "og:title", content: "Configurações — Vaga Match" },
      { property: "og:description", content: "Dados da sua conta." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Settings,
});

function Settings() {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setEmail(data.user?.email ?? null);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Informações da sua conta.</p>
      </div>

      <div className="surface-panel space-y-3 p-5">
        <p className="text-sm font-medium">E-mail da conta</p>
        {loading ? (
          <Skeleton className="h-5 w-56" />
        ) : (
          <p className="text-sm text-muted-foreground">{email ?? "não disponível"}</p>
        )}
      </div>

      <div className="surface-panel space-y-2 p-5">
        <p className="text-sm font-medium">Privacidade dos seus dados</p>
        <p className="text-sm text-muted-foreground">
          Currículos, vagas e análises são visíveis apenas para a sua conta. A análise automática nunca
          cria experiências, empresas, datas ou certificações que você não informou.
        </p>
      </div>
    </div>
  );
}
