import { randomUUID } from 'node:crypto';

export type Credentials = { username: string; password: string };

/** Senha pública do Sauce Demo, documentada na própria tela de login. */
const password = process.env.SAUCEDEMO_PASSWORD ?? 'secret_sauce';
const validUser = process.env.SAUCEDEMO_USER ?? 'standard_user';

/**
 * Perfis de acesso usados nas features. A feature fala em perfis ("válido", "bloqueado"),
 * e só este arquivo sabe quais credenciais cada perfil usa.
 */
export function userByProfile(profile: string): Credentials {
  switch (profile) {
    case 'válido':
      return { username: validUser, password };
    case 'bloqueado':
      return { username: 'locked_out_user', password };
    case 'com senha incorreta':
      return { username: validUser, password: `errada-${randomUUID().slice(0, 6)}` };
    case 'inexistente':
      return { username: `inexistente-${randomUUID().slice(0, 8)}`, password };
    case 'sem usuário':
      return { username: '', password };
    case 'sem senha':
      return { username: validUser, password: '' };
    default:
      throw new Error(`Perfil de usuário desconhecido: "${profile}"`);
  }
}
