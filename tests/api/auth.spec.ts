import { credentials, responseInfo, expect, expectJson, test } from '../../src/api/fixtures';
import { authTokenSchema } from '../../src/api/models/booking';

test.describe('POST /auth', () => {
  test('gera token com credenciais válidas', { tag: '@positivo' }, async ({ bookingApi }) => {
    const response = await bookingApi.createToken(credentials.username, credentials.password);

    const body = await expectJson(response, 200, authTokenSchema);
    expect(body.token).toMatch(/^\w+$/);
  });

  test('não emite token com senha incorreta', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.createToken(credentials.username, 'senha-errada');

    const body = (await response.json()) as Record<string, unknown>;
    expect(body, await responseInfo(response)).not.toHaveProperty('token');
    expect(body.reason).toBe('Bad credentials');
  });

  test('não emite token para usuário inexistente', { tag: '@negativo' }, async ({ bookingApi }) => {
    const response = await bookingApi.createToken('usuario-inexistente', credentials.password);

    const body = (await response.json()) as Record<string, unknown>;
    expect(body).not.toHaveProperty('token');
    expect(body.reason).toBe('Bad credentials');
  });

  test(
    'responde 401 para credenciais inválidas',
    {
      tag: ['@negativo', '@bug'],
      annotation: {
        type: 'bug',
        description: 'A API responde 200 com {"reason":"Bad credentials"}; o esperado para falha de autenticação é 401.',
      },
    },
    async ({ bookingApi }) => {
      test.fail();
      const response = await bookingApi.createToken(credentials.username, 'senha-errada');
      expect(response.status()).toBe(401);
    },
  );
});
