import type { APIRequestContext, APIResponse } from '@playwright/test';
import type { Booking } from '../models/booking';

type Auth = { token?: string };

/**
 * Cliente da API de reservas. Concentra rotas, headers e autenticação para que
 * os testes descrevam só o comportamento esperado.
 * O payload é `unknown` de propósito: os testes negativos precisam mandar dados inválidos.
 */
export class BookingClient {
  constructor(private readonly request: APIRequestContext) {}

  async createToken(username: string, password: string): Promise<APIResponse> {
    return this.request.post('/auth', { data: { username, password } });
  }

  async list(filters: Record<string, string> = {}): Promise<APIResponse> {
    return this.request.get('/booking', { params: filters });
  }

  async get(id: number | string): Promise<APIResponse> {
    return this.request.get(`/booking/${id}`);
  }

  async create(payload: unknown): Promise<APIResponse> {
    return this.request.post('/booking', { data: payload });
  }

  /** Envia o corpo cru, sem serializar: usado para testar JSON malformado. */
  async createRaw(body: string, contentType = 'application/json'): Promise<APIResponse> {
    return this.request.post('/booking', { data: body, headers: { 'Content-Type': contentType } });
  }

  async update(id: number | string, payload: unknown, auth: Auth = {}): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, { data: payload, headers: this.authHeaders(auth) });
  }

  async updateRaw(id: number | string, body: string, auth: Auth = {}): Promise<APIResponse> {
    return this.request.put(`/booking/${id}`, {
      data: body,
      headers: { 'Content-Type': 'application/json', ...this.authHeaders(auth) },
    });
  }

  async partialUpdate(id: number | string, payload: Partial<Booking>, auth: Auth = {}): Promise<APIResponse> {
    return this.request.patch(`/booking/${id}`, { data: payload, headers: this.authHeaders(auth) });
  }

  async remove(id: number | string, auth: Auth = {}): Promise<APIResponse> {
    return this.request.delete(`/booking/${id}`, { headers: this.authHeaders(auth) });
  }

  /** Chamada genérica para testar métodos que a rota não suporta. */
  async send(method: string, path: string): Promise<APIResponse> {
    return this.request.fetch(path, { method });
  }

  private authHeaders({ token }: Auth): Record<string, string> {
    return token ? { Cookie: `token=${token}` } : {};
  }
}
