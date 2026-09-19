# Career Compass

Prompt para Lovable — App de Matchmaking e Currículos ATS

Crie do zero uma aplicação web completa, moderna e responsiva para matchmaking entre candidatos e vagas de emprego, com foco em ajudar o usuário a adaptar seu currículo para uma vaga específica e gerar versões ATS-friendly.

1. Objetivo do produto

O sistema deve permitir que o usuário:

Crie uma conta e faça login.

Cadastre ou importe seu currículo principal.

Informe a descrição completa de uma vaga.

Analise automaticamente a compatibilidade entre o currículo e a vaga.

Identifique:

palavras-chave importantes da vaga;

competências técnicas exigidas;

competências comportamentais;

experiências relevantes;

requisitos atendidos;

requisitos não identificados no currículo;

possíveis lacunas;

nível estimado de compatibilidade.

Gere uma versão personalizada do currículo para aquela vaga.

Mantenha o conteúdo factual do currículo do usuário, sem inventar experiências, empresas, cargos, formação, certificações ou competências.

Otimize a estrutura e a linguagem para sistemas ATS.

Permita editar o currículo antes da exportação.

Exporte o currículo final em:

HTML;

DOC/DOCX;

PDF.

Permita manter diferentes versões do currículo para diferentes vagas.

2. Stack obrigatória

Frontend

Utilize a stack web mais adequada suportada pelo Lovable, priorizando:

React;

TypeScript;

Vite;

Tailwind CSS;

componentes acessíveis e responsivos.

A interface deve ser preparada para consumir uma API REST.

Backend

O backend de negócio deve ser desenvolvido em:

Kotlin

Spring Boot

API REST;

arquitetura organizada por camadas;

DTOs para entrada e saída;

validação de dados;

tratamento centralizado de erros;

autenticação/autorização;

documentação OpenAPI/Swagger.

Não implemente regras de negócio importantes diretamente no frontend.

O frontend deve consumir o backend Kotlin através de uma API HTTP.

Banco de dados

Utilize:

Supabase PostgreSQL

O banco deve ser estruturado de forma relacional e preparado para crescimento.

Utilize migrations para criação e alteração do schema.

3. Arquitetura

Estruture o projeto aproximadamente desta forma:

Frontend
   |
   | REST/JSON
   v
Kotlin + Spring Boot
   |
   +---- Serviço de autenticação/autorização
   |
   +---- Serviço de currículos
   |
   +---- Serviço de vagas
   |
   +---- Serviço de matchmaking
   |
   +---- Serviço de geração de currículo ATS
   |
   +---- Serviço de exportação
   |
   v
Supabase PostgreSQL


Mantenha frontend e backend desacoplados.

Crie uma estrutura que permita futuramente substituir ou adicionar um provedor de IA sem alterar significativamente a aplicação.

4. Autenticação

Implemente:

cadastro;

login;

logout;

recuperação de acesso;

sessão autenticada;

proteção das páginas privadas.

O usuário só pode acessar seus próprios currículos, vagas e análises.

Utilize o Supabase para os recursos de autenticação quando apropriado, mas mantenha o Kotlin/Spring Boot como camada principal da API e das regras de negócio.

Nunca exponha credenciais ou secrets no frontend.

Utilize variáveis de ambiente para:

SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
JWT_SECRET
AI_PROVIDER_API_KEY


Não coloque valores reais no código.

5. Modelo de dados

Crie inicialmente as seguintes entidades.

users

Informações básicas do usuário.

Campos sugeridos:

id
email
name
created_at
updated_at


resumes

Currículo principal do usuário.

id
user_id
title
raw_content
structured_content
created_at
updated_at


O currículo deve possuir uma representação estruturada, permitindo manipular separadamente:

personal_information
summary
experiences
education
skills
certifications
languages
projects


resume_experiences

id
resume_id
company
position
start_date
end_date
description
achievements


resume_education

id
resume_id
institution
degree
field
start_date
end_date
description


skills

id
resume_id
name
category
proficiency


jobs

Vagas informadas pelo usuário.

id
user_id
title
company
description
source_url
created_at
updated_at


job_analysis

Resultado da análise da vaga.

id
job_id
required_skills
preferred_skills
keywords
responsibilities
requirements
seniority
match_score
analysis_json
created_at
updated_at


resume_versions

Versões personalizadas de currículo.

id
resume_id
job_id
name
content
structured_content
match_score
created_at
updated_at


match_results

Resultado do matchmaking.

id
resume_id
job_id
score
matched_keywords
missing_keywords
matched_skills
missing_skills
recommendations
analysis_json
created_at


