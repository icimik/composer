const { fixture } = require('../tests/helpers/revision-core-fixture.cjs');
const { hash } = require('../electron/store/primitives.cjs');
const { createPlan } = require('../electron/store/revisions/journal.cjs');
const { resourcePolicy } = require('../electron/store/revisions/resource-policy.cjs');

const f = fixture();
const content = '文'.repeat(5000);
const after = content + '修订';
f.fields.expectedHash = hash(content);
f.images.manuscript = { before: Buffer.from(content), after: Buffer.from(after) };
for (const side of ['before', 'after']) {
  const meta = JSON.parse(f.images.manifest[side]);
  const selected = meta.documents[0];
  meta.documents = [
    selected,
    ...Array.from({ length: 6999 }, (_, i) => ({
      id: `chapter-${i + 1}`,
      title: `第${i + 2}章`,
      kind: 'chapter'
    }))
  ];
  f.images.manifest[side] = Buffer.from(JSON.stringify(meta));
}
const snapshot = {
  id: 'snapshot-0',
  title: f.fields.expectedTitle,
  content,
  createdAt: f.fields.createdAt,
  reason: f.fields.reason
};
const history = Array.from({ length: 5000 }, (_, i) => ({ ...snapshot, id: `snapshot-${i}` }));
f.images.history.before = Buffer.from(JSON.stringify(history));
f.images.history.after = Buffer.from(
  JSON.stringify([...history, { ...snapshot, id: f.fields.operationId }])
);
const event = JSON.parse(f.images.audit.after);
event.beforeHash = hash(content);
event.afterHash = hash(after);
delete event.operationId;
const audit = (JSON.stringify(event) + '\n').repeat(12000);
f.images.audit.before = Buffer.from(audit);
f.images.audit.after = Buffer.from(
  audit + JSON.stringify({ ...event, operationId: f.fields.operationId }) + '\n'
);
const started = performance.now();
const plan = createPlan(f.fields, f.images, resourcePolicy, 2 * 1024 ** 3);
console.log(
  JSON.stringify({
    chapterReferences: 7000,
    selectedChapterCharacters: 5000,
    priorSnapshots: 5000,
    priorAuditEvents: 12000,
    stagedImagesBytes: plan.stagedBytes,
    requiredFreeBytes: plan.requiredBytes + resourcePolicy.minFreeBytes,
    planningMilliseconds: Math.round(performance.now() - started),
    processPeakRssKiB: process.resourceUsage().maxRSS
  })
);
console.log(
  'One Linux process observation including fixture allocation; not GUI latency or cross-platform RAM assurance.'
);
