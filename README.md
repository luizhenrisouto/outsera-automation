# Outsera: Avaliação de Automação de Testes

Projeto da avaliação técnica de automação de testes da Outsera. Uma stack só, **Playwright com TypeScript**, para todos os blocos.

| Bloco | Situação |
|---|---|
| 1. Testes automatizados de API | ✅ Entregue |
| 2. Testes E2E com Cucumber | ✅ Entregue |
| 3. Pipeline de CI/CD | ✅ Entregue |
| 4. Testes de carga (opcional) | ✅ Entregue |
| 5. Testes mobile (opcional) | Não incluído (veja abaixo) |

O bloco 5 (mobile com Appium) é opcional e ficou de fora desta entrega: priorizei profundidade nos blocos de API, E2E, pipeline e carga, que são o foco da vaga (automação web com Playwright). A estrutura do projeto e do pipeline comporta um job de mobile sem mudanças nos demais.

## Versões utilizadas

| Ferramenta | Versão |
|---|---|
| Node.js | 24.x (mínimo 20) |
| @playwright/test | 1.65.1 |
| TypeScript | 6.0.3 |
| Zod (validação de contrato) | 4.6.7 |
| playwright-bdd (Cucumber/Gherkin no Playwright) | 9.2.1 |
| k6 (carga) | 2.4.0 |
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

