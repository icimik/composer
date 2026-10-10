const { hash } = require('../electron/store/primitives.cjs');
const { fixture } = require('../tests/helpers/revision-core-fixture.cjs');
const { resourcePolicy } = require('../electron/store/revisions/resource-policy.cjs');

function measure(totalCharacters, snapshots) {
  const chapterCharacters = 5000;
  const chapters = totalCharacters / chapterCharacters;
  const content = '文'.repeat(chapterCharacters);
  const meta = JSON.parse(fixture().images.manifest.before);
  meta.documents = Array.from({ length: chapters }, (_, i) => ({
    id: i ? `chapter-${i}` : 'document-a',
    kind: 'chapter',
    title: `第${i + 1}章`
  }));
  const manifestBefore = Buffer.byteLength(JSON.stringify(meta));
  meta.documents[0].title = '修订章';
  const manifestAfter = Buffer.byteLength(JSON.stringify(meta));
  const snapshot = {
    id: 'snapshot-0',
    title: '第一章',
    content,
    createdAt: '2026-10-10T00:00:00.000Z',
    reason: '合成历史'
  };
  const historySize = (count) => {
    let bytes = 2;
    for (let i = 0; i < count; i++)
      bytes +=
        Buffer.byteLength(JSON.stringify({ ...snapshot, id: `snapshot-${i}` })) + (i ? 1 : 0);
    return bytes;
  };
  const historyBefore = historySize(snapshots);
  const historyAfter = historySize(snapshots + 1);
  const event = {
    time: snapshot.createdAt,
    documentId: 'document-a',
    title: '修订章',
    reason: '合成修订',
    beforeHash: hash(content),
    afterHash: hash(content),
    operationId: 'operation-0',
    requestDigest: hash('synthetic')
  };
  let auditBefore = 0;
  // Workspace-wide audit assumption: one prior event per chapter plus selected-document history events.
  for (let i = 0; i < chapters + snapshots; i++)
    auditBefore +=
      Buffer.byteLength(JSON.stringify({ ...event, operationId: `operation-${i}` })) + 1;
  const auditAfter = auditBefore + Buffer.byteLength(JSON.stringify(event)) + 1;
  const payload =
    2 * Buffer.byteLength(content) +
    manifestBefore +
    manifestAfter +
    historyBefore +
    historyAfter +
    auditBefore +
    auditAfter;
  const scratch = Math.max(Buffer.byteLength(content), manifestAfter, historyAfter, auditAfter);
  return {
    totalCharacters,
    chapters,
    chapterCharacters,
    priorSelectedChapterSnapshots: snapshots,
    corpusUtf8Bytes: chapters * Buffer.byteLength(content),
    manifestBefore,
    manifestAfter,
    historyBefore,
    historyAfter,
    auditBefore,
    auditAfter,
    stagedImagesBytes: payload,
    fits128MiB: payload <= 128 * 1024 * 1024,
    fits256MiB: payload <= resourcePolicy.maxStagedBytes,
    conservativeRequiredFreeBytes: payload + scratch + 3 * 65536 + resourcePolicy.minFreeBytes
  };
}
for (const total of [5_000_000, 35_000_000])
  for (const snapshots of [1000, 5000, 10000])
    console.log(JSON.stringify(measure(total, snapshots)));
console.log(
  'Exact compact JSON serialization counts for synthetic chapterized Chinese text; not runtime or RAM benchmarks.'
);
