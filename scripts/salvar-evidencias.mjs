// Copia o relatório da última execução para evidencias/<bloco>, que fica versionado no repositório.
// Uso: node scripts/salvar-evidencias.mjs api
import { cpSync, rmSync, mkdirSync, existsSync } from 'node:fs';

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
console.log(`Evidências salvas em ${destino}`);
