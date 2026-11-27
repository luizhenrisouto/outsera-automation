# language: pt
@checkout
Funcionalidade: Checkout no e-commerce Demoblaze
  Como cliente da loja
  Quero colocar produtos no carrinho e pagar com cartão
  Para receber a minha compra no endereço informado

  Contexto:
    Dado que estou na loja Demoblaze
    E adicionei ao carrinho os produtos:
      | produto           |
      | Samsung galaxy s6 |
      | Nokia lumia 1520  |
    E abri o carrinho

  @positivo
  Cenário: Carrinho lista os produtos adicionados e soma o total
    Então o carrinho lista cada produto com o preço da página dele
    E o total do carrinho é a soma dos preços

  @positivo
  Cenário: Compra completa com dados válidos
    Quando finalizo o pedido com dados de pagamento e entrega válidos
    Então vejo a confirmação "Thank you for your purchase!"
    E o comprovante mostra o número do pedido, o valor total, o cartão e o nome do comprador

  @negativo
  Cenário: Compra sem nome e sem cartão é recusada
    Quando finalizo o pedido sem nome e sem número de cartão
    Então o pedido é recusado com o aviso "Please fill out Name and Creditcard."

  @negativo @bug:DB-01 @fail
  Cenário: Compra com número de cartão contendo letras é recusada
    Quando finalizo o pedido com o número de cartão "abcd efgh ijkl mnop"
    Então o pedido é recusado com um aviso ao comprador

  @negativo @bug:DB-02 @fail
  Cenário: Compra com número de cartão curto demais é recusada
    Quando finalizo o pedido com o número de cartão "4111"
    Então o pedido é recusado com um aviso ao comprador

  @negativo @bug:DB-03 @fail
  Cenário: Compra com endereço de entrega incompleto é recusada
    Quando finalizo o pedido sem país e sem cidade de entrega
    Então o pedido é recusado com um aviso ao comprador

  @positivo @bug:DB-04 @fail
  Cenário: Comprovante mostra a data do dia da compra
    Quando finalizo o pedido com dados de pagamento e entrega válidos
    Então o comprovante mostra a data de hoje
