(()=>{
'use strict';

const STORAGE_KEY='comgab-ai-conversations-v1';
const MAX_CHATS=25;
const MAX_STORED_MESSAGES=80;
const API_URL=window.COMGAB_CHAT_API_URL||'https://comgab-chat.comgabdigital.workers.dev';
const REQUEST_ERROR='Sorry, I couldn\'t reach the assistant right now. Please try again or contact us on WhatsApp.';
const root=document.createElement('div');
root.innerHTML=`<button id="cg-btn" type="button" aria-label="Open chat assistant" aria-expanded="false" aria-controls="cg"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg></button>
<section id="cg" role="dialog" aria-label="COMGAB Assistant" aria-modal="false"><header><i aria-hidden="true"></i><div class="cg-brand"><b>COMGAB Assistant</b><small id="cg-status">AI assistant · private chat history</small></div><button type="button" id="cg-new" aria-label="Start a new chat" title="New chat">＋</button><button type="button" id="cg-x" aria-label="Close chat">&times;</button></header>
<nav class="cg-toolbar" aria-label="Conversation actions"><button type="button" id="cg-history-toggle" aria-expanded="false" aria-controls="cg-history">Recent chats</button><button type="button" id="cg-clear">Clear chat</button></nav>
<div id="cg-confirm" class="cg-confirm" role="group" aria-live="assertive" aria-labelledby="cg-confirm-text" hidden><span id="cg-confirm-text"></span><div><button type="button" id="cg-confirm-cancel">Cancel</button><button type="button" id="cg-confirm-accept">Confirm</button></div></div>
<div id="cg-history" aria-label="Recent conversations" hidden></div>
<div id="cg-log" role="log" aria-label="Conversation" aria-live="off"></div>
<div id="cg-live" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
<div id="cg-suggestions" role="group" aria-label="Suggested prompts"></div>
<form id="cg-f" autocomplete="off"><label class="sr-only" for="cg-i">Message COMGAB Assistant</label><textarea id="cg-i" placeholder="Ask anything… (Enter to send)" rows="1" maxlength="10000"></textarea><button type="submit" id="cg-send" aria-label="Send message"><span>Send</span></button></form>
<p id="cg-error" role="status" aria-live="polite" hidden></p></section>`;
document.body.appendChild(root);

const css=`
#cg-btn{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:90;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(120deg,#70e9f4,#8c9cff);color:#02121a;box-shadow:0 10px 30px rgba(58,196,220,.35);display:grid;place-items:center;transition:transform .25s}
#cg-btn:hover{transform:scale(1.07)}
#cg-btn svg{width:28px;height:28px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#cg{position:fixed;right:20px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:90;width:min(420px,calc(100vw - 32px));height:min(640px,calc(100svh - 130px));min-height:min(340px,calc(100svh - 130px));display:flex;flex-direction:column;border-radius:22px;background:#111a29;border:1px solid rgba(204,218,238,.28);backdrop-filter:blur(18px);box-shadow:0 30px 80px rgba(0,0,0,.55);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(14px) scale(.98);transition:opacity .25s,transform .25s,visibility .25s}
#cg.open{opacity:1;visibility:visible;transform:none}
#cg header{flex:none;padding:12px 14px;background:#101725;border-bottom:1px solid rgba(204,218,238,.2);display:flex;align-items:center;gap:10px}
#cg header>i{width:10px;height:10px;flex:none;border-radius:50%;background:#4ade80;box-shadow:0 0 10px #4ade80}
#cg .cg-brand{min-width:0;flex:1}
#cg header b{font-family:'DM Sans',system-ui,sans-serif;font-size:.95rem;color:#f8fafc}
#cg header small{display:block;color:#c1cada;font-size:.72rem}
#cg header button{flex:none;background:rgba(255,255,255,.08);border:1px solid rgba(204,218,238,.22);border-radius:8px;color:#f3f6fb;font-size:1.2rem;cursor:pointer;line-height:1;width:34px;height:34px;transition:background .2s,border-color .2s}
#cg header button:hover{background:rgba(255,255,255,.16);border-color:rgba(204,218,238,.42)}
#cg .cg-toolbar{flex:none;display:flex;align-items:center;justify-content:space-between;padding:7px 12px;background:#131d2c;border-bottom:1px solid rgba(204,218,238,.12)}
#cg .cg-toolbar button{border:0;background:none;color:#ccd5e2;font:inherit;font-size:.76rem;padding:5px 8px;border-radius:7px;cursor:pointer}
#cg .cg-toolbar button:hover{background:rgba(255,255,255,.08);color:#fff}
#cg .cg-confirm{flex:none;padding:10px 12px;background:#282719;border-bottom:1px solid rgba(201,170,104,.3);color:#f3ecd9;font-size:.78rem}
#cg .cg-confirm[hidden]{display:none}
#cg .cg-confirm>div{display:flex;justify-content:flex-end;gap:7px;margin-top:8px}
#cg .cg-confirm button,#cg .cg-rename button{border:1px solid rgba(204,218,238,.3);border-radius:7px;background:rgba(255,255,255,.06);color:#f1f3f6;font:inherit;font-size:.73rem;padding:5px 9px;cursor:pointer}
#cg .cg-confirm button:last-child{border-color:rgba(201,170,104,.65);color:#f2d89a}
#cg .cg-confirm button:hover,#cg .cg-rename button:hover{background:rgba(255,255,255,.14)}
#cg-history{flex:none;max-height:180px;overflow:auto;padding:7px 10px;background:#111a29;border-bottom:1px solid rgba(204,218,238,.17)}
#cg-history[hidden]{display:none}
#cg .cg-history-row{display:flex;align-items:center;gap:4px;padding:3px;border-radius:8px}
#cg .cg-history-row:hover{background:rgba(255,255,255,.06)}
#cg .cg-history-open{flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:0;background:none;color:#dce4ef;font:inherit;font-size:.78rem;padding:7px;cursor:pointer}
#cg .cg-history-row[aria-current="true"] .cg-history-open{color:#f2d89a}
#cg .cg-history-action{border:1px solid transparent;border-radius:6px;background:transparent;color:#aebbd0;font:inherit;font-size:.7rem;padding:5px;cursor:pointer}
#cg .cg-history-action:hover{border-color:#617087;color:#fff}
#cg .cg-rename{display:flex;align-items:center;gap:6px;flex:1}
#cg .cg-rename input{flex:1;min-width:0;padding:6px 8px;border-radius:7px;border:1px solid #53627a;background:#202d40;color:#f7f9fc;font:inherit;font-size:.78rem}
#cg-log{flex:1;min-height:0;overflow-y:auto;padding:16px;background:#182233;display:flex;flex-direction:column;gap:13px;scrollbar-color:#73829a #182233;scrollbar-width:thin}
#cg-log::-webkit-scrollbar,#cg-history::-webkit-scrollbar{width:9px}
#cg-log::-webkit-scrollbar-track,#cg-history::-webkit-scrollbar-track{background:#182233}
#cg-log::-webkit-scrollbar-thumb,#cg-history::-webkit-scrollbar-thumb{background:#73829a;border:2px solid #182233;border-radius:999px}
#cg-log::-webkit-scrollbar-thumb:hover,#cg-history::-webkit-scrollbar-thumb:hover{background:#a5b1c2}
#cg .cm{max-width:96%;padding:11px 13px;border-radius:15px;font-size:.88rem;line-height:1.6;overflow-wrap:anywhere;animation:cmin .2s ease}
@keyframes cmin{from{opacity:0;transform:translateY(5px)}}
#cg .cm.u{max-width:88%;align-self:flex-end;background:#29384c;border:1px solid #485b74;color:#f5f7fb;border-bottom-right-radius:5px;white-space:pre-wrap}
#cg .cm.b{align-self:stretch;color:#edf2f8}
#cg .cm-content p{margin:0 0 .75em}
#cg .cm-content p:last-child{margin-bottom:0}
#cg .cm-content h1,#cg .cm-content h2,#cg .cm-content h3{font-family:'DM Sans',system-ui,sans-serif;line-height:1.3;color:#fff;margin:.85em 0 .45em}
#cg .cm-content h1{font-size:1.2rem}#cg .cm-content h2{font-size:1.1rem}#cg .cm-content h3{font-size:1rem}
#cg .cm-content ul,#cg .cm-content ol{padding-left:1.4em;margin:.45em 0}
#cg .cm-content li{padding-left:.15em;margin:.2em 0}
#cg .cm-content a{color:#a7eaf1;text-decoration:underline;text-underline-offset:2px}
#cg .cm-content a:hover{color:#fff}
#cg .cm-content code{font-family:Consolas,'Courier New',monospace;font-size:.88em;background:#0d1623;color:#f5d994;padding:.13em .35em;border-radius:5px}
#cg .cm-content pre{overflow:auto;max-width:100%;margin:.65em 0;padding:12px;border:1px solid #42516a;border-radius:10px;background:#0d1623}
#cg .cm-content pre code{padding:0;background:transparent;color:#e5edf8;white-space:pre}
#cg .cm-actions{display:flex;gap:6px;margin-top:8px}
#cg .cm-actions button{border:1px solid rgba(204,218,238,.18);border-radius:7px;background:rgba(255,255,255,.04);color:#bdc9d9;font:inherit;font-size:.7rem;padding:4px 8px;cursor:pointer}
#cg .cm-actions button:hover{border-color:#a88b4a;color:#fff}
#cg .cg-welcome{max-width:320px;margin:auto;text-align:center;color:#e7edf5}
#cg .cg-welcome b{display:block;color:#f2d89a;font-size:1.35rem;margin-bottom:8px}
#cg .cg-welcome p{font-size:.84rem;color:#c3cede}
#cg .cg-typing{display:flex;gap:5px;align-items:center;padding:8px 2px;color:#dce4ef;font-size:.75rem}
#cg .cg-typing i{width:6px;height:6px;border-radius:50%;background:#d6deeb;animation:cg-dot 1s infinite}
#cg .cg-typing i:nth-child(2){animation-delay:.15s}#cg .cg-typing i:nth-child(3){animation-delay:.3s}
@keyframes cg-dot{50%{opacity:.3;transform:translateY(-3px)}}
#cg-suggestions{flex:none;display:flex;gap:7px;flex-wrap:wrap;padding:0 12px 10px;background:#182233}
#cg-suggestions[hidden]{display:none}
#cg-suggestions button{font:inherit;font-size:.73rem;color:#e3d3a9;background:rgba(157,123,53,.12);border:1px solid rgba(201,170,104,.4);border-radius:999px;padding:6px 10px;cursor:pointer}
#cg-suggestions button:hover{background:rgba(157,123,53,.24)}
#cg form{flex:none;display:flex;align-items:flex-end;gap:8px;padding:10px;background:#111a29;border-top:1px solid rgba(204,218,238,.2)}
#cg textarea{flex:1;min-width:0;min-height:40px;height:40px;max-height:140px;resize:none;padding:10px 13px;border-radius:15px;background:#202d40;border:1px solid #53627a;color:#f7f9fc;font:inherit;font-size:.85rem;line-height:1.45}
#cg textarea::placeholder{color:#c0cada;opacity:1}
#cg textarea:focus{border-color:#c3a45e;box-shadow:0 0 0 3px rgba(195,164,94,.18);outline:0}
#cg form button{flex:none;min-width:66px;min-height:40px;border:0;border-radius:12px;padding:0 13px;font-weight:700;cursor:pointer;background:linear-gradient(120deg,#e1c47e,#b89145);color:#1b1a16;font-family:inherit;transition:filter .2s,transform .2s}
#cg form button:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}
#cg form button:disabled{opacity:.52;cursor:not-allowed}
#cg form button.cg-stop{background:#344258;color:#f4f6fb;border:1px solid #64748b}
#cg #cg-error{flex:none;margin:0;padding:7px 12px;background:#32212a;color:#ffd9df;font-size:.76rem}
#cg #cg-error[hidden]{display:none}
#cg button:focus-visible,#cg textarea:focus-visible{outline:3px solid #f2d89a;outline-offset:2px}
@media(max-width:560px){#cg{left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:auto;height:min(700px,calc(100svh - 100px));min-height:min(300px,calc(100svh - 100px));border-radius:19px}#cg-log{padding:13px}#cg .cm{max-width:100%}#cg header{padding:10px 11px}#cg .cg-toolbar{padding:5px 9px}}
@media(prefers-reduced-motion:reduce){#cg,#cg .cm,#cg .cg-typing i{animation:none;transition:none}}`;
const style=document.createElement('style');
style.textContent=css;
document.head.appendChild(style);

const byId=id=>document.getElementById(id);
const box=byId('cg');
const opener=byId('cg-btn');
const log=byId('cg-log');
const liveStatus=byId('cg-live');
const input=byId('cg-i');
const sendButton=byId('cg-send');
const form=byId('cg-f');
const errorBox=byId('cg-error');
const historyPanel=byId('cg-history');
const historyToggle=byId('cg-history-toggle');
const suggestions=byId('cg-suggestions');
const confirmation=byId('cg-confirm');
let confirmAction=null;
let controller=null;
let storedOk=true;

const promptIdeas=[
  ['Help me improve my website','I have a website. Suggest a practical plan to improve its clarity, accessibility, and conversions.'],
  ['Write something','Help me write a polished, friendly email to a new client.'],
  ['Explain a coding concept','Explain how CSS Grid works, with a small example.']
];

function escapeHtml(text){
  return text.replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
}
function inlineMarkdown(text){
  let html=text
    .replace(/`([^`\n]+)`/g,'<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>')
    .replace(/__([^_]+)__/g,'<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g,'<em>$1</em>')
    .replace(/_([^_\n]+)_/g,'<em>$1</em>');
  html=html.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+|mailto:[^\s)]+)\)/g,(_match,label,url)=>{
    const safeUrl=url.replace(/&amp;/g,'&');
    try{
      const parsed=new URL(safeUrl);
      if(!['http:','https:','mailto:'].includes(parsed.protocol))return label;
    }catch{return label}
    return `<a href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer">${label}</a>`;
  });
  return html.replace(/  \n/g,'<br>').replace(/\n/g,'<br>');
}
function renderMarkdown(markdown){
  const lines=escapeHtml(markdown).split('\n');
  const blocks=[];
  let index=0;
  while(index<lines.length){
    if(!lines[index].trim()){index+=1;continue}
    const fence=lines[index].match(/^\s*```([a-z0-9_-]*)\s*$/i);
    if(fence){
      index+=1;
      const code=[];
      while(index<lines.length&&!/^\s*```\s*$/.test(lines[index]))code.push(lines[index++]);
      if(index<lines.length)index+=1;
      blocks.push(`<pre><code${fence[1]?` class="language-${fence[1]}"`:''}>${code.join('\n')}</code></pre>`);
      continue;
    }
    const heading=lines[index].match(/^(#{1,3})\s+(.+)$/);
    if(heading){
      const level=heading[1].length;
      blocks.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      index+=1;
      continue;
    }
    const listMatch=lines[index].match(/^\s*([-*+]|\d+[.)])\s+/);
    if(listMatch){
      const ordered=/^\d/.test(listMatch[1]);
      const items=[];
      while(index<lines.length){
        const item=lines[index].match(/^\s*([-*+]|\d+[.)])\s+(.+)$/);
        if(!item||/^\d/.test(item[1])!==ordered)break;
        items.push(`<li>${inlineMarkdown(item[2])}</li>`);
        index+=1;
      }
      blocks.push(`<${ordered?'ol':'ul'}>${items.join('')}</${ordered?'ol':'ul'}>`);
      continue;
    }
    const paragraph=[];
    while(index<lines.length&&lines[index].trim()&&!/^\s*```/.test(lines[index])&&!/^#{1,3}\s+/.test(lines[index])&&!/^\s*([-*+]|\d+[.)])\s+/.test(lines[index])){
      paragraph.push(lines[index++]);
    }
    blocks.push(`<p>${inlineMarkdown(paragraph.join('\n'))}</p>`);
  }
  return blocks.join('');
}
function makeChat(){
  return {id:crypto.randomUUID(),title:'New chat',updatedAt:Date.now(),messages:[]};
}
function loadChats(){
  try{
    const parsed=JSON.parse(localStorage.getItem(STORAGE_KEY)||'[]');
    if(!Array.isArray(parsed))return [];
    return parsed.filter(chat=>chat&&typeof chat.id==='string'&&Array.isArray(chat.messages))
      .slice(0,MAX_CHATS).map(chat=>({
        id:chat.id,
        title:typeof chat.title==='string'?chat.title.slice(0,80):'New chat',
        updatedAt:Number(chat.updatedAt)||Date.now(),
        messages:chat.messages.filter(message=>message&&['user','assistant'].includes(message.role)&&typeof message.content==='string')
          .slice(-MAX_STORED_MESSAGES).map(message=>({role:message.role,content:message.content.slice(0,10000)}))
      }));
  }catch{
    storedOk=false;
    return [];
  }
}
let chats=loadChats();
if(!chats.length)chats=[makeChat()];
let currentId=chats[0].id;
function currentChat(){return chats.find(chat=>chat.id===currentId)||chats[0]}
function persist(){
  try{
    chats.sort((a,b)=>b.updatedAt-a.updatedAt);
    chats=chats.slice(0,MAX_CHATS);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(chats.map(chat=>({...chat,messages:chat.messages.slice(-MAX_STORED_MESSAGES)}))));
    storedOk=true;
  }catch{
    storedOk=false;
    showError('Chat history could not be saved on this device. Your current conversation may be lost.');
  }
}
function showError(message,actionLabel,action){
  errorBox.replaceChildren();
  errorBox.hidden=!message;
  if(!message)return;
  const text=document.createElement('span');
  text.textContent=message;
  errorBox.append(text);
  if(action){
    const button=document.createElement('button');
    button.type='button';
    button.className='cg-retry';
    button.textContent=actionLabel||'Retry';
    button.addEventListener('click',action);
    errorBox.append(' ',button);
  }
}
function scrollToBottom(){log.scrollTop=log.scrollHeight}
function makeAction(label,handler){
  const button=document.createElement('button');
  button.type='button';
  button.textContent=label;
  button.addEventListener('click',handler);
  return button;
}
function createMessage(message,index,total){
  const article=document.createElement('article');
  article.className=`cm ${message.role==='user'?'u':'b'}`;
  if(message.role==='user'){
    article.textContent=message.content;
    return article;
  }
  const content=document.createElement('div');
  content.className='cm-content';
  content.innerHTML=renderMarkdown(message.content);
  article.append(content);
  if(!controller&&message.content){
    const actions=document.createElement('div');
    actions.className='cm-actions';
    actions.append(makeAction('Copy',async()=>{
      try{
        await navigator.clipboard.writeText(message.content);
        showError('Response copied.');
        setTimeout(()=>{if(errorBox.textContent==='Response copied.')showError('')},1800);
      }catch{showError('Could not copy this response. Select the text and copy it manually.')}
    }));
    if(index===total-1&&currentChat().messages[index-1]?.role==='user'){
      actions.append(makeAction('Regenerate',()=>regenerate()));
    }
    article.append(actions);
  }
  return article;
}
function hideConfirmation(){
  confirmation.hidden=true;
  confirmAction=null;
}
function showConfirmation(message,label,action){
  byId('cg-confirm-text').textContent=message;
  const accept=byId('cg-confirm-accept');
  accept.textContent=label;
  confirmAction=action;
  confirmation.hidden=false;
  accept.focus();
}
function renderHistory(){
  historyPanel.replaceChildren();
  for(const chat of [...chats].sort((a,b)=>b.updatedAt-a.updatedAt)){
    const row=document.createElement('div');
    row.className='cg-history-row';
    row.setAttribute('aria-current',String(chat.id===currentId));
    const open=makeAction(chat.title||'New chat',()=>{
      if(controller)controller.abort();
      hideConfirmation();
      currentId=chat.id;
      historyPanel.hidden=true;
      historyToggle.setAttribute('aria-expanded','false');
      showError('');
      render();
    });
    open.className='cg-history-open';
    open.title=chat.title||'New chat';
    const rename=makeAction('Rename',()=>{
      const form=document.createElement('form');
      form.className='cg-rename';
      const field=document.createElement('input');
      field.type='text';
      field.value=chat.title;
      field.maxLength=80;
      field.setAttribute('aria-label','Conversation name');
      const save=document.createElement('button');
      save.type='submit';
      save.textContent='Save';
      const cancel=makeAction('Cancel',render);
      form.addEventListener('submit',event=>{
        event.preventDefault();
        const nextTitle=field.value.trim();
        if(!nextTitle){field.focus();return}
        chat.title=nextTitle.slice(0,80);
        chat.updatedAt=Date.now();
        persist();
        render();
      });
      form.replaceChildren(field,save,cancel);
      row.replaceChildren(form);
      field.focus();
      field.select();
    });
    rename.className='cg-history-action';
    const remove=makeAction('Delete',()=>{
      showConfirmation(`Delete "${chat.title}" from this device?`, 'Delete',()=>{
        chats=chats.filter(item=>item.id!==chat.id);
        if(!chats.length)chats=[makeChat()];
        if(currentId===chat.id)currentId=chats[0].id;
        persist();
        render();
      });
    });
    remove.className='cg-history-action';
    row.append(open,rename,remove);
    historyPanel.append(row);
  }
}
function render(){
  const chat=currentChat();
  log.replaceChildren();
  if(!chat.messages.length){
    const welcome=document.createElement('div');
    welcome.className='cg-welcome';
    const title=document.createElement('b');
    title.textContent='What can I help with?';
    const description=document.createElement('p');
    description.textContent='Ask a question, explore an idea, write something, or work through a coding problem.';
    welcome.append(title,description);
    log.append(welcome);
    suggestions.replaceChildren();
    for(const [label,promptText] of promptIdeas){
      const button=makeAction(label,()=>sendMessage(promptText));
      suggestions.append(button);
    }
    suggestions.hidden=false;
  }else{
    chat.messages.forEach((message,index)=>log.append(createMessage(message,index,chat.messages.length)));
    suggestions.hidden=true;
  }
  renderHistory();
  byId('cg-status').textContent=controller
    ?'Generating response…'
    :storedOk?'AI assistant · history saved on this device':'History storage unavailable · active chat stays in memory';
  if(controller){
    const typing=document.createElement('div');
    typing.className='cg-typing';
    typing.setAttribute('aria-label','Assistant is responding');
    typing.innerHTML='<i></i><i></i><i></i><span>Thinking</span>';
    log.append(typing);
  }
  sendButton.classList.toggle('cg-stop',Boolean(controller));
  sendButton.querySelector('span').textContent=controller?'Stop':'Send';
  sendButton.setAttribute('aria-label',controller?'Stop generating':'Send message');
  input.disabled=Boolean(controller);
  byId('cg-clear').disabled=Boolean(controller);
  scrollToBottom();
}
function fitInput(){
  input.style.height='auto';
  input.style.height=`${Math.min(input.scrollHeight,140)}px`;
}
function getContext(){
  const context=currentChat().messages.filter(message=>message.role==='user'||message.content).slice(-30);
  let total=context.reduce((sum,message)=>sum+message.content.length,0);
  while(total>18_000&&context.length>1)total-=context.shift().content.length;
  return context.map(message=>({role:message.role,content:message.content}));
}
async function requestAssistant(){
  const chat=currentChat();
  if(controller||chat.messages.at(-1)?.role!=='user')return;
  const activeController=new AbortController();
  controller=activeController;
  const assistantMessage={role:'assistant',content:''};
  chat.messages.push(assistantMessage);
  liveStatus.textContent='Assistant is responding.';
  showError('');
  persist();
  render();
  try{
    const endpoint=new URL(API_URL);
    if(!['http:','https:'].includes(endpoint.protocol)||location.protocol==='https:'&&endpoint.protocol!=='https:'){
      throw new Error('The chat API URL must use HTTPS on this website.');
    }
    const response=await fetch(endpoint.href,{
      method:'POST',
      headers:{'Content-Type':'application/json','Accept':'application/json'},
      body:JSON.stringify({messages:getContext()}),
      signal:activeController.signal
    });
    if(!response.ok)throw new Error(REQUEST_ERROR);
    const data=await response.json();
    if(typeof data.reply!=='string'||!data.reply.trim())throw new Error(REQUEST_ERROR);
    assistantMessage.content=data.reply.trim();
    chat.updatedAt=Date.now();
    chat.messages=chat.messages.slice(-MAX_STORED_MESSAGES);
    persist();
    liveStatus.textContent='Assistant response complete.';
    render();
  }catch(error){
    if(error.name!=='AbortError'){
      chat.messages=chat.messages.filter(message=>message!==assistantMessage);
      liveStatus.textContent='The assistant could not complete the response.';
      showError(REQUEST_ERROR, 'Retry',()=>requestAssistant());
      persist();
      render();
    }else{
      chat.messages=chat.messages.filter(message=>message!==assistantMessage||message.content);
      if(assistantMessage.content){
        chat.updatedAt=Date.now();
        persist();
        liveStatus.textContent='Response generation stopped. The partial answer is saved.';
      }else{
        chat.messages=chat.messages.filter(message=>message!==assistantMessage);
        liveStatus.textContent='Response generation stopped.';
      }
      render();
    }
  }finally{
    if(controller===activeController)controller=null;
    render();
  }
}
function sendMessage(text){
  const content=text.trim();
  if(!content||controller)return;
  const chat=currentChat();
  chat.messages.push({role:'user',content});
  if(chat.title==='New chat')chat.title=content.replace(/\s+/g,' ').slice(0,42)+(content.length>42?'…':'');
  chat.updatedAt=Date.now();
  input.value='';
  fitInput();
  showError('');
  persist();
  render();
  requestAssistant();
}
function regenerate(){
  const chat=currentChat();
  if(controller||chat.messages.at(-1)?.role!=='assistant')return;
  chat.messages.pop();
  showError('');
  persist();
  requestAssistant();
}
function newChat(){
  if(controller)controller.abort();
  controller=null;
  hideConfirmation();
  const chat=makeChat();
  chats.unshift(chat);
  chats=chats.slice(0,MAX_CHATS);
  currentId=chat.id;
  historyPanel.hidden=true;
  historyToggle.setAttribute('aria-expanded','false');
  input.value='';
  fitInput();
  showError('');
  persist();
  render();
  input.focus();
}
function toggle(open){
  box.classList.toggle('open',open);
  opener.setAttribute('aria-expanded',String(open));
  if(open)setTimeout(()=>input.focus(),200);
}

opener.addEventListener('click',()=>toggle(!box.classList.contains('open')));
byId('cg-x').addEventListener('click',()=>{toggle(false);opener.focus()});
byId('cg-new').addEventListener('click',newChat);
byId('cg-confirm-cancel').addEventListener('click',()=>{
  hideConfirmation();
  byId('cg-clear').focus();
});
byId('cg-confirm-accept').addEventListener('click',()=>{
  const action=confirmAction;
  hideConfirmation();
  if(action)action();
});
historyToggle.addEventListener('click',()=>{
  historyPanel.hidden=!historyPanel.hidden;
  historyToggle.setAttribute('aria-expanded',String(!historyPanel.hidden));
});
byId('cg-clear').addEventListener('click',()=>{
  if(controller)return;
  showConfirmation('Clear all messages in this conversation? This cannot be undone.','Clear messages',()=>{
    currentChat().messages=[];
    currentChat().title='New chat';
    currentChat().updatedAt=Date.now();
    showError('');
    persist();
    render();
  });
});
form.addEventListener('submit',event=>{
  event.preventDefault();
  if(controller){
    controller.abort();
    return;
  }
  sendMessage(input.value);
});
input.addEventListener('input',fitInput);
input.addEventListener('keydown',event=>{
  if(event.key==='Enter'&&!event.shiftKey){
    event.preventDefault();
    form.requestSubmit();
  }
});
addEventListener('keydown',event=>{
  if(event.key==='Escape'&&box.classList.contains('open'))toggle(false);
});
addEventListener('storage',event=>{
  if(event.key!==STORAGE_KEY)return;
  chats=loadChats();
  if(!chats.length)chats=[makeChat()];
  if(!chats.some(chat=>chat.id===currentId))currentId=chats[0].id;
  render();
});
render();
})();
