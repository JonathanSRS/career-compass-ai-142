import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { emptyResume, type StructuredResume } from "@/lib/resume-schema";
import { ResumeExportPanel } from "@/components/ResumeExportPanel";

export interface ResumeFormValue {
  title: string;
  is_primary: boolean;
  structured_content: StructuredResume;
}

interface Props {
  value: ResumeFormValue;
  onChange: (value: ResumeFormValue) => void;
  onSubmit: () => void;
  saving: boolean;
}

export function createEmptyFormValue(): ResumeFormValue {
  return { title: "Currículo principal", is_primary: true, structured_content: emptyResume() };
}

export function ResumeForm({ value, onChange, onSubmit, saving }: Props) {
  const [tab, setTab] = useState("dados");
  const content = value.structured_content;

  function patchContent(patch: Partial<StructuredResume>) {
    onChange({ ...value, structured_content: { ...content, ...patch } });
  }


  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
      className="space-y-6"
    >
      <div className="surface-panel space-y-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="resume-title">Nome do currículo</Label>
          <Input
            id="resume-title"
            required
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
          />
        </div>
        <div className="flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3">
          <div>
            <p className="text-sm font-medium">Currículo principal</p>
            <p className="text-xs text-muted-foreground">Usado por padrão nas comparações com vagas.</p>
          </div>
          <Switch
            checked={value.is_primary}
            onCheckedChange={(checked) => onChange({ ...value, is_primary: checked })}
          />
        </div>
        <ResumeExportPanel resume={content} title={value.title} />

      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="dados">Dados e resumo</TabsTrigger>
          <TabsTrigger value="experiencias">Experiências</TabsTrigger>
          <TabsTrigger value="formacao">Formação</TabsTrigger>
          <TabsTrigger value="competencias">Competências</TabsTrigger>
          <TabsTrigger value="extras">Certificações, idiomas e projetos</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="mt-4 space-y-4">
          <div className="surface-panel grid gap-4 p-5 sm:grid-cols-2">
            {(
              [
                ["full_name", "Nome completo"],
                ["email", "E-mail"],
                ["phone", "Telefone"],
                ["location", "Localização"],
                ["linkedin", "LinkedIn"],
                ["github", "GitHub"],
                ["website", "Site / portfólio"],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="space-y-2">
                <Label htmlFor={`pi-${field}`}>{label}</Label>
                <Input
                  id={`pi-${field}`}
                  value={content.personal_information[field]}
                  onChange={(e) =>
                    patchContent({
                      personal_information: { ...content.personal_information, [field]: e.target.value },
                    })
                  }
                />
              </div>
            ))}
          </div>
          <div className="surface-panel space-y-2 p-5">
            <Label htmlFor="summary">Resumo profissional</Label>
            <Textarea
              id="summary"
              rows={5}
              value={content.summary}
              onChange={(e) => patchContent({ summary: e.target.value })}
              placeholder="Descreva sua trajetória com base em fatos reais."
            />
          </div>
        </TabsContent>

        <TabsContent value="experiencias" className="mt-4 space-y-4">
          {content.experiences.map((exp, index) => (
            <div key={index} className="surface-panel space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Experiência {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover experiência"
                  onClick={() =>
                    patchContent({ experiences: content.experiences.filter((_, i) => i !== index) })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["position", "Cargo"],
                    ["company", "Empresa"],
                    ["start_date", "Início (MM/AAAA)"],
                    ["end_date", "Fim (MM/AAAA ou vazio)"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <Label>{field === "end_date" && exp.current ? "Fim (emprego atual)" : label}</Label>
                    <Input
                      value={field === "end_date" && exp.current ? "" : exp[field]}
                      disabled={field === "end_date" && exp.current}
                      placeholder={field === "end_date" && exp.current ? "Atual" : undefined}
                      onChange={(e) => {
                        const next = [...content.experiences];
                        next[index] = { ...exp, [field]: e.target.value };
                        patchContent({ experiences: next });
                      }}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between gap-4 rounded-lg bg-muted px-4 py-3">
                <div>
                  <p className="text-sm font-medium">É meu emprego atual</p>
                  <p className="text-xs text-muted-foreground">
                    Marque se você continua nesta posição; a data de fim será exibida como "atual".
                  </p>
                </div>
                <Switch
                  checked={exp.current}
                  aria-label="Emprego atual"
                  onCheckedChange={(checked) => {
                    const next = [...content.experiences];
                    next[index] = { ...exp, current: checked, end_date: checked ? "" : exp.end_date };
                    patchContent({ experiences: next });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Descrição</Label>
                <Textarea
                  rows={3}
                  value={exp.description}
                  onChange={(e) => {
                    const next = [...content.experiences];
                    next[index] = { ...exp, description: e.target.value };
                    patchContent({ experiences: next });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label>Resultados (um por linha)</Label>
                <Textarea
                  rows={3}
                  value={exp.achievements.join("\n")}
                  onChange={(e) => {
                    const next = [...content.experiences];
                    next[index] = {
                      ...exp,
                      achievements: e.target.value.split("\n").filter((line) => line.trim() !== ""),
                    };
                    patchContent({ experiences: next });
                  }}
                />
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patchContent({
                experiences: [
                  ...content.experiences,
                  {
                    company: "",
                    position: "",
                    start_date: "",
                    end_date: "",
                    current: false,
                    description: "",
                    achievements: [],
                  },
                ],
              })
            }
          >
            <Plus className="mr-2 size-4" /> Adicionar experiência
          </Button>
        </TabsContent>

        <TabsContent value="formacao" className="mt-4 space-y-4">
          {content.education.map((edu, index) => (
            <div key={index} className="surface-panel space-y-4 p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Formação {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover formação"
                  onClick={() => patchContent({ education: content.education.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    ["institution", "Instituição"],
                    ["degree", "Curso / grau"],
                    ["field", "Área"],
                    ["start_date", "Início"],
                    ["end_date", "Conclusão"],
                  ] as const
                ).map(([field, label]) => (
                  <div key={field} className="space-y-2">
                    <Label>{label}</Label>
                    <Input
                      value={edu[field]}
                      onChange={(e) => {
                        const next = [...content.education];
                        next[index] = { ...edu, [field]: e.target.value };
                        patchContent({ education: next });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              patchContent({
                education: [
                  ...content.education,
                  { institution: "", degree: "", field: "", start_date: "", end_date: "", description: "" },
                ],
              })
            }
          >
            <Plus className="mr-2 size-4" /> Adicionar formação
          </Button>
        </TabsContent>

        <TabsContent value="competencias" className="mt-4 space-y-4">
          <div className="surface-panel space-y-4 p-5">
            {content.skills.map((skill, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1.5fr_1.5fr_auto]">
                <Input
                  placeholder="Competência"
                  value={skill.name}
                  onChange={(e) => {
                    const next = [...content.skills];
                    next[index] = { ...skill, name: e.target.value };
                    patchContent({ skills: next });
                  }}
                />
                <Input
                  placeholder="Categoria"
                  value={skill.category}
                  onChange={(e) => {
                    const next = [...content.skills];
                    next[index] = { ...skill, category: e.target.value };
                    patchContent({ skills: next });
                  }}
                />
                <Input
                  placeholder="Nível"
                  value={skill.proficiency}
                  onChange={(e) => {
                    const next = [...content.skills];
                    next[index] = { ...skill, proficiency: e.target.value };
                    patchContent({ skills: next });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover competência"
                  onClick={() => patchContent({ skills: content.skills.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                patchContent({ skills: [...content.skills, { name: "", category: "", proficiency: "" }] })
              }
            >
              <Plus className="mr-2 size-4" /> Adicionar competência
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="extras" className="mt-4 space-y-4">
          <div className="surface-panel space-y-3 p-5">
            <p className="text-sm font-medium">Certificações</p>
            {content.certifications.map((cert, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[2fr_1.5fr_1fr_auto]">
                <Input
                  placeholder="Nome"
                  value={cert.name}
                  onChange={(e) => {
                    const next = [...content.certifications];
                    next[index] = { ...cert, name: e.target.value };
                    patchContent({ certifications: next });
                  }}
                />
                <Input
                  placeholder="Emissor"
                  value={cert.issuer}
                  onChange={(e) => {
                    const next = [...content.certifications];
                    next[index] = { ...cert, issuer: e.target.value };
                    patchContent({ certifications: next });
                  }}
                />
                <Input
                  placeholder="Ano"
                  value={cert.year}
                  onChange={(e) => {
                    const next = [...content.certifications];
                    next[index] = { ...cert, year: e.target.value };
                    patchContent({ certifications: next });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover certificação"
                  onClick={() =>
                    patchContent({ certifications: content.certifications.filter((_, i) => i !== index) })
                  }
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patchContent({
                  certifications: [...content.certifications, { name: "", issuer: "", year: "" }],
                })
              }
            >
              <Plus className="mr-2 size-4" /> Adicionar certificação
            </Button>
          </div>

          <div className="surface-panel space-y-3 p-5">
            <p className="text-sm font-medium">Idiomas</p>
            {content.languages.map((lang, index) => (
              <div key={index} className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
                <Input
                  placeholder="Idioma"
                  value={lang.name}
                  onChange={(e) => {
                    const next = [...content.languages];
                    next[index] = { ...lang, name: e.target.value };
                    patchContent({ languages: next });
                  }}
                />
                <Input
                  placeholder="Nível"
                  value={lang.level}
                  onChange={(e) => {
                    const next = [...content.languages];
                    next[index] = { ...lang, level: e.target.value };
                    patchContent({ languages: next });
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remover idioma"
                  onClick={() => patchContent({ languages: content.languages.filter((_, i) => i !== index) })}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => patchContent({ languages: [...content.languages, { name: "", level: "" }] })}
            >
              <Plus className="mr-2 size-4" /> Adicionar idioma
            </Button>
          </div>

          <div className="surface-panel space-y-3 p-5">
            <p className="text-sm font-medium">Projetos</p>
            {content.projects.map((project, index) => (
              <div key={index} className="space-y-3 border-b pb-4 last:border-0 last:pb-0">
                <div className="grid gap-3 sm:grid-cols-[2fr_2fr_auto]">
                  <Input
                    placeholder="Nome"
                    value={project.name}
                    onChange={(e) => {
                      const next = [...content.projects];
                      next[index] = { ...project, name: e.target.value };
                      patchContent({ projects: next });
                    }}
                  />
                  <Input
                    placeholder="URL"
                    value={project.url}
                    onChange={(e) => {
                      const next = [...content.projects];
                      next[index] = { ...project, url: e.target.value };
                      patchContent({ projects: next });
                    }}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    aria-label="Remover projeto"
                    onClick={() => patchContent({ projects: content.projects.filter((_, i) => i !== index) })}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <Textarea
                  rows={2}
                  placeholder="Descrição"
                  value={project.description}
                  onChange={(e) => {
                    const next = [...content.projects];
                    next[index] = { ...project, description: e.target.value };
                    patchContent({ projects: next });
                  }}
                />
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                patchContent({ projects: [...content.projects, { name: "", description: "", url: "" }] })
              }
            >
              <Plus className="mr-2 size-4" /> Adicionar projeto
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <div className="sticky bottom-4 flex justify-end">
        <Button type="submit" size="lg" disabled={saving}>
          {saving ? "Salvando..." : "Salvar currículo"}
        </Button>
      </div>
    </form>
  );
}
