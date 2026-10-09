const {test,expect,_electron}=require('@playwright/test');
const fs=require('node:fs/promises');const os=require('node:os');const path=require('node:path');const http=require('node:http');
let app,page,root,server,endpoint,received=[],mode='success';
async function launch(){
  app=await _electron.launch({args:[...(process.platform==='linux'?['--no-sandbox']:[]),'.'],cwd:path.resolve(__dirname,'../..'),
    env:{...process.env,ELECTRON_RUN_AS_NODE:'',COMPOSER_E2E:'1',COMPOSER_TEST_ROOT:root}});
  page=await app.firstWindow();await expect(page.getByTestId('composer-app')).toBeVisible();
}
async function saveText(text){await page.getByLabel('正文编辑器').fill(text);await page.getByLabel('文档标题').click();await expect(page.getByTestId('save-status')).toHaveText(/已保存/);}
async function newDocument(title,kind='chapter'){
  await page.getByRole('button',{name:'新建文档',exact:true}).click();
  const d=page.getByRole('dialog');await d.getByLabel('名称',{exact:true}).fill(title);
  await d.getByLabel('文档类型').selectOption(kind);await d.getByRole('button',{name:'创建',exact:true}).click();
  await expect(page.getByLabel('文档标题')).toHaveValue(title);
}
async function configureAI(){
  await page.getByRole('button',{name:'模型设置',exact:true}).click();
  const d=page.getByRole('dialog');await d.getByLabel('API 基础地址').fill(endpoint);
  await d.getByLabel('模型名称').fill('e2e-fixture');await d.getByLabel('API 密钥').fill('fixture-key-not-real');
  await d.getByRole('button',{name:'保存模型设置'}).click();await expect(d).not.toBeVisible();
}
test.beforeAll(async()=>{
  server=http.createServer(async(req,res)=>{
    let data='';for await(const chunk of req)data+=chunk;received.push(JSON.parse(data));
    if(mode==='error'){res.statusCode=429;res.end('{}');return;}
    const timer=setTimeout(()=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify({choices:[{message:{content:'门外响了三下。林遥放下信，走到门边。'}}]}));},mode==='slow'?10000:60);
    res.on('close',()=>clearTimeout(timer));
  });await new Promise(r=>server.listen(0,'127.0.0.1',r));endpoint=`http://127.0.0.1:${server.address().port}/v1`;
});
test.beforeEach(async()=>{root=await fs.mkdtemp(path.join(os.tmpdir(),'composer-e2e-'));mode='success';received=[];await launch();});
test.afterEach(async()=>{if(app)await app.close();await fs.rm(root,{recursive:true,force:true});});
test.afterAll(async()=>{await new Promise(r=>server.close(r));});
test('creates chapter, autosaves UTF-8, survives complete app restart',async()=>{
  await page.getByLabel('文档标题').fill('第一章 雨');await saveText('雨停了。\n\n“信是你的。”');
  await app.close();await launch();await expect(page.getByLabel('文档标题')).toHaveValue('第一章 雨');await expect(page.getByLabel('正文编辑器')).toHaveValue('雨停了。\n\n“信是你的。”');
});
test('close flushes a pending draft without waiting for debounce',async()=>{
  await page.getByLabel('正文编辑器').fill('关闭前刚输入的句子');await app.close();await launch();
  await expect(page.getByLabel('正文编辑器')).toHaveValue('关闭前刚输入的句子');
});
test('workspaces isolate content and retain state when switching back',async()=>{
  await saveText('甲作品私有正文');const first=await page.getByLabel('工作区',{exact:true}).inputValue();
  await page.getByRole('button',{name:'新建',exact:true}).click();const d=page.getByRole('dialog');await d.getByLabel('名称',{exact:true}).fill('乙作品');await d.getByRole('button',{name:'创建',exact:true}).click();
  await expect(page.getByLabel('正文编辑器')).toHaveValue('');await saveText('乙作品私有正文');
  await page.getByLabel('工作区',{exact:true}).selectOption(first);await expect(page.getByLabel('正文编辑器')).toHaveValue('甲作品私有正文');
});
test('session switch restores independent prompts and document selection',async()=>{
  await page.getByLabel('这一章要发生什么？').fill('甲会话的独立指令');await saveText('共有的正文');
  await page.getByRole('button',{name:'新建会话',exact:true}).click();const d=page.getByRole('dialog');await d.getByLabel('名称',{exact:true}).fill('修稿会话');await d.getByRole('button',{name:'创建',exact:true}).click();
  await expect(page.getByLabel('这一章要发生什么？')).toHaveValue('');await expect(page.getByLabel('正文编辑器')).toHaveValue('共有的正文');
  await page.getByRole('tab',{name:'创作会话',exact:true}).click();await expect(page.getByLabel('这一章要发生什么？')).toHaveValue('甲会话的独立指令');
});
test('creates all story asset types and displays overview',async()=>{
  await newDocument('第二章');await saveText('第二章正文');
  await newDocument('林遥','character');await saveText('她在邮局工作。');
  await newDocument('雾港','world');await newDocument('故事大纲','outline');await newDocument('克制具体','style');
  await page.getByRole('button',{name:'结构总览',exact:true}).click();await expect(page.getByRole('heading',{name:'让故事有迹可循'})).toBeVisible();
  await expect(page.getByRole('button').filter({has:page.getByRole('heading',{name:'第二章',exact:true})})).toBeVisible();
});
test('stage and manual checks survive restart',async()=>{
  await page.getByRole('button',{name:/阶段检查/}).click();await page.getByLabel('当前阶段').selectOption('审阅');await page.getByLabel('中文表达自然').check();
  await app.close();await launch();await page.getByRole('button',{name:/阶段检查/}).click();await expect(page.getByLabel('当前阶段')).toHaveValue('审阅');await expect(page.getByLabel('中文表达自然')).toBeChecked();
});
test('focus mode, panel toggle, theme and command palette',async()=>{
  await page.getByRole('button',{name:'切换明暗主题'}).click();await expect(page.locator('html')).toHaveAttribute('data-theme','dark');
  await page.getByRole('button',{name:'收起 AI 面板'}).click();await expect(page.getByLabel('AI 创作助手')).not.toBeVisible();
  await page.getByRole('button',{name:'展开 AI 面板'}).click();await expect(page.getByLabel('AI 创作助手')).toBeVisible();
  await page.keyboard.press('F8');await expect(page.getByLabel('工作区导航')).not.toBeVisible();await page.keyboard.press('Escape');await expect(page.getByLabel('工作区导航')).toBeVisible();
  await page.getByRole('button',{name:'打开命令面板'}).click();await page.getByLabel('搜索操作').fill('新建章节');await page.getByRole('button',{name:'新建章节',exact:true}).click();await expect(page.getByRole('dialog',{name:'新建文档'})).toBeVisible();
});
test('history restore is reversible',async()=>{
  await saveText('版本甲');await saveText('版本乙');await page.getByRole('button',{name:'历史快照',exact:true}).click();
  const article=page.getByRole('dialog').locator('article').filter({hasText:'版本甲'});await article.getByRole('button',{name:'恢复此版本'}).click();
  await expect(page.getByLabel('正文编辑器')).toHaveValue('版本甲');
  await page.getByRole('button',{name:'历史快照',exact:true}).click();await expect(page.getByRole('dialog').locator('article').filter({hasText:'版本乙'})).toBeVisible();
  await fs.mkdir(path.resolve('docs/research/screenshots'),{recursive:true});
  await page.screenshot({path:path.resolve('docs/research/screenshots/history.png')});
});
test('AI unconfigured state shows actionable error without mutation',async()=>{
  await page.getByLabel('这一章要发生什么？').fill('写一个开场');await page.getByRole('button',{name:'生成正文提案'}).click();
  await expect(page.getByRole('alert')).toContainText('尚未配置 AI');await expect(page.getByLabel('正文编辑器')).toHaveValue('');
});
test('AI actual HTTP adapter generates proposal, only acceptance changes text',async()=>{
  await configureAI();await page.getByLabel('这一章要发生什么？').fill('林遥收到了信');await page.getByRole('button',{name:'生成正文提案'}).click();
  await expect(page.getByTestId('ai-proposal')).toBeVisible();await expect(page.getByLabel('正文编辑器')).toHaveValue('');
  await fs.mkdir(path.resolve('docs/research/screenshots'),{recursive:true});
  await page.screenshot({path:path.resolve('docs/research/screenshots/ai-proposal.png')});
  await page.getByRole('button',{name:'采纳',exact:true}).click();await expect(page.getByLabel('正文编辑器')).toHaveValue('门外响了三下。林遥放下信，走到门边。');
  expect(received[0].messages[0].content).toContain('中文生成约束');
  const settings=await page.evaluate(async()=>{const s=await window.composer.load();return window.composer.getSettings(s.activeWorkspaceId);});
  expect(JSON.stringify(settings)).not.toContain('fixture-key-not-real');
});
test('AI context includes selected assets, not another workspace',async()=>{
  await configureAI();await newDocument('林遥','character');await saveText('她是邮局唯一的员工。');
  await page.getByRole('button',{name:/01.*第一章/}).click();await page.getByRole('button',{name:/参考设定/}).click();await page.getByLabel('林遥',{exact:true}).check();
  await page.getByLabel('这一章要发生什么？').fill('起笔');await page.getByRole('button',{name:'生成正文提案'}).click();await expect(page.getByTestId('ai-proposal')).toBeVisible();
  expect(received[0].messages[1].content).toContain('她是邮局唯一的员工。');
});
test('polishing is whole-chapter proposal and stale result is rejected',async()=>{
  await configureAI();await saveText('原始正文');await page.getByRole('button',{name:'优化表达',exact:true}).click();
  await page.getByLabel('希望怎样调整表达？').fill('保留结构，让动作具体');await page.getByRole('button',{name:'生成优化提案'}).click();
  await expect(page.getByTestId('ai-proposal')).toBeVisible();await saveText('作者后来改动了正文');await page.getByRole('button',{name:'采纳',exact:true}).click();
  await expect(page.getByRole('alert')).toContainText('正文已变化');await expect(page.getByLabel('正文编辑器')).toHaveValue('作者后来改动了正文');
  await page.screenshot({path:path.resolve('docs/research/screenshots/stale-proposal-error.png')});
});
test('continuation appends once, discard leaves draft unchanged',async()=>{
  await configureAI();await saveText('雨停了。');await page.getByRole('button',{name:'续写',exact:true}).click();await page.getByLabel('这一章要发生什么？').fill('有人敲门');
  await page.getByRole('button',{name:'生成正文提案'}).click();await expect(page.getByTestId('ai-proposal')).toBeVisible();await page.getByRole('button',{name:'放弃',exact:true}).click();await expect(page.getByLabel('正文编辑器')).toHaveValue('雨停了。');
  await page.getByRole('button',{name:'生成正文提案'}).click();await expect(page.getByTestId('ai-proposal')).toBeVisible();await page.getByRole('button',{name:'采纳',exact:true}).click();
  await expect(page.getByLabel('正文编辑器')).toHaveValue('雨停了。\n\n门外响了三下。林遥放下信，走到门边。');
});
test('AI errors and cancel do not mutate document or create proposals',async()=>{
  await configureAI();await page.getByLabel('这一章要发生什么？').fill('起笔');mode='error';
  await page.getByRole('button',{name:'生成正文提案'}).click();await expect(page.getByRole('alert')).toContainText('请求受限');mode='slow';
  await page.getByRole('button',{name:'生成正文提案'}).click();await expect(page.getByRole('button',{name:'取消生成'})).toBeVisible();await page.getByRole('button',{name:'取消生成'}).click();
  await expect(page.getByRole('alert')).toContainText('取消');await expect(page.getByLabel('正文编辑器')).toHaveValue('');await expect(page.getByTestId('ai-proposal')).toHaveCount(0);
});
test('external edit conflict preserves external content and current unsaved input',async()=>{
  const s=await page.evaluate(()=>window.composer.load());const w=s.workspaces[0];const doc=w.documents[0];
  await fs.writeFile(path.join(w.path,'07-writing/chapters',doc.id+'.md'),'外部作者的改稿','utf8');
  await page.getByLabel('正文编辑器').fill('当前编辑区的改稿');await expect(page.getByRole('alert')).toContainText('其他操作修改');
  await expect(page.getByLabel('正文编辑器')).toHaveValue('当前编辑区的改稿');
  expect(await fs.readFile(path.join(w.path,'07-writing/chapters',doc.id+'.md'),'utf8')).toBe('外部作者的改稿');
  // Restore the external file solely so teardown can flush without intentionally blocking close.
  await fs.writeFile(path.join(w.path,'07-writing/chapters',doc.id+'.md'),'','utf8');
});
test('renderer cannot access Node; untrusted text is never executed',async()=>{
  expect(await page.evaluate(()=>typeof window.require)).toBe('undefined');
  await saveText('<script>window.hacked=true</script>');expect(await page.evaluate(()=>window.hacked)).toBeUndefined();
  const result=await app.evaluate(({BrowserWindow})=>{const win=BrowserWindow.getAllWindows()[0];return win.webContents.getLastWebPreferences();});
  expect(result.nodeIntegration).toBe(false);expect(result.contextIsolation).toBe(true);expect(result.sandbox).toBe(true);
});
test('export UI writes only manuscript through the save dialog',async()=>{
  await saveText('仅导出这个正文');await newDocument('秘密角色','character');await saveText('这段资料不导出');
  const output=path.join(root,'export.md');
  await app.evaluate(({dialog},output)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:output});},output);
  await page.getByRole('button',{name:/导出文稿/}).click();await expect(page.getByRole('status').filter({hasText:'已导出'})).toBeVisible();
  const text=await fs.readFile(output,'utf8');expect(text).toContain('仅导出这个正文');expect(text).not.toContain('这段资料不导出');
});
test('open directory UI restores an existing local workspace',async()=>{
  await saveText('已有目录里的正文');const s=await page.evaluate(()=>window.composer.load());const original=s.workspaces[0];
  await page.getByRole('button',{name:'新建',exact:true}).click();const d=page.getByRole('dialog');await d.getByLabel('名称',{exact:true}).fill('临时切换');await d.getByRole('button',{name:'创建',exact:true}).click();
  await app.evaluate(({dialog},folder)=>{dialog.showOpenDialog=async()=>({canceled:false,filePaths:[folder]});},original.path);
  await page.getByRole('button',{name:'打开目录',exact:true}).click();await expect(page.getByLabel('正文编辑器')).toHaveValue('已有目录里的正文');
});
test('reading size and palette change presentation but never manuscript',async()=>{
  await saveText('正文不能随主题改变。');await page.getByLabel('阅读字号').selectOption('large');await page.getByLabel('配色方案').selectOption('mono');
  await expect(page.locator('html')).toHaveAttribute('data-scheme','mono');await expect(page.locator('.writing-area')).toHaveClass(/large/);
  await page.getByLabel('阅读字号').selectOption('standard');await page.getByLabel('配色方案').selectOption('pine');
  await expect(page.getByLabel('正文编辑器')).toHaveValue('正文不能随主题改变。');await page.getByRole('button',{name:'使用说明',exact:true}).click();await expect(page.getByRole('dialog')).toContainText('会话保存');
});
test('invalid settings report error inside modal and preserve the draft',async()=>{
  await saveText('保留稿件');await page.getByRole('button',{name:'模型设置',exact:true}).click();const d=page.getByRole('dialog');
  await d.getByLabel('API 基础地址').fill('http://unsafe.example/v1');await d.getByLabel('模型名称').fill('fixture');await d.getByLabel('API 密钥').fill('fixture-key-not-real');
  await d.getByRole('button',{name:'保存模型设置'}).click();await expect(d.getByRole('alert')).toContainText('HTTPS');
  await d.getByRole('button',{name:'关闭对话框'}).click();await expect(page.getByLabel('正文编辑器')).toHaveValue('保留稿件');
});
test('child frame cannot invoke privileged workspace operations',async()=>{
  await page.evaluate(()=>{const f=document.createElement('iframe');f.id='untrusted-frame';f.src='composer://app/';document.body.appendChild(f);});
  await expect(page.frameLocator('#untrusted-frame').getByTestId('composer-app')).toBeAttached();
  const handle=await page.locator('#untrusted-frame').elementHandle();const frame=await handle.contentFrame();
  expect(await frame.evaluate(()=>typeof window.composer)).toBe('undefined');
  expect(await frame.evaluate(()=>typeof window.require)).toBe('undefined');
  await expect(page.locator('#root').getByLabel('正文编辑器')).toHaveValue('');
});
