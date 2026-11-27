import type { Locator, Page } from '@playwright/test';
import type { ShippingInfo } from '../../data/buyer.factory';

/** Área logada do Sauce Demo: vitrine, carrinho e a primeira etapa do checkout (formulário). */
export class ShopPage {
  readonly title: Locator;
  readonly cartBadge: Locator;
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly postalCode: Locator;
  readonly continueButton: Locator;
  readonly error: Locator;

  constructor(private readonly page: Page) {
    this.title = page.locator('[data-test="title"]');
    this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');
    this.firstName = page.getByPlaceholder('First Name');
    this.lastName = page.getByPlaceholder('Last Name');
    this.postalCode = page.getByPlaceholder('Zip/Postal Code');
    this.continueButton = page.getByRole('button', { name: 'Continue' });
    this.error = page.locator('[data-test="error"]');
  }

  async addToCart(product: string): Promise<void> {
    await this.page
      .locator('[data-test="inventory-item"]')
      .filter({ hasText: product })
      .getByRole('button', { name: 'Add to cart' })
      .click();
  }

  async goToCheckoutForm(): Promise<void> {
    await this.page.locator('[data-test="shopping-cart-link"]').click();
    await this.page.getByRole('button', { name: 'Checkout' }).click();
  }

  async fillCheckoutForm(data: Partial<ShippingInfo>): Promise<void> {
    if (data.firstName !== undefined) await this.firstName.fill(data.firstName);
    if (data.lastName !== undefined) await this.lastName.fill(data.lastName);
    if (data.postalCode !== undefined) await this.postalCode.fill(data.postalCode);
  }
}
