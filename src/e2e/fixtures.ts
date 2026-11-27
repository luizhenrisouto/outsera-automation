import { createBdd, test as base } from 'playwright-bdd';
import { buildBuyer, type Buyer } from './data/buyer.factory';
import { LoginPage } from './pages/saucedemo/login.page';
import { ShopPage } from './pages/saucedemo/shop.page';
import { PlaceOrderModal, type PurchaseOutcome } from './pages/demoblaze/place-order.modal';
import { StorePage } from './pages/demoblaze/store.page';

/** Estado do cenário de compra, compartilhado só entre os steps do mesmo cenário. */
export type OrderState = {
  buyer: Buyer;
  /** Produto -> preço lido na página do produto. */
  products: Map<string, number>;
  outcome?: PurchaseOutcome;
};

type E2eFixtures = {
  loginPage: LoginPage;
  shopPage: ShopPage;
  storePage: StorePage;
  placeOrder: PlaceOrderModal;
  order: OrderState;
};

export const test = base.extend<E2eFixtures>({
  loginPage: async ({ page }, use) => use(new LoginPage(page)),
  shopPage: async ({ page }, use) => use(new ShopPage(page)),
  storePage: async ({ page }, use) => use(new StorePage(page)),
  placeOrder: async ({ page }, use) => use(new PlaceOrderModal(page)),
  // eslint-disable-next-line no-empty-pattern
  order: async ({}, use) => use({ buyer: buildBuyer(), products: new Map() }),
});

export const { Given, When, Then, Before } = createBdd(test);
