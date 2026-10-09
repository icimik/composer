const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const YAML = require('yaml');
const { assertPolicy } = require('../../scripts/ci-policy.cjs');

const source = fs.readFileSync(path.join(__dirname, '../../.github/workflows/ci.yml'), 'utf8');
const parse = () => YAML.parse(source);

test('CI policy holds for LF and Windows CRLF checkouts', () => {
  assertPolicy(YAML.parse(source.replace(/\r\n/g, '\n')));
  assertPolicy(YAML.parse(source.replace(/\r?\n/g, '\r\n')));
});

const mutations = [
  ['Linux job skipped with false', (w) => (w.jobs.verify.if = false)],
  ['native runner on PR', (w) => delete w.jobs.desktop.if],
  ['installer build on PR', (w) => delete w.jobs.package.if],
  ['Windows ordinary verification', (w) => (w.jobs.verify['runs-on'] = 'windows-latest')],
  ['native validation without Linux gate', (w) => delete w.jobs.desktop.needs],
  ['packaging without native gate', (w) => (w.jobs.package.needs = 'verify')],
  ['artifact upload in verification', (w) => w.jobs.verify.steps.push(w.jobs.package.steps.at(-1))],
  [
    'installer compilation in verification',
    (w) => w.jobs.verify.steps.push({ run: 'npm run dist' })
  ],
  ['mutable action tag', (w) => (w.jobs.verify.steps[0].uses = 'actions/checkout@v7')],
  ['privileged PR trigger', (w) => (w.on.pull_request_target = {})],
  ['extra ungated native job', (w) => (w.jobs.extra = { 'runs-on': 'macos-14', steps: [] })],
  [
    'upload reports instead of installers',
    (w) => (w.jobs.package.steps.at(-1).with.path = 'test-results/')
  ]
];

for (const job of ['verify', 'desktop', 'package']) {
  mutations.push([
    `${job} job tolerates failure`,
    (w) => (w.jobs[job]['continue-on-error'] = true)
  ]);
}
for (const command of ['check', 'test:smoke', 'test:e2e']) {
  for (const [field, value] of [
    ['if', false],
    ['continue-on-error', true]
  ]) {
    mutations.push([
      `${command} step overrides ${field}`,
      (w) =>
        (w.jobs.verify.steps.find((step) => step.run?.includes(`npm run ${command}`))[field] =
          value)
    ]);
  }
}

for (const [name, mutate] of mutations) {
  test(`CI policy rejects ${name}`, () => {
    const workflow = parse();
    mutate(workflow);
    assert.throws(() => assertPolicy(workflow));
  });
}
