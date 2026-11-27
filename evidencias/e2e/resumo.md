# Resumo da execução

- Início: 2026-11-27T15:44:27.765Z
- Duração: 29.7 s
- Cenários: 19 (6 positivos, 13 negativos)
- Passaram: 15
- Bugs confirmados da aplicação: 4
- Falhas inesperadas: 0
- Instáveis: 0

| Projeto | Cenário | Tipo | Situação | Tempo (ms) |
|---|---|---|---|---|
| e2e | Checkout no e-commerce Demoblaze › Carrinho lista os produtos adicionados e soma o total | Positivo | Passou | 13098 |
| e2e | Checkout no e-commerce Demoblaze › Compra completa com dados válidos | Positivo | Passou | 12576 |
| e2e | Checkout no e-commerce Demoblaze › Compra sem nome e sem cartão é recusada | Negativo | Passou | 13134 |
| e2e | Checkout no e-commerce Demoblaze › Compra com número de cartão contendo letras é recusada | Negativo | Bug confirmado (falha esperada) | 14300 |
| e2e | Checkout no e-commerce Demoblaze › Compra com número de cartão curto demais é recusada | Negativo | Bug confirmado (falha esperada) | 14952 |
| e2e | Checkout no e-commerce Demoblaze › Compra com endereço de entrega incompleto é recusada | Negativo | Bug confirmado (falha esperada) | 14553 |
| e2e | Checkout no e-commerce Demoblaze › Comprovante mostra a data do dia da compra | Positivo | Bug confirmado (falha esperada) | 14907 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Login com usuário válido abre a vitrine de produtos | Positivo | Passou | 3164 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Usuário logado navega até o formulário de checkout | Positivo | Passou | 3341 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Formulário de checkout preenchido avança para a revisão do pedido | Positivo | Passou | 2306 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Página interna não abre sem login | Negativo | Passou | 2095 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Login recusado para usuário <perfil> › Login recusado para usuário com senha incorreta | Negativo | Passou | 1766 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Login recusado para usuário <perfil> › Login recusado para usuário inexistente | Negativo | Passou | 1823 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Login recusado para usuário <perfil> › Login recusado para usuário bloqueado | Negativo | Passou | 2445 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Login recusado para usuário <perfil> › Login recusado para usuário sem usuário | Negativo | Passou | 2136 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Login recusado para usuário <perfil> › Login recusado para usuário sem senha | Negativo | Passou | 1906 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Formulário de checkout sem o campo obrigatório <campo> › Formulário de checkout sem o campo obrigatório First Name | Negativo | Passou | 2314 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Formulário de checkout sem o campo obrigatório <campo> › Formulário de checkout sem o campo obrigatório Last Name | Negativo | Passou | 1864 |
| e2e | Login e navegação até o formulário de checkout (Sauce Demo) › Formulário de checkout sem o campo obrigatório <campo> › Formulário de checkout sem o campo obrigatório Postal Code | Negativo | Passou | 1858 |

## Bugs encontrados na aplicação

- **Checkout no e-commerce Demoblaze › Compra com número de cartão contendo letras é recusada**: DB-01: Demoblaze conclui a compra com cartão contendo letras; o esperado é recusar o número.
- **Checkout no e-commerce Demoblaze › Compra com número de cartão curto demais é recusada**: DB-02: Demoblaze conclui a compra com cartão de 4 dígitos; o esperado é recusar o número.
- **Checkout no e-commerce Demoblaze › Compra com endereço de entrega incompleto é recusada**: DB-03: Demoblaze conclui a compra sem país e cidade de entrega; o esperado é exigir o endereço.
- **Checkout no e-commerce Demoblaze › Comprovante mostra a data do dia da compra**: DB-04: O comprovante da compra mostra o mês anterior ao atual (mês do JavaScript contado a partir de 0).
