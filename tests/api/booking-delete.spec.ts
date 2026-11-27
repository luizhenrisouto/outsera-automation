import { responseInfo, expect, expectJson, test } from '../../src/api/fixtures';
import { bookingSchema } from '../../src/api/models/booking';

test.describe('DELETE /booking/:id', () => {
  test('apaga a reserva com token', { tag: '@positivo' }, async ({ bookingApi, token, existingBooking }) => {
    const response = await bookingApi.remove(existingBooking.bookingid, { token });

    expect(response.ok(), await responseInfo(response)).toBe(true);
    expect(response.headers()['content-type']).toContain('text/plain');
    expect((await bookingApi.get(existingBooking.bookingid)).status()).toBe(404);
  });

  test('responde 403 sem token e mantém a reserva', { tag: '@negativo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.remove(existingBooking.bookingid);

    expect(response.status(), await responseInfo(response)).toBe(403);
    await expectJson(await bookingApi.get(existingBooking.bookingid), 200, bookingSchema);
  });

  test('responde 403 com token inválido', { tag: '@negativo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.remove(existingBooking.bookingid, { token: 'token-invalido' });

    expect(response.status(), await responseInfo(response)).toBe(403);
  });

  test(
    'responde 200 ou 204 ao apagar',
    {
      tag: ['@positivo', '@bug'],
      annotation: { type: 'bug', description: 'A API responde 201 Created ao apagar; o esperado é 200 ou 204.' },
    },
    async ({ bookingApi, token, existingBooking }) => {
      test.fail();

      const response = await bookingApi.remove(existingBooking.bookingid, { token });

      expect([200, 204]).toContain(response.status());
    },
  );

  test(
    'responde 404 ao apagar reserva já apagada',
    {
      tag: ['@negativo', '@bug'],
      annotation: { type: 'bug', description: 'A segunda exclusão responde 405; o esperado é 404.' },
    },
    async ({ bookingApi, token, existingBooking }) => {
      test.fail();
      await bookingApi.remove(existingBooking.bookingid, { token });

      const response = await bookingApi.remove(existingBooking.bookingid, { token });

      expect(response.status(), await responseInfo(response)).toBe(404);
    },
  );
});
