(()=>{
const EMAIL='comgabdigital@gmail.com';
const pick=a=>a[Math.floor(Math.random()*a.length)];
const state={name:null,used:{},last:'',asked:false};

// Each intent: regex, list of varied replies, optional follow-up suggestions.
const intents=[
{id:'greet',re:/\b(hi|hello|hey|good (morning|afternoon|evening)|howdy|yo)\b/i,r:[
 n=>`Hi${n}! 👋 Great to have you here. What are you looking to build?`,
 n=>`Hello${n}! Welcome to COMGAB DIGITAL. Tell me a bit about your idea and I'll point you the right way.`,
 n=>`Hey${n}! Happy you stopped by. Are you thinking of a website, an app, or something with AI?`]},
{id:'how',re:/how are you|how('s| is) it going|what'?s up/i,r:[
 ()=>`Doing great, thanks for asking! Ready to help. What brings you here today?`,
 ()=>`All good on my side 😊 How can I help with your project?`]},
{id:'name',re:/(my name is|i am|i'm|call me)\s+([a-z]+)/i,r:[
 n=>`Nice to meet you${n}! What can we help you build?`,
 n=>`Lovely to meet you${n}. Are you after a website, an app, or something else?`]},
{id:'web',re:/\b(web ?site|web ?dev|landing page|online store|e-?commerce|web app)\b/i,r:[
 ()=>`We build fast, responsive, conversion-focused websites, from business sites to online stores. Do you already have a brand and content, or are you starting from scratch?`,
 ()=>`Websites are one of our specialties. We handle design, development and launch. What's the website for?`,
 ()=>`Great choice! A strong website is the base of any online presence. Roughly what pages or features do you need?`]},
{id:'app',re:/\b(mobile|app|ios|android|iphone)\b/i,r:[
 ()=>`We build polished iOS and Android apps. Is it for customers, your team, or both?`,
 ()=>`Mobile apps are right up our street. What should the app let people do?`,
 ()=>`Nice! Share the main idea of the app and I can tell you how we'd approach it.`]},
{id:'ai',re:/\b(ai|artificial|video|content|copy|chatbot|automation)\b/i,r:[
 ()=>`Our AI work covers AI-powered video, visuals and written content that tell your story at scale. What would you like to create?`,
 ()=>`AI content is a great way to move faster. Are you thinking promo videos, social visuals, or copywriting?`]},
{id:'ux',re:/\b(ui|ux|design|logo|brand|figma|wireframe)\b/i,r:[
 ()=>`Our UI/UX design focuses on clean, intuitive interfaces built around real users. Is this a new design or a redesign?`,
 ()=>`Design is where we love to start: wireframes, visuals, then a clickable look at the result. What are you designing?`]},
{id:'seo',re:/\b(seo|google|rank|ranking|traffic|search)\b/i,r:[
 ()=>`We do technical and content SEO to help people find you on Google. Do you already have a site we should look at?`,
 ()=>`Good thinking, visibility matters. We optimise speed, structure and content. Is your site live yet?`]},
{id:'maint',re:/\b(maintenance|support|update|fix|bug|broken|hosting|security)\b/i,r:[
 ()=>`We offer maintenance and support: updates, security and fixes so your site or app stays in top shape. What needs attention?`,
 ()=>`Happy to help keep things running smoothly. Is something broken right now, or do you want ongoing care?`]},
{id:'price',re:/\b(price|cost|how much|quote|budget|pricing|rate|afford|cheap)\b/i,r:[
 ()=>`Pricing depends on scope, so we give a tailored quote after a short chat about your goals. Click "Start a Project" or tell me what you need and I'll help you prepare the request.`,
 ()=>`Every project is different, so we quote per project rather than guess. If you describe your idea, I'll help you send it to the team.`,
 ()=>`Fair question! We'll tailor a quote to your needs and budget. What are you planning to build?`]},
{id:'time',re:/\b(how long|timeline|deadline|when|duration|turnaround|fast|quickly)\b/i,r:[
 ()=>`Timelines depend on the project size. A simple site can be quick, while apps take longer. We'll agree a clear schedule up front. Do you have a target date?`,
 ()=>`We'll give you a realistic timeline once we know the scope. Is there a date you need to hit?`]},
{id:'process',re:/\b(process|steps|how do you work|workflow|how it works)\b/i,r:[
 ()=>`Simple: Discover (your goals), Design (wireframes and visuals), Build (with regular previews), then Launch & Grow (go live, support and optimise).`]},
{id:'start',re:/start a project|get started|work with you|hire/i,r:[()=>`Wonderful! Tell me a little about your idea (what you want to build and roughly when). When you're ready, say \"email them\" and I'll open a message to the team, or use the contact form below.`,()=>`Love it! What kind of project is it: website, app, AI content or something else?`]},
{id:'contact',re:/\b(contact|email|phone|call|reach|talk to|human|person|speak)\b/i,r:[
 ()=>`You can call or WhatsApp the team on +233 54 919 1228, email ${EMAIL}, or use the contact form at the bottom of the page. I can also open an email for you. Just say "email them".`]},
{id:'emailnow',re:/email them|send (it|an email|a message)|open (an )?email/i,r:[
 ()=>`Opening an email to the team for you now 📧`],action:()=>{
  const body=`Hi COMGAB DIGITAL,\n\n${state.name?'My name is '+state.name+'.\n':''}I'd like to discuss a project.\n`;
  location.href=`mailto:${EMAIL}?subject=${encodeURIComponent('Project enquiry')}&body=${encodeURIComponent(body)}`}},
{id:'who',re:/\b(who are you|what are you|are you (a )?(bot|robot|human|real))\b/i,r:[
 ()=>`I'm the COMGAB DIGITAL virtual assistant, an automated helper (not a person). I can answer questions about our services and help you get in touch with the team.`]},
{id:'services',re:/\b(services|what do you (do|offer)|offer|help with)\b/i,r:[
 ()=>`We offer website design & development, mobile apps, AI video & content creation, UI/UX design, SEO, and maintenance & support. Which one interests you most?`]},
{id:'thanks',re:/\b(thanks|thank you|thx|cheers|appreciate)\b/i,r:[
 ()=>`You're very welcome! 😊 Anything else I can help with?`,
 ()=>`My pleasure! I'm here if you have more questions.`,
 ()=>`Glad I could help! Feel free to ask anything else.`]},
{id:'bye',re:/\b(bye|goodbye|see you|later|that'?s all)\b/i,r:[
 ()=>`Thanks for visiting COMGAB DIGITAL! Have a wonderful day 🌟`,
 ()=>`Take care! We'd love to work with you whenever you're ready.`]},
{id:'yes',re:/^(yes|yeah|yep|sure|ok(ay)?|please|go ahead)\W*$/i,r:[
 ()=>`Great! Tell me a bit more about what you have in mind, and I'll guide you from there.`,
 ()=>`Perfect. What would you like to know or build first?`]},
{id:'no',re:/^(no|nope|nah|not really)\W*$/i,r:[
 ()=>`No problem at all. Ask me anything whenever you like.`,
 ()=>`That's fine! Let me know if there's something else I can help with.`]}
];

const fallbacks=[
 ()=>`Thanks for sharing that! Could you tell me a little more? I can help with websites, apps, AI content, design, SEO and support.`,
 ()=>`I want to get this right. Is this about a website, an app, AI content, or something else?`,
 ()=>`Interesting! I may not have the full answer, but our team will. Want me to open an email to them (just say "email them")?`,
 ()=>`Could you rephrase that for me? Or ask about our services, process or pricing.`,
 ()=>`I'm not sure I caught that, but I'd love to help. What kind of project do you have in mind?`
];

function reply(text){
  const t=text.trim();
  const nm=t.match(/(my name is|i am|i'm|call me)\s+([a-z]+)/i);
  if(nm&&!/^(looking|interested|here|a|an|the|just|not|building|want|need)$/i.test(nm[2]))
    state.name=nm[2][0].toUpperCase()+nm[2].slice(1).toLowerCase();
  const n=state.name?`, ${state.name}`:'';
  // Match specific intents first; greetings only win if nothing else matches.
  const hits=intents.filter(i=>i.re.test(t));
  const hit=hits.find(i=>i.id!=='greet'&&i.id!=='yes'&&i.id!=='no')||hits[0];
  let pool,id;
  if(hit){
    id=hit.id;pool=hit.r;
    if(hit.action)setTimeout(hit.action,900);
  }else{id='fb';pool=fallbacks}
  const used=state.used[id]||(state.used[id]=[]);
  let options=pool.map((f,i)=>i).filter(i=>!used.includes(i));
  if(!options.length){used.length=0;options=pool.map((f,i)=>i)}
  let out;
  // Never repeat the previous message, even after a pool reset.
  for(let tries=0;tries<10;tries++){
    const idx=pick(options);out=pool[idx](n);
    if(out!==state.last){used.push(idx);break}
  }
  state.last=out;
  return out;
}

// UI
const css=`
#cg-btn{position:fixed;right:20px;bottom:calc(20px + env(safe-area-inset-bottom,0px));z-index:90;width:60px;height:60px;border-radius:50%;border:0;cursor:pointer;background:linear-gradient(120deg,#70e9f4,#8c9cff);color:#02121a;box-shadow:0 10px 30px rgba(58,196,220,.35);display:grid;place-items:center;transition:transform .25s}
#cg-btn:hover{transform:scale(1.07)}
#cg-btn svg{width:28px;height:28px;stroke:currentColor;fill:none;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
#cg{position:fixed;right:20px;bottom:calc(92px + env(safe-area-inset-bottom,0px));z-index:90;width:min(380px,calc(100vw - 32px));height:min(540px,calc(100svh - 130px));display:flex;flex-direction:column;border-radius:22px;background:rgba(10,15,29,.96);border:1px solid var(--bd);backdrop-filter:blur(18px);box-shadow:0 30px 80px rgba(0,0,0,.55);overflow:hidden;opacity:0;visibility:hidden;transform:translateY(14px) scale(.98);transition:.3s}
#cg.open{opacity:1;visibility:visible;transform:none}
#cg header{padding:16px 18px;border-bottom:1px solid var(--bd);display:flex;align-items:center;gap:12px}
#cg header i{width:10px;height:10px;border-radius:50%;background:#4ade80;box-shadow:0 0 10px #4ade80}
#cg header b{font-family:'Space Grotesk',sans-serif;font-size:1rem}
#cg header small{display:block;color:var(--mu);font-size:.75rem}
#cg header button{margin-left:auto;background:none;border:0;color:var(--mu);font-size:1.5rem;cursor:pointer;line-height:1}
#cg-log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
.cm{max-width:84%;padding:10px 14px;border-radius:16px;font-size:.92rem;line-height:1.45;animation:cmin .25s ease;overflow-wrap:anywhere}
@keyframes cmin{from{opacity:0;transform:translateY(6px)}}
.cm.b{background:rgba(255,255,255,.07);border:1px solid var(--bd);align-self:flex-start;border-bottom-left-radius:5px}
.cm.u{background:linear-gradient(120deg,#70e9f4,#8c9cff);color:#02121a;align-self:flex-end;border-bottom-right-radius:5px}
.cm.t{display:flex;gap:4px;padding:14px}
.cm.t span{width:6px;height:6px;border-radius:50%;background:var(--mu);animation:td 1s infinite}
.cm.t span:nth-child(2){animation-delay:.15s}.cm.t span:nth-child(3){animation-delay:.3s}
@keyframes td{50%{opacity:.25;transform:translateY(-3px)}}
#cg-q{display:flex;gap:8px;flex-wrap:wrap;padding:0 16px 10px}
#cg-q button{font:inherit;font-size:.8rem;color:var(--ac);background:rgba(102,227,244,.07);border:1px solid rgba(102,227,244,.25);border-radius:999px;padding:6px 12px;cursor:pointer}
#cg form{display:flex;gap:8px;padding:12px;border-top:1px solid var(--bd)}
#cg input{flex:1;padding:11px 14px;border-radius:999px}
#cg form button{border:0;border-radius:999px;padding:0 18px;font-weight:600;cursor:pointer;background:linear-gradient(120deg,#70e9f4,#8c9cff);color:#02121a;font-family:inherit}
@media(prefers-reduced-motion:reduce){.cm,.cm.t span{animation:none}}`;
const st=document.createElement('style');st.textContent=css;document.head.appendChild(st);

const root=document.createElement('div');
root.innerHTML=`<button id="cg-btn" type="button" aria-label="Open chat assistant" aria-expanded="false" aria-controls="cg"><svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 01-11.6 7.1L4 20l1-4.6A8 8 0 1121 12z"/></svg></button>
<section id="cg" role="dialog" aria-label="COMGAB DIGITAL assistant"><header><i></i><div><b>COMGAB Assistant</b><small>Automated helper · usually instant</small></div><button type="button" id="cg-x" aria-label="Close chat">&times;</button></header>
<div id="cg-log" aria-live="polite"></div>
<div id="cg-q"></div>
<form id="cg-f" autocomplete="off"><input id="cg-i" placeholder="Type your message…" aria-label="Your message" maxlength="400"><button type="submit">Send</button></form></section>`;
document.body.appendChild(root);

const btn=document.getElementById('cg-btn'),box=document.getElementById('cg'),log=document.getElementById('cg-log'),inp=document.getElementById('cg-i'),q=document.getElementById('cg-q');
const add=(txt,who)=>{const d=document.createElement('div');d.className='cm '+who;d.textContent=txt;log.appendChild(d);log.scrollTop=log.scrollHeight;return d};
const say=txt=>{
  const t=document.createElement('div');t.className='cm b t';t.innerHTML='<span></span><span></span><span></span>';log.appendChild(t);log.scrollTop=log.scrollHeight;
  setTimeout(()=>{t.remove();add(txt,'b')},500+Math.min(txt.length*12,900));
};
const send=txt=>{if(!txt.trim())return;add(txt,'u');q.style.display='none';say(reply(txt))};
let started=false;
const toggle=open=>{
  box.classList.toggle('open',open);btn.setAttribute('aria-expanded',String(open));
  if(open){
    if(!started){started=true;say("Hi there! 👋 I'm the COMGAB DIGITAL assistant. What can I help you with today?");
      ['Your services','Pricing','Start a project','How it works'].forEach(l=>{const b=document.createElement('button');b.type='button';b.textContent=l;b.onclick=()=>send(l==='Start a project'?'I want to start a project':l==='Your services'?'What services do you offer?':l==='Pricing'?'How much does it cost?':'What is your process?');q.appendChild(b)})}
    setTimeout(()=>inp.focus(),300);
  }
};
btn.onclick=()=>toggle(!box.classList.contains('open'));
document.getElementById('cg-x').onclick=()=>{toggle(false);btn.focus()};
addEventListener('keydown',e=>{if(e.key==='Escape'&&box.classList.contains('open'))toggle(false)});
document.getElementById('cg-f').onsubmit=e=>{e.preventDefault();const v=inp.value;inp.value='';send(v)};
})();
