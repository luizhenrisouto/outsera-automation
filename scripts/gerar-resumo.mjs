// Gera um resumo em Markdown a partir do relatório JSON do Playwright.
// Uso: node scripts/gerar-resumo.mjs [entrada.json] [saida.md]
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const [entrada = 'reports/json/results.json', saida = 'reports/resumo.md'] = process.argv.slice(2);
const relatorio = JSON.parse(readFileSync(entrada, 'utf-8'));

const linhas = [];
function percorrer(suite, caminho = []) {
  const titulo = suite.title && !suite.title.endsWith('.ts') ? [...caminho, suite.title] : caminho;
  for (const spec of suite.specs ?? []) {
    for (const t of spec.tests) {
      const ultimo = t.results.at(-1) ?? {};
      const bug = t.annotations.find((a) => a.type === 'bug');
      let situacao;
      if (t.status === 'expected') situacao = bug ? 'Bug confirmado (falha esperada)' : 'Passou';
      else if (t.status === 'flaky') situacao = 'Instável (passou no retry)';
      else if (t.status === 'skipped') situacao = 'Ignorado';
      else situacao = bug ? 'Bug corrigido? Revisar (passou)' : 'Falhou';
      linhas.push({
        projeto: t.projectName,
        arquivo: spec.file,
        cenario: [...titulo, spec.title].join(' › '),
        tipo: spec.tags.includes('negativo') ? 'Negativo' : 'Positivo',
        situacao,
        duracao: ultimo.duration ?? 0,
        bug: bug?.description ?? '',
      });
    }
  }
  for (const filha of suite.suites ?? []) percorrer(filha, titulo);
}
relatorio.suites.forEach((s) => percorrer(s));

const total = linhas.length;
const contar = (f) => linhas.filter(f).length;
const s = relatorio.stats;
const md = [
  '# Resumo da execução',
  '',
  `- Início: ${s.startTime}`,
  `- Duração: ${(s.duration / 1000).toFixed(1)} s`,
  `- Cenários: ${total} (${contar((l) => l.tipo === 'Positivo')} positivos, ${contar((l) => l.tipo === 'Negativo')} negativos)`,
  `- Passaram: ${contar((l) => l.situacao === 'Passou')}`,
  `- Bugs confirmados da aplicação: ${contar((l) => l.situacao.startsWith('Bug confirmado'))}`,
  `- Falhas inesperadas: ${contar((l) => l.situacao === 'Falhou')}`,
  `- Instáveis: ${contar((l) => l.situacao.startsWith('Instável'))}`,
  '',
  '| Projeto | Cenário | Tipo | Situação | Tempo (ms) |',
  '|---|---|---|---|---|',
  ...linhas.map((l) => `| ${l.projeto} | ${l.cenario} | ${l.tipo} | ${l.situacao} | ${l.duracao} |`),
  '',
  '## Bugs encontrados na aplicação',
  '',
  ...linhas.filter((l) => l.bug).map((l) => `- **${l.cenario}**: ${l.bug}`),
  '',
];

mkdirSync(dirname(saida), { recursive: true });
writeFileSync(saida, md.join('\n'));
console.log(`Resumo gravado em ${saida} (${total} cenários)`);
