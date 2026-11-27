import { randomUUID } from 'node:crypto';

export type Buyer = {
  name: string;
  country: string;
  city: string;
  card: string;
  month: string;
  year: string;
};

export type ShippingInfo = { firstName: string; lastName: string; postalCode: string };

/** Dados de pagamento e entrega válidos e únicos por chamada (nome com sufixo aleatório). */
export function buildBuyer(overrides: Partial<Buyer> = {}): Buyer {
  return {
    name: `Luiz QA ${randomUUID().slice(0, 8)}`,
    country: 'Brasil',
    city: 'Florianópolis',
    card: '4111111111111111', // cartão de teste Visa, válido no algoritmo de Luhn
    month: '12',
    year: String(new Date().getFullYear() + 1),
    ...overrides,
  };
}

/** Dados da primeira etapa do checkout do Sauce Demo. */
export function buildShippingInfo(): ShippingInfo {
  return { firstName: 'Luiz', lastName: `QA-${randomUUID().slice(0, 6)}`, postalCode: '88000-000' };
}
