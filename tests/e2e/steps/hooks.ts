import { knownBugs } from '../../../src/e2e/data/bugs';
import { Before } from '../../../src/e2e/fixtures';

/** Cenários com @bug:<id> ganham a anotação "bug" com a descrição do defeito, como no bloco de API. */
Before(({ $tags, $testInfo }) => {
  for (const tag of $tags.filter((t) => t.startsWith('@bug:'))) {
    const id = tag.slice('@bug:'.length);
    $testInfo.annotations.push({ type: 'bug', description: `${id}: ${knownBugs[id] ?? 'defeito sem descrição'}` });
  }
});
