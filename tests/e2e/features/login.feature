# language: pt
@login
Funcionalidade: Login e navegação até o formulário de checkout (Sauce Demo)
  Como cliente da loja
  Quero entrar com o meu usuário
  Para chegar ao formulário com os meus dados de compra

  Contexto:
    Dado que estou na página de login

  @positivo
  Cenário: Login com usuário válido abre a vitrine de produtos
    Quando faço login com o usuário "válido"
    Então vejo a página "Products"
    E o endereço da página termina em "/inventory.html"

  @positivo
  Cenário: Usuário logado navega até o formulário de checkout
    E que fiz login com o usuário "válido"
    Quando adiciono o produto "Sauce Labs Backpack" ao carrinho
    E sigo do carrinho para o checkout
    Então vejo a página "Checkout: Your Information"
    E o endereço da página termina em "/checkout-step-one.html"
    E o formulário de dados do comprador está pronto para preenchimento

  @positivo
  Cenário: Formulário de checkout preenchido avança para a revisão do pedido
    E que fiz login e estou no formulário de checkout
    Quando preencho o formulário com dados válidos e continuo
    Então vejo a página "Checkout: Overview"

  @negativo
  Esquema do Cenário: Login recusado para usuário <perfil>
    Quando faço login com o usuário "<perfil>"
    Então vejo a mensagem de erro "<mensagem>"
    E continuo na página de login

    Exemplos:
      | perfil              | mensagem                                                                  |
      | com senha incorreta | Epic sadface: Username and password do not match any user in this service |
      | inexistente         | Epic sadface: Username and password do not match any user in this service |
      | bloqueado           | Epic sadface: Sorry, this user has been locked out.                       |
      | sem usuário         | Epic sadface: Username is required                                        |
      | sem senha           | Epic sadface: Password is required                                        |

  @negativo
  Cenário: Página interna não abre sem login
    Quando acesso a vitrine direto pelo endereço "/inventory.html"
    Então vejo a mensagem de erro "Epic sadface: You can only access '/inventory.html' when you are logged in."
    E continuo na página de login

  @negativo
  Esquema do Cenário: Formulário de checkout sem o campo obrigatório <campo>
    E que fiz login e estou no formulário de checkout
    Quando envio o formulário sem o campo "<campo>"
    Então vejo a mensagem de erro "Error: <campo> is required"
    E continuo no formulário de checkout

    Exemplos:
      | campo       |
      | First Name  |
      | Last Name   |
      | Postal Code |
