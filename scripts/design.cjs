const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'docs/research');
const css=fs.readFileSync(path.join(root,'src/styles.css'),'utf8');
const extract=(selector,text=css)=>{
  const start=text.indexOf(selector+'{');assert.ok(start>=0,selector);
  const block=text.slice(start+selector.length+1,text.indexOf('}',start));
  return Object.fromEntries([...block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)].map(m=>[m[1],m[2].trim()]));
};
const base=extract(':root');
const tokens={
  pine:{light:base,dark:{...base,...extract('[data-theme=dark]')}},
  mono:{light:{...base,...extract('[data-scheme=mono]')},dark:{...base,...extract('[data-theme=dark]'),...extract('[data-scheme=mono]'),...extract('[data-scheme=mono][data-theme=dark]')}}
};
const json=JSON.stringify(tokens);
const luminance=hex=>{
  const c=hex.slice(1).match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return c[0]*.2126+c[1]*.7152+c[2]*.0722;
};
const ratio=(a,b)=>{const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const pairs=[
  ...['bg','surface','sidebar','subtle','selected'].flatMap(bg=>[['text',bg,4.5],['muted',bg,4.5]]),
  ['accent','bg',4.5],['accent','surface',4.5],['accent','selected',4.5],['on-accent','accent',4.5],
  ['danger','danger-bg',4.5],['control-line','bg',3],['control-line','surface',3],['control-line','sidebar',3],['accent','sidebar',3]
];
const measurements=Object.entries(tokens).flatMap(([scheme,modes])=>Object.entries(modes).flatMap(([mode,t])=>pairs.map(([fg,bg,min])=>({scheme,mode,fg,bg,min,ratio:ratio(t[fg],t[bg])}))));
const failed=measurements.filter(p=>p.ratio<p.min);
if(failed.length)throw Error('Contrast failed: '+JSON.stringify(failed));
const verify=(spec,html)=>{
  const specData=JSON.parse(spec.match(/<!-- TOKEN_JSON:(.*?) -->/s)?.[1]||'null');
  const htmlData=JSON.parse(html.match(/<script id="design-tokens" type="application\/json">(.*?)<\/script>/s)?.[1]||'null');
  assert.deepEqual(specData,tokens,'Specification token drift');
  assert.deepEqual(htmlData,tokens,'Showcase token drift');
  const renderedCSS=html.match(/<style>(.*?)<\/style>/s)?.[1]||'';
  for(const selector of [':root','[data-theme=dark]','[data-scheme=mono]','[data-scheme=mono][data-theme=dark]']){
    assert.deepEqual(extract(selector,renderedCSS),extract(selector),'Showcase CSS token drift');
  }
  for(const [name,value]of Object.entries(base)){
    const row=spec.split('\n').find(line=>line.startsWith(`| \`--${name}\` |`));
    assert.ok(row,`Missing specification token ${name}`);
    const columns=row.split('|').slice(2,6).map(v=>v.trim());
    assert.deepEqual(columns,[value,tokens.pine.dark[name],tokens.mono.light[name],tokens.mono.dark[name]],'Specification table token drift');
  }
  assert.ok(!/var\(--(?:game|print|terminal)-/.test(html),'Undeclared cross-surface token');
  const known=new Set(Object.keys(base));
  for(const m of html.matchAll(/var\(--([\w-]+)\)/g))assert.ok(known.has(m[1]),`Unknown token ${m[1]}`);
};
if(process.argv.includes('--check')){
  const spec=fs.readFileSync(path.join(dir,'08-设计规范.md'),'utf8'),html=fs.readFileSync(path.join(dir,'design-showcase.html'),'utf8');
  verify(spec,html);
  const changed=html.replace('"bg":"#f6f5f1"','"bg":"#000000"');assert.notEqual(changed,html);
  assert.throws(()=>verify(spec,changed),/Showcase token drift/);
  assert.throws(()=>verify(spec,html.replace('--bg:#f6f5f1','--bg:#000000')),/Showcase CSS token drift/);
  assert.throws(()=>verify(spec.replace('| #f6f5f1 |','| #000000 |'),html),/Specification table token drift/);
  console.log(`Design check passed: 4 schemes/modes, ${measurements.length} contrast pairs; 3 token-drift mutations rejected.`);process.exit(0);
}
const table=Object.keys(base).map(name=>`| \`--${name}\` | ${tokens.pine.light[name]} | ${tokens.pine.dark[name]} | ${tokens.mono.light[name]} | ${tokens.mono.dark[name]} |`).join('\n');
const results=measurements.map(p=>`| ${p.scheme}/${p.mode} | ${p.fg} / ${p.bg} | ${p.ratio.toFixed(2)} | ${p.min} |`).join('\n');
const spec=`# Icimik Composer 设计规范

本规范为 Greenfield 目标，设计值标为“本项目设计”；实际 token 来源是 \`src/styles.css\`。根据作者的 [design-system skill](https://github.com/kimmywork/skills/blob/master/drafting/skills/design-system/SKILL.md) 同时生成规范和自包含 showcase；展示页不是产品功能替代品。

## 用户与表面边界

专业程序员兼中文作者，在 macOS／Windows 反复进行长文写作、设定检索、表达优化与提案裁决。系统控制 Electron 渲染器和浏览器设计展示；不控制 OS 对话框、Keychain、Windows DPAPI、外部模型网站、终端或未来游戏播放器的颜色。

当前两个品牌配色 scheme 为松墨 pine、石墨 mono；每个均有 light／dark 明暗 mode。配色和阅读字号只作用于当前 UI，不改变文字数据，不自动影响未来 IF／印刷表面。OS forced-colors 使用系统角色，不强行保留品牌色。

## 原则与理由

- **正文先于工具**：正文是主要工作对象，避免仪表盘和复杂 AI 控件占据写作区。
- **保存可感知**：状态紧邻当前文稿；失败保留输入，因为无反馈会诱发重复操作。
- **提案先于覆盖**：模型输出先审阅再采纳，因为“生成完成”不等于“创作决定”。
- **会话不复制正文**：不同工作上下文共享唯一正式稿，降低版本混淆。
- **界面和小说两种语体**：无衬线 UI 与衬线长文各有角色，便于从操作回到阅读。
- **克制动态**：只为操作反馈使用短转场，正文不移动，降低长时工作疲劳。

## 颜色与 token

全部为本项目设计值，不从 showcase 示例抽取虚构品牌色。表中通用字体／间距值故意共用，颜色在各 scheme／mode 独立定义。长文可较大字号，控件不因用户文稿风格而改变。

| Token | 松墨／明 | 松墨／暗 | 石墨／明 | 石墨／暗 |
|---|---|---|---|---|
${table}

## 排版、文案与布局

中文正文采用 Songti／Noto Serif CJK／SimSun／Georgia 回退；界面采用 OS 字体和中文无衬线回退，全部离线可读。只发布中文 UI；英文 MANUSCRIPT／STRUCTURE 是辅助分类，不替代中文说明。

正文 18px、行高 2.1，较大 22px；UI 12–17px；章标题 28px。正文区域建议阅读 measure 680px，桌面边栏分别 244px／310px。最小产品窗口 900×640；小于 720px 的展示按纵向布局，不将其宣称为移动 App。

| 术语 | 使用 | 避免 | 理由 |
|---|---|---|---|
| 工作区 | 作品及资料隔离边界 | 账号、云空间 | 当前无账号与同步 |
| 会话 | 文档位置、指令、提案 | 新稿、正文副本 | 正文唯一 |
| 提案 | 待作者裁决的 AI 产物 | 自动完成、最终稿 | 不混淆生成与批准 |
| 采纳 | 明确写入正文 | 一键优化完成 | 标示实质后果 |
| 放弃 | 丢弃提案，不改正文 | 删除作品 | 区分对象 |
| 已保存 | 真实写入成功 | 自动同步 | 无远程同步 |
| 保存失败 | 内容保留，并给恢复步骤 | 出错了 | 可行动的反馈 |

## 组件规范

- **按钮**：主操作只用于生成／创建／保存设置；32px 最小控件，高频主按钮 40px；图标按钮都有可访问名称。禁用配文字原因，不依靠颜色。
- **输入**：标签始终可见，placeholder 只作示例；正文不限制局部手动修改；有效边界采用 control-line，装饰分隔采用 line。
- **文档树**：标题超长省略而不挤掉序号；选择态以背景＋状态点和语义共同表达。
- **会话 tab**：aria-selected 与下划线标示当前会话；过多会话横向滚动，不压缩名称至不可读。
- **提案**：任务类型、正文和采纳／放弃相邻；不同章节提案不能在当前章采纳。
- **消息**：失败与成功包含文字，role=alert／status；对话框内错误在框内显示。
- **Dialog**：使用原生 dialog 的焦点约束与 Escape；关闭不采纳未提交数据。
- **状态卡**：空、加载、错误、生成中和成功在对应位置展示；不以无功能样板按钮假装完成。

## 动态与可访问性

转场只使用 fast=120ms，prefers-reduced-motion 下移除；正文内容和游标不动画。forced-colors 保留 OS 调色板、明显边界、标签与文字。支持键盘、带名称控件、正常 Tab 顺序和 dialog 焦点。

文本对比最低 4.5:1，有意义的控件边界／focus 最低 3:1。装饰 line 不表达交互边界，不列作需 3:1 的 meaningful pair；透明悬停态落在 subtle，同样测文本。禁用态与 OS 原生 popup 控件另作原生验收，不因这里通过就声称完整 WCAG 合规。

| 模式 | 前景／背景 | 实测 | 阈值 |
|---|---|---|---|
${results}

## 验证与未决

\`npm run design:check\` 比较 CSS 源、规范内嵌 JSON 与 showcase JSON，验证所有声明 token 和颜色对，检查未声明的跨表面引用，并故意改色证明漂移检查会失败。展示含主题／方案切换、由实际 section 生成的目录、写作／提案／错误／空态场景与实时对比表。

检查覆盖 token 和已枚举配对，不声称静态分析所有 CSS 几何或未来组件；实际窗口布局、缩放、字体与中文 IME 仍需截图和原生人工验收。正文 measure 和组件密度需要作者试写后确认；scheme／字号当前不跨启动持久化。

<!-- TOKEN_JSON:${json} -->
`;
const html=`<!doctype html><html lang="zh-CN" data-theme="light" data-scheme="pine"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Icimik Composer · Design system</title><style>
${css.slice(0,css.indexOf('*{'))}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:var(--base) var(--ui)}button,select,textarea{font:inherit;color:inherit}button,select{background:var(--surface);border:1px solid var(--control-line);padding:var(--s2) var(--s3);border-radius:var(--radius);min-height:var(--target);cursor:pointer}button:focus-visible,select:focus-visible,textarea:focus-visible,a:focus-visible{outline:2px solid var(--accent);outline-offset:var(--s1)}a{color:var(--accent)}header,main{padding:var(--s6);max-width:calc(var(--measure) * 2);margin:auto}header{display:flex;gap:var(--s4);align-items:center;flex-wrap:wrap;border-bottom:1px solid var(--line)}h1{font-size:var(--title);font-weight:500;margin:0}h2{font-size:var(--lg);font-weight:600}p{line-height:1.9}nav{display:flex;gap:var(--s4);flex-wrap:wrap}section{margin-bottom:var(--s10)}.controls{margin-left:auto;display:flex;gap:var(--s3);flex-wrap:wrap}.scene{border:1px solid var(--control-line);border-radius:var(--radius);overflow:hidden;background:var(--surface)}.scene-head{display:flex;justify-content:space-between;align-items:center;gap:var(--s3);padding:var(--s4);border-bottom:1px solid var(--line)}.scene-grid{display:grid;grid-template-columns:var(--sidebar-width) minmax(0,1fr) var(--ai-width)}.tree{background:var(--sidebar);padding:var(--s5);border-right:1px solid var(--line)}.tree button{display:block;width:100%;text-align:left;margin-bottom:var(--s2)}.tree p{color:var(--muted);font-size:var(--xs)}.prose{padding:var(--s8);font-family:var(--prose)}.prose textarea{width:100%;min-height:calc(var(--s12)*4);border:0;background:transparent;font:var(--prose-size)/2.1 var(--prose);resize:vertical}.prose h3{font-size:var(--title);font-weight:400}.assistant{padding:var(--s5);border-left:1px solid var(--line)}.primary{background:var(--accent);color:var(--on-accent)}.card{padding:var(--s5);border:1px solid var(--control-line);border-radius:var(--radius);background:var(--surface)}.muted{color:var(--muted);font-size:var(--sm)}.states{display:grid;grid-template-columns:repeat(auto-fit,minmax(var(--sidebar-width),1fr));gap:var(--s4)}.error{color:var(--danger);background:var(--danger-bg);padding:var(--s4)}.success{color:var(--accent);background:var(--selected);padding:var(--s4)}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;font-size:var(--xs)}td,th{padding:var(--s2);border-bottom:1px solid var(--line);text-align:left;overflow-wrap:anywhere}.tokens{font-family:var(--mono)}.compact{--s5:16px;--s8:24px}.status{font-size:var(--xs);color:var(--muted)}@media(max-width:940px){.scene-grid{grid-template-columns:minmax(0,1fr)}.tree,.assistant{border:0;border-bottom:1px solid var(--line)}.controls{margin-left:0}.prose{padding:var(--s5)}}@media(prefers-reduced-motion:reduce){*{transition:none}}@media(forced-colors:active){button,select{border-color:ButtonText}.primary{background:ButtonFace;color:ButtonText}}
</style></head><body><header><svg width="26" height="26" viewBox="0 0 26 26" aria-label="Composer 标志"><path d="M5 4h7v17H5zM14 4h7v17h-7z" fill="none" stroke="currentColor"/></svg><h1>Icimik Composer · 设计系统</h1><div class="controls"><label>方案 <select id="scheme"><option value="pine">松墨</option><option value="mono">石墨</option></select></label><label>明暗 <select id="mode"><option value="light">明</option><option value="dark">暗</option></select></label><label>密度 <select id="density"><option value="comfortable">舒适</option><option value="compact">紧凑</option></select></label></div></header><main><nav id="toc" aria-label="章节目录"></nav>
<section id="writing"><h2>完整场景 · 写作与提案</h2><p class="muted">设计场景，不调用 AI、不保存文稿；可体验编辑、选择与提案裁决。</p><div class="scene"><div class="scene-head"><strong>雾港来信 / 样章创作</strong><span class="status" id="save-status">已保存（展示）</span></div><div class="scene-grid"><aside class="tree"><p>作品资料</p><button id="chapter">第一章 · 迟来的信</button><button id="character">人物 · 林遥</button><p>会话共享唯一正文，提案独立保留。</p></aside><div class="prose"><h3 id="title">第一章 · 迟来的信</h3><textarea id="manuscript" aria-label="展示正文">雨停在凌晨四点。\n\n林遥推开邮局的门。柜台后的老人没抬头，只把一封信推到灯下。\n\n“你的。”</textarea></div><aside class="assistant"><h2>创作助手</h2><p class="muted">当前章 + 指令 + 所选设定 + 中文约束</p><div class="card"><p id="proposal">信封上的名字是她的。邮戳却是二十年前。</p><button id="discard">放弃</button> <button class="primary" id="accept">采纳</button></div><p class="status" id="decision" role="status">提案尚未写入正文。</p></aside></div></div></section>
<section id="states"><h2>交互状态</h2><div class="states"><div class="card"><h3>空状态</h3><p class="muted">还没有提案。先描述这一章的任务。</p><button id="reset">重置场景</button></div><div class="card"><h3>生成中</h3><p class="muted" id="generation">正在等待模型（展示）</p><button id="cancel">取消生成</button></div><div class="card"><h3>错误与恢复</h3><p class="error" role="alert">正文已变化，不能采纳旧提案。请基于新正文重新生成。</p><p class="success">已恢复快照，恢复前的正文也已保留。</p></div><div class="card"><h3>焦点与禁用</h3><p class="muted">用 Tab 检查焦点。状态总有文字，不只靠颜色。</p><button disabled>正在保存</button></div></div></section>
<section id="contrast"><h2>实时对比度</h2><p class="muted">当前方案／明暗：<span id="active-mode"></span>。普通文本 ≥ 4.5，有意义边界 ≥ 3；装饰分隔线不作交互边界。</p><div class="table-wrap"><table><thead><tr><th>前景</th><th>背景</th><th>比值</th><th>阈值</th><th>结果</th></tr></thead><tbody id="contrast-body"></tbody></table></div></section>
<section id="tokens"><h2>完整 token 表</h2><div class="table-wrap"><table class="tokens"><thead><tr><th>名称</th><th>当前值</th></tr></thead><tbody id="tokens-body"></tbody></table></div></section>
<section id="boundary"><h2>表面边界与验证</h2><p>此页面只控制创作工作台的视觉语言，不改变 OS 弹窗、终端、未来 IF 播放器或印刷稿。所有字体离线回退；无 CDN、无构建步骤、无外部资源。</p><p>规范与展示由同一 CSS token 源生成。design:check 对四个方案／明暗组合计算配对，解析规范和展示并检测漂移，故意改色的反例必须失败。</p></section></main>
<script id="design-tokens" type="application/json">${json}</script><script>
const tokens=JSON.parse(document.getElementById('design-tokens').textContent);
const pairs=${JSON.stringify(pairs)};
const lum=${luminance.toString()},ratio=${ratio.toString().replaceAll('luminance','lum')};
const el=id=>document.getElementById(id);
function render(){const scheme=el('scheme').value,mode=el('mode').value,t=tokens[scheme][mode];document.documentElement.dataset.scheme=scheme;document.documentElement.dataset.theme=mode;el('active-mode').textContent=scheme+' / '+mode;el('contrast-body').innerHTML=pairs.map(([fg,bg,min])=>{const r=ratio(t[fg],t[bg]);return '<tr><td>'+fg+'</td><td>'+bg+'</td><td>'+r.toFixed(2)+'</td><td>'+min+'</td><td>'+(r>=min?'通过':'失败')+'</td></tr>';}).join('');el('tokens-body').innerHTML=Object.entries(t).map(([name,value])=>'<tr><td>--'+name+'</td><td>'+value+'</td></tr>').join('');}
el('mode').onchange=el('scheme').onchange=render;el('density').onchange=()=>document.body.classList.toggle('compact',el('density').value==='compact');
const original=el('manuscript').value;el('manuscript').oninput=()=>el('save-status').textContent='展示编辑中，不保存';
el('accept').onclick=()=>{el('manuscript').value+='\\n\\n'+el('proposal').textContent;el('decision').textContent='已采纳（展示），可重置。';el('accept').disabled=true;el('discard').disabled=true;};
el('discard').onclick=()=>{el('decision').textContent='已放弃，正文未改动。';el('accept').disabled=true;el('discard').disabled=true;};
el('cancel').onclick=()=>{el('generation').textContent='已取消，正文未改动。';};
el('reset').onclick=()=>{el('manuscript').value=original;el('accept').disabled=false;el('discard').disabled=false;el('decision').textContent='提案尚未写入正文。';el('title').textContent='第一章 · 迟来的信';el('save-status').textContent='已保存（展示）';};
el('character').onclick=()=>{el('title').textContent='人物 · 林遥';el('manuscript').value='林遥：在雾港邮局工作。父亲的旧信是她一直没有拆开的东西。';};
el('chapter').onclick=()=>{el('title').textContent='第一章 · 迟来的信';el('manuscript').value=original;};
el('toc').innerHTML=Array.from(document.querySelectorAll('main>section')).map(s=>'<a href="#'+s.id+'">'+s.querySelector('h2').textContent+'</a>').join('');render();
</script></body></html>`;
fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'08-设计规范.md'),spec);fs.writeFileSync(path.join(dir,'design-showcase.html'),html);
verify(spec,html);console.log(`Generated specification and offline showcase; ${measurements.length} contrast pairs passed.`);
