const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ignored = new Set([
  '.git',
  'node_modules',
  'dist',
  'release',
  'test-results',
  'playwright-report'
]);
const extensions = new Set(['.js', '.cjs', '.mjs', '.ts', '.mts', '.tsx']);

function sourceFiles(root) {
  const files = [];
  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory() && !ignored.has(entry.name)) walk(file);
      else if (entry.isFile() && extensions.has(path.extname(entry.name))) files.push(file);
    }
  }
  walk(root);
  return files.sort();
}

function sourceMessages(source, file = 'fixture.js') {
  const lines = source.split(/\r\n|[\n\r\u2028\u2029]/u);
  if (lines.at(-1) === '' && lines.length > 1) lines.pop();
  const messages = [];
  if (lines.length > 180) {
    messages.push({
      file,
      line: 181,
      ruleId: 'max-lines',
      message: `${lines.length} lines; maximum 180`
    });
  }
  lines.forEach((line, index) => {
    let extra = 0;
    line.replace(/\t/gu, (_, offset) => {
      extra += 2 - ((offset + extra) % 2) - 1;
      return '';
    });
    const width = Array.from(line).length + extra;
    if (width > 120) {
      messages.push({
        file,
        line: index + 1,
        ruleId: 'max-len',
        message: `${width} characters; maximum 120`
      });
    }
  });
  return messages;
}

function syntaxMessages(source, file) {
  // Compile only: the wrapper preserves CommonJS top-level return and bindings. Nothing is evaluated.
  // Strict syntax rejects duplicate parameters and legacy octal, which Oxlint does not implement as rules.
  const relative = file.replaceAll('\\', '/');
  if (!/^(?:electron\/|scripts\/|tests\/|[^/]+\.cjs$)/u.test(relative) || !file.endsWith('.cjs'))
    return [];
  const text = source.replace(/^#![^\r\n]*/u, '');
  try {
    new vm.Script(
      `(function(exports,require,module,__filename,__dirname){'use strict';\n${text}\n})`,
      {
        filename: file
      }
    );
    return [];
  } catch (error) {
    return [{ file, line: 1, ruleId: 'strict-cjs-syntax', message: error.message }];
  }
}

function checkSources(root) {
  return sourceFiles(root).flatMap((file) => {
    const relative = path.relative(root, file);
    const source = fs.readFileSync(file, 'utf8');
    return [...sourceMessages(source, relative), ...syntaxMessages(source, relative)];
  });
}

if (require.main === module) {
  const messages = checkSources(path.resolve(__dirname, '..'));
  for (const { file, line, ruleId, message } of messages)
    console.error(`${file}:${line}: ${ruleId}: ${message}`);
  if (messages.length) process.exitCode = 1;
}

module.exports = { sourceFiles, sourceMessages, syntaxMessages, checkSources };