Utilize UUIDs como identificadores.

Adicione índices apropriados para:

user_id
resume_id
job_id
created_at


Garanta isolamento dos dados entre usuários.

6. Dashboard

Depois do login, o usuário deve visualizar um dashboard.

Mostrar:

currículo principal;

quantidade de versões criadas;

vagas analisadas;

últimos matchings;

melhor score de compatibilidade;

atalhos para:

Novo currículo;

Nova vaga;

Analisar vaga;

Minhas versões.

Criar uma interface limpa, profissional e orientada a produtividade.

7. Cadastro/importação do currículo

Criar uma tela chamada:

Meu currículo

O usuário deve poder:

Opção A — Criar do zero

Campos:

nome;

contato;

localização;

LinkedIn;

GitHub;

resumo profissional;

experiências;

formação;

habilidades;

certificações;

idiomas;

projetos.

Opção B — Importar currículo

Permitir upload de:

PDF;

DOCX;

TXT.

O sistema deve extrair o conteúdo e convertê-lo para uma estrutura interna.

Após a importação, mostrar uma etapa de revisão para que o usuário confirme ou corrija os dados extraídos.

Nunca assumir que a extração está correta.

8. Cadastro da vaga

Criar uma página:

Nova vaga

Campos:

Título da vaga
Empresa
URL da vaga
Descrição da vaga


O campo de descrição deve aceitar texto grande.

Adicionar botão:

Analisar vaga

Ao clicar, o backend deve processar a descrição.

9. Análise da vaga

Extrair e organizar:

Informações básicas

cargo;

empresa;

senioridade;

localização, quando disponível;

modalidade, quando disponível.

Requisitos

Separar:

requisitos obrigatórios;

requisitos desejáveis.

Competências

Classificar:

linguagens;

frameworks;

ferramentas;

bancos de dados;

cloud;

metodologias;

soft skills;

idiomas;

certificações.

Palavras-chave

Identificar termos relevantes para ATS.

Responsabilidades

Listar as principais responsabilidades da posição.

Mostrar tudo de forma visual e organizada.

10. Matchmaking

Criar uma página:

Match com a vaga

Comparar o currículo selecionado com a vaga.

Calcular um score de compatibilidade de 0 a 100.

Mostrar:

Compatibilidade geral
████████████████░░░░ 82%


Separar o resultado em:

Pontos fortes

Exibir competências e experiências que possuem forte correspondência.

Pontos de atenção

Mostrar requisitos da vaga que não estão claramente representados no currículo.

Palavras-chave ausentes

Mostrar termos importantes que podem ser adicionados somente quando forem verdadeiros para o candidato.

Experiências relevantes

Destacar experiências do currículo relacionadas à vaga.

Recomendações

Sugerir melhorias específicas.

Importante:

O sistema nunca deve recomendar que o usuário minta, invente experiência ou inclua uma competência que não possui.

11. Geração do currículo ATS

Criar botão:

Gerar currículo para esta vaga

O backend deve gerar uma nova versão baseada em:

Currículo original
+
Descrição da vaga
+
Resultado do matchmaking


O objetivo é adaptar o currículo para a vaga.

A geração deve:

priorizar experiências relevantes;

reorganizar informações;

melhorar descrições;

utilizar palavras-chave relevantes;

melhorar clareza;

utilizar verbos de ação;

destacar resultados;

evitar informações irrelevantes;

manter o conteúdo factual.

Nunca inventar:

experiências;

empresas;

cargos;

datas;

números;

resultados;

certificações;

tecnologias;

formação;

idiomas.

12. Regras ATS

O currículo gerado deve utilizar uma estrutura simples e compatível com ATS.

Evitar:

tabelas complexas;

múltiplas colunas;

elementos posicionados livremente;

gráficos;

barras de habilidade;

ícones como substitutos de texto;

informações essenciais somente em imagens;

cabeçalhos ou rodapés complexos;

excesso de elementos visuais.

Priorizar:

texto real;

títulos claros;

seções tradicionais;

hierarquia semântica;

palavras-chave;

datas em formato consistente;

bullets;

HTML semanticamente correto.

Estrutura padrão:

Nome
Contato

Resumo profissional

Experiência profissional

Formação acadêmica

Competências

Certificações

Idiomas

Projetos


As seções devem aparecer somente quando existirem informações relevantes.

13. Editor de currículo

Criar um editor visual.

O usuário deve poder alterar:

nome;

resumo;

experiência;

bullets;

competências;

