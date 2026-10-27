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
document.getElementById('f').addEventListener('submit',e=>{
  e.preventDefault();
  const form=e.currentTarget;
  if(!form.reportValidity())return;
  const d=new FormData(form);
  const ok=document.getElementById('ok');
  const body='Name: '+d.get('name')+'\nEmail: '+d.get('email')+'\nBusiness: '+(d.get('business')||'Not provided')+'\nWhatsApp: '+(d.get('whatsapp')||'Not provided')+'\nService: '+d.get('svc')+'\nBudget: '+(d.get('budget')||'Not provided')+'\nDeadline: '+(d.get('deadline')||'Not provided')+'\n\n'+d.get('msg');
  const mail='mailto:'+EMAIL+'?subject='+encodeURIComponent('New project request: '+d.get('svc'))+'&body='+encodeURIComponent(body);
  ok.innerHTML='Your project details are ready. <a href="'+mail+'">Open your email app to send the enquiry</a>, or continue via WhatsApp.';
  ok.style.display='block';
});