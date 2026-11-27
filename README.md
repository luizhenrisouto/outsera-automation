# Outsera: Avaliação de Automação de Testes

Projeto da avaliação técnica de automação de testes da Outsera. Uma stack só, **Playwright com TypeScript**, para todos os blocos.

| Bloco | Situação |
|---|---|
| 1. Testes automatizados de API | ✅ Entregue |
| 2. Testes E2E com Cucumber | ✅ Entregue |
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
| playwright-bdd (Cucumber/Gherkin no Playwright) | 9.2.1 |
| Chromium do Playwright (E2E) | instalado por `npx playwright install chromium` |
| ESLint + typescript-eslint + eslint-plugin-playwright | 10.15.0 / 8.74.0 / 2.12.2 |

## Como instalar

```bash
npm ci
cp .env.example .env   # opcional: os valores padrão já apontam para a API pública
```

Os testes de API não precisam de navegador. Para o E2E, instale o Chromium do Playwright:

```bash
npx playwright install chromium
```

## Como executar e gerar o relatório

```bash
npm run check          # lint + typecheck (gate de qualidade, rodado antes dos testes)
npm run test:api       # executa a suíte de API
npm run resumo         # gera reports/resumo.md a partir do relatório JSON
npm run report         # abre o relatório HTML no navegador
npm run evidencias:api # copia o relatório da última execução para evidencias/api

npm run test:e2e       # gera os specs a partir das features (bddgen) e executa a suíte E2E
npm run resumo         # o mesmo resumo, agora da execução E2E
npm run evidencias:e2e # copia relatório, resumo e prints de cada cenário para evidencias/e2e
```

Filtros úteis:

```bash
npx playwright test --project=api --grep @negativo   # só cenários negativos
npx playwright test --project=api --grep @bug        # só os bugs encontrados
npx playwright test --project=api --repeat-each=3    # checagem de estabilidade
npx bddgen && npx playwright test --project=e2e --grep @bug   # só os bugs do E2E
npx bddgen && npx playwright test --project=e2e --repeat-each=3
```

Relatórios gerados a cada execução (em `reports/`, fora do Git):
- `reports/html`: relatório HTML do Playwright, com o detalhe de cada requisição que falhou;
- `reports/junit/results.xml`: JUnit, para o pipeline;
- `reports/json/results.json` e `reports/resumo.md`: resumo por cenário, com os bugs encontrados.

A última execução de cada bloco fica versionada em [`evidencias/api`](evidencias/api/resumo.md) e [`evidencias/e2e`](evidencias/e2e/resumo.md) (este com os prints de todos os cenários em `evidencias/e2e/prints`).

## Arquitetura e estrutura de pastas

```
.
├── .github/workflows/ci.yml   # pipeline do GitHub Actions: qualidade, API e E2E a cada commit
├── playwright.config.ts        # projetos (api, e2e), reporters (list, html, junit, json), retries só no CI
├── src/api/
│   ├── clients/booking.client.ts  # cliente da API: rotas, headers e autenticação em um só lugar
│   ├── data/booking.factory.ts    # massa de teste única por execução (isolamento entre testes paralelos)
│   ├── models/booking.ts          # contratos com Zod (schemas e tipos derivados)
│   └── fixtures.ts                # fixtures: cliente, token, reserva criada e apagada por teste
├── src/e2e/
│   ├── pages/saucedemo/           # Page Objects do Sauce Demo (login, vitrine, carrinho e formulário)
│   ├── pages/demoblaze/           # Page Objects do Demoblaze (loja, carrinho, modal de pedido e comprovante)
│   ├── data/                      # perfis de usuário, comprador gerado por execução, bugs conhecidos
│   └── fixtures.ts                # fixtures com os Page Objects e Given/When/Then do playwright-bdd
├── tests/api/                     # specs por recurso e método HTTP
├── tests/e2e/features/            # cenários em Gherkin, em português (login.feature, checkout.feature)
├── tests/e2e/steps/               # definições dos passos e hook que anota os bugs
├── scripts/                       # resumo em Markdown e cópia das evidências
├── evidencias/                    # relatórios da última execução, versionados
└── .env.example                   # URLs e credenciais públicas da API e dos sites de demonstração
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

## 2. Testes E2E com Cucumber

Cucumber com Playwright pelo [playwright-bdd](https://vitalets.github.io/playwright-bdd/): as features ficam em Gherkin (em português, `# language: pt`), o `bddgen` gera os specs e o Playwright executa, com paralelismo, fixtures e relatórios do próprio Playwright.