formação;

certificações;

idiomas;

projetos.

Adicionar:

salvar;

desfazer;

refazer;

visualizar;

comparar com currículo original.

Mostrar claramente quando o conteúdo foi gerado ou alterado pela IA.

14. Comparação antes/depois

Criar uma tela:

Comparar versões

Mostrar:

Currículo original
        VS
Currículo adaptado


Destacar:

frases modificadas;

palavras-chave adicionadas;

experiências reorganizadas;

seções modificadas.

Mostrar também:

Score anterior: 61%
Score após adaptação: 86%


O score deve ser apresentado como uma estimativa e não como garantia de aprovação em um ATS ou contratação.

15. Exportação

O usuário deve conseguir exportar a versão final em:

HTML

Gerar HTML limpo e sem dependências externas desnecessárias.

DOC/DOCX

Gerar documento profissional e editável.

PDF

Gerar PDF utilizando uma estrutura apropriada para preservar texto selecionável e compatibilidade com ATS.

Criar botões:

Exportar HTML
Exportar DOCX
Exportar PDF


O arquivo deve utilizar o currículo atualmente salvo.

16. Visualização

Criar uma prévia do currículo antes da exportação.

A visualização deve simular o documento final em uma página A4.

Permitir:

zoom;

paginação;

visualização desktop;

visualização mobile.

A visualização não deve alterar o conteúdo do currículo.

17. Histórico

Criar:

Minhas versões

Cada item deve mostrar:

Nome da versão
Vaga
Empresa
Score
Data


Ações:

Abrir
Editar
Duplicar
Comparar
Exportar
Excluir


Solicitar confirmação antes da exclusão.

18. Segurança

Implementar:

autenticação;

autorização por usuário;

validação de inputs;

proteção contra acesso a recursos de outros usuários;

sanitização de HTML;

proteção contra XSS;

tratamento seguro de uploads;

limite de tamanho dos arquivos;

validação de tipo de arquivo;

secrets somente em variáveis de ambiente.

Nunca confiar em user_id enviado pelo frontend para determinar propriedade do recurso.

O backend deve obter o usuário autenticado a partir da sessão/token.

19. API REST

Criar endpoints organizados.

Exemplo:

POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/logout

GET    /api/resumes
POST   /api/resumes
GET    /api/resumes/{id}
PUT    /api/resumes/{id}
DELETE /api/resumes/{id}

POST   /api/resumes/import

GET    /api/jobs
POST   /api/jobs
GET    /api/jobs/{id}
DELETE /api/jobs/{id}

POST   /api/jobs/{id}/analyze

POST   /api/matches
GET    /api/matches/{id}

POST   /api/resume-versions
GET    /api/resume-versions
GET    /api/resume-versions/{id}
PUT    /api/resume-versions/{id}
DELETE /api/resume-versions/{id}

POST   /api/resume-versions/{id}/export/html
POST   /api/resume-versions/{id}/export/docx
POST   /api/resume-versions/{id}/export/pdf


Utilizar DTOs e nunca expor diretamente as entidades do banco.

20. Camadas do backend Kotlin

Organizar o backend aproximadamente assim:

src/main/kotlin/
└── com.example.resumeapp/
    ├── config/
    ├── controller/
    ├── dto/
    ├── entity/
    ├── repository/
    ├── service/
    ├── security/
    ├── exception/
    ├── mapper/
    └── util/


Separar claramente:

Controller
    ↓
Service
    ↓
Repository
    ↓
Supabase/PostgreSQL


As regras de negócio devem ficar nos Services.

21. IA

Criar uma camada de abstração:

AIService


Com métodos conceituais:

analyzeJob()
analyzeResume()
calculateMatch()
generateResumeVersion()
improveResumeSection()


Não acoplar o restante da aplicação diretamente ao provedor de IA.

Criar uma interface para permitir futuramente utilizar diferentes provedores.

As respostas da IA devem possuir formato estruturado, preferencialmente JSON validável.

Validar a resposta antes de persistir no banco.

22. Prompt interno da IA

Criar prompts internos que orientem a IA a:

analisar a vaga;

analisar o currículo;

identificar correspondências;

identificar lacunas;

sugerir melhorias;

gerar currículo adaptado.

Regra fundamental:

A IA deve trabalhar exclusivamente com informações fornecidas pelo usuário e pela vaga. Ela pode reescrever, reorganizar e otimizar a apresentação das informações, mas não pode criar fatos profissionais inexistentes.

Caso uma informação necessária não esteja disponível, a IA deve indicar que a informação está ausente.

