# Outsera: Avaliação de Automação de Testes

Projeto da avaliação técnica de automação de testes da Outsera. Uma stack só, **Playwright com TypeScript**, para todos os blocos.

| Bloco | Situação |
|---|---|
| 1. Testes automatizados de API | ✅ Entregue |
| 2. Testes E2E com Cucumber | Em andamento |
| 3. Pipeline de CI/CD | Em andamento |
| 4. Testes de carga (opcional) | Em andamento |
| 5. Testes mobile (opcional) | Em andamento |

## Versões utilizadas

| Ferramenta | Versão |
|---|---|
| Node.js | 24.x (mínimo 20) |
| @playwright/test | 1.65.1 |
| TypeScript | 6.0.3 |
| Zod (validação de contrato) | 4.6.7 |
| ESLint + typescript-eslint + eslint-plugin-playwright | 10.15.0 / 8.74.0 / 2.12.2 |

## Como instalar

```bash
npm ci
cp .env.example .env   # opcional: os valores padrão já apontam para a API pública
```

Os testes de API não precisam de navegador.

## Como executar e gerar o relatório

```bash
npm run check          # lint + typecheck (gate de qualidade, rodado antes dos testes)
npm run test:api       # executa a suíte de API
npm run resumo         # gera reports/resumo.md a partir do relatório JSON
npm run report         # abre o relatório HTML no navegador
npm run evidencias:api # copia o relatório da última execução para evidencias/api
```

Filtros úteis:

```bash
npx playwright test --project=api --grep @negativo   # só cenários negativos
npx playwright test --project=api --grep @bug        # só os bugs encontrados
npx playwright test --project=api --repeat-each=3    # checagem de estabilidade
```

Relatórios gerados a cada execução (em `reports/`, fora do Git):
- `reports/html`: relatório HTML do Playwright, com o detalhe de cada requisição que falhou;
- `reports/junit/results.xml`: JUnit, para o pipeline;
- `reports/json/results.json` e `reports/resumo.md`: resumo por cenário, com os bugs encontrados.

A última execução fica versionada em [`evidencias/api`](evidencias/api/resumo.md).

## Arquitetura e estrutura de pastas

```
.
├── playwright.config.ts        # projetos (api), reporters (list, html, junit, json), retries só no CI
├── src/api/
│   ├── clients/booking.client.ts  # cliente da API: rotas, headers e autenticação em um só lugar
│   ├── data/booking.factory.ts    # massa de teste única por execução (isolamento entre testes paralelos)
│   ├── models/booking.ts          # contratos com Zod (schemas e tipos derivados)
│   └── fixtures.ts                # fixtures: cliente, token, reserva criada e apagada por teste
├── tests/api/                     # specs por recurso e método HTTP
├── scripts/                       # resumo em Markdown e cópia das evidências
├── evidencias/                    # relatórios da última execução, versionados
└── .env.example                   # URL e credenciais da API pública
```

Decisões:
- **Cliente de API separado dos testes.** Os testes descrevem só o comportamento; rota, header e autenticação ficam no cliente.
- **Contrato validado por schema (Zod).** Cada resposta é checada em status, `Content-Type` e corpo. Se a API mudar um campo, o teste aponta qual.
- **Massa isolada.** Cada teste cria a própria reserva (fixture `existingBooking`) e a apaga no final. Os testes rodam em paralelo sem depender uns dos outros nem de dados fixos da API pública.
- **Bugs documentados, não escondidos.** Quando a API foge do comportamento esperado de uma API REST, o teste afirma o comportamento correto e é marcado com `test.fail()` e a anotação `bug`. A suíte continua verde, o relatório lista o defeito, e se a API for corrigida o teste avisa.
- **Gates de qualidade.** ESLint (com regras do Playwright: sem `test.only`, sem espera fixa, sem promessa sem `await`) e `tsc --noEmit` antes da execução.

## 1. Testes de API

API alvo: [Restful-Booker](https://restful-booker.herokuapp.com/apidoc/index.html), pública, com CRUD de reservas e autenticação por token.

**33 cenários: 10 positivos e 23 negativos**, cobrindo GET, POST, PUT, PATCH e DELETE.

| Recurso | Positivos | Negativos |
|---|---|---|
| `POST /auth` | token com credenciais válidas | senha incorreta, usuário inexistente, status 401 esperado |
| `GET /booking` e `/booking/:id` | listagem, filtro por nome, busca por id | filtro sem resultado, id inexistente, id não numérico |
| `POST /booking` | criação e persistência, campo opcional ausente | JSON malformado, campo obrigatório ausente, tipo inválido, corpo vazio |
| `PUT` e `PATCH /booking/:id` | atualização completa e parcial com token | sem token, token inválido (sem alterar a reserva), payload incompleto, JSON malformado, id inexistente |
| `DELETE /booking/:id` | exclusão com token, com checagem de 404 depois | sem token (a reserva continua), token inválido, exclusão repetida |
| Métodos inválidos | — | `OPTIONS` anuncia só GET, HEAD e POST; PUT, PATCH e DELETE na coleção são recusados |

Em todos os cenários são validados status code, headers (`Content-Type`, `Allow`) e corpo da resposta.

### Bugs encontrados na API

| Cenário | Comportamento atual | Esperado |
|---|---|---|
| Login com credenciais inválidas | 200 com `{"reason":"Bad credentials"}` | 401 |
| POST sem campo obrigatório | 500 | 400 |
| POST com corpo vazio | 500 | 400 |
| POST com `totalprice: "abc"` | 200, grava `totalprice: null` | 400 |
| PUT em reserva inexistente | 405 | 404 |
| DELETE com sucesso | 201 Created | 200 ou 204 |
| DELETE de reserva já apagada | 405 | 404 |

## Uso de IA

Projeto desenvolvido com apoio de IA (Claude Code), da mesma forma que trabalho no dia a dia: eu defino a estratégia, os cenários e os critérios, a IA acelera a escrita, e todo o código passa por revisão, lint, typecheck e execução repetida antes de entrar.
