// API mock com as rotas principais do Restful-Booker, em memória e sem dependências.
// É o alvo do teste de carga: roda local e no CI, sem sobrecarregar um serviço de terceiros.
// Uso: node load/mock-api/server.mjs   (porta pela variável PORT, padrão 3333)
import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';

const port = Number(process.env.PORT ?? 3333);
const pageSize = Number(process.env.PAGINA_TAMANHO ?? 0);
const bookings = new Map();
const tokens = new Set();
let nextId = 1;

// Massa inicial, como a API real, que já começa com reservas cadastradas.
for (let i = 0; i < 50; i++) {
  bookings.set(nextId++, {
    firstname: 'Seed',
    lastname: `Reserva-${i}`,
    totalprice: 100 + i,
    depositpaid: i % 2 === 0,
    bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
    additionalneeds: 'Breakfast',
  });
}

const json = (res, status, body) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
};

const readBody = (req) =>
  new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      try {
        resolve(JSON.parse(data || 'null'));
      } catch {
        resolve(undefined);
      }
    });
  });

const isValidBooking = (b) =>
  b &&
  typeof b.firstname === 'string' &&
  typeof b.lastname === 'string' &&
  typeof b.totalprice === 'number' &&
  typeof b.depositpaid === 'boolean' &&
  typeof b.bookingdates?.checkin === 'string' &&
  typeof b.bookingdates?.checkout === 'string';

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const idMatch = /^\/booking\/(\d+)$/.exec(url.pathname);

  if (req.method === 'GET' && url.pathname === '/ping') return json(res, 200, { status: 'ok' });

  if (req.method === 'POST' && url.pathname === '/auth') {
    const body = await readBody(req);
    if (body?.username === 'admin' && body?.password === 'password123') {
      const token = randomUUID().replace(/-/g, '').slice(0, 15);
      tokens.add(token);
      return json(res, 200, { token });
    }
    return json(res, 401, { reason: 'Bad credentials' });
  }

  // Como na API real, a listagem devolve todas as reservas, sem paginação (é o gargalo achado no
  // teste de carga). Com PAGINA_TAMANHO definido, o mock pagina (?page=1, 2...): é a correção
  // proposta, usada para confirmar a causa do gargalo.
  if (req.method === 'GET' && url.pathname === '/booking') {
    const lastname = url.searchParams.get('lastname');
    const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
    const first = pageSize ? (page - 1) * pageSize : 0;
    const last = pageSize ? page * pageSize : Infinity;
    const ids = [];
    let matched = 0;
    for (const [bookingid, b] of bookings) {
      if (lastname && b.lastname !== lastname) continue;
      if (matched >= first) ids.push({ bookingid });
      // Paginado, para de percorrer assim que a página fica completa.
      if (++matched >= last) break;
    }
    return json(res, 200, ids);
  }

  if (req.method === 'GET' && idMatch) {
    const booking = bookings.get(Number(idMatch[1]));
    return booking ? json(res, 200, booking) : json(res, 404, { reason: 'Not found' });
  }

  if (req.method === 'POST' && url.pathname === '/booking') {
    const body = await readBody(req);
    if (!isValidBooking(body)) return json(res, 400, { reason: 'Invalid booking' });
    const bookingid = nextId++;
    bookings.set(bookingid, body);
    return json(res, 200, { bookingid, booking: body });
  }

  if (req.method === 'DELETE' && idMatch) {
    const token = /token=([^;]+)/.exec(req.headers.cookie ?? '')?.[1];
    if (!token || !tokens.has(token)) return json(res, 403, { reason: 'Forbidden' });
    return bookings.delete(Number(idMatch[1])) ? json(res, 200, { deleted: true }) : json(res, 404, { reason: 'Not found' });
  }

  json(res, 404, { reason: 'Not found' });
});

server.keepAliveTimeout = 65_000;
server.listen(port, () => console.log(`Mock API em http://localhost:${port}`));

const stop = () => {
  console.log(`Encerrando o mock com ${bookings.size} reservas em memória`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2_000).unref();
};
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
