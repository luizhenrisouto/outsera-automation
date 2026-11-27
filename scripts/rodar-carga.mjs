// Sobe a API mock, roda o k6 (painel web exportado em HTML e métricas brutas em CSV), gera a evolução
// por janela de tempo e derruba o mock no fim.
// Uso: node scripts/rodar-carga.mjs [--paginada]
//   --paginada  liga a paginação da listagem no mock (correção proposta) e grava em reports/load-paginada
// Variáveis: VUS, DURACAO e RAMPA passam direto para o k6; o executável vem do PATH ou de K6_BIN.
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, rmSync } from 'node:fs';

const paginada = process.argv.includes('--paginada');
const port = process.env.PORT ?? '3333';
const baseUrl = `http://localhost:${port}`;
const reportDir = process.env.REPORT_DIR ?? (paginada ? 'reports/load-paginada' : 'reports/load');
rmSync(reportDir, { recursive: true, force: true });
mkdirSync(reportDir, { recursive: true });

const mock = spawn(process.execPath, ['load/mock-api/server.mjs'], {
  env: { ...process.env, PORT: port, ...(paginada && { PAGINA_TAMANHO: process.env.PAGINA_TAMANHO ?? '100' }) },
  stdio: 'inherit',
});

async function waitForMock() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(`${baseUrl}/ping`)).ok) return;
    } catch {
      // ainda subindo
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`O mock não respondeu em ${baseUrl}`);
}

let code = 1;
try {
  await waitForMock();
  const k6 = spawn(process.env.K6_BIN ?? 'k6', ['run', '--out', `csv=${reportDir}/metricas.csv.gz`, 'load/k6/carga.js'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      BASE_URL: baseUrl,
      REPORT_DIR: reportDir,
      LISTAGEM_PAGINADA: String(paginada),
      K6_WEB_DASHBOARD: 'true',
      K6_WEB_DASHBOARD_EXPORT: `${reportDir}/relatorio.html`,
      K6_WEB_DASHBOARD_PERIOD: '5s',
    },
  });
  code = await new Promise((resolve) => k6.on('close', (c) => resolve(c ?? 1)));
} catch (error) {
  console.error(error);
} finally {
  mock.kill('SIGTERM');
}

// A análise roda mesmo quando os critérios de aceite são violados: é justamente quando ela mais importa.
spawnSync(process.execPath, ['scripts/analisar-carga.mjs', reportDir], { stdio: 'inherit' });
process.exit(code);
