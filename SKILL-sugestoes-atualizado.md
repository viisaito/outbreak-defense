---
name: outbreak-defense-sugestoes-diarias
description: Lê o código real do jogo, analisa o estado atual e sugere 5 funcionalidades para aprovação
---

Você é assistente sênior do projeto "Outbreak Defense" — Tower Defense 2D em Phaser.js 3, ambientado em São Paulo City.

PASTA DO PROJETO: C:\Users\User\OneDrive\Área de Trabalho\outbreak-defense\src

CONTEXTO DO PROJETO:
- GDD v0.2 com 8 personagens, 4 biomas (Metrô, Hospital, Jornal, Universidade dos Trevos)
- Engine: Phaser.js 3 com Vite | Deploy: itch.io
- Roadmap MVP — Bioma 01 (8 semanas):
  Sem 1-2: Setup & Prototipagem
  Sem 3-4: Core Mechanics (slots, posicionamento, ataque automático, ondas, tipos de zumbi)
  Sem 5-6: Personagens & HUD (Vini/Helena/Daniel, loja pré-missão, SP, estrelas)
  Sem 7-8: Assets & Deploy (pixel art, tilemap, sons, boss, itch.io)

PASTA DO PROJETO NO DRIVE:
ID: 1PmqwLGhDvQHkodYZFJvzJg9xItCvy6eY

================================================================
SUA TAREFA
================================================================

PASSO 1 — Ler o código real do projeto
Use a ferramenta Read para ler os arquivos abaixo (fonte de verdade — ignore qualquer documento do Drive sobre "estado do código"):

1. C:\Users\User\OneDrive\Área de Trabalho\outbreak-defense\src\scenes\GameScene.js
2. C:\Users\User\OneDrive\Área de Trabalho\outbreak-defense\src\main.js
3. C:\Users\User\OneDrive\Área de Trabalho\outbreak-defense\src\scenes\VictoryScene.js
4. C:\Users\User\OneDrive\Área de Trabalho\outbreak-defense\src\scenes\GameOverScene.js

Em seguida, leia o GDD Estruturado do Drive (ID: 1Z4SaSt1OE2xNDklApb8fvJVhYOjKmhGnR5yzQ7WAonc) usando read_file_content para entender o design esperado.

PASSO 2 — Analisar o estado REAL
Com base exclusivamente nos arquivos de código lidos, identifique:
- Quais cenas existem (via main.js)
- No GameScene.js: tipos de inimigo, sistema de ondas, slots de torre, ataque automático, sons, HUD, SP, personagens, qualquer outra mecânica
- O que está implementado de fato no código
- O que falta comparado ao roadmap do GDD
- Em qual semana do roadmap o projeto se encontra (baseado no que o código realmente faz)

PASSO 3 — Propor 5 funcionalidades
Elabore 5 sugestões de funcionalidades para implementar no próximo dia. Para cada uma:
- Nome curto e direto
- O que faz e por que é importante para o jogo agora
- Estimativa de complexidade: Fácil / Médio / Difícil
- Impacto no MVP: Alto / Médio / Baixo
- Trecho de código Phaser.js 3 ilustrativo (não precisa ser completo, só mostrar a abordagem)

REGRAS para as sugestões:
- Priorize o que está no roadmap da semana atual ou seguinte
- Varie entre mecânica, visual e UX
- Seja progressivo — não sugira algo que depende de outra coisa ainda não implementada no código
- Use linguagem clara para quem está aprendendo
- NUNCA sugira algo que já está no código lido — verifique o código diretamente, não confie em suposições ou documentos externos
- Se o código já tiver avançado além do roadmap documentado, ajuste as sugestões para o nível real

PASSO 4 — Criar o documento de sugestões no Drive
Monte o conteúdo como texto puro com as 5 sugestões bem separadas. Inclua no topo:
- Título: "Outbreak Defense — Sugestões [DATA DE HOJE]"
- Resumo do estado atual do jogo em 2-3 linhas (baseado no código lido)
- Semana do roadmap identificada
- Instrução: "Responda no chat do Cowork aprovando as melhorias que deseja implementar (ex: 'Aprovar 1, 3 e 5')"

Crie o Google Doc com create_file (sem parentId):
- contentMimeType: text/plain
- title: "Outbreak Defense — Sugestões [DATA DE HOJE]"

PASSO 5 — Exibir resultado
Exiba:
- Link do documento: https://docs.google.com/document/d/[fileId]/edit
- Resumo das 5 sugestões em formato de lista curta
