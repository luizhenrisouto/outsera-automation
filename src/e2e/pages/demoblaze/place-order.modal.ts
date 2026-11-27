import type { Locator, Page } from '@playwright/test';
import type { Buyer } from '../../data/buyer.factory';

export type PurchaseReceipt = { id: string; amount: number; card: string; name: string; date: string };
export type PurchaseOutcome = { kind: 'alert'; message: string } | { kind: 'confirmation' };

/**
 * Modal "Place order" e o comprovante da compra.
 * Os rótulos do modal estão ligados ao campo errado no HTML do site (o rótulo "Total" aponta para o
 * campo Name) e não há data-test, então os campos são achados pelo id, dentro do diálogo achado pelo papel.
 */
export class PlaceOrderModal {
  readonly dialog: Locator;
  readonly confirmation: Locator;

  constructor(private readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: 'Place order' });
    this.confirmation = page.locator('.sweet-alert');
  }

  async open(): Promise<void> {
    await this.page.getByRole('button', { name: 'Place Order' }).click();
  }

  async fill(buyer: Partial<Buyer>): Promise<void> {
    for (const field of ['name', 'country', 'city', 'card', 'month', 'year'] as const) {
      const value = buyer[field];
      if (value !== undefined) await this.dialog.locator(`#${field}`).fill(value);
    }
  }

  async purchase(): Promise<void> {
    await this.dialog.getByRole('button', { name: 'Purchase' }).click();
  }

  /**
   * Clica em Purchase e espera o desfecho: o alert nativo de validação ou o comprovante.
   * Esperar pelos dois evita falso positivo: um "não apareceu o comprovante" checado cedo demais
   * passaria antes de a loja responder.
   */
  async submit(): Promise<PurchaseOutcome> {
    const alert = this.page.waitForEvent('dialog').then(async (dialog): Promise<PurchaseOutcome> => {
      const message = dialog.message();
      await dialog.accept();
      return { kind: 'alert', message };
    });
    const confirmed = this.confirmation
      .waitFor({ state: 'visible' })
      .then((): PurchaseOutcome => ({ kind: 'confirmation' }));
    // A espera que perder a corrida é rejeitada quando a página fecha; sem isso viraria erro solto.
    alert.catch(() => undefined);
    confirmed.catch(() => undefined);

    await this.purchase();
    return Promise.race([alert, confirmed]);
  }

  /** Lê o comprovante exibido após a compra (Id, Amount, Card Number, Name, Date). */
  async receipt(): Promise<PurchaseReceipt> {
    const text = await this.confirmation.locator('p').innerText();
    const field = (label: string) => new RegExp(`${label}: (.*)`).exec(text)?.[1]?.trim() ?? '';
    return {
      id: field('Id'),
      amount: Number(field('Amount').replace(/\D+/g, '')),
      card: field('Card Number'),
      name: field('Name'),
      date: field('Date'),
    };
  }
}
