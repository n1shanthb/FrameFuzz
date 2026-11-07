import { readFile } from 'node:fs/promises';
import { loadCases } from './fixtures.mjs';
import { loadAdapter } from './adapters/index.mjs';
import { createScenarioCases } from './scenarios.mjs';

export async function selectCases({ casesLocation = 'examples/cases', scenario, adapterFile, rulesFile, caseId, mutationFamily } = {}) {
  let cases;
  if (scenario && scenario !== 'fixtures') {
    if (!adapterFile || !rulesFile) throw new Error('Scenario requires --adapter and --rules');
    cases = createScenarioCases({ scenario, adapter: await loadAdapter(adapterFile), rules: JSON.parse(await readFile(rulesFile, 'utf8')) })
      .map(c => ({ ...c, reproduction: { scenario, adapterFile, rulesFile } }));
  } else cases = await loadCases(casesLocation);
  if (caseId) cases = cases.filter(c => c.id === caseId);
  if (mutationFamily && mutationFamily !== 'all') cases = cases.filter(c => mutationFamily === 'baseline' ? !c.mutation : c.mutation?.family === mutationFamily);
  if (!cases.length) throw new Error('No cases match selection');
  return cases;
}
