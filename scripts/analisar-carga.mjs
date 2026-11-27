// Lê as métricas brutas do k6 (CSV gzip) e gera a evolução por janela de 30 s: usuários, vazão,
// p95 por endpoint, tamanho da listagem e falhas. É o que mostra quando e como a API degrada.
// Uso: node scripts/analisar-carga.mjs [pasta]   (padrão reports/load; lê metricas.csv.gz e grava janelas.md)
import { createReadStream, writeFileSync } from 'node:fs';
import { createGunzip } from 'node:zlib';
import { createInterface } from 'node:readline';

const dir = process.argv[2] ?? 'reports/load';
const JANELA = 30;
const duracoes = new Map(); // janela -> endpoint -> [ms]
const vus = new Map();
const listagem = new Map();
const falhas = new Map();
let inicio;
let colunas;

const linhas = createInterface({ input: createReadStream(`${dir}/metricas.csv.gz`).pipe(createGunzip()) });
for await (const linha of linhas) {
  const campos = linha.split(',');
  if (!colunas) {
    colunas = Object.fromEntries(campos.map((c, i) => [c, i]));
    continue;
  }
  const ts = Number(campos[colunas.timestamp]);
  inicio ??= ts;
  const janela = Math.floor((ts - inicio) / JANELA) * JANELA;
  const metrica = campos[colunas.metric_name];
  const valor = Number(campos[colunas.metric_value]);
  if (metrica === 'http_req_duration') {
    const endpoint = /endpoint=([^&]+)/.exec(campos[colunas.extra_tags])?.[1];
    if (!endpoint) continue; // checagem de saúde do setup
    const porEndpoint = duracoes.get(janela) ?? new Map();
    duracoes.set(janela, porEndpoint);
    (porEndpoint.get(endpoint) ?? porEndpoint.set(endpoint, []).get(endpoint)).push(valor);
  } else if (metrica === 'vus') {
    vus.set(janela, Math.max(vus.get(janela) ?? 0, valor));
  } else if (metrica === 'tamanho_listagem_kb') {
    listagem.set(janela, Math.max(listagem.get(janela) ?? 0, valor));
  } else if (metrica === 'http_req_failed' && valor === 1) {
    falhas.set(janela, (falhas.get(janela) ?? 0) + 1);
  }
}

const p95 = (valores) => {
  const ordenados = [...valores].sort((a, b) => a - b);
  return ordenados[Math.min(ordenados.length - 1, Math.floor(ordenados.length * 0.95))];
};
const endpoints = ['GET /booking', 'GET /booking/:id', 'POST /booking'];
const md = [
  `# Evolução por janela de ${JANELA} s`,
  '',
  `| Janela | Usuários | Req/s | ${endpoints.map((e) => `p95 ${e} (ms)`).join(' | ')} | Listagem (KB) | Falhas |`,
  `|${'---|'.repeat(5 + endpoints.length)}`,
  ...[...duracoes.keys()]
    .sort((a, b) => a - b)
    .map((j) => {
      const porEndpoint = duracoes.get(j);
      const total = [...porEndpoint.values()].reduce((n, v) => n + v.length, 0);
      const colunasP95 = endpoints.map((e) => (porEndpoint.get(e) ? p95(porEndpoint.get(e)).toFixed(1) : '-'));
      return `| ${j}-${j + JANELA} s | ${vus.get(j) ?? 0} | ${Math.round(total / JANELA)} | ${colunasP95.join(' | ')} | ${(listagem.get(j) ?? 0).toFixed(0)} | ${falhas.get(j) ?? 0} |`;
    }),
  '',
].join('\n');

writeFileSync(`${dir}/janelas.md`, md);
console.log(md);
