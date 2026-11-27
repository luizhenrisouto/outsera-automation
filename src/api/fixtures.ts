import { test as base, expect, type APIResponse } from '@playwright/test';
import type { z } from 'zod';
import { BookingClient } from './clients/booking.client';
import { buildBooking } from './data/booking.factory';
import { authTokenSchema, createdBookingSchema, type CreatedBooking } from './models/booking';

export const credentials = {
  username: process.env.API_USERNAME ?? 'admin',
  password: process.env.API_PASSWORD ?? 'password123',
};

type ApiFixtures = {
  bookingApi: BookingClient;
  /** Token válido, gerado uma vez por teste que o pede. */
  token: string;
  /** Reserva criada antes do teste e apagada depois dele (massa isolada). */
  existingBooking: CreatedBooking;
};

export const test = base.extend<ApiFixtures>({
  bookingApi: async ({ request }, use) => {
    await use(new BookingClient(request));
  },

  token: async ({ bookingApi }, use) => {
    const response = await bookingApi.createToken(credentials.username, credentials.password);
    expect(response.status(), 'falha ao gerar token no setup').toBe(200);
    const { token } = authTokenSchema.parse(await response.json());
    await use(token);
  },

  existingBooking: async ({ bookingApi, token }, use) => {
    const response = await bookingApi.create(buildBooking());
    expect(response.status(), 'falha ao criar a reserva do setup').toBe(200);
    const created = createdBookingSchema.parse(await response.json());

    await use(created);

    // Limpeza: o teste pode já ter apagado a reserva; por isso não falha aqui.
    await bookingApi.remove(created.bookingid, { token });
  },
});

export { expect };

/** Status, Content-Type JSON e corpo válido pelo schema. Devolve o corpo já tipado. */
export async function expectJson<T extends z.ZodType>(
  response: APIResponse,
  status: number,
  schema: T,
): Promise<z.infer<T>> {
  expect(response.status(), await responseInfo(response)).toBe(status);
  expect(response.headers()['content-type']).toContain('application/json');
  const body: unknown = await response.json();
  const parsed = schema.safeParse(body);
  expect(parsed.success, `corpo fora do contrato: ${parsed.success ? '' : parsed.error.message}`).toBe(true);
  return parsed.data as z.infer<T>;
}

/** Mensagem de falha com o corpo da resposta, para o relatório já mostrar a causa. */
export async function responseInfo(response: APIResponse): Promise<string> {
  const text = await response.text().catch(() => '');
  return `${response.url()} -> ${response.status()} ${text.slice(0, 300)}`;
}