Aplicações alvo, públicas e de demonstração:
- **Tarefa 1 (login e navegação):** [Sauce Demo](https://www.saucedemo.com/), do login até o formulário de checkout.
- **Tarefa 2 (checkout):** [Demoblaze](https://www.demoblaze.com/), que tem carrinho e um formulário de pedido com cartão e endereço (país e cidade).

**19 cenários: 6 positivos e 13 negativos**, sendo 4 deles bugs documentados.

| Feature | Positivos | Negativos |
|---|---|---|
| `login.feature` (Sauce Demo) | login válido abre a vitrine; navegação até o formulário de checkout, com URL, título e campos editáveis; formulário preenchido avança para a revisão | senha incorreta, usuário inexistente, usuário bloqueado, usuário em branco, senha em branco, página interna sem login, e cada campo obrigatório do formulário em branco (First Name, Last Name, Postal Code) |
| `checkout.feature` (Demoblaze) | carrinho lista os 2 produtos com o preço da página de cada um e soma o total; compra completa com comprovante (número, valor, cartão e nome) | compra sem nome e cartão é recusada; cartão com letras; cartão curto demais; endereço de entrega incompleto |

Decisões:
- **Page Object e fixtures.** Cada página tem a sua classe; as fixtures entregam os Page Objects aos passos, e o estado da compra (comprador, produtos e preços, desfecho) vive numa fixture por cenário, sem variável global.
- **Massa sem dados fixos espalhados.** A feature fala em perfis ("válido", "bloqueado", "inexistente"); as credenciais ficam em `src/e2e/data/users.ts` e no `.env`. Comprador, senha errada e usuário inexistente são gerados a cada execução.
- **Seletores estáveis.** Papel, placeholder e `data-test`. O Demoblaze não tem `data-test` e os rótulos do modal de pedido apontam para o campo errado (o rótulo "Total" está ligado ao campo Name), então os campos são achados pelo id dentro do diálogo achado pelo papel; o motivo está comentado no Page Object.
- **Sem espera fixa.** Tudo espera por estado: o carrinho só segue quando as linhas e o total carregaram, os alerts nativos do Demoblaze são esperados como evento, e o envio do pedido espera o desfecho (alert de validação ou comprovante). Isso evita o falso positivo de checar "não apareceu o comprovante" antes de a loja responder.
- **Bugs como no bloco de API.** O cenário afirma o comportamento correto e recebe as tags `@fail` (vira `test.fail()`) e `@bug:<id>`; um hook grava a descrição como anotação `bug` no relatório (`src/e2e/data/bugs.ts`).
- **Evidências.** Print de todo cenário (inclusive das falhas esperadas, em que o print mostra a compra concluída indevidamente), e vídeo e trace guardados em caso de falha.
- **Estabilidade.** A suíte passou com `--repeat-each=3` (57 execuções, 6 workers) sem nenhuma falha.

### Bugs encontrados no Demoblaze

| Id | Cenário | Comportamento atual | Esperado |
|---|---|---|---|
| DB-01 | Cartão com letras (`abcd efgh ijkl mnop`) | compra concluída, comprovante exibido | recusar o número do cartão |
| DB-02 | Cartão com 4 dígitos (`4111`) | compra concluída | recusar o número do cartão |
| DB-03 | Sem país e sem cidade de entrega | compra concluída | exigir o endereço de entrega |
| DB-04 | Data no comprovante | mostra o mês anterior (ex.: 27/10 em 27/11), mês do JavaScript contado a partir de 0 | data do dia da compra |

O Demoblaze só valida nome e cartão em branco ("Please fill out Name and Creditcard."), e esse cenário passa normalmente.

### Limitações dos sites escolhidos

- São sites públicos de terceiros: lentidão ou mudança neles afeta a suíte. Os cenários do Demoblaze levam de 10 a 35 s cada (páginas pesadas e carrinho por AJAX); por isso o projeto `e2e` tem tempo limite de 60 s.
- O Sauce Demo não tem campos de cartão nem de endereço no checkout; por isso a Tarefa 2 usa o Demoblaze.
- O Demoblaze avisa com `alert()` nativo e não tem validação de cartão nem de endereço, então os negativos de cartão e endereço são bugs documentados, não recusas reais.
- O carrinho do Demoblaze é ligado a um cookie anônimo; cada cenário roda num contexto novo do navegador, então os carrinhos não se misturam entre testes paralelos.

## 3. Pipeline de CI/CD (GitHub Actions)

Workflow em [`.github/workflows/ci.yml`](.github/workflows/ci.yml). Roda a cada push em qualquer branch, em pull requests para o `main` e sob demanda (`workflow_dispatch`).

```
qualidade (lint + typecheck) ──┬──> api (Playwright, Restful-Booker)
                               └──> e2e (Cucumber/playwright-bdd, Chromium)
```

- **Gate de qualidade primeiro.** Lint e typecheck rodam antes; se falharem, as suítes nem começam.
- **API e E2E em paralelo**, em jobs separados: uma falha numa suíte não esconde o resultado da outra, e cada uma tem o seu relatório.
- **Execução eficiente.** Cache do npm e do Chromium (chave pela versão do Playwright), `npm ci` para instalação reproduzível, e um commit novo na mesma branch cancela a execução anterior.
- **Comportamento de CI no Playwright.** Com `CI=true`, o `playwright.config.ts` liga 1 retry (o resumo marca o teste como "Instável" se só passar no retry) e proíbe `test.only` esquecido.
- **Mobile.** O job de mobile entra no pipeline junto com o bloco 5.

### Relatório das execuções

Cada execução fica na aba **Actions** do repositório:
- **Resumo na própria página da execução** (`$GITHUB_STEP_SUMMARY`): a tabela de cenários, positivos e negativos, bugs confirmados e falhas inesperadas, gerada por `scripts/gerar-resumo.mjs`.
- **Artefatos para download** (`relatorio-api` e `relatorio-e2e`, guardados por 14 dias): relatório HTML do Playwright, JUnit, JSON e, no E2E, os prints de todos os cenários e vídeo e trace dos que falharem.

Os bugs documentados (`test.fail()` na API e `@fail` no E2E) não quebram o pipeline: ele só fica vermelho com falha inesperada ou bug corrigido sem revisão do teste.

## Uso de IA

Projeto desenvolvido com apoio de IA (Claude Code), da mesma forma que trabalho no dia a dia: eu defino a estratégia, os cenários e os critérios, a IA acelera a escrita, e todo o código passa por revisão, lint, typecheck e execução repetida antes de entrar.
