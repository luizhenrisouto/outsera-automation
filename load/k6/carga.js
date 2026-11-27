// Teste de carga em k6: 500 usuários simultâneos por 5 minutos na API mock (rotas do Restful-Booker).
// Uso direto: k6 run load/k6/carga.js   |   pelo npm: npm run test:load (sobe o mock e gera os relatórios)
// Variáveis: BASE_URL, VUS (padrão 500), DURACAO (padrão 5m), RAMPA (padrão 30s).
import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3333';
const VUS = Number(__ENV.VUS || 500);
const DURACAO = __ENV.DURACAO || '5m';
const RAMPA = __ENV.RAMPA || '30s';

// Métricas de negócio, além das métricas HTTP padrão do k6.
const reservasCriadas = new Counter('reservas_criadas');
const tempoJornada = new Trend('tempo_jornada', true);
// Tamanho da resposta da listagem em KB: a API devolve todas as reservas, sem paginação.
const tamanhoListagem = new Trend('tamanho_listagem_kb');
// Reservas da massa inicial do mock (ids 1 a 50), que nunca são apagadas.
const RESERVAS_SEMENTE = 50;

export const options = {
  scenarios: {
    usuarios_simultaneos: {
      executor: 'ramping-vus',
      startVUs: 0,
      // Rampa curta de subida, 500 usuários sustentados pelo tempo pedido e descida.
      stages: [
        { duration: RAMPA, target: VUS },
        { duration: DURACAO, target: VUS },
        { duration: '15s', target: 0 },
      ],
      gracefulRampDown: '10s',
    },
  },
  // Critérios de aceite: se algum for violado, o k6 termina com código de erro.
  thresholds: {
    http_req_failed: ['rate<0.01'],
    checks: ['rate>0.99'],
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    'http_req_duration{endpoint:POST /auth}': ['p(95)<300'],
    'http_req_duration{endpoint:GET /booking}': ['p(95)<500'],
    'http_req_duration{endpoint:GET /booking/:id}': ['p(95)<300'],
    'http_req_duration{endpoint:POST /booking}': ['p(95)<300'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

const jsonHeaders = { headers: { 'Content-Type': 'application/json', Accept: 'application/json' } };
const endpoint = (name) => ({ ...jsonHeaders, tags: { endpoint: name } });

export function setup() {
  const res = http.get(`${BASE_URL}/ping`);
  if (res.status !== 200) throw new Error(`API fora do ar em ${BASE_URL}: status ${res.status}`);
}

// Cada usuário virtual faz login uma vez e depois repete a jornada: lista, consulta e reserva.
let token;

export default function () {
  const inicio = Date.now();

  if (!token) {
    group('login', () => {
      const res = http.post(
        `${BASE_URL}/auth`,
        JSON.stringify({ username: 'admin', password: 'password123' }),
        endpoint('POST /auth'),
      );
      check(res, { 'login: status 200': (r) => r.status === 200, 'login: devolve token': (r) => !!r.json('token') });
      token = res.json('token');
    });
  }

  group('consultar reservas', () => {
    const lista = http.get(`${BASE_URL}/booking`, endpoint('GET /booking'));
    // A lista não é convertida de JSON de propósito: com dezenas de milhares de itens, o próprio
    // k6 viraria o gargalo. Basta conferir o status, o formato e medir o tamanho.
    check(lista, {
      'listagem: status 200': (r) => r.status === 200,
      'listagem: devolve uma lista': (r) => typeof r.body === 'string' && r.body.startsWith('['),
    });
    if (typeof lista.body === 'string') tamanhoListagem.add(lista.body.length / 1024);

    const bookingid = 1 + Math.floor(Math.random() * RESERVAS_SEMENTE);
    const detalhe = http.get(`${BASE_URL}/booking/${bookingid}`, endpoint('GET /booking/:id'));
    check(detalhe, {
      'detalhe: status 200': (r) => r.status === 200,
      'detalhe: tem firstname': (r) => typeof r.json('firstname') === 'string',
    });
  });

  group('criar reserva', () => {
    const reserva = {
      firstname: 'Carga',
      lastname: `VU${__VU}-IT${__ITER}`,
      totalprice: 100 + (__ITER % 500),
      depositpaid: __ITER % 2 === 0,
      bookingdates: { checkin: '2026-12-01', checkout: '2026-12-05' },
      additionalneeds: 'Breakfast',
    };
    const res = http.post(`${BASE_URL}/booking`, JSON.stringify(reserva), endpoint('POST /booking'));
    const ok = check(res, {
      'criação: status 200': (r) => r.status === 200,
      'criação: devolve bookingid': (r) => Number.isInteger(r.json('bookingid')),
    });
    if (ok) reservasCriadas.add(1);
  });

  tempoJornada.add(Date.now() - inicio);
  // Tempo de pensar do usuário entre uma jornada e outra (1 a 2 s).
  sleep(1 + Math.random());
}

// Relatório em Markdown e JSON, além do resumo no terminal.
export function handleSummary(data) {
  const dir = __ENV.REPORT_DIR || 'reports/load';
  const m = data.metrics;
  const ms = (v) => (v === undefined ? '-' : `${v.toFixed(1)} ms`);
  const pct = (v) => `${(v * 100).toFixed(2)}%`;
  const linhaEndpoint = (nome) => {
    const t = m[`http_req_duration{endpoint:${nome}}`];
    if (!t) return `| ${nome} | - | - | - | - | - |`;
    const v = t.values;
    return `| ${nome} | ${ms(v.avg)} | ${ms(v.med)} | ${ms(v['p(95)'])} | ${ms(v['p(99)'])} | ${ms(v.max)} |`;
  };
  const thresholds = Object.entries(m)
    .filter(([, metric]) => metric.thresholds)
    .flatMap(([nome, metric]) =>
      Object.entries(metric.thresholds).map(([regra, r]) => `| \`${nome}\` | \`${regra}\` | ${r.ok ? 'OK' : 'VIOLADO'} |`),
    );
  const d = m.http_req_duration.values;
  const md = [
    '# Resumo do teste de carga (k6)',
    '',
    `- Alvo: ${BASE_URL}`,
    `- Listagem no mock: ${__ENV.LISTAGEM_PAGINADA === 'true' ? 'paginada (correção proposta)' : 'sem paginação, como a API real'}`,
    `- Carga: ${VUS} usuários simultâneos, rampa de ${RAMPA}, ${DURACAO} sustentados`,
    `- Duração total: ${(data.state.testRunDurationMs / 1000).toFixed(0)} s`,
    `- Requisições: ${m.http_reqs.values.count} (${m.http_reqs.values.rate.toFixed(1)} por segundo)`,
    `- Jornadas completas: ${m.iterations.values.count}; reservas criadas: ${m.reservas_criadas?.values.count ?? 0}`,
    `- Falhas HTTP: ${pct(m.http_req_failed.values.rate)}; checks aprovados: ${pct(m.checks.values.rate)}`,
    `- Tempo de resposta geral: média ${ms(d.avg)}, p95 ${ms(d['p(95)'])}, p99 ${ms(d['p(99)'])}, máximo ${ms(d.max)}`,
    `- Tempo da jornada (sem o tempo de pensar): p95 ${ms(m.tempo_jornada.values['p(95)'])}`,
    `- Tamanho da resposta da listagem: de ${m.tamanho_listagem_kb.values.min.toFixed(1)} KB a ${m.tamanho_listagem_kb.values.max.toFixed(1)} KB`,
    '',
    '## Tempo de resposta por endpoint',
    '',
    '| Endpoint | Média | Mediana | p95 | p99 | Máximo |',
    '|---|---|---|---|---|---|',
    ...['POST /auth', 'GET /booking', 'GET /booking/:id', 'POST /booking'].map(linhaEndpoint),
    '',
    '## Critérios de aceite (thresholds)',
    '',
    '| Métrica | Regra | Resultado |',
    '|---|---|---|',
    ...thresholds,
    '',
  ].join('\n');

  return {
    stdout: `\n${md}\n`,
    [`${dir}/resumo.md`]: md,
    [`${dir}/summary.json`]: JSON.stringify(data, null, 2),
  };
}
