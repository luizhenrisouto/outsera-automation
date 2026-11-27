import { expect } from '@playwright/test';
import type { DataTable } from 'playwright-bdd';
import type { Buyer } from '../../../src/e2e/data/buyer.factory';
import { Given, Then, When, type OrderState } from '../../../src/e2e/fixtures';
import type { PlaceOrderModal } from '../../../src/e2e/pages/demoblaze/place-order.modal';

const sum = (prices: Iterable<number>) => [...prices].reduce((a, b) => a + b, 0);

Given('que estou na loja Demoblaze', async ({ storePage }) => {
  await storePage.open();
});

Given('adicionei ao carrinho os produtos:', async ({ storePage, order }, table: DataTable) => {
  for (const { produto } of table.hashes()) {
    order.products.set(produto, await storePage.addProduct(produto));
  }
});

Given('abri o carrinho', async ({ storePage, order }) => {
  await storePage.openCart();
  // O carrinho carrega por AJAX: só segue quando todas as linhas e o total chegaram.
  await expect(storePage.cartRows).toHaveCount(order.products.size);
  await expect(storePage.cartTotal).toHaveText(String(sum(order.products.values())));
});

When('finalizo o pedido com dados de pagamento e entrega válidos', async ({ placeOrder, order }) => {
  await submitOrder(placeOrder, order, order.buyer);
});

When('finalizo o pedido sem nome e sem número de cartão', async ({ placeOrder, order }) => {
  await submitOrder(placeOrder, order, { ...order.buyer, name: '', card: '' });
});

When('finalizo o pedido com o número de cartão {string}', async ({ placeOrder, order }, card: string) => {
  await submitOrder(placeOrder, order, { ...order.buyer, card });
});

When('finalizo o pedido sem país e sem cidade de entrega', async ({ placeOrder, order }) => {
  await submitOrder(placeOrder, order, { ...order.buyer, country: '', city: '' });
});

Then('o carrinho lista cada produto com o preço da página dele', async ({ storePage, order }) => {
  for (const [product, price] of order.products) {
    await expect(storePage.cartRow(product)).toContainText(String(price));
  }
});

Then('o total do carrinho é a soma dos preços', async ({ storePage, order }) => {
  await expect(storePage.cartTotal).toHaveText(String(sum(order.products.values())));
});

Then('vejo a confirmação {string}', async ({ placeOrder }, title: string) => {
  await expect(placeOrder.confirmation.getByRole('heading', { name: title })).toBeVisible();
});

Then(
  'o comprovante mostra o número do pedido, o valor total, o cartão e o nome do comprador',
  async ({ placeOrder, order }) => {
    const receipt = await placeOrder.receipt();
    expect(receipt.id).toMatch(/^\d+$/);
    expect(receipt.amount).toBe(sum(order.products.values()));
    expect(receipt.card).toBe(order.buyer.card);
    expect(receipt.name).toBe(order.buyer.name);
  },
);

Then('o comprovante mostra a data de hoje', async ({ placeOrder }) => {
  const today = new Date();
  const receipt = await placeOrder.receipt();
  expect(receipt.date.split('/').map(Number), `data no comprovante: ${receipt.date}`).toEqual([
    today.getDate(),
    today.getMonth() + 1,
    today.getFullYear(),
  ]);
});

Then('o pedido é recusado com o aviso {string}', async ({ placeOrder, order }, message: string) => {
  expect(order.outcome, 'a loja deveria recusar o pedido com um aviso').toEqual({ kind: 'alert', message });
  await expect(placeOrder.confirmation).toBeHidden();
  await expect(placeOrder.dialog).toBeVisible();
});

Then('o pedido é recusado com um aviso ao comprador', async ({ placeOrder, order }) => {
  expect(order.outcome?.kind, 'a loja concluiu o pedido em vez de recusar os dados').toBe('alert');
  await expect(placeOrder.confirmation).toBeHidden();
});

async function submitOrder(placeOrder: PlaceOrderModal, order: OrderState, buyer: Buyer): Promise<void> {
  await placeOrder.open();
  await expect(placeOrder.dialog).toBeVisible();
  await placeOrder.fill(buyer);
  order.buyer = buyer;
  order.outcome = await placeOrder.submit();
}
