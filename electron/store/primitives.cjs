const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');
const { z } = require('zod');
const idSchema = z.string().regex(/^[a-z0-9-]{1,80}$/);
const nameSchema = z.string().trim().min(1).max(120);
const contentSchema = z.string().max(2_000_000);
const kindSchema = z.enum(['chapter', 'character', 'world', 'outline', 'style']);
const proposalSchema = z.object({
  id: idSchema,
  docId: idSchema,
  baseHash: z.string(),
  action: z.string(),
  text: contentSchema,
  createdAt: z.string(),
  status: z.enum(['pending', 'accepted', 'discarded'])
});
const sessionSchema = z.object({
  id: idSchema,
  name: nameSchema,
  documentId: idSchema,
  prompt: z.string().max(10000),
  proposals: z.array(proposalSchema).max(1000)
});
const workspaceSchema = z.object({
  version: z.literal(1),
  id: idSchema,
  name: nameSchema,
  stage: z.string().max(40),
  target: z.number().int().positive().max(10000000),
  documents: z.array(z.object({ id: idSchema, title: nameSchema, kind: kindSchema })).max(10000),
  sessions: z.array(sessionSchema).min(1).max(100),
  activeSessionId: idSchema,
  checks: z.array(z.string().max(100)).max(50)
});
const newId = () => crypto.randomUUID();
const hash = (text) => crypto.createHash('sha256').update(text).digest('hex');
async function atomic(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.${newId()}.tmp`;
  let handle;
  try {
    handle = await fs.open(tmp, 'wx', 0o600);
    await handle.writeFile(value, 'utf8');
    await handle.sync();
    await handle.close();
    handle = null;
    await fs.rename(tmp, file);
  } finally {
    if (handle) await handle.close();
    await fs.rm(tmp, { force: true });
  }
}
const folders = {
  chapter: '07-writing/chapters',
  character: '03-foundation/souls',
  world: '03-foundation',
  outline: '04-outline',
  style: '05-rules'
};

module.exports = {
  atomic,
  hash,
  newId,
  idSchema,
  nameSchema,
  contentSchema,
  kindSchema,
  proposalSchema,
  workspaceSchema,
  folders
};