23. UX/UI

Criar uma interface profissional semelhante a uma aplicação SaaS moderna.

Estilo:

minimalista;

profissional;

bastante espaço em branco;

tipografia legível;

boa hierarquia visual;

responsiva;

acessível;

foco em produtividade.

Menu lateral:

Dashboard
Meus Currículos
Minhas Vagas
Matchmaking
Minhas Versões
Configurações


Utilizar componentes consistentes:

cards;

badges;

progress bars;

modais;

tabs;

dropdowns;

tabelas;

alertas;

toasts;

skeleton loading.

24. Estados da aplicação

Implementar corretamente:

loading;

empty state;

error state;

success state;

retry;

confirmação de exclusão;

processamento da IA;

upload em andamento;

exportação em andamento.

Para operações demoradas, mostrar mensagens como:

Analisando a vaga...
Comparando seu currículo...
Gerando recomendações...
Preparando seu currículo...


Não bloquear a interface sem feedback.

25. Responsividade

A aplicação deve funcionar em:

desktop;

tablet;

celular.

No desktop:

Sidebar | Conteúdo


No mobile, transformar o menu em navegação compacta.

O editor de currículo deve continuar utilizável em telas pequenas.

26. Tratamento de erros

Criar mensagens amigáveis para o usuário.

Não mostrar stack traces.

Exemplo:

Não foi possível analisar esta vaga.
Tente novamente em alguns instantes.


Registrar detalhes técnicos no backend/logs.

27. Dados de exemplo

Durante o desenvolvimento, criar dados mockados apenas quando necessário para demonstrar a interface.

Deixar claramente separado:

MOCK


de dados reais.

Não misturar dados mockados com dados reais do usuário.

28. Qualidade do código

Priorizar:

código limpo;

componentes reutilizáveis;

baixo acoplamento;

alta coesão;

tipagem forte;

tratamento de erros;

validação;

testes para regras críticas.

Criar testes para:

matchmaking;

cálculo do score;

autorização;

criação de currículo;

criação de versão;

exportação.

29. Primeira versão — MVP

Não tente implementar todas as funcionalidades avançadas de uma vez.

Construa o MVP nesta ordem:

Fase 1

autenticação;

dashboard;

criação de currículo;

cadastro de vaga;

persistência no Supabase.

Fase 2

análise da vaga;

análise do currículo;

matchmaking;

score de compatibilidade.

Fase 3

geração do currículo ATS;

editor;

versões.

Fase 4

exportação HTML;

DOCX;

PDF.

Fase 5

comparação entre versões;

melhorias de UX;

testes;

tratamento de erros;

refinamento visual.

30. Critérios de aceite

A primeira versão será considerada funcional quando o seguinte fluxo estiver funcionando:

Usuário
   ↓
Cadastro/Login
   ↓
Criar currículo
   ↓
Cadastrar vaga
   ↓
Analisar vaga
   ↓
Comparar currículo + vaga
   ↓
Exibir score
   ↓
Exibir pontos fortes
   ↓
Exibir gaps
   ↓
Gerar currículo ATS
   ↓
Editar currículo
   ↓
Salvar versão
   ↓
Visualizar currículo
   ↓
Exportar HTML / DOCX / PDF


Todos os dados devem ser persistidos no Supabase.

O frontend deve consumir o backend Kotlin.

O backend deve conter as regras de negócio.

A aplicação deve estar preparada para receber posteriormente um provedor real de IA.

31. Importante sobre implementação no Lovable

Antes de gerar funcionalidades complexas, crie primeiro a estrutura do projeto e confirme a separação entre:

Frontend
Backend Kotlin
Supabase


Não substituir o backend Kotlin por regras de negócio implementadas diretamente no frontend.

Caso alguma funcionalidade não possa ser executada diretamente pelo ambiente do Lovable, crie a interface, os contratos da API e os pontos de integração necessários, deixando claramente documentado o que deverá ser executado no backend Kotlin.

Não utilizar dados fictícios como se fossem dados reais.

Não hardcodar:

credenciais;

tokens;

chaves de API;

URLs privadas;

senhas.

Utilizar .env e secrets/configuração segura.

Ao finalizar cada etapa, deixe o projeto executável e mantenha o código organizado para a próxima etapa.

Comece pela Fase 1 do MVP, criando a arquitetura, banco, autenticação, dashboard, currículo e cadastro de vagas. Não implemente as fases seguintes antes que a fundação esteja funcionando corretamente.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/bd59932a-0e16-4a81-9daa-d8d9131bd458).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
