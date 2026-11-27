// Copia o relatório da última execução para evidencias/<bloco>, que fica versionado no repositório.
// Uso: node scripts/salvar-evidencias.mjs api|e2e
// No E2E também copia os prints de cada cenário para evidencias/e2e/prints, com o nome do cenário.
import { cpSync, rmSync, mkdirSync, existsSync, readFileSync } from 'node:fs';

const bloco = process.argv[2] ?? 'api';
const destino = `evidencias/${bloco}`;
rmSync(destino, { recursive: true, force: true });
mkdirSync(destino, { recursive: true });

for (const [origem, alvo] of [
  ['reports/html', `${destino}/html`],
  ['reports/resumo.md', `${destino}/resumo.md`],
  ['reports/junit/results.xml', `${destino}/junit.xml`],
]) {
  if (existsSync(origem)) cpSync(origem, alvo, { recursive: true });
}

const json = 'reports/json/results.json';
if (existsSync(json)) {
  const slug = (texto) =>
    texto
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^\w]+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  let prints = 0;
  const percorrer = (suite) => {
    for (const spec of suite.specs ?? []) {
      for (const t of spec.tests) {
        const imagens = (t.results.at(-1)?.attachments ?? []).filter((a) => a.contentType === 'image/png' && a.path);
        imagens.forEach((a, i) => {
          if (!existsSync(a.path)) return;
          mkdirSync(`${destino}/prints`, { recursive: true });
          cpSync(a.path, `${destino}/prints/${slug(spec.title)}${i ? `-${i + 1}` : ''}.png`);
          prints++;
        });
      }
    }
    (suite.suites ?? []).forEach(percorrer);
  };
  JSON.parse(readFileSync(json, 'utf-8')).suites.forEach(percorrer);
  if (prints) console.log(`${prints} prints copiados para ${destino}/prints`);
}
console.log(`Evidências salvas em ${destino}`);
