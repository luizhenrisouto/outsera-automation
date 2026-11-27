import { responseInfo, expect, expectJson, test } from '../../src/api/fixtures';
import { bookingIdListSchema, bookingSchema } from '../../src/api/models/booking';

test.describe('GET /booking', () => {
  test('lista as reservas com o contrato esperado', { tag: '@positivo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.list();

    const body = await expectJson(response, 200, bookingIdListSchema);
    expect(body.map((item) => item.bookingid)).toContain(existingBooking.bookingid);
  });

  test('filtra por nome e sobrenome', { tag: '@positivo' }, async ({ bookingApi, existingBooking }) => {
    const { firstname, lastname } = existingBooking.booking;

    const response = await bookingApi.list({ firstname, lastname });

    const body = await expectJson(response, 200, bookingIdListSchema);
    expect(body).toEqual([{ bookingid: existingBooking.bookingid }]);
  });

  test('filtro sem resultado devolve lista vazia', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.list({ firstname: 'Ninguem', lastname: `Inexistente-${Date.now()}` });

    const body = await expectJson(response, 200, bookingIdListSchema);
    expect(body).toEqual([]);
  });
});

test.describe('GET /booking/:id', () => {
  test('devolve a reserva pelo id', { tag: '@positivo' }, async ({ bookingApi, existingBooking }) => {
    const response = await bookingApi.get(existingBooking.bookingid);

    const body = await expectJson(response, 200, bookingSchema);
    expect(body).toEqual(existingBooking.booking);
  });

  test('responde 404 para id inexistente', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.get(999_999_999);

    expect(response.status(), await responseInfo(response)).toBe(404);
  });

  test('responde 404 para id não numérico', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.get('abc');

    expect(response.status(), await responseInfo(response)).toBe(404);
  });
});
