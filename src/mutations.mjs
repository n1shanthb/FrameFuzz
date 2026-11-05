// Mutate a semantic *unsigned* transaction model, never signed RLP bytes.
// Adapter must re-encode and re-sign each variant, because modifying raw hex
// breaks signatures and can create false-positive 'fuzzing' outcomes.
export async function numericBoundaryCases({
  id, template, field, boundary, sign, expectedFor, path = 'alt', method = 'eth_sendFrameTransaction'
}) {
  if (typeof sign !== 'function') throw new Error('A real encode-and-sign adapter is required. No placeholder signing.');
  if (!Number.isSafeInteger(boundary) || boundary < 1) throw new Error('boundary must be a positive safe integer');
  if (typeof field !== 'string' || !field) throw new Error('field required');
  const cases = [];
  for (const [suffix, value] of [['below', boundary - 1], ['at', boundary], ['above', boundary + 1]]) {
    const next = structuredClone(template);
    next[field] = value;
    const raw = await sign(next, { field, boundary, value, suffix });
    const expected = await expectedFor(next, { field, boundary, value, suffix });
    cases.push({
      id: `${id}-${suffix}-${value}`,
      category: `boundary:${field}`,
      description: `${field}=${value} around limit ${boundary}`,
      mutation: { field, boundary, value, suffix },
      paths: [{ id: path, method, params: [raw], expected }],
    });
  }
  return cases;
}
