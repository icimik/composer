const { z } = require('zod');
const { kinds, sha, describe, equal, fail, parse } = require('./format.cjs');
const { idSchema } = require('../primitives.cjs');
const { validatePlan, marker } = require('./journal.cjs');

const markerSchema = z
  .object({
    version: z.literal(1),
    operationId: idSchema,
    phase: z.enum(['commit', 'complete']),
    intentHash: sha
  })
  .strict();
function inspect(plan, current, markers, resourcePolicy) {
  validatePlan(plan, resourcePolicy);
  if (!markers || !Object.keys(markers).every((key) => ['commit', 'complete'].includes(key)))
    fail('invalid-marker');
  for (const phase of ['commit', 'complete']) {
    if (markers[phase] !== undefined) {
      const value = parse(markerSchema, markers[phase], 'invalid-marker');
      if (!equal(value, marker(plan, phase))) fail('invalid-marker');
    }
  }
  if (markers.complete && !markers.commit) fail('invalid-marker');
  if (!current || !equal(Object.keys(current).sort(), [...kinds].sort())) fail('invalid-images');
  const states = plan.intent.resources.map((resource) => {
    const observed = describe(current[resource.kind]);
    const before = equal(observed, resource.before);
    const after = equal(observed, resource.after);
    return { kind: resource.kind, before, after };
  });
  const phase = markers.complete ? 'complete' : markers.commit ? 'committed' : 'prepared';
  let action = 'conflict';
  let install = [];
  if (phase === 'prepared' && states.every((state) => state.before)) action = 'cleanup-prepared';
  if (phase === 'committed' && states.every((state) => state.before || state.after)) {
    action = 'roll-forward';
    install = states.filter((state) => !state.after).map((state) => state.kind);
  }
  if (phase === 'complete' && states.every((state) => state.after)) action = 'cleanup-complete';
  // Pure decision only: no filesystem access, canonical replacement, cleanup or hydration occurs here.
  return Object.freeze({ phase, action, install: Object.freeze(install) });
}
module.exports = { inspect };
