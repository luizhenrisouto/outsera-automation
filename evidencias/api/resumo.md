# Resumo da execução

- Início: 2026-11-27T15:24:14.692Z
- Duração: 6.4 s
- Cenários: 33 (10 positivos, 23 negativos)
- Passaram: 26
- Bugs confirmados da aplicação: 7
- Falhas inesperadas: 0
- Instáveis: 0

| Projeto | Cenário | Tipo | Situação | Tempo (ms) |
|---|---|---|---|---|
| api | POST /auth › gera token com credenciais válidas | Positivo | Passou | 532 |
| api | POST /auth › não emite token com senha incorreta | Negativo | Passou | 515 |
| api | POST /auth › não emite token para usuário inexistente | Negativo | Passou | 549 |
| api | POST /auth › responde 401 para credenciais inválidas | Negativo | Bug confirmado (falha esperada) | 498 |
| api | DELETE /booking/:id › apaga a reserva com token | Positivo | Passou | 1089 |
| api | DELETE /booking/:id › responde 403 sem token e mantém a reserva | Negativo | Passou | 1091 |
| api | DELETE /booking/:id › responde 403 com token inválido | Negativo | Passou | 845 |
| api | DELETE /booking/:id › responde 200 ou 204 ao apagar | Positivo | Bug confirmado (falha esperada) | 848 |
| api | DELETE /booking/:id › responde 404 ao apagar reserva já apagada | Negativo | Bug confirmado (falha esperada) | 995 |
| api | GET /booking › lista as reservas com o contrato esperado | Positivo | Passou | 1005 |
| api | GET /booking › filtra por nome e sobrenome | Positivo | Passou | 873 |
| api | GET /booking › filtro sem resultado devolve lista vazia | Negativo | Passou | 444 |
| api | GET /booking/:id › devolve a reserva pelo id | Positivo | Passou | 904 |
| api | GET /booking/:id › responde 404 para id inexistente | Negativo | Passou | 465 |
| api | GET /booking/:id › responde 404 para id não numérico | Negativo | Passou | 450 |
| api | POST /booking › cria a reserva e a persiste | Positivo | Passou | 901 |
| api | POST /booking › cria a reserva sem o campo opcional additionalneeds | Positivo | Passou | 750 |
| api | POST /booking › rejeita JSON malformado com 400 | Negativo | Passou | 432 |
| api | POST /booking › rejeita reserva sem campo obrigatório com 400 | Negativo | Bug confirmado (falha esperada) | 451 |
| api | POST /booking › rejeita tipo inválido em totalprice com 400 | Negativo | Bug confirmado (falha esperada) | 451 |
| api | POST /booking › rejeita corpo vazio com 400 | Negativo | Bug confirmado (falha esperada) | 441 |
| api | Métodos não suportados em /booking › OPTIONS anuncia apenas GET, HEAD e POST | Negativo | Passou | 441 |
| api | Métodos não suportados em /booking › PUT na coleção não é aceito | Negativo | Passou | 443 |
| api | Métodos não suportados em /booking › PATCH na coleção não é aceito | Negativo | Passou | 432 |
| api | Métodos não suportados em /booking › DELETE na coleção não é aceito | Negativo | Passou | 440 |
| api | PUT /booking/:id › atualiza a reserva inteira com token | Positivo | Passou | 1011 |
| api | PUT /booking/:id › responde 403 sem token | Negativo | Passou | 863 |
| api | PUT /booking/:id › responde 403 com token inválido e não altera a reserva | Negativo | Passou | 999 |
| api | PUT /booking/:id › rejeita payload incompleto com 400 | Negativo | Passou | 868 |
| api | PUT /booking/:id › rejeita JSON malformado com 400 | Negativo | Passou | 832 |
| api | PUT /booking/:id › responde 404 ao atualizar reserva inexistente | Negativo | Bug confirmado (falha esperada) | 569 |
| api | PATCH /booking/:id › altera só os campos enviados | Positivo | Passou | 841 |
| api | PATCH /booking/:id › responde 403 sem token | Negativo | Passou | 853 |

## Bugs encontrados na aplicação

- **POST /auth › responde 401 para credenciais inválidas**: A API responde 200 com {"reason":"Bad credentials"}; o esperado para falha de autenticação é 401.
- **DELETE /booking/:id › responde 200 ou 204 ao apagar**: A API responde 201 Created ao apagar; o esperado é 200 ou 204.
- **DELETE /booking/:id › responde 404 ao apagar reserva já apagada**: A segunda exclusão responde 405; o esperado é 404.
- **POST /booking › rejeita reserva sem campo obrigatório com 400**: Sem "firstname", a API responde 500 (erro interno); o esperado é 400 com a validação do campo.
- **POST /booking › rejeita tipo inválido em totalprice com 400**: Com totalprice "abc", a API grava a reserva com totalprice null e responde 200.
- **POST /booking › rejeita corpo vazio com 400**: Com corpo vazio, a API responde 500; o esperado é 400.
- **PUT /booking/:id › responde 404 ao atualizar reserva inexistente**: A API responde 405 (Method Not Allowed) para um id que não existe; o esperado é 404.
