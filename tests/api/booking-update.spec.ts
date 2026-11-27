import { responseInfo, expect, expectJson, test } from '../../src/api/fixtures';
import { buildBooking } from '../../src/api/data/booking.factory';
import { bookingSchema } from '../../src/api/models/booking';

test.describe('PUT /booking/:id', () => {
  test('atualiza a reserva inteira com token', { tag: '@positivo' }, async ({ bookingApi, token, existingBooking }) => {
    const changes = buildBooking({ firstname: 'Bia', totalprice: 999, depositpaid: false, additionalneeds: 'Lunch' });

    const response = await bookingApi.update(existingBooking.bookingid, changes, { token });

    expect(await expectJson(response, 200, bookingSchema)).toEqual(changes);
    const persisted = await expectJson(await bookingApi.get(existingBooking.bookingid), 200, bookingSchema);
    expect(persisted).toEqual(changes);
  });

  test('responde 403 sem token', { tag: '@negativo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.update(existingBooking.bookingid, buildBooking());

    expect(response.status(), await responseInfo(response)).toBe(403);
    expect(await response.text()).toBe('Forbidden');
  });

  test('responde 403 com token inválido e não altera a reserva', { tag: '@negativo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.update(existingBooking.bookingid, buildBooking({ firstname: 'Invasor' }), {
      token: 'token-invalido',
    });

    expect(response.status()).toBe(403);
    const persisted = await expectJson(await bookingApi.get(existingBooking.bookingid), 200, bookingSchema);
    expect(persisted).toEqual(existingBooking.booking);
  });

  test('rejeita payload incompleto com 400', { tag: '@negativo' }, async ({ bookingApi, token, existingBooking }) => {
    const response = await bookingApi.update(existingBooking.bookingid, { firstname: 'Somente nome' }, { token });

    expect(response.status(), await responseInfo(response)).toBe(400);
  });

  test('rejeita JSON malformado com 400', { tag: '@negativo' }, async ({ bookingApi, token, existingBooking }) => {
    const response = await bookingApi.updateRaw(existingBooking.bookingid, '{"firstname":', { token });

    expect(response.status(), await responseInfo(response)).toBe(400);
  });

  test(
    'responde 404 ao atualizar reserva inexistente',
    {
      tag: ['@negativo', '@bug'],
      annotation: { type: 'bug', description: 'A API responde 405 (Method Not Allowed) para um id que não existe; o esperado é 404.' },
    },
    async ({ bookingApi, token }) => {
      test.fail();

      const response = await bookingApi.update(999_999_999, buildBooking(), { token });

      expect(response.status(), await responseInfo(response)).toBe(404);
    },
  );
});

test.describe('PATCH /booking/:id', () => {
  test('altera só os campos enviados', { tag: '@positivo' }, async ({ bookingApi, token, existingBooking }) => {
    const response = await bookingApi.partialUpdate(existingBooking.bookingid, { totalprice: 123 }, { token });

    const body = await expectJson(response, 200, bookingSchema);
    expect(body).toEqual({ ...existingBooking.booking, totalprice: 123 });
  });

  test('responde 403 sem token', { tag: '@negativo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.partialUpdate(existingBooking.bookingid, { totalprice: 1 });

    expect(response.status(), await responseInfo(response)).toBe(403);
  });
});
