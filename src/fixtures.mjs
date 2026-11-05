import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export async function loadCases(location) {
  const absolute = path.resolve(location);
  const candidates = [];
  const s = await import('node:fs/promises').then(fs => fs.stat(absolute));
  if (s.isDirectory()) {
    const files = (await readdir(absolute)).filter(f => /\.(json|mjs)$/i.test(f)).sort();
    for (const name of files) candidates.push(path.join(absolute, name));
  } else candidates.push(absolute);
  const results = [];
  for (const file of candidates) {
    let parsed;
    if (file.endsWith('.mjs')) {
      const mod = await import(pathToFileURL(file).href);
      parsed = mod.cases ?? mod.default;
      if (typeof parsed === 'function') parsed = await parsed();
    } else parsed = JSON.parse(await readFile(file, 'utf8'));
    const cases = Array.isArray(parsed) ? parsed : [parsed];
    for (const c of cases) {
      if (!c || typeof c !== 'object' || !c.id || !Array.isArray(c.paths)) throw new Error(`Invalid fixture in ${file}: expected id and paths array`);
      results.push({ ...c, sourceFile: file });
    }
  }
  return results;
}
