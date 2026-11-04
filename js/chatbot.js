(()=>{
'use strict';

const STORAGE_KEY='comgab-ai-conversations-v1';
const MAX_CHATS=25;
const MAX_STORED_MESSAGES=80;
const API_URL=window.COMGAB_CHAT_API_URL||'https://comgab-chat.comgabdigital.workers.dev';
const REQUEST_ERROR='Sorry, I couldn\'t reach the assistant right now. Please try again or contact us on WhatsApp.';
const root=document.createElement('div');
root.innerHTML=`<button id="cg-btn" type="button" aria-label="Open chat assistant" aria-expanded="false" aria-controls="cg"><svg class="cg-chat-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg><svg class="cg-close-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button>
<section id="cg" role="dialog" aria-label="COMGAB AI" aria-modal="false"><header><span class="cg-robot" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M12 3v2m-5 2h10a3 3 0 0 1 3 3v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-7a3 3 0 0 1 3-3Zm-3 6H2v4h2m16-4h2v4h-2M9 12h.01M15 12h.01M9 16h6"/></svg></span><div class="cg-brand"><b>COMGAB AI <span aria-hidden="true">✦</span></b><small>Your digital assistant</small><small id="cg-status" class="sr-only"></small></div><button type="button" id="cg-new" aria-label="Start a new chat" title="New chat">＋</button><button type="button" id="cg-x" aria-label="Close chat">&times;</button></header>
<nav class="cg-toolbar" aria-label="Conversation actions"><button type="button" id="cg-history-toggle" aria-expanded="false" aria-controls="cg-history">Recent chats</button><button type="button" id="cg-clear">Clear chat</button><a href="https://wa.me/233549191228" target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">Chat on WhatsApp</a></nav>
<div id="cg-confirm" class="cg-confirm" role="group" aria-live="assertive" aria-labelledby="cg-confirm-text" hidden><span id="cg-confirm-text"></span><div><button type="button" id="cg-confirm-cancel">Cancel</button><button type="button" id="cg-confirm-accept">Confirm</button></div></div>
<div id="cg-history" aria-label="Recent conversations" hidden></div>
<div id="cg-log" role="log" aria-label="Conversation" aria-live="off"></div>
<div id="cg-live" class="sr-only" role="status" aria-live="polite" aria-atomic="true"></div>
<div id="cg-suggestions" role="group" aria-label="Suggested prompts"></div>
<form id="cg-f" autocomplete="off"><label class="sr-only" for="cg-i">Message COMGAB AI</label><textarea id="cg-i" placeholder="Ask COMGAB AI anything..." rows="1" maxlength="10000"></textarea><button type="submit" id="cg-send" aria-label="Send message"><span>Send</span><svg class="cg-send-icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m22 2-7 20-4-9-9-4 20-7ZM22 2 11 13"/></svg><svg class="cg-stop-icon" viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2"/></svg></button></form>
<p id="cg-error" role="status" aria-live="polite" hidden></p></section>`;
document.body.appendChild(root);

const css=`
#cg-btn{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:90;width:60px;height:60px;border-radius:50%;border:1px solid rgba(255,244,197,.8);cursor:pointer;background:linear-gradient(135deg,#f6dc82,#d4af37 58%,#a8781d);color:#171107;box-shadow:0 10px 30px rgba(212,175,55,.35);display:grid;place-items:center;transition:transform .25s}
#cg-btn:hover{transform:scale(1.07)}
#cg-btn svg{width:27px;height:27px;stroke:currentColor;fill:none;stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}
#cg-btn .cg-close-icon{display:none}
#cg-btn[aria-expanded="true"] .cg-chat-icon{display:none}
#cg-btn[aria-expanded="true"] .cg-close-icon{display:block}
#cg{position:fixed;right:20px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:90;width:min(420px,calc(100vw - 32px));height:min(640px,80vh);min-height:min(360px,80vh);display:flex;flex-direction:column;border-radius:22px;background:#fbf8f0;border:1px solid rgba(212,175,55,.4);box-shadow:0 28px 80px rgba(0,0,0,.58),0 0 36px rgba(212,175,55,.12);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(14px) scale(.98);transition:opacity .25s,transform .25s,visibility .25s}
#cg.open{opacity:1;visibility:visible;transform:none}
#cg header{flex:none;padding:13px 15px;background:#050505;border-bottom:1px solid rgba(212,175,55,.36);display:flex;align-items:center;gap:11px}
#cg .cg-robot{width:42px;height:42px;flex:none;border:1px solid #d4af37;border-radius:50%;display:grid;place-items:center;color:#f6dc82;background:#0b0b0b}
#cg .cg-robot svg{width:25px;height:25px;fill:none;stroke:currentColor;stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round}
#cg .cg-brand{min-width:0;flex:1}
#cg header b{font-family:'DM Sans',system-ui,sans-serif;font-size:1rem;color:#fff8e4;letter-spacing:.025em}
#cg header b span{color:#f6dc82;margin-left:3px}
#cg header small{display:block;color:#d0c8b7;font-size:.75rem}
#cg header button{flex:none;background:#17140b;border:1px solid rgba(212,175,55,.42);border-radius:10px;color:#f6dc82;font-size:1.2rem;cursor:pointer;line-height:1;width:36px;height:36px;transition:background .2s,border-color .2s}
#cg header button:hover{background:#28200d;border-color:#f6dc82}
#cg .cg-toolbar{flex:none;display:flex;align-items:center;justify-content:space-between;gap:3px;padding:7px 10px;background:#f4efe3;border-bottom:1px solid #e8dfcb}
#cg .cg-toolbar button,#cg .cg-toolbar a{border:0;background:none;color:#67521d;font:inherit;font-size:.72rem;padding:6px;border-radius:7px;cursor:pointer;text-decoration:none;white-space:nowrap}
#cg .cg-toolbar button:hover,#cg .cg-toolbar a:hover{background:rgba(212,175,55,.14);color:#39290c}
#cg .cg-confirm{flex:none;padding:10px 12px;background:#f6efdb;border-bottom:1px solid rgba(169,127,33,.3);color:#302817;font-size:.8rem}
#cg .cg-confirm[hidden]{display:none}
#cg .cg-confirm>div{display:flex;justify-content:flex-end;gap:7px;margin-top:8px}
#cg .cg-confirm button,#cg .cg-rename button{border:1px solid rgba(138,100,28,.32);border-radius:7px;background:#fffaf0;color:#302817;font:inherit;font-size:.75rem;padding:6px 10px;cursor:pointer}
#cg .cg-confirm button:last-child{border-color:#b8912a;color:#39290c}
#cg .cg-confirm button:hover,#cg .cg-rename button:hover{background:#f2e6c6}
#cg-history{flex:none;max-height:180px;overflow:auto;padding:7px 10px;background:#f8f4ea;border-bottom:1px solid #e8dfcb}
#cg-history[hidden]{display:none}
#cg .cg-history-row{display:flex;align-items:center;gap:4px;padding:3px;border-radius:8px}
#cg .cg-history-row:hover{background:rgba(138,100,28,.08)}
#cg .cg-history-open{flex:1;min-width:0;text-align:left;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;border:0;background:none;color:#302817;font:inherit;font-size:.78rem;padding:7px;cursor:pointer}
#cg .cg-history-row[aria-current="true"] .cg-history-open{color:#80611a}
#cg .cg-history-action{border:1px solid transparent;border-radius:6px;background:transparent;color:#6b6251;font:inherit;font-size:.7rem;padding:5px;cursor:pointer}
#cg .cg-history-action:hover{border-color:#b8912a;color:#302817}
#cg .cg-rename{display:flex;align-items:center;gap:6px;flex:1}
#cg .cg-rename input{flex:1;min-width:0;padding:6px 8px;border-radius:7px;border:1px solid #d1c4a4;background:#fffdf7;color:#302817;font:inherit;font-size:.78rem}
#cg-log{flex:1;min-height:0;overflow-y:auto;padding:17px;background:#fbf8f0;display:flex;flex-direction:column;gap:13px;scrollbar-color:#c4b995 #fbf8f0;scrollbar-width:thin;scroll-behavior:smooth}
#cg-log::-webkit-scrollbar,#cg-history::-webkit-scrollbar{width:9px}
#cg-log::-webkit-scrollbar-track,#cg-history::-webkit-scrollbar-track{background:#fbf8f0}
#cg-log::-webkit-scrollbar-thumb,#cg-history::-webkit-scrollbar-thumb{background:#c4b995;border:2px solid #fbf8f0;border-radius:999px}
#cg-log::-webkit-scrollbar-thumb:hover,#cg-history::-webkit-scrollbar-thumb:hover{background:#a9945b}
#cg .cm{max-width:85%;padding:11px 14px;border-radius:16px;font-size:15.5px;line-height:1.6;overflow-wrap:anywhere;animation:cmin .2s ease}
@keyframes cmin{from{opacity:0;transform:translateY(5px)}}
#cg .cm.u{max-width:85%;align-self:flex-end;background:linear-gradient(135deg,#f3d879,#d4af37);border:1px solid #c39b28;color:#211907;border-bottom-right-radius:5px;white-space:pre-wrap}
#cg .cm.b{align-self:flex-start;background:#f0ebdf;border:1px solid #e7deca;color:#302d26;border-bottom-left-radius:5px}
#cg .cm-content p{margin:0 0 .75em}
#cg .cm-content p:last-child{margin-bottom:0}
#cg .cm-content h1,#cg .cm-content h2,#cg .cm-content h3{font-family:'DM Sans',system-ui,sans-serif;line-height:1.3;color:#3a2a0d;margin:.85em 0 .45em}
#cg .cm-content h1{font-size:1.2rem}#cg .cm-content h2{font-size:1.1rem}#cg .cm-content h3{font-size:1rem}
#cg .cm-content ul,#cg .cm-content ol{padding-left:1.4em;margin:.45em 0}
#cg .cm-content li{padding-left:.15em;margin:.2em 0}
#cg .cm-content a{color:#765613;text-decoration:underline;text-underline-offset:2px}
#cg .cm-content a:hover{color:#39290c}
#cg .cm-content code{font-family:Consolas,'Courier New',monospace;font-size:.88em;background:#e6dec9;color:#3a2a0d;padding:.13em .35em;border-radius:5px}
#cg .cm-content pre{overflow:auto;max-width:100%;margin:.65em 0;padding:12px;border:1px solid #ddd1b2;border-radius:10px;background:#f2ecdd}
#cg .cm-content pre code{padding:0;background:transparent;color:#302817;white-space:pre}
#cg .cm-actions{display:flex;gap:6px;margin-top:8px}
#cg .cm-actions button{border:1px solid #ddd1b2;border-radius:7px;background:#fffaf0;color:#67521d;font:inherit;font-size:.72rem;padding:5px 9px;cursor:pointer}
#cg .cm-actions button:hover{border-color:#b8912a;color:#302817;background:#f7efd9}
#cg .cg-welcome{max-width:85%;margin:0;color:#302d26}
#cg .cg-welcome b{display:block;color:#5a4314;font-size:1.05rem;margin-bottom:6px}
#cg .cg-welcome p{font-size:.96rem;color:#302d26}
#cg .cg-typing{display:flex;gap:5px;align-items:center;padding:8px 2px;color:#67521d;font-size:.8rem}
#cg .cg-typing i{width:6px;height:6px;border-radius:50%;background:#b8912a;animation:cg-dot 1s infinite}
#cg .cg-typing i:nth-child(2){animation-delay:.15s}#cg .cg-typing i:nth-child(3){animation-delay:.3s}
@keyframes cg-dot{50%{opacity:.3;transform:translateY(-3px)}}
#cg-suggestions{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px;background:transparent}
#cg-suggestions[hidden]{display:none}
#cg-suggestions button{font:inherit;font-size:.78rem;color:#624a13;background:#fffaf0;border:1px solid #d8c38b;border-radius:999px;padding:7px 11px;cursor:pointer}
#cg-suggestions button:hover{background:#f3e7c7;border-color:#b8912a}
#cg form{flex:none;display:flex;align-items:center;gap:8px;margin:10px 12px 12px;padding:6px 7px 6px 13px;background:#fffdf8;border:1px solid #ded3bb;border-radius:999px;box-shadow:0 3px 12px rgba(70,53,15,.07)}
#cg textarea{flex:1;min-width:0;min-height:52px;height:52px;max-height:120px;resize:none;padding:14px 0;border:0;border-radius:0;background:transparent;color:#302817;font:inherit;font-size:.95rem;line-height:1.45}
#cg textarea::placeholder{color:#817968;opacity:1}
#cg textarea:focus{border-color:transparent;box-shadow:none;outline:0}
#cg form button{flex:none;width:46px;height:46px;display:grid;place-items:center;border:0;border-radius:50%;padding:0;cursor:pointer;background:linear-gradient(135deg,#f6dc82,#d4af37 58%,#a8781d);color:#211907;box-shadow:0 3px 8px rgba(138,100,28,.22);transition:filter .2s,transform .2s}
#cg form button span{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
#cg form button svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#cg .cg-stop .cg-send-icon{display:none}
#cg .cg-stop .cg-stop-icon{display:block}
#cg form button:not(.cg-stop) .cg-stop-icon{display:none}
#cg form button:hover:not(:disabled){filter:brightness(1.07);transform:translateY(-1px)}
#cg form button:disabled{opacity:.62;cursor:not-allowed}
#cg form button.cg-stop{background:#2b2924;color:#f6dc82;border:1px solid #b8912a}
#cg #cg-error{flex:none;margin:0 12px 10px;padding:9px 12px;border:1px solid #e2c6bd;border-radius:10px;background:#f8e9e4;color:#6b2e20;font-size:.8rem}
#cg #cg-error[hidden]{display:none}
#cg #cg-error button{margin-left:4px;border:1px solid #b8912a;border-radius:999px;background:#fffaf0;color:#624a13;font:inherit;font-size:.76rem;padding:4px 10px;cursor:pointer}
#cg #cg-error button:hover{background:#f3e7c7}
#cg button:focus-visible,#cg textarea:focus-visible{outline:3px solid #b8912a;outline-offset:2px}
@media(max-width:599px){#cg{left:12px;right:12px;bottom:calc(84px + env(safe-area-inset-bottom,0px));width:calc(100vw - 24px);height:85vh;max-height:calc(100svh - 100px);min-height:0;border-radius:19px}#cg-log{padding:13px}#cg .cm{max-width:85%}#cg header{padding:10px 11px}#cg .cg-toolbar{padding:5px 7px;gap:0}#cg .cg-toolbar button,#cg .cg-toolbar a{font-size:.68rem;padding:6px 4px}#cg .cg-robot{width:38px;height:38px}#cg header button{width:34px;height:34px}}
@media(prefers-reduced-motion:reduce){#cg,#cg .cm,#cg .cg-typing i{animation:none;transition:none}#cg-log{scroll-behavior:auto}}`;
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
  ['I need a website','I need a website'],
  ['What services do you offer?','What services do you offer?'],
  ['I want a quote','I want a quote'],
  ['How do I start a project?','How do I start a project?']
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
    welcome.className='cm b cg-welcome';
    const description=document.createElement('p');
    description.textContent='Hi 👋 Welcome to COMGAB Digital! What are you looking to build today? Tell me about your project and I\'ll help you get started.';
    suggestions.replaceChildren();
    for(const [label,promptText] of promptIdeas){
      const button=makeAction(label,()=>sendMessage(promptText));
      suggestions.append(button);
    }
    suggestions.hidden=false;
    welcome.append(description,suggestions);
    log.append(welcome);
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
  opener.setAttribute('aria-label',open?'Close COMGAB AI':'Open chat assistant');
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
