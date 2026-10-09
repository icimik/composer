import { useState, useEffect, useRef, useCallback } from 'react';
import { BookOpen, FileText, Users, Globe2, ListTree, Feather, Plus, Settings2, PanelRightClose, PanelRightOpen, Focus, Moon, Sun, Search, ArrowUpRight, Clock3, Check, FolderOpen, Download, X, RotateCcw, Sparkles, ChevronDown, CircleHelp } from 'lucide-react';
import type { AppState, Workspace, Document, Kind, Settings, Snapshot } from './types';
import { previewBridge } from './preview';

const bridge=window.composer || previewBridge();
const desktop=!!window.composer;
const kinds:{id:Kind;label:string;icon:typeof FileText}[]=[
  {id:'chapter',label:'章节',icon:FileText},{id:'outline',label:'大纲',icon:ListTree},
  {id:'character',label:'人物',icon:Users},{id:'world',label:'世界观',icon:Globe2},{id:'style',label:'风格规范',icon:Feather}
];
const checkLabels=['推进目标明确','人物动机一致','冲突有实际后果','章尾留下钩子','中文表达自然'];
const stages=['立项','设定','大纲','样章','写作','审阅','发布'];
const cleanError=(e:unknown)=>String(e instanceof Error?e.message:e).replace(/^Error invoking remote method '[^']+': Error: /,'');
const count=(text:string)=>Array.from(text.replace(/\s/g,'')).length;
function Logo(){return <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-label="Icimik Composer"><path d="M5 4h7v17H5zM14 4h7v17h-7z" stroke="currentColor" strokeWidth="1.5"/><path d="M8 8h2M8 12h2M16 8h3M16 12h3M12 21l1 1 1-1" stroke="currentColor" strokeWidth="1.5"/></svg>;}
function Dialog({title,children,onClose}:{title:string;children:React.ReactNode;onClose:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{ref.current?.showModal();return()=>ref.current?.close();},[]);
  return <dialog ref={ref} onCancel={e=>{e.preventDefault();onClose();}} aria-label={title}><div className="dialog-header"><h2>{title}</h2><button className="icon-button" aria-label="关闭对话框" onClick={onClose}><X size={18}/></button></div>{children}</dialog>;
}
export function App(){
  const [state,setState]=useState<AppState|null>(null);
  const [draft,setDraft]=useState(''),[title,setTitle]=useState(''),[prompt,setPrompt]=useState('');
  const [status,setStatus]=useState('已保存'),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const [view,setView]=useState<'write'|'outline'|'review'>('write');
  const [focus,setFocus]=useState(false),[panel,setPanel]=useState(true);
  const [dialog,setDialog]=useState<''|'workspace'|'document'|'session'|'settings'|'history'|'commands'|'help'>('');
  const [name,setName]=useState(''),[newKind,setNewKind]=useState<Kind>('chapter');
  const [settings,setSettings]=useState<Settings>({endpoint:'https://api.openai.com/v1',model:'',hasKey:false}),[key,setKey]=useState('');
  const [contextIds,setContextIds]=useState<string[]>([]),[showContext,setShowContext]=useState(false);
  const [busy,setBusy]=useState(false),[action,setAction]=useState('generate'),[history,setHistory]=useState<Snapshot[]>([]);
  const [query,setQuery]=useState(''),[fontSize,setFontSize]=useState('standard');
  const [scheme,setScheme]=useState('pine');
  const live=useRef({state,draft,title,prompt});
  live.current={state,draft,title,prompt};
  const request=useRef('');
  const saving=useRef<Promise<void>>(Promise.resolve());
  const timer=useRef<ReturnType<typeof setTimeout>|null>(null);
  const w=state?.workspaces.find(w=>w.id===state.activeWorkspaceId);
  const session=w?.sessions.find(s=>s.id===w.activeSessionId);
  const doc=w?.documents.find(d=>d.id===session?.documentId);
  const dirty=doc&&(draft!==doc.content||title!==doc.title||prompt!==session?.prompt);
  const pending=session?.proposals.filter(p=>p.status==='pending')||[];
  useEffect(()=>{
    if(pending.length)requestAnimationFrame(()=>document.querySelector('.ai-content .proposal:last-child')?.scrollIntoView({block:'nearest'}));
  },[pending.length]);
  const update=(next:Workspace)=>{
    setState(s=>s?{...s,workspaces:s.workspaces.map(w=>w.id===next.id?next:w)}:s);
  };
  const hydrate=(s:AppState)=>{
    const w=s.workspaces.find(w=>w.id===s.activeWorkspaceId)!;const se=w.sessions.find(se=>se.id===w.activeSessionId)!;
    const d=w.documents.find(d=>d.id===se.documentId)!;
    setState(s);setDraft(d.content);setTitle(d.title);setPrompt(se.prompt);setContextIds([]);setStatus('已保存');
  };
  useEffect(()=>{bridge.load().then(hydrate).catch(e=>setError(cleanError(e)));},[]);
  const flush=useCallback(async()=>{
    if(timer.current){clearTimeout(timer.current);timer.current=null;}
    // Serialize renderer saves so a queued save reads the latest returned revision.
    const task=saving.current.then(async()=>{
      const {state:s,draft,title,prompt}=live.current;if(!s)return;
      const w=s.workspaces.find(w=>w.id===s.activeWorkspaceId)!;const se=w.sessions.find(se=>se.id===w.activeSessionId)!;
      const d=w.documents.find(d=>d.id===se.documentId)!;
      if(draft===d.content&&title===d.title&&prompt===se.prompt)return;
      setStatus('保存中');
      try {
        let result=d;
        if(draft!==d.content||title!==d.title) result=await bridge.saveDocument(w.id,d.id,title,draft,d.hash);
        const next=await bridge.updateSession(w.id,se.id,d.id,prompt);
        next.documents=next.documents.map(item=>item.id===result.id?result:item);
        // Preserve edits made while the save was in flight.
        const current=live.current.state;
        if(current){const updated={...current,workspaces:current.workspaces.map(item=>item.id===next.id?next:item)};live.current.state=updated;setState(updated);}
        setStatus(live.current.draft===result.content&&live.current.title===result.title&&live.current.prompt===prompt?'已保存':'待保存');
      }catch(e){setStatus('保存失败');setError(cleanError(e));throw e;}
    });
    saving.current=task.catch(()=>{});return task;
  },[]);
  useEffect(()=>{
    if(!dirty)return;setStatus('待保存');
    timer.current=setTimeout(()=>{void flush().catch(()=>{});},700);
    return()=>{if(timer.current)clearTimeout(timer.current);};
  },[draft,title,prompt,dirty,flush]);
  useEffect(()=>{
    const fn=()=>{void flush().then(()=>{(window as Window&{composerClose?:()=>Promise<void>}).composerClose?.();}).catch(()=>{});};
    window.addEventListener('composer-before-close',fn);return()=>window.removeEventListener('composer-before-close',fn);
  },[flush]);
  const run=async(fn:()=>Promise<void>)=>{setError('');try{await fn();}catch(e){setError(cleanError(e));}};
  const switchTo=async(wid:string,sid?:string)=>{
    if(busy)throw Error('请先取消生成，再切换工作区或会话。');
    await flush();
    const next=sid?await bridge.switchSession(wid,sid):await bridge.switchWorkspace(wid);
    const s=live.current.state!;hydrate({...s,activeWorkspaceId:wid,workspaces:s.workspaces.map(item=>item.id===next.id?next:item)});
  };
  const selectDoc=async(id:string)=>{
    if(busy)throw Error('请先取消生成，再切换章节。');
    await flush();const next=await bridge.updateSession(w!.id,session!.id,id,prompt);
    const d=next.documents.find(d=>d.id===id)!;update(next);setDraft(d.content);setTitle(d.title);setStatus('已保存');setView('write');
  };
  const openSettings=async()=>{if(!w)return;await flush();setSettings(await bridge.getSettings(w.id));setKey('');setDialog('settings');};
  const openHistory=async()=>{await flush();setHistory(await bridge.snapshots(w!.id,doc!.id));setDialog('history');};
  const theme=async()=>{
    const next=state?.theme==='dark'?'light':'dark';await bridge.setTheme(next);setState(s=>s?{...s,theme:next}:s);
  };
  useEffect(()=>{document.documentElement.dataset.theme=state?.theme||'light';},[state?.theme]);
  useEffect(()=>{document.documentElement.dataset.scheme=scheme;},[scheme]);
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='s'){e.preventDefault();void flush().catch(()=>{});}
      if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();setDialog('commands');}
      if(e.key==='F8'){e.preventDefault();setFocus(f=>!f);}
      if(e.key==='Escape'&&focus)setFocus(false);
    };window.addEventListener('keydown',fn);return()=>window.removeEventListener('keydown',fn);
  },[flush,focus]);
  const generate=async()=>{
    await flush();const current=live.current.state!.workspaces.find(item=>item.id===w!.id)!;
    if(current.documents.find(d=>d.id===doc!.id)!.content.trim()&&action==='generate')throw Error('已有正文，请选择续写或优化表达；新生成用于空章节。');
    setBusy(true);setNotice('');const id=crypto.randomUUID();request.current=id;
    try {
      await bridge.generate(w!.id,session!.id,doc!.id,action,prompt,contextIds,id);
      const next=await bridge.switchSession(w!.id,session!.id);update(next);
      setNotice('提案已生成，正文尚未改动。');
    }finally{setBusy(false);request.current='';}
  };
  const resolve=async(pid:string,accept:boolean)=>{
    await flush();const next=await bridge.resolveProposal(w!.id,session!.id,pid,accept);update(next);
    const d=next.documents.find(d=>d.id===doc!.id)!;setDraft(d.content);setTitle(d.title);setNotice(accept?'已采纳，原文已保留为历史快照。':'已放弃提案，正文未改动。');
  };
  const create=async()=>{
    if(busy)throw Error('请先取消生成，再创建工作区、会话或文档。');
    await flush();
    if(dialog==='workspace'){const s=await bridge.createWorkspace(name);hydrate(s);}
    if(dialog==='session'){const next=await bridge.createSession(w!.id,name);const s=live.current.state!;hydrate({...s,workspaces:s.workspaces.map(w=>w.id===next.id?next:w)});}
    if(dialog==='document'){const d=await bridge.createDocument(w!.id,name,newKind);const next=await bridge.updateSession(w!.id,session!.id,d.id,prompt);update(next);setDraft('');setTitle(d.title);setView('write');}
    setDialog('');setName('');
  };
  if(!state||!w||!doc||!session)return <main className="loading"><Logo/><h1>Icimik Composer</h1><p role={error?'alert':'status'}>{error||'正在打开本地工作区…'}</p></main>;
  const total=w.documents.filter(d=>d.kind==='chapter').reduce((n,d)=>n+count(d.id===doc.id?draft:d.content),0);
  const isChapter=doc.kind==='chapter';
  return <div className={`app ${focus?'focused':''} ${panel?'':'panel-hidden'}`} data-testid="composer-app">
    {!desktop&&<div className="preview-banner">界面预览 · 内容仅在本次浏览中暂存，关闭后不保留；本地文件与 AI 功能请使用桌面 App。</div>}
    <header className="app-header">
      <div className="brand"><Logo/><strong>Icimik <span>Composer</span></strong><span className="version">0.1</span></div>
      <div className="header-center"><span className="local-mark"/><span>本地工作区</span><span className="slash">/</span><span>{w.name}</span></div>
      <div className="header-actions"><button onClick={()=>setDialog('commands')} className="command-button" aria-label="打开命令面板"><Search size={15}/><span>快速操作</span><kbd>⌘ / Ctrl K</kbd></button><button className="icon-button" aria-label="切换明暗主题" onClick={()=>void run(theme)}>{state.theme==='dark'?<Sun size={17}/>:<Moon size={17}/>}</button><button className="icon-button" aria-label="使用说明" onClick={()=>setDialog('help')}><CircleHelp size={17}/></button></div>
    </header>
    <div className="workspace-layout">
      <aside className="sidebar" aria-label="工作区导航">
        <div className="workspace-switch"><label htmlFor="workspace-select">工作区</label><div className="select-wrap"><select id="workspace-select" value={w.id} onChange={e=>void run(()=>switchTo(e.target.value))} disabled={busy}>{state.workspaces.map(w=><option key={w.id} value={w.id}>{w.name}</option>)}</select><ChevronDown size={14}/></div>
          <div className="workspace-tools"><button onClick={()=>{setName('');setDialog('workspace');}}><Plus size={14}/>新建</button><button onClick={()=>void run(async()=>{await flush();const s=await bridge.openWorkspace();if(s)hydrate(s);})}><FolderOpen size={14}/>打开目录</button></div>
        </div>
        <nav className="primary-nav" aria-label="视图"><button className={view==='write'?'selected':''} onClick={()=>setView('write')}><Feather size={17}/>创作</button><button className={view==='outline'?'selected':''} onClick={()=>setView('outline')}><ListTree size={17}/>结构总览</button><button className={view==='review'?'selected':''} onClick={()=>setView('review')}><Check size={17}/>阶段检查<span className="nav-count">{w.checks.length}/{checkLabels.length}</span></button></nav>
        <div className="section-heading"><span>作品资料</span><button className="icon-button small" aria-label="新建文档" onClick={()=>{setName('');setNewKind('chapter');setDialog('document');}}><Plus size={16}/></button></div>
        <div className="document-tree">
          {kinds.map(({id,label,icon:Icon})=><section key={id} className="tree-group"><h3><Icon size={14}/>{label}<span>{w.documents.filter(d=>d.kind===id).length.toString().padStart(2,'0')}</span></h3>{w.documents.filter(d=>d.kind===id).map((d,i)=><button key={d.id} className={`document-link ${d.id===doc.id?'active':''}`} onClick={()=>void run(()=>selectDoc(d.id))} disabled={busy}><span className="document-number">{(i+1).toString().padStart(2,'0')}</span><span>{d.title}</span>{d.id===doc.id&&<span className="active-dot"/>}</button>)}</section>)}
        </div>
        <div className="sidebar-bottom"><div className="progress-label"><span>创作进度</span><span>{total.toLocaleString('zh-CN')} / {w.target.toLocaleString('zh-CN')} 字</span></div><progress value={Math.min(total,w.target)} max={w.target}/><p>自己的节奏，比进度更重要。</p><button onClick={()=>void run(async()=>{await flush();const p=await bridge.exportWorkspace(w.id);if(p)setNotice('已导出 Markdown 文稿。');})}><Download size={15}/>导出文稿<ArrowUpRight size={14}/></button></div>
      </aside>
      <main className="main-pane">
        <div className="session-bar"><div className="session-tabs" role="tablist" aria-label="创作会话">{w.sessions.map(s=><button key={s.id} role="tab" aria-selected={s.id===session.id} className={s.id===session.id?'active':''} onClick={()=>void run(()=>switchTo(w.id,s.id))} disabled={busy}><span className="tab-dot"/>{s.name}</button>)}<button className="icon-button" aria-label="新建会话" onClick={()=>{setName('');setDialog('session');}}><Plus size={16}/></button></div><span className="session-hint">会话独立保留文档与 AI 提案</span></div>
        <div className="editor-toolbar"><div className="breadcrumb"><BookOpen size={15}/><span>{w.name}</span><span>/</span><span>{kinds.find(k=>k.id===doc.kind)?.label}</span></div><div className="toolbar-actions"><span className={`save-status ${status==='保存失败'?'failure':''}`} role="status" data-testid="save-status">{status==='已保存'&&<Check size={13}/>} {status}</span><button className="icon-button" aria-label="历史快照" onClick={()=>void run(openHistory)}><Clock3 size={17}/></button><button className="icon-button" aria-label={focus?'退出专注模式':'进入专注模式'} onClick={()=>setFocus(!focus)}><Focus size={17}/></button><button className="icon-button" aria-label={panel?'收起 AI 面板':'展开 AI 面板'} onClick={()=>setPanel(!panel)}>{panel?<PanelRightClose size={17}/>:<PanelRightOpen size={17}/>}</button></div></div>
        {error&&!dialog&&<div className="message error" role="alert"><span>{error}</span><button aria-label="关闭错误提示" onClick={()=>setError('')}><X size={15}/></button></div>}
        {notice&&<div className="message success" role="status"><span>{notice}</span><button aria-label="关闭通知" onClick={()=>setNotice('')}><X size={15}/></button></div>}
        {view==='write'&&<div className={`writing-area ${fontSize}`}>
          <div className="chapter-meta"><span>{isChapter?'MANUSCRIPT':'STORY BIBLE'}</span><span>{w.stage} · {isChapter?'章节草稿':'项目资料'}</span></div>
          <input className="chapter-title" aria-label="文档标题" value={title} maxLength={120} onChange={e=>setTitle(e.target.value)}/>
          <div className="chapter-subline"><span>{isChapter?'把故事写下来，其他事可以稍后再说。':'好的设定，是人物行动时可以依靠的东西。'}</span><span>{count(draft).toLocaleString('zh-CN')} 字</span></div>
          <textarea className="manuscript" aria-label="正文编辑器" data-testid="manuscript" value={draft} onChange={e=>setDraft(e.target.value)} spellCheck={false} placeholder={isChapter?'从一个动作、一件物品，或一句没说完的话开始。':'记录设定、创作边界与需要保持一致的细节。'}/>
          <div className="end-mark" aria-hidden="true"><span/>◇<span/></div>
        </div>}
        {view==='outline'&&<section className="overview"><p className="eyebrow">STRUCTURE</p><h1>让故事有迹可循</h1><p>每一章都承担自己的叙事任务。点击卡片，回到正文。</p><div className="chapter-grid">{w.documents.filter(d=>d.kind==='chapter').map((d,i)=><button className="chapter-card" key={d.id} onClick={()=>void run(()=>selectDoc(d.id))}><span>CHAPTER {(i+1).toString().padStart(2,'0')}</span><h2>{d.title}</h2><p>{d.content.slice(0,120)||'还没有正文。留一点空间，让故事开始。'}</p><footer>{count(d.content)} 字<ArrowUpRight size={16}/></footer></button>)}<button className="chapter-card add-card" onClick={()=>{setNewKind('chapter');setName('');setDialog('document');}}><Plus size={24}/><span>添加下一章</span></button></div></section>}
        {view==='review'&&<section className="overview"><p className="eyebrow">FRAMEWORK</p><h1>先保结构，再修表达</h1><p>这些是作者的检查记录，不是 AI 自动验收。完整多角色审阅在后续版本接入。</p><label className="field stage-field">当前阶段<select value={w.stage} onChange={e=>{const stage=e.target.value;update({...w,stage});void run(async()=>update(await bridge.updateWorkspace(w.id,{stage})));}}>{stages.map(s=><option key={s}>{s}</option>)}</select></label><div className="review-list">{checkLabels.map(label=><label key={label}><input type="checkbox" checked={w.checks.includes(label)} onChange={e=>{const checks=e.target.checked?[...w.checks,label]:w.checks.filter(c=>c!==label);update({...w,checks});void run(async()=>update(await bridge.updateWorkspace(w.id,{checks})));}}/><span>{label}</span></label>)}</div><div className="review-note"><Feather size={22}/><p>规则帮助你作出判断，不替你决定故事。<br/>表达优化也不应改变因果、人物关系与章尾钩子。</p></div></section>}
        <footer className="editor-status"><span>{isChapter?'中文写作':'设定编辑'}<span className="dot-separator">·</span>UTF-8<span className="dot-separator">·</span>Markdown</span><div><select aria-label="配色方案" value={scheme} onChange={e=>setScheme(e.target.value)}><option value="pine">松墨</option><option value="mono">石墨</option></select><label>字号<select aria-label="阅读字号" value={fontSize} onChange={e=>setFontSize(e.target.value)}><option value="standard">标准</option><option value="large">较大</option></select></label><button onClick={()=>void run(flush)}>保存 <kbd>⌘ / Ctrl S</kbd></button></div></footer>
      </main>
      <aside className="ai-panel" aria-label="AI 创作助手">
        <div className="ai-heading"><div><Sparkles size={17}/><strong>创作助手</strong></div><button className="icon-button" aria-label="模型设置" onClick={()=>void run(openSettings)}><Settings2 size={17}/></button></div>
        <div className="ai-content"><p className="assistant-lead">你决定故事。<br/><span>AI 帮你找到另一种表达。</span></p>
          <div className="action-tabs" role="group" aria-label="AI 任务类型">{[['generate','生成'],['continue','续写'],['polish','优化表达']].map(([id,label])=><button key={id} className={action===id?'active':''} onClick={()=>setAction(id)} disabled={busy}>{label}</button>)}</div>
          <label className="prompt-label" htmlFor="ai-prompt">{action==='polish'?'希望怎样调整表达？':'这一章要发生什么？'}</label><textarea id="ai-prompt" value={prompt} maxLength={10000} onChange={e=>setPrompt(e.target.value)} placeholder={action==='polish'?'例如：让对白更自然，删去情绪总结，保留事件和人物关系。':'人物想要什么？什么挡住了他？这次行动要付出什么代价？'}/>
          <button className="context-toggle" onClick={()=>setShowContext(!showContext)}><Plus size={14}/>参考设定<span>{contextIds.length} 项</span><ChevronDown size={14}/></button>
          {showContext&&<div className="context-list">{w.documents.filter(d=>d.kind!=='chapter').length?w.documents.filter(d=>d.kind!=='chapter').map(d=><label key={d.id}><input type="checkbox" checked={contextIds.includes(d.id)} onChange={e=>setContextIds(e.target.checked?[...contextIds,d.id]:contextIds.filter(id=>id!==d.id))}/>{d.title}</label>):<p>先新建人物、世界观或风格规范，再作为参考。</p>}</div>}
          <div className="context-summary"><span>发送范围</span><p>当前章全文 + 指令 + 所选设定 + 中文生成约束。不会发送其他工作区或会话。</p></div>
          {busy?<button className="primary-button" onClick={()=>void run(async()=>{await bridge.cancel(request.current);})}>取消生成</button>:<button className="primary-button" onClick={()=>void run(generate)} disabled={!isChapter||!prompt.trim()}><Sparkles size={15}/>{action==='polish'?'生成优化提案':'生成正文提案'}<ArrowUpRight size={15}/></button>}
          <p className="privacy-note">调用你配置的模型服务，可能产生费用。<br/>结果先成为提案，采纳前不会覆盖正文。</p>
          <div className="proposal-heading"><span>本会话的提案</span><span>{pending.length.toString().padStart(2,'0')}</span></div>
          {pending.length?pending.map(p=><article className="proposal" key={p.id} data-testid="ai-proposal"><header><span>{p.action==='polish'?'表达优化':p.action==='continue'?'续写提案':'正文提案'}</span><time>{new Date(p.createdAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'})}</time></header><p>{p.text}</p><footer><button onClick={()=>void run(()=>resolve(p.id,false))}>放弃</button><button className="accept" disabled={p.docId!==doc.id||busy} onClick={()=>void run(()=>resolve(p.id,true))}><Check size={14}/>采纳</button></footer>{p.docId!==doc.id&&<small>切回对应章节后才能采纳。</small>}</article>):<div className="proposal-empty"><div className="paper-lines"><Feather size={23}/></div><h3>给灵感一点空间</h3><p>描述这一章的任务，或告诉助手<br/>哪些表达需要重新斟酌。</p></div>}
        </div><div className="ai-panel-footer"><span className="local-mark"/><span>作者始终拥有最后决定权</span></div>
      </aside>
    </div>
    {dialog&&<Dialog title={{workspace:'新建工作区',document:'新建文档',session:'新建会话',settings:'模型设置',history:'历史快照',commands:'快速操作',help:'使用 Icimik Composer'}[dialog]} onClose={()=>{setDialog('');setKey('');}}>
      {error&&<p className="message error" role="alert">{error}</p>}
      {['workspace','document','session'].includes(dialog)&&<form onSubmit={e=>{e.preventDefault();void run(create);}}><p className="dialog-description">{dialog==='workspace'?'每个工作区有独立的作品资料、会话、提案和模型设置。':dialog==='session'?'会话保留打开的文档、创作指令和提案；正文仍是同一份，不产生并行稿。':'文档将以 Markdown 保存在当前工作区。'}</p><label className="field">名称<input autoFocus value={name} onChange={e=>setName(e.target.value)} required maxLength={120}/></label>{dialog==='document'&&<label className="field">文档类型<select value={newKind} onChange={e=>setNewKind(e.target.value as Kind)}>{kinds.map(k=><option key={k.id} value={k.id}>{k.label}</option>)}</select></label>}<button className="primary-button" type="submit" disabled={!name.trim()}>创建</button></form>}
      {dialog==='settings'&&<form onSubmit={e=>{e.preventDefault();void run(async()=>{const s=await bridge.setSettings(w.id,settings.endpoint,settings.model,key);setSettings(s);setKey('');setDialog('');setNotice('模型设置已保存，密钥不会发送到编辑器。');});}}><p className="dialog-description">支持 OpenAI 兼容的 Chat Completions API。仅在本机配置；密钥由系统安全存储加密，不写入作品目录或仓库。</p>{!desktop&&<p className="warning">浏览器预览不接收密钥。</p>}<label className="field">API 基础地址<input value={settings.endpoint} onChange={e=>setSettings({...settings,endpoint:e.target.value})} type="url" required disabled={!desktop}/></label><label className="field">模型名称<input value={settings.model} onChange={e=>setSettings({...settings,model:e.target.value})} required placeholder="填写供应商提供的模型 ID" disabled={!desktop}/></label><label className="field">API 密钥<input type="password" autoComplete="off" value={key} onChange={e=>setKey(e.target.value)} placeholder={settings.hasKey?'已保存；留空保留原密钥':'仅保存在本机'} required={!settings.hasKey} disabled={!desktop}/></label><p className="privacy-note">点击生成时，所示发送范围会传给此地址对应的服务。请确认你信任该服务以及它的稿件处理政策。</p><button className="primary-button" type="submit" disabled={!desktop}>保存模型设置</button></form>}
      {dialog==='history'&&<div className="history-list"><p className="dialog-description">保存变化前的整篇内容。恢复也会先保留当前正文，便于再次恢复。</p>{history.length?history.slice().reverse().map(s=><article key={s.id}><header><strong>{s.title}</strong><time>{new Date(s.createdAt).toLocaleString('zh-CN')}</time></header><p>{s.content.slice(0,160)||'空白正文'}</p><button onClick={()=>void run(async()=>{const d=await bridge.restore(w.id,doc.id,s.id,doc.hash);const next={...w,documents:w.documents.map(item=>item.id===d.id?d:item)};update(next);setDraft(d.content);setTitle(d.title);setDialog('');setNotice('已恢复快照，恢复前的正文也已保留。');})}><RotateCcw size={14}/>恢复此版本</button></article>):<p>还没有快照。修改并保存正文后，上一版会出现在这里。</p>}</div>}
      {dialog==='commands'&&<div className="commands"><input aria-label="搜索操作" autoFocus placeholder="搜索操作…" value={query} onChange={e=>setQuery(e.target.value)}/>{[
        {label:'新建章节',fn:()=>{setNewKind('chapter');setName('');setDialog('document');}},
        {label:'新建工作区',fn:()=>{setName('');setDialog('workspace');}},
        {label:'新建会话',fn:()=>{setName('');setDialog('session');}},
        {label:'模型设置',fn:()=>void run(openSettings)},
        {label:'结构总览',fn:()=>{setView('outline');setDialog('');}},
        {label:'阶段检查',fn:()=>{setView('review');setDialog('');}},
        {label:'切换专注模式',fn:()=>{setFocus(!focus);setDialog('');}},
        {label:'保存当前文档',fn:()=>{void run(flush);setDialog('');}},
      ].filter(item=>item.label.includes(query)).map(item=><button key={item.label} onClick={()=>{setQuery('');item.fn();}}>{item.label}<ArrowUpRight size={15}/></button>)}</div>}
      {dialog==='help'&&<div className="help-copy"><p>工作区隔离不同作品。会话保存你的文档位置、指令和提案，不复制正文。</p><p>正文会自动保存，也可以用 ⌘ / Ctrl S 手动保存。F8 进入专注模式，Escape 退出，⌘ / Ctrl K 打开快速操作。</p><p>AI 支持空章生成、续写和整章表达优化。先在模型设置中配置服务，再确认发送范围。提案可以采纳或放弃；正文变化后，旧提案会拒绝覆盖。</p><p>阶段检查是作者记录，不代表自动完成框架的多角色验收。交互小说和视觉小说在后续路线图中，首版仅支持小说。</p><p className="privacy-note">首次开发版本：请保留作品备份。暂不支持多人并行编辑、外部实时文件监听或云端同步。</p></div>}
    </Dialog>}
  </div>;
}
