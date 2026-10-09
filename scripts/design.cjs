const { renderTemplate } = require('./design/templates.cjs');
const { createShowcase } = require('./design/showcase-runtime.cjs');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..'),
  dir = path.join(root, 'docs/research');
const css = fs.readFileSync(path.join(root, 'src/styles.css'), 'utf8');
const extract = (selector, text = css) => {
  const start = text.indexOf(selector + '{');
  assert.ok(start >= 0, selector);
  const block = text.slice(start + selector.length + 1, text.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()])
  );
};
const base = extract(':root');
const tokens = {
  pine: { light: base, dark: { ...base, ...extract('[data-theme=dark]') } },
  mono: {
    light: { ...base, ...extract('[data-scheme=mono]') },
    dark: {
      ...base,
      ...extract('[data-theme=dark]'),
      ...extract('[data-scheme=mono]'),
      ...extract('[data-scheme=mono][data-theme=dark]')
    }
  }
};
const json = JSON.stringify(tokens);
const luminance = (hex) => {
  const c = hex
    .slice(1)
    .match(/../g)
    .map((v) => parseInt(v, 16) / 255)
    .map((v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return c[0] * 0.2126 + c[1] * 0.7152 + c[2] * 0.0722;
};
const ratio = (a, b) => {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};
const pairs = [
  ...['bg', 'surface', 'sidebar', 'subtle', 'selected'].flatMap((bg) => [
    ['text', bg, 4.5],
    ['muted', bg, 4.5]
  ]),
  ['accent', 'bg', 4.5],
  ['accent', 'surface', 4.5],
  ['accent', 'selected', 4.5],
  ['on-accent', 'accent', 4.5],
  ['danger', 'danger-bg', 4.5],
  ['control-line', 'bg', 3],
  ['control-line', 'surface', 3],
  ['control-line', 'sidebar', 3],
  ['accent', 'sidebar', 3]
];
const measurements = Object.entries(tokens).flatMap(([scheme, modes]) =>
  Object.entries(modes).flatMap(([mode, t]) =>
    pairs.map(([fg, bg, min]) => ({ scheme, mode, fg, bg, min, ratio: ratio(t[fg], t[bg]) }))
  )
);
const failed = measurements.filter((p) => p.ratio < p.min);
if (failed.length) throw Error('Contrast failed: ' + JSON.stringify(failed));
const verify = (spec, html) => {
  const specData = JSON.parse(spec.match(/<!-- TOKEN_JSON:(.*?) -->/s)?.[1] || 'null');
  const htmlData = JSON.parse(
    html.match(/<script id="design-tokens" type="application\/json">(.*?)<\/script>/s)?.[1] ||
      'null'
  );
  assert.deepEqual(specData, tokens, 'Specification token drift');
  assert.deepEqual(htmlData, tokens, 'Showcase token drift');
  const renderedCSS = html.match(/<style>(.*?)<\/style>/s)?.[1] || '';
  for (const selector of [
    ':root',
    '[data-theme=dark]',
    '[data-scheme=mono]',
    '[data-scheme=mono][data-theme=dark]'
  ]) {
    assert.deepEqual(extract(selector, renderedCSS), extract(selector), 'Showcase CSS token drift');
  }
  for (const [name, value] of Object.entries(base)) {
    const row = spec.split('\n').find((line) => line.startsWith(`| \`--${name}\` |`));
    assert.ok(row, `Missing specification token ${name}`);
    const columns = row
      .split('|')
      .slice(2, 6)
      .map((v) => v.trim());
    assert.deepEqual(
      columns,
      [value, tokens.pine.dark[name], tokens.mono.light[name], tokens.mono.dark[name]],
      'Specification table token drift'
    );
  }
  assert.ok(!/var\(--(?:game|print|terminal)-/.test(html), 'Undeclared cross-surface token');
  const known = new Set(Object.keys(base));
  for (const m of html.matchAll(/var\(--([\w-]+)\)/g))
    assert.ok(known.has(m[1]), `Unknown token ${m[1]}`);
};
if (process.argv.includes('--check')) {
  const spec = fs.readFileSync(path.join(dir, '08-设计规范.md'), 'utf8'),
    html = fs.readFileSync(path.join(dir, 'design-showcase.html'), 'utf8');
  verify(spec, html);
  const changed = html.replace('"bg":"#f6f5f1"', '"bg":"#000000"');
  assert.notEqual(changed, html);
  assert.throws(() => verify(spec, changed), /Showcase token drift/);
  assert.throws(
    () => verify(spec, html.replace('--bg:#f6f5f1', '--bg:#000000')),
    /Showcase CSS token drift/
  );
  assert.throws(
    () => verify(spec.replace('| #f6f5f1 |', '| #000000 |'), html),
    /Specification table token drift/
  );
  console.log(
    `Design check passed: 4 schemes/modes, ${measurements.length} contrast pairs; 3 token-drift mutations rejected.`
  );
  process.exit(0);
}
const table = Object.keys(base)
  .map(
    (name) =>
      '| ' +
      [
        `\`--${name}\``,
        tokens.pine.light[name],
        tokens.pine.dark[name],
        tokens.mono.light[name],
        tokens.mono.dark[name]
      ].join(' | ') +
      ' |'
  )
  .join('\n');
const results = measurements
  .map((p) => `| ${p.scheme}/${p.mode} | ${p.fg} / ${p.bg} | ${p.ratio.toFixed(2)} | ${p.min} |`)
  .join('\n');
const spec = renderTemplate('spec', {
  slot0: table,
  slot1: results,
  slot2: json
});
const html = renderTemplate('html', {
  slot0: css.slice(0, css.indexOf('*{')),
  slot1: json,
  slot2: JSON.stringify(pairs),
  slot3: luminance.toString(),
  runtime: createShowcase.toString()
});
fs.mkdirSync(dir, { recursive: true });
fs.writeFileSync(path.join(dir, '08-设计规范.md'), spec);
fs.writeFileSync(path.join(dir, 'design-showcase.html'), html);
verify(spec, html);
console.log(
  `Generated specification and offline showcase; ${measurements.length} contrast pairs passed.`
);
