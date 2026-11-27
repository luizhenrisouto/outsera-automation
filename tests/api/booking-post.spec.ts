import { responseInfo, expect, expectJson, test } from '../../src/api/fixtures';
import { buildBooking } from '../../src/api/data/booking.factory';
import { bookingSchema, createdBookingSchema } from '../../src/api/models/booking';

test.describe('POST /booking', () => {
  test('cria a reserva e a persiste', { tag: '@positivo' }, async ({ bookingApi, token }) => {
    const payload = buildBooking();

    const response = await bookingApi.create(payload);

    const created = await expectJson(response, 200, createdBookingSchema);
    expect(created.booking).toEqual(payload);

    const persisted = await expectJson(await bookingApi.get(created.bookingid), 200, bookingSchema);
    expect(persisted).toEqual(payload);

    await bookingApi.remove(created.bookingid, { token });
  });

  test('cria a reserva sem o campo opcional additionalneeds', { tag: '@positivo' }, async ({ bookingApi, token }) => {
    const { additionalneeds: _ignorado, ...payload } = buildBooking();

    const response = await bookingApi.create(payload);

    const created = await expectJson(response, 200, createdBookingSchema);
    expect(created.booking).not.toHaveProperty('additionalneeds');

    await bookingApi.remove(created.bookingid, { token });
  });

  test('rejeita JSON malformado com 400', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.createRaw('{"firstname": "Luiz",');

    expect(response.status(), await responseInfo(response)).toBe(400);
  });

  test(
    'rejeita reserva sem campo obrigatório com 400',
    {
      tag: ['@negativo', '@bug'],
      annotation: {
        type: 'bug',
        description: 'Sem "firstname", a API responde 500 (erro interno); o esperado é 400 com a validação do campo.',
      },
    },
    async ({ bookingApi }) => {
      test.fail();
      const { firstname: _ausente, ...payload } = buildBooking();

      const response = await bookingApi.create(payload);

      expect(response.status(), await responseInfo(response)).toBe(400);
    },
  );

  test(
    'rejeita tipo inválido em totalprice com 400',
    {
      tag: ['@negativo', '@bug'],
      annotation: {
        type: 'bug',
        description: 'Com totalprice "abc", a API grava a reserva com totalprice null e responde 200.',
      },
    },
    async ({ bookingApi }) => {
      test.fail();

      const response = await bookingApi.create({ ...buildBooking(), totalprice: 'abc' });

      expect(response.status(), await responseInfo(response)).toBe(400);
    },
  );

  test(
    'rejeita corpo vazio com 400',
    {
      tag: ['@negativo', '@bug'],
      annotation: { type: 'bug', description: 'Com corpo vazio, a API responde 500; o esperado é 400.' },
    },
    async ({ bookingApi }) => {
      test.fail();

      const response = await bookingApi.create({});

      expect(response.status(), await responseInfo(response)).toBe(400);
    },
  );
});

test.describe('Métodos não suportados em /booking', () => {
  test('OPTIONS anuncia apenas GET, HEAD e POST', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.send('OPTIONS', '/booking');

    expect(response.status()).toBe(200);
    const allow = (response.headers()['allow'] ?? '').split(',').map((m) => m.trim());
    expect(allow.sort()).toEqual(['GET', 'HEAD', 'POST']);
  });

  for (const method of ['PUT', 'PATCH', 'DELETE']) {
    test(`${method} na coleção não é aceito`, { tag: '@negativo' }, async ({ bookingApi }) => {
      const response = await bookingApi.send(method, '/booking');

      expect(response.ok(), await responseInfo(response)).toBe(false);
      expect(response.status()).toBe(404);
    });
  }
});
