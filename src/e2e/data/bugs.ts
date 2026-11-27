/**
 * Defeitos conhecidos das aplicações de demonstração. O cenário recebe a tag @bug:<id> (e @fail),
 * e o hook em tests/e2e/steps/hooks.ts grava a descrição como anotação "bug" no relatório.
 */
export const knownBugs: Record<string, string> = {
  'DB-01': 'Demoblaze conclui a compra com cartão contendo letras; o esperado é recusar o número.',
  'DB-02': 'Demoblaze conclui a compra com cartão de 4 dígitos; o esperado é recusar o número.',
  'DB-03': 'Demoblaze conclui a compra sem país e cidade de entrega; o esperado é exigir o endereço.',
  'DB-04': 'O comprovante da compra mostra o mês anterior ao atual (mês do JavaScript contado a partir de 0).',
};
