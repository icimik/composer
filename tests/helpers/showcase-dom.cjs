const vm = require('node:vm');
function runShowcase(html) {
  const nodes = new Map();
  const tokenData = html.match(
    /<script id="design-tokens" type="application\/json">(.*?)<\/script>/s
  )[1];
  for (const [id, value] of [
    ['scheme', 'pine'],
    ['mode', 'light'],
    ['density', 'comfortable'],
    ['manuscript', '示例正文']
  ])
    nodes.set(id, { value });
  const get = (id) => {
    if (!nodes.has(id))
      nodes.set(id, { value: '', textContent: '', innerHTML: '', disabled: false });
    return nodes.get(id);
  };
  get('design-tokens').textContent = tokenData;
  get('proposal').textContent = '提案内容';
  const dataset = {};
  const classes = {};
  const document = {
    getElementById: get,
    documentElement: { dataset },
    body: { classList: { toggle: (name, enabled) => (classes[name] = enabled) } },
    querySelectorAll: () => [{ id: 'writing', querySelector: () => ({ textContent: '写作' }) }]
  };
  const script = html.match(/<script>(.*?)<\/script>/s)[1];
  vm.runInNewContext(script, { document }, { timeout: 1000 });
  const snapshot = () =>
    JSON.parse(JSON.stringify({ nodes: Object.fromEntries(nodes), dataset, classes }));
  return { get, snapshot };
}
module.exports = { runShowcase };
