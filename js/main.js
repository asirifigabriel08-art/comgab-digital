document.documentElement.classList.add('js');
const EMAIL='comgabdigital@gmail.com';
const nav=document.getElementById('nav');
const ham=document.getElementById('ham');
const links=document.getElementById('links');
const setMenuOpen=open=>{
  ham.classList.toggle('o',open);
  links.classList.toggle('o',open);
  ham.setAttribute('aria-expanded',String(open));
  ham.setAttribute('aria-label',open?'Close menu':'Open menu');
};
addEventListener('scroll',()=>nav.classList.toggle('s',scrollY>20),{passive:true});
ham.addEventListener('click',()=>setMenuOpen(ham.getAttribute('aria-expanded')!=='true'));
links.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>setMenuOpen(false)));
addEventListener('keydown',e=>{if(e.key==='Escape')setMenuOpen(false)});
if('IntersectionObserver'in window){
  const io=new IntersectionObserver(entries=>entries.forEach(entry=>{
    if(entry.isIntersecting){entry.target.classList.add('in');io.unobserve(entry.target)}
  }),{threshold:.15});
  document.querySelectorAll('.rv').forEach(el=>io.observe(el));
}else{
  document.querySelectorAll('.rv').forEach(el=>el.classList.add('in'));
}
const sc=document.getElementById('scene');
if(sc&&matchMedia('(hover:hover) and (prefers-reduced-motion: no-preference)').matches){
  sc.addEventListener('mousemove',e=>{
    const r=sc.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;
    sc.style.transform=`rotateY(${x*8}deg) rotateX(${-y*8}deg)`;
  });
  sc.addEventListener('mouseleave',()=>sc.style.transform='');
}
document.getElementById('f').addEventListener('submit',async e=>{
  e.preventDefault();
  const form=e.currentTarget;
  if(!form.reportValidity())return;
  const d=new FormData(form);
  const ok=document.getElementById('ok');
  const btn=form.querySelector('button[type=submit]');
  const label=btn.textContent;
  btn.disabled=true;btn.textContent='Sending...';
  ok.style.display='none';
  try{
    const r=await fetch('https://formsubmit.co/ajax/'+EMAIL,{
      method:'POST',
      headers:{'Content-Type':'application/json',Accept:'application/json'},
      body:JSON.stringify({name:d.get('name'),email:d.get('email'),service:d.get('svc'),message:d.get('msg'),_subject:'New project request: '+d.get('svc'),_replyto:d.get('email'),_template:'table',_captcha:'false'})
    });
    const j=await r.json();
    if(!r.ok||String(j.success)==='false')throw new Error('fail');
    ok.textContent='Thank you! Your project request has been sent. We will get back to you shortly.';
    ok.style.display='block';
    form.reset();
  }catch(err){
    ok.innerHTML='Sorry, we could not send your request. Please email <a href="mailto:'+EMAIL+'">'+EMAIL+'</a> or WhatsApp +233 54 919 1228.';
    ok.style.display='block';
  }finally{btn.disabled=false;btn.textContent=label;}
});