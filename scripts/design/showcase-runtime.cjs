function createShowcase({ pairs, luminance }) {
  const tokens = JSON.parse(document.getElementById('design-tokens').textContent);
  const ratio = (a, b) => {
    const x = luminance(a),
      y = luminance(b);
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  };
  const el = (id) => document.getElementById(id);
  function render() {
    const scheme = el('scheme').value,
      mode = el('mode').value,
      t = tokens[scheme][mode];
    document.documentElement.dataset.scheme = scheme;
    document.documentElement.dataset.theme = mode;
    el('active-mode').textContent = scheme + ' / ' + mode;
    el('contrast-body').innerHTML = pairs
      .map(([fg, bg, min]) => {
        const r = ratio(t[fg], t[bg]);
        return (
          '<tr><td>' +
          fg +
          '</td><td>' +
          bg +
          '</td><td>' +
          r.toFixed(2) +
          '</td><td>' +
          min +
          '</td><td>' +
          (r >= min ? '通过' : '失败') +
          '</td></tr>'
        );
      })
      .join('');
    el('tokens-body').innerHTML = Object.entries(t)
      .map(([name, value]) => '<tr><td>--' + name + '</td><td>' + value + '</td></tr>')
      .join('');
  }
  el('mode').onchange = el('scheme').onchange = render;
  el('density').onchange = () =>
    document.body.classList.toggle('compact', el('density').value === 'compact');
  const original = el('manuscript').value;
  el('manuscript').oninput = () => (el('save-status').textContent = '展示编辑中，不保存');
  el('accept').onclick = () => {
    el('manuscript').value += '\n\n' + el('proposal').textContent;
    el('decision').textContent = '已采纳（展示），可重置。';
    el('accept').disabled = true;
    el('discard').disabled = true;
  };
  el('discard').onclick = () => {
    el('decision').textContent = '已放弃，正文未改动。';
    el('accept').disabled = true;
    el('discard').disabled = true;
  };
  el('cancel').onclick = () => {
    el('generation').textContent = '已取消，正文未改动。';
  };
  el('reset').onclick = () => {
    el('manuscript').value = original;
    el('accept').disabled = false;
    el('discard').disabled = false;
    el('decision').textContent = '提案尚未写入正文。';
    el('title').textContent = '第一章 · 迟来的信';
    el('save-status').textContent = '已保存（展示）';
  };
  el('character').onclick = () => {
    el('title').textContent = '人物 · 林遥';
    el('manuscript').value = '林遥：在雾港邮局工作。父亲的旧信是她一直没有拆开的东西。';
  };
  el('chapter').onclick = () => {
    el('title').textContent = '第一章 · 迟来的信';
    el('manuscript').value = original;
  };
  el('toc').innerHTML = Array.from(document.querySelectorAll('main>section'))
    .map((s) => '<a href="#' + s.id + '">' + s.querySelector('h2').textContent + '</a>')
    .join('');
  render();
}
module.exports = { createShowcase };