Para a carga, instale o [k6](https://grafana.com/docs/k6/latest/set-up/install-k6/) (no Windows: `winget install GrafanaLabs.k6`).

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

npm run test:load            # sobe a API mock, roda o k6 (500 usuários por 5 min) e gera os relatórios em reports/load
npm run test:load:paginada   # a mesma carga com a listagem paginada no mock (correção proposta)
npm run evidencias:carga     # copia os relatórios das duas rodadas para evidencias/carga
```

Para uma carga curta (validar o script): `VUS=50 DURACAO=30s npm run test:load`.

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
├── load/mock-api/server.mjs       # API mock (rotas do Restful-Booker), alvo da carga
├── load/k6/carga.js               # script k6: cenário, jornada, métricas, critérios de aceite e relatório
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
                               ├──> e2e (Cucumber/playwright-bdd, Chromium)
                               └──> carga (k6 contra a API mock)
```

- **Gate de qualidade primeiro.** Lint e typecheck rodam antes; se falharem, as suítes nem começam.
- **API e E2E em paralelo**, em jobs separados: uma falha numa suíte não esconde o resultado da outra, e cada uma tem o seu relatório.
- **Execução eficiente.** Cache do npm e do Chromium (chave pela versão do Playwright), `npm ci` para instalação reproduzível, e um commit novo na mesma branch cancela a execução anterior.
- **Comportamento de CI no Playwright.** Com `CI=true`, o `playwright.config.ts` liga 1 retry (o resumo marca o teste como "Instável" se só passar no retry) e proíbe `test.only` esquecido.
- **Carga.** O job `carga` roda a cada commit numa versão curta (50 usuários, 30 s) que valida o script e os critérios de aceite; a carga completa (500 usuários por 5 min) roda sob demanda, marcando `carga_completa` no *Run workflow*.
- **Mobile.** O enunciado pede API, E2E e mobile no pipeline; o mobile (bloco 5, opcional) não foi incluído nesta entrega, então o pipeline cobre API, E2E e carga.

### Relatório das execuções

Cada execução fica na aba **Actions** do repositório. A [primeira execução](https://github.com/luizhenrisouto/outsera-automation/actions/runs/46048070958) passou nos 4 jobs: lint e typecheck, API com 33 cenários, E2E com 19 cenários (os bugs documentados contam como falha esperada) e a versão curta da carga.

O que cada execução entrega:
- **Resumo na própria página da execução** (`$GITHUB_STEP_SUMMARY`): a tabela de cenários, positivos e negativos, bugs confirmados e falhas inesperadas, gerada por `scripts/gerar-resumo.mjs`.
- **Artefatos para download** (`relatorio-api` e `relatorio-e2e`, guardados por 14 dias): relatório HTML do Playwright, JUnit, JSON e, no E2E, os prints de todos os cenários e vídeo e trace dos que falharem.

Os bugs documentados (`test.fail()` na API e `@fail` no E2E) não quebram o pipeline: ele só fica vermelho com falha inesperada ou bug corrigido sem revisão do teste.

## 4. Testes de carga (k6)

**Alvo:** uma API mock em Node ([`load/mock-api/server.mjs`](load/mock-api/server.mjs)) com as rotas do Restful-Booker (`/auth`, `/booking`, `/booking/:id`), em memória. O enunciado permite API de mock, e 500 usuários por 5 minutos contra o serviço gratuito real seria sobrecarregar um serviço de terceiros e medir a internet, não a API. O mock roda local e no CI, e o resultado é reproduzível.

**Script** ([`load/k6/carga.js`](load/k6/carga.js)):
- **Cenário:** executor `ramping-vus`, rampa de 30 s até 500 usuários, **500 usuários simultâneos sustentados por 5 minutos** e descida de 15 s.
- **Jornada de cada usuário:** login uma vez e, a cada iteração, listar reservas, consultar uma reserva e criar outra, com 1 a 2 s de tempo de pensar entre as jornadas.
- **Métricas:** as HTTP padrão do k6, separadas por endpoint com a tag `endpoint`, mais métricas próprias: `tempo_jornada`, `reservas_criadas` e `tamanho_listagem_kb`.
- **Critérios de aceite (thresholds):** falhas HTTP < 1%, checks > 99%, p95 < 500 ms e p99 < 1 s no geral, e p95 por endpoint. Se algum for violado, o k6 termina com erro.
- **Relatórios:** painel web do k6 exportado em HTML (gráficos ao longo do tempo), resumo em Markdown, `summary.json` e a evolução por janela de 30 s (`janelas.md`), calculada das métricas brutas por [`scripts/analisar-carga.mjs`](scripts/analisar-carga.mjs).

### Resultado e análise

Evidências em [`evidencias/carga`](evidencias/carga): uma pasta por rodada, cada uma com `relatorio.html`, `resumo.md`, `janelas.md` e `summary.json`.

| Rodada | Requisições (média/s) | p95 geral | p99 geral | Falhas | Critérios |
|---|---|---|---|---|---|
| Listagem sem paginação, como a API real ([resumo](evidencias/carga/sem-paginacao/resumo.md)) | 190.452 (550/s) | 1.584 ms | 2.196 ms | 0% | ❌ 5 de 8 violados |
| Listagem paginada no mock ([resumo](evidencias/carga/com-paginacao/resumo.md)) | 322.266 (930/s) | 5,5 ms | 23,8 ms | 0% | ✅ todos aprovados |

**Gargalo encontrado: a listagem `GET /booking` sem paginação.** Ela devolve todas as reservas, e a própria carga cria cerca de 180 reservas por segundo. A evolução por janela ([`janelas.md`](evidencias/carga/sem-paginacao/janelas.md)) mostra a causa e o efeito:

| Janela | Req/s | p95 `GET /booking` | p95 `GET /booking/:id` | Resposta da listagem |
|---|---|---|---|---|
| 30-60 s | 1.002 | 3,6 ms | 2,9 ms | 286 KB |
| 90-120 s | 712 | 698 ms | 681 ms | 611 KB |
| 180-210 s | 477 | 1.345 ms | 1.346 ms | 909 KB |
| 300-330 s | 341 | 2.391 ms | 2.393 ms | 1.200 KB |

O que os números mostram:
- **A resposta cresce sem limite** (de 1 KB para 1,2 MB), e o tempo de resposta cresce junto.
- **O gargalo contamina a API inteira.** `GET /booking/:id` é uma busca direta, sem custo que cresça, e degradou igual à listagem. O Node atende tudo num único processo: enquanto ele percorre e serializa a lista enorme, as outras requisições esperam na fila.
- **A vazão cai com o mesmo número de usuários**: de ~1.000 para ~340 req/s. Com 500 usuários fixos, cada um espera mais por resposta e faz menos requisições. Um monitor só de erros não veria nada: **0% de falhas HTTP**, a API só fica lenta.

**Confirmação da causa.** Rodei a mesma carga com a listagem paginada no mock (`npm run test:load:paginada`, 100 itens por página):
- Numa primeira versão, a paginação só cortava a resposta depois de percorrer todas as reservas. A degradação demorou mais para começar (~2,5 min em vez de ~1 min), mas veio do mesmo jeito, porque o trabalho por requisição continuava proporcional ao total de reservas.
- Com a paginação parando de percorrer ao completar a página, a API ficou estável os 5 minutos: ~1.000 req/s do início ao fim, p95 abaixo de 8 ms na maioria das janelas (com um pico de 41 ms entre 60 e 90 s e 12 ms na janela seguinte, que se normalizou sozinho) e todos os critérios aprovados.

**Recomendações para a API:**
1. Paginar a listagem (`page`/`size` ou cursor), com tamanho máximo de página, sem percorrer a coleção inteira a cada chamada.
2. Não deixar uma rota pesada bloquear as leves: mais de um processo (cluster ou réplicas atrás de um balanceador) e um limite de tempo por requisição.
3. Monitorar latência (p95/p99 por endpoint) e não só taxa de erro, já que aqui a degradação veio com 0% de falhas.
4. Incluir esta carga no pipeline como regressão de performance (a versão curta já roda a cada commit).

**Limitações:**
- O k6 e o mock rodaram na mesma máquina (12 núcleos), disputando CPU. Os números absolutos valem para esta máquina; o que importa é a tendência e a comparação entre as rodadas.
- O mock guarda tudo em memória e reproduz o comportamento da listagem, não a infraestrutura da API real (banco, rede, Heroku).
- Para o k6 não virar ele mesmo o gargalo, o script não converte a lista de JSON: confere o status e o formato e mede o tamanho.

## Próximo passo: triagem das falhas com IA

Neste pipeline, as falhas da aplicação já chegam classificadas: são os bugs documentados com `test.fail()` e `@fail`. No dia a dia, porém, a falha que chega é inesperada, e alguém precisa decidir se é defeito do produto, teste instável ou teste quebrado. Para essa etapa eu mantenho um projeto à parte: [triagem-de-falhas-ia](https://github.com/luizhenrisouto/triagem-de-falhas-ia).

Quando um teste falha, um fluxo no n8n envia o erro, o stack, o trecho do teste e o print para um modelo de IA. O modelo classifica a falha, e o fluxo abre ou atualiza uma issue no GitHub sem duplicar. As falhas desse projeto são plantadas de propósito, com gabarito, então o acerto exibido na [página de resultados](https://luizhenrisouto.github.io/triagem-de-falhas-ia/) é medido, não declarado. As [issues abertas pela IA](https://github.com/luizhenrisouto/triagem-de-falhas-ia/issues?q=label%3Atriagem-ia) ficam públicas.

O encaixe aqui seria direto: o fluxo recebe relatório JSON do Playwright ou JUnit XML, e os jobs `api` e `e2e` deste pipeline já geram os dois (`reports/json/results.json` e `reports/junit/results.xml`). Bastaria um passo a mais no workflow, rodando só quando houver falha inesperada, com a chave do modelo guardada como segredo do repositório.

Não liguei a triagem nesta avaliação, por dois motivos: o enunciado não pede isso, e ela exigiria segredos e um n8n rodando só para triar falhas que hoje não existem.

## Uso de IA

Projeto desenvolvido com apoio de IA (Claude Code), da mesma forma que trabalho no dia a dia: eu defino a estratégia, os cenários e os critérios, a IA acelera a escrita, e todo o código passa por revisão, lint, typecheck e execução repetida antes de entrar.
