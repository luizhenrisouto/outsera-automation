import { expect } from '@playwright/test';
import { e2eConfig } from '../../../src/e2e/config';
import { buildShippingInfo, type ShippingInfo } from '../../../src/e2e/data/buyer.factory';
import { userByProfile } from '../../../src/e2e/data/users';
import { Given, Then, When } from '../../../src/e2e/fixtures';

const checkoutFields: Record<string, keyof ShippingInfo> = {
  'First Name': 'firstName',
  'Last Name': 'lastName',
  'Postal Code': 'postalCode',
};

Given('que estou na página de login', async ({ loginPage }) => {
  await loginPage.open();
  await expect(loginPage.submit).toBeVisible();
});

Given('que fiz login com o usuário {string}', async ({ loginPage, shopPage }, profile: string) => {
  await loginPage.login(userByProfile(profile));
  await expect(shopPage.title).toHaveText('Products');
});

Given('que fiz login e estou no formulário de checkout', async ({ loginPage, shopPage }) => {
  await loginPage.login(userByProfile('válido'));
  await shopPage.addToCart('Sauce Labs Backpack');
  await shopPage.goToCheckoutForm();
  await expect(shopPage.title).toHaveText('Checkout: Your Information');
});

When('faço login com o usuário {string}', async ({ loginPage }, profile: string) => {
  await loginPage.login(userByProfile(profile));
});

When('acesso a vitrine direto pelo endereço {string}', async ({ page }, path: string) => {
  await page.goto(new URL(path, e2eConfig.saucedemoUrl).toString());
});

When('adiciono o produto {string} ao carrinho', async ({ shopPage }, product: string) => {
  await shopPage.addToCart(product);
  await expect(shopPage.cartBadge).toHaveText('1');
});

When('sigo do carrinho para o checkout', async ({ shopPage }) => {
  await shopPage.goToCheckoutForm();
});

When('preencho o formulário com dados válidos e continuo', async ({ shopPage }) => {
  await shopPage.fillCheckoutForm(buildShippingInfo());
  await shopPage.continueButton.click();
});

When('envio o formulário sem o campo {string}', async ({ shopPage }, field: string) => {
  const key = checkoutFields[field];
  if (!key) throw new Error(`Campo desconhecido no formulário de checkout: "${field}"`);
  await shopPage.fillCheckoutForm({ ...buildShippingInfo(), [key]: '' });
  await shopPage.continueButton.click();
});

Then('vejo a página {string}', async ({ shopPage }, title: string) => {
  await expect(shopPage.title).toHaveText(title);
});

Then('o endereço da página termina em {string}', async ({ page }, path: string) => {
  await expect(page).toHaveURL(new URL(path, e2eConfig.saucedemoUrl).toString());
});

Then('o formulário de dados do comprador está pronto para preenchimento', async ({ shopPage }) => {
  for (const field of [shopPage.firstName, shopPage.lastName, shopPage.postalCode]) {
    await expect(field).toBeEditable();
    await expect(field).toBeEmpty();
  }
  await expect(shopPage.continueButton).toBeEnabled();
});

Then('vejo a mensagem de erro {string}', async ({ page }, message: string) => {
  await expect(page.locator('[data-test="error"]')).toHaveText(message);
});

Then('continuo na página de login', async ({ page, loginPage }) => {
  await expect(page).toHaveURL(e2eConfig.saucedemoUrl);
  await expect(loginPage.submit).toBeVisible();
});

Then('continuo no formulário de checkout', async ({ page, shopPage }) => {
  await expect(page).toHaveURL(/\/checkout-step-one\.html$/);
  await expect(shopPage.title).toHaveText('Checkout: Your Information');
});
