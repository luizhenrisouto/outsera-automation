import { expect, type Locator, type Page } from '@playwright/test';
import { e2eConfig } from '../../config';

/**
 * Vitrine, página de produto e carrinho do Demoblaze.
 * O site avisa "Product added" com um alert nativo: o page object aceita o alert e confere a mensagem.
 */
export class StorePage {
  readonly cartRows: Locator;
  readonly cartTotal: Locator;

  constructor(private readonly page: Page) {
    this.cartRows = page.locator('#tbodyid tr');
    this.cartTotal = page.locator('#totalp');
  }

  async open(): Promise<void> {
    await this.page.goto(e2eConfig.demoblazeUrl);
  }

  /** Abre o produto pela vitrine, adiciona ao carrinho e devolve o preço exibido na página dele. */
  async addProduct(name: string): Promise<number> {
    await this.page.getByRole('link', { name: 'Home' }).first().click();
    await this.page.getByRole('link', { name, exact: true }).click();
    await expect(this.page.getByRole('heading', { name, exact: true })).toBeVisible();
    const priceText = await this.page.locator('.price-container').innerText();

    const dialog = this.page.waitForEvent('dialog');
    await this.page.getByRole('link', { name: 'Add to cart' }).click();
    const alert = await dialog;
    const message = alert.message();
    await alert.accept();
    expect(message, 'alerta de confirmação ao adicionar o produto').toBe('Product added');

    return Number(priceText.replace(/\D+/g, ''));
  }

  async openCart(): Promise<void> {
    await this.page.getByRole('link', { name: 'Cart', exact: true }).click();
  }

  cartRow(product: string): Locator {
    return this.cartRows.filter({ hasText: product });
  }
}
