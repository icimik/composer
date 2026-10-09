const fs = require('node:fs');
const path = require('node:path');
function renderTemplate(name, values) {
  const text = fs.readFileSync(path.join(__dirname, 'templates', name + '.tpl'), 'utf8');
  return text.replace(/\{\{(\w+)\}\}/g, (_match, key) => {
    if (!Object.hasOwn(values, key)) throw Error('Missing template value: ' + key);
    return String(values[key]);
  });
}
module.exports = { renderTemplate };
