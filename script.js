// ═══════════════════════════════════════════
//  KAREN ARMANUOS — Portfolio Script
//  ⚠️  Replace firebaseConfig below!
// ═══════════════════════════════════════════

import { initializeApp }   from "https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut }
    from "https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js";
import {
    getFirestore, collection, getDocs, doc, setDoc, addDoc,
    updateDoc, deleteDoc, serverTimestamp, query, orderBy,
    getDoc, increment, where, writeBatch
} from "https://www.gstatic.com/firebasejs/12.2.1/firebase-firestore.js";

// ⚠️ REPLACE WITH YOUR FIREBASE CONFIG
  const firebaseConfig = {
    apiKey: "AIzaSyALtEbx7ayYtLfxibu4Gz0VPvkmW0lLQz8",
    authDomain: "my-portfolio-91b40.firebaseapp.com",
    projectId: "my-portfolio-91b40",
    storageBucket: "my-portfolio-91b40.firebasestorage.app",
    messagingSenderId: "308813211230",
    appId: "1:308813211230:web:2b0512f930b60e856536cf",
    measurementId: "G-89TV1393PJ"
  };


const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ── Globals ──
let isAdmin   = false;
let caseData  = [];
let curX = -100, curY = -100, ringX = -100, ringY = -100, ringVx = 0, ringVy = 0;

const g   = id => document.getElementById(id);
const esc = t  => String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

// ════════════════════════════════
//  THEME
// ════════════════════════════════
function initTheme() {
    const saved = localStorage.getItem('karenTheme') || 'light';
    applyTheme(saved);
    g('theme-toggle').addEventListener('click', () => {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    });
}
function applyTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    localStorage.setItem('karenTheme', t);
}

// ════════════════════════════════
//  LOADING
// ════════════════════════════════
function initLoading() {
    const screen = g('loading-screen'), bar = g('ls-bar');
    if (!screen) return;
    let p = 0;
    const iv = setInterval(() => { p += Math.random()*12+5; if(p>=100){p=100;clearInterval(iv);} if(bar) bar.style.width = p + '%'; }, 110);
    const hide = () => { clearInterval(iv); if(bar) bar.style.width='100%'; screen.classList.add('fade-out'); setTimeout(() => screen.style.display='none', 700); };
    if (document.readyState === 'complete') setTimeout(hide, 300);
    else window.addEventListener('load', () => setTimeout(hide, 300), {once:true});
    setTimeout(hide, 5000);
}

// ════════════════════════════════
//  CURSOR (Magnetic)
// ════════════════════════════════
function initCursor() {
    const outer = g('cur-outer'), inner = g('cur-inner');
    if (!outer || !inner) return;
    window.addEventListener('mousemove', e => { curX = e.clientX; curY = e.clientY; });
    (function loop() {
        ringVx += (curX - ringX) * .14; ringVy += (curY - ringY) * .14;
        ringVx *= .72; ringVy *= .72; ringX += ringVx; ringY += ringVy;
        outer.style.transform = `translate(${ringX}px,${ringY}px) translate(-50%,-50%)`;
        const ix = ringX + (curX - ringX) * .35, iy = ringY + (curY - ringY) * .35;
        inner.style.transform = `translate(${ix}px,${iy}px) translate(-50%,-50%)`;
        requestAnimationFrame(loop);
    })();
    document.querySelectorAll('a,button,.case-card,.tool-card,.process-card,.test-card').forEach(el => {
        el.addEventListener('mouseenter', () => outer.classList.add('hovered'));
        el.addEventListener('mouseleave', () => outer.classList.remove('hovered'));
    });
}

// ════════════════════════════════
//  SCROLL ANIMATIONS
// ════════════════════════════════
function initScrollAnim() {
    // Reveal elements
    const revObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, {threshold: 0.08});
    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));
    // Timeline items
    const tlObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, {threshold: 0.1});
    document.querySelectorAll('.tl-item').forEach(el => tlObs.observe(el));
    // GSAP scroll progress
    if (window.gsap && window.ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        gsap.to('#scroll-progress', { width: '100%', ease: 'none',
            scrollTrigger: { scrub: 0.1, start: 'top top', end: 'bottom bottom' }
        });
    } else {
        window.addEventListener('scroll', () => {
            const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
            const el = g('scroll-progress'); if(el) el.style.width = (p*100) + '%';
        }, {passive:true});
    }
}

// ════════════════════════════════
//  BACK TO TOP + MOBILE MENU
// ════════════════════════════════
function initMisc() {
    const btn = g('back-to-top');
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), {passive:true});
    btn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    const ham = g('hamburger'), nav = g('mobile-nav');
    ham.addEventListener('click', () => nav.classList.toggle('open'));
    document.querySelectorAll('.mn-link').forEach(l => l.addEventListener('click', () => nav.classList.remove('open')));
}

// ════════════════════════════════
//  HERO NAME ANIMATION
// ════════════════════════════════
function initHeroAnim() {
    setTimeout(() => {
        document.querySelectorAll('.hn-line').forEach(el => el.classList.add('anim'));
    }, 200);
}

// ════════════════════════════════
//  STATS COUNTER
// ════════════════════════════════
function countUp(el, target, dur=1400) {
    const t0 = performance.now();
    (function tick(now) {
        const p = Math.min((now-t0)/dur, 1);
        el.textContent = Math.round(target * (1 - Math.pow(1-p, 3)));
        if(p < 1) requestAnimationFrame(tick);
    })(performance.now());
}
function initStats() {
    const sec = g('stats'); if(!sec) return;
    const obs = new IntersectionObserver(entries => {
        if(entries[0].isIntersecting) {
            document.querySelectorAll('.stat-num[data-target]').forEach(el => {
                const t = +el.dataset.target; if(t > 0) countUp(el, t);
            });
            obs.unobserve(sec);
        }
    }, {threshold:.3});
    obs.observe(sec);
}

// ════════════════════════════════
//  VISITOR COUNTER
// ════════════════════════════════
async function initVisitors() {
    const disp = g('visitor-count-display');
    try {
        const ref = doc(db,'siteStats','visitors'), snap = await getDoc(ref);
        let count = snap.exists() ? (snap.data().count || 0) : 0;
        if(!sessionStorage.getItem('karenVisited')) {
            sessionStorage.setItem('karenVisited','1');
            await setDoc(ref, {count: increment(1)}, {merge:true});
            count++;
        }
        if(disp) { const t0=performance.now(); (function tick(now){ const p=Math.min((now-t0)/1200,1); disp.textContent=Math.round(count*(1-Math.pow(1-p,3))).toLocaleString()+' visitors'; if(p<1)requestAnimationFrame(tick); })(performance.now()); }
    } catch { if(disp) disp.textContent = '—'; }
}

// ════════════════════════════════
//  TOAST
// ════════════════════════════════
function toast(msg, type='success', ms=3500) {
    const c = g('toast-container'), el = document.createElement('div');
    el.className = `toast ${type==='error'?'toast-error':''}`;
    el.textContent = (type==='success'?'✓ ':type==='error'?'✕ ':'ℹ ') + msg;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(8px)'; el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, ms);
}

// ════════════════════════════════
//  MODALS
// ════════════════════════════════
function openModal(id)  { g(id).classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeModal(id) { g(id).classList.add('hidden');    document.body.style.overflow=''; }
function initModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => {
            if(e.target === m || e.target.classList.contains('modal-close'))
                closeModal(m.id);
        });
    });
}

// ════════════════════════════════
//  STAR RATING
// ════════════════════════════════
function initStars() {
    const stars = document.querySelectorAll('#star-rating .star'), inp = g('t-rating');
    stars.forEach(s => {
        s.addEventListener('mouseover', () => { const v=+s.dataset.val; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); });
        s.addEventListener('mouseout',  () => { const v=+inp.value||0; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); });
        s.addEventListener('click',     () => { const v=+s.dataset.val; inp.value=v; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); });
    });
}

// ════════════════════════════════
//  LOAD SITE SETTINGS
// ════════════════════════════════
async function loadSiteSettings() {
    try {
        // Hero texts
        const hero = await getDoc(doc(db,'site_content','hero'));
        if(hero.exists()) {
            const d = hero.data();
            if(d.name)       g('hero-name-line1').textContent = d.name.split(' ')[0] || 'Karen';
            if(d.name)       g('hero-name-line2').textContent = d.name.split(' ').slice(1).join(' ') || 'Armanuos';
            if(d.role)       g('hero-role').textContent = d.role;
            if(d.tagline)    g('hero-tagline').innerHTML = d.tagline;
            if(d.statusText) g('hero-status-text').textContent = d.statusText;
        }
        // Hero image
        const heroImg = await getDoc(doc(db,'site_content','heroImage'));
        if(heroImg.exists() && heroImg.data().url) g('hero-image').src = heroImg.data().url;
        // About
        const about = await getDoc(doc(db,'site_content','about'));
        if(about.exists()) {
            const d = about.data();
            if(d.text)     g('about-text').textContent = d.text;
            if(d.imageUrl) g('about-image').src = d.imageUrl;
        }
        // Stats
        const stats = await getDoc(doc(db,'site_content','stats'));
        if(stats.exists()) {
            const d = stats.data();
            if(d.projects != null) { const el=g('stat-projects'); if(el){el.dataset.target=d.projects;el.textContent='0';} }
            if(d.clients  != null) { const el=g('stat-clients');  if(el){el.dataset.target=d.clients; el.textContent='0';} }
            if(d.hours    != null) { const el=g('stat-hours');    if(el){el.dataset.target=d.hours;   el.textContent='0';} }
            if(d.tools)            { const el=g('stat-tools');    if(el) el.textContent=d.tools; }
        }
        // Social links
        const social = await getDoc(doc(db,'site_content','social'));
        if(social.exists()) {
            const d = social.data();
            ['behance','dribbble','linkedin'].forEach(k => {
                if(d[k]) { const a=g('social-'+k); if(a)a.href=d[k]; const fa=g('fs-'+k); if(fa)fa.href=d[k]; }
            });
        }
        // Email
        const contact = await getDoc(doc(db,'site_content','contact'));
        if(contact.exists() && contact.data().email) {
            const em = contact.data().email;
            g('email-text').textContent = em;
            const ml = g('mailto-btn'); if(ml) ml.href = 'mailto:' + em;
        }
    } catch(e) { console.warn('loadSiteSettings:', e); }
}

// ════════════════════════════════
//  INIT STATIC DATA (first admin login)
// ════════════════════════════════
async function initStaticData() {
    const procSnap = await getDocs(collection(db,'process'));
    if(procSnap.empty) {
        const steps = [
            {id:'p1',num:'01',icon:'🔍',title:'Empathize', desc:'Deep-dive into user research, interviews, and journey mapping to understand the real problem.',order:1},
            {id:'p2',num:'02',icon:'📌',title:'Define',    desc:'Synthesize insights into a clear problem statement and define success metrics.',order:2},
            {id:'p3',num:'03',icon:'💡',title:'Ideate',    desc:'Rapid ideation sessions, competitive analysis, and creative concept exploration.',order:3},
            {id:'p4',num:'04',icon:'✏️',title:'Design',    desc:'Wireframes, visual design, and high-fidelity prototypes aligned with brand guidelines.',order:4},
            {id:'p5',num:'05',icon:'🧪',title:'Test',      desc:'Usability testing, A/B testing, and iteration until the experience feels effortless.',order:5},
        ];
        const b = writeBatch(db);
        steps.forEach(({id,...d}) => b.set(doc(db,'process',id),{...d,createdAt:serverTimestamp()}));
        await b.commit();
    }
    const toolsSnap = await getDocs(collection(db,'tools'));
    if(toolsSnap.empty) {
        const tools = [
            {id:'t1',name:'Figma',        icon:'🎨',category:'Design',     level:90},
            {id:'t2',name:'Sketch',       icon:'💎',category:'Design',     level:80},
            {id:'t3',name:'Miro',         icon:'🗺',category:'Research',   level:85},
            {id:'t4',name:'Notion',       icon:'📝',category:'Productivity',level:88},
            {id:'t5',name:'Prototyping',  icon:'📱',category:'Prototyping', level:82},
            {id:'t6',name:'User Research',icon:'🔍',category:'Research',   level:78},
        ];
        const b = writeBatch(db);
        tools.forEach(({id,...d}) => b.set(doc(db,'tools',id),{...d,createdAt:serverTimestamp()}));
        await b.commit();
    }
    const tlSnap = await getDocs(collection(db,'timeline'));
    if(tlSnap.empty) {
        const items = [
            {id:'s1',year:'2023 – Present',role:'UI/UX Designer',company:'Freelance Projects',icon:'🎨',desc:'Designing user-centered digital products — mobile apps, web platforms, and design systems.',tags:['Figma','Prototyping','UX Research']},
            {id:'s2',year:'2022 – Present',role:'Computer Science Student',company:'University',icon:'🎓',desc:'Building a strong foundation in CS while specializing in human-computer interaction and design.',tags:['Design Thinking','HCI','Algorithms']},
        ];
        const b = writeBatch(db);
        items.forEach(({id,...d}) => b.set(doc(db,'timeline',id),{...d,createdAt:serverTimestamp()}));
        await b.commit();
    }
}

// ════════════════════════════════
//  PROCESS
// ════════════════════════════════
async function loadProcess() {
    const wrap = g('process-steps');
    wrap.innerHTML = '<div class="loader-wrap"><div class="loader"></div></div>';
    try {
        let snap;
        try { snap = await getDocs(query(collection(db,'process'),orderBy('order','asc'))); }
        catch { try { snap = await getDocs(query(collection(db,'process'),orderBy('createdAt','asc'))); } catch { snap = await getDocs(collection(db,'process')); } }
        wrap.innerHTML = '';
        if(snap.empty) { renderStaticProcess(wrap); return; }
        const items = [];
        snap.forEach(d => items.push({id:d.id,...d.data()}));
        items.sort((a,b) => (a.order??a.createdAt?.seconds??0) - (b.order??b.createdAt?.seconds??0));
        items.forEach(p => wrap.appendChild(mkProcessCard(p)));
        revealNewItems();
    } catch { renderStaticProcess(wrap); }
}
function renderStaticProcess(wrap) {
    [{id:'p1',num:'01',icon:'🔍',title:'Empathize',desc:'Deep user research and journey mapping.'},{id:'p2',num:'02',icon:'📌',title:'Define',desc:'Clear problem statement and success metrics.'},{id:'p3',num:'03',icon:'💡',title:'Ideate',desc:'Creative concept exploration.'},{id:'p4',num:'04',icon:'✏️',title:'Design',desc:'Wireframes and high-fidelity prototypes.'},{id:'p5',num:'05',icon:'🧪',title:'Test',desc:'Usability testing and iteration.'}]
    .forEach(p => wrap.appendChild(mkProcessCard(p)));
    revealNewItems();
}
function mkProcessCard(p) {
    const c = document.createElement('div'); c.className = 'process-card reveal';
    c.innerHTML = `<div class="pnum">Step ${p.num||p.step||''}</div><span class="picon">${p.icon||'✦'}</span><h3>${esc(p.title||'')}</h3><p>${esc(p.desc||p.description||'')}</p>${isAdmin?`<div class="admin-row"><button class="ab-edit" onclick="editProcess('${p.id}')">Edit</button><button class="ab-del" onclick="delProcess('${p.id}')">Delete</button></div>`:''}`;
    return c;
}
window.editProcess = async id => {
    let d = {};
    try { const s=await getDoc(doc(db,'process',id)); if(s.exists())d=s.data(); } catch {}
    g('process-id').value=id; g('process-num').value=d.num||d.step||''; g('process-icon').value=d.icon||''; g('process-title-inp').value=d.title||''; g('process-desc-inp').value=d.desc||d.description||''; g('process-modal-title').innerText='Edit Step'; openModal('process-modal');
};
window.delProcess = async id => {
    if(!confirm('Delete this step?')) return;
    try { await deleteDoc(doc(db,'process',id)); } catch(e){toast('Error: '+e.message,'error');return;}
    loadProcess(); toast('Deleted','info');
};

// ════════════════════════════════
//  CASE STUDIES
// ════════════════════════════════
async function loadCases() {
    const grid = g('cases-grid');
    grid.innerHTML = '<div class="loader-wrap"><div class="loader"></div></div>';
    try {
        let snap;
        try { snap = await getDocs(query(collection(db,'caseStudies'),orderBy('createdAt','desc'))); }
        catch { snap = await getDocs(collection(db,'caseStudies')); }
        grid.innerHTML = ''; caseData = [];
        if(snap.empty) { grid.innerHTML='<p style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:3rem;text-align:center;grid-column:1/-1">No case studies yet.</p>'; return; }
        snap.forEach(d => { const c={id:d.id,...d.data()}; caseData.push(c); grid.appendChild(mkCaseCard(c)); });
        initFilter(); revealNewItems();
    } catch(e) { grid.innerHTML='<p style="color:#DC2626;padding:3rem;grid-column:1/-1">Error loading.</p>'; console.error(e); }
}
function getCatClass(cat) { return {Mobile:'mobile','Mobile App':'mobile','Web App':'web','Branding':'branding','E-Commerce':'ecomm','Healthcare':'health'}[cat]||'mobile'; }
function mkCaseCard(cs) {
    const card = document.createElement('div'); card.className='case-card reveal'; card.dataset.cat=cs.category||'';
    card.style.cursor='pointer'; card.onclick=()=>showCase(cs.id);
    card.innerHTML=`<div class="case-card-img-wrap"><img class="case-card-img" src="${cs.thumbnail||'https://placehold.co/600x400/FFE4E6/BE185D?text='+encodeURIComponent(cs.title||'Case Study')}" alt="${esc(cs.title)}" loading="lazy"></div><div class="case-card-body"><div class="case-cat ${getCatClass(cs.category)}">${cs.category||'Design'}</div><h3>${esc(cs.title||'')}</h3><p>${esc(cs.description||'')}</p><div class="case-card-tools">${(cs.tools||[]).slice(0,3).map(t=>`<span class="cct">${esc(t)}</span>`).join('')}</div><div class="case-card-footer">${isAdmin?`<div style="display:flex;gap:.4rem"><button class="ab-edit" onclick="event.stopPropagation();editCase('${cs.id}')">Edit</button><button class="ab-del" onclick="event.stopPropagation();delCase('${cs.id}')">Del</button></div>`:'<span></span>'}<span class="case-view">View Study →</span></div></div>`;
    return card;
}
window.showCase = id => {
    const cs = caseData.find(x=>x.id===id); if(!cs) return;
    g('cd-title').innerText=cs.title||''; g('cd-category').innerText=cs.category||'';
    g('cd-main-img').src=cs.thumbnail||''; g('cd-challenge').innerText=cs.challenge||''; g('cd-solution').innerText=cs.solution||'';
    g('cd-tools').innerHTML=(cs.tools||[]).map(t=>`<span class="cct">${esc(t)}</span>`).join('');
    g('cd-gallery').innerHTML=(cs.images||[]).map(img=>`<img src="${img.url||img}" alt="">`).join('');
    const lc=g('cd-links'); lc.innerHTML='';
    if(cs.prototypeLink){const a=document.createElement('a');a.href=cs.prototypeLink;a.target='_blank';a.className='btn-pill-primary';a.style.fontSize='.78rem';a.innerText='View Prototype →';lc.appendChild(a);}
    openModal('case-detail-modal');
};
window.editCase = async id => {
    const cs=caseData.find(x=>x.id===id); if(!cs) return;
    g('case-id').value=id; g('case-title').value=cs.title||''; g('case-category').value=cs.category||'Mobile App'; g('case-desc').value=cs.description||''; g('case-challenge').value=cs.challenge||''; g('case-solution').value=cs.solution||''; g('case-tools').value=(cs.tools||[]).join(', '); g('case-thumbnail').value=cs.thumbnail||''; g('case-prototype').value=cs.prototypeLink||'';
    g('case-imgs-wrap').innerHTML=''; (cs.images||[]).forEach(img=>addImgRow(img.url||img));
    g('case-modal-title').innerText='Edit Case Study'; openModal('case-modal');
};
window.delCase = async id => {
    if(!confirm('Delete?')) return;
    await deleteDoc(doc(db,'caseStudies',id)); loadCases(); toast('Deleted','info');
};
function addImgRow(url='') {
    const r=document.createElement('div'); r.style.cssText='display:flex;gap:.5rem;margin-bottom:.5rem';
    r.innerHTML=`<input type="url" class="m-input case-extra-img" value="${url}" placeholder="Image URL" style="margin:0;flex:1"><button type="button" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:1rem" onclick="this.parentElement.remove()">✕</button>`;
    g('case-imgs-wrap').appendChild(r);
}
function initFilter() {
    document.querySelectorAll('.fb').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.fb').forEach(b=>b.classList.remove('active')); btn.classList.add('active');
            const cat=btn.dataset.cat;
            document.querySelectorAll('.case-card').forEach(c=>{ c.style.display=(cat==='all'||c.dataset.cat===cat)?'':'none'; });
        });
    });
}

// ════════════════════════════════
//  TOOLS
// ════════════════════════════════
async function loadTools() {
    const grid = g('tools-grid');
    grid.innerHTML = '<div class="loader-wrap"><div class="loader"></div></div>';
    try {
        let snap;
        try { snap = await getDocs(query(collection(db,'tools'),orderBy('createdAt','asc'))); }
        catch { snap = await getDocs(collection(db,'tools')); }
        grid.innerHTML = '';
        if(snap.empty) { renderStaticTools(grid); return; }
        snap.forEach(d => grid.appendChild(mkToolCard({id:d.id,...d.data()})));
        setTimeout(animateBars, 100); revealNewItems();
    } catch { renderStaticTools(grid); }
}
function renderStaticTools(grid) {
    [{id:'t1',name:'Figma',icon:'🎨',category:'Design',level:90},{id:'t2',name:'Sketch',icon:'💎',category:'Design',level:80},{id:'t3',name:'Miro',icon:'🗺',category:'Research',level:85},{id:'t4',name:'Notion',icon:'📝',category:'Productivity',level:88},{id:'t5',name:'Prototyping',icon:'📱',category:'Prototyping',level:82},{id:'t6',name:'User Research',icon:'🔍',category:'Research',level:78}]
    .forEach(t => grid.appendChild(mkToolCard(t)));
    setTimeout(animateBars, 100); revealNewItems();
}
function mkToolCard(t) {
    const c=document.createElement('div'); c.className='tool-card reveal';
    c.innerHTML=`<span class="tool-emoji">${t.icon||'🎨'}</span><div class="tool-name">${esc(t.name||'')}</div><div class="tool-cat">${esc(t.category||'')}</div><div class="tool-bar-bg"><div class="tool-bar-fill" data-level="${t.level||80}" style="width:0%"></div></div><div class="tool-pct">${t.level||80}%</div>${isAdmin?`<div class="admin-row"><button class="ab-edit" onclick="editTool('${t.id}')">Edit</button><button class="ab-del" onclick="delTool('${t.id}')">Del</button></div>`:''}`;
    return c;
}
function animateBars() { document.querySelectorAll('.tool-bar-fill').forEach(b => b.style.width=b.dataset.level+'%'); }
window.editTool = async id => {
    let d={};
    try { const s=await getDoc(doc(db,'tools',id)); if(s.exists())d=s.data(); } catch {}
    g('tool-id').value=id; g('tool-name').value=d.name||''; g('tool-icon').value=d.icon||''; g('tool-category').value=d.category||'Design'; g('tool-level').value=d.level||80; g('tool-lvl-display').textContent=(d.level||80)+'%'; g('tool-modal-title').innerText='Edit Tool'; openModal('tool-modal');
};
window.delTool = async id => {
    if(!confirm('Delete this tool?')) return;
    try { await deleteDoc(doc(db,'tools',id)); } catch(e){toast('Error: '+e.message,'error');return;}
    loadTools(); toast('Deleted','info');
};

// ════════════════════════════════
//  TIMELINE
// ════════════════════════════════
async function loadTimeline() {
    const list = g('timeline-list');
    Array.from(list.children).forEach(el=>{if(!el.classList.contains('timeline-line'))el.remove();});
    try {
        let snap;
        try { snap=await getDocs(query(collection(db,'timeline'),orderBy('createdAt','asc'))); }
        catch { snap=await getDocs(collection(db,'timeline')); }
        if(snap.empty){renderStaticTl(list);return;}
        const items=[]; snap.forEach(d=>items.push({id:d.id,...d.data()}));
        items.sort((a,b)=>{ const yr=s=>{const m=String(s||'').match(/\d{4}/);return m?+m[0]:0;}; return yr(b.year||b.date)-yr(a.year||a.date); });
        items.forEach(item=>list.appendChild(mkTlCard(item)));
        revealNewItems();
    } catch { renderStaticTl(list); }
}
function renderStaticTl(list) {
    [{id:'s1',year:'2023 – Present',role:'UI/UX Designer',company:'Freelance',icon:'🎨',desc:'Designing user-centered digital products.',tags:['Figma','UX']},{id:'s2',year:'2022 – Present',role:'CS Student',company:'University',icon:'🎓',desc:'Computer Science with focus on design.',tags:['Design','HCI']}]
    .forEach(item=>list.appendChild(mkTlCard(item))); revealNewItems();
}
function mkTlCard(item) {
    const w=document.createElement('div'); w.className='tl-item';
    w.innerHTML=`<div class="tl-card"><div class="tl-date">${esc(item.year||'')} ${item.icon||''}</div><div class="tl-role">${esc(item.role||'')}</div><div class="tl-company">${esc(item.company||'')}</div><p class="tl-desc">${esc(item.desc||item.description||'')}</p><div class="tl-tags">${(item.tags||[]).map(t=>`<span class="tl-tag">${esc(t)}</span>`).join('')}</div>${isAdmin?`<div class="admin-row"><button class="ab-edit" onclick="editTl('${item.id}')">Edit</button><button class="ab-del" onclick="delTl('${item.id}')">Del</button></div>`:''}</div>`;
    // observe for animation
    const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.1});
    obs.observe(w);
    return w;
}
window.editTl = async id => {
    let d={};
    try { const s=await getDoc(doc(db,'timeline',id)); if(s.exists())d=s.data(); } catch {}
    g('tl-id').value=id; g('tl-year').value=d.year||''; g('tl-role').value=d.role||d.title||''; g('tl-company').value=d.company||''; g('tl-icon').value=d.icon||''; g('tl-desc').value=d.desc||d.description||''; g('tl-tags').value=(d.tags||[]).join(', '); g('tl-modal-title').innerText='Edit Timeline Item'; openModal('timeline-modal');
};
window.delTl = async id => {
    if(!confirm('Delete?')) return;
    try { await deleteDoc(doc(db,'timeline',id)); } catch(e){toast('Error: '+e.message,'error');return;}
    loadTimeline(); toast('Deleted','info');
};

// ════════════════════════════════
//  TESTIMONIALS
// ════════════════════════════════
async function loadTestimonials() {
    const grid = g('testimonials-grid');
    grid.innerHTML='<div class="loader-wrap"><div class="loader"></div></div>';
    try {
        let snap;
        try { snap=await getDocs(query(collection(db,'testimonials'),where('status','==','approved'),orderBy('timestamp','desc'))); }
        catch { snap=await getDocs(query(collection(db,'testimonials'),where('status','==','approved'))); }
        grid.innerHTML='';
        if(snap.empty){grid.innerHTML='<p style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:3rem;text-align:center;grid-column:1/-1">No reviews yet — be the first! ✦</p>';return;}
        snap.forEach(d=>{
            const t={id:d.id,...d.data()},stars='★'.repeat(t.rating||5)+'☆'.repeat(5-(t.rating||5)),ini=(t.name||'A').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
            const card=document.createElement('div'); card.className='test-card reveal';
            card.innerHTML=`<div class="test-bigquote">"</div><div class="test-stars">${stars}</div><p class="test-msg">"${esc(t.message)}"</p><div class="test-author"><div class="test-avatar">${ini}</div><div><div class="test-name">${esc(t.name)}</div><div class="test-role">${esc(t.role||'')}</div></div>${isAdmin?`<div style="margin-left:auto"><button class="ab-del" onclick="delTest('${d.id}')">Del</button></div>`:''}</div>`;
            grid.appendChild(card);
        });
        revealNewItems();
    } catch(e) { grid.innerHTML='<p style="color:var(--muted);padding:3rem;grid-column:1/-1">Unable to load reviews.</p>'; console.error(e); }
}
async function loadPendingTests() {
    const list=g('pending-list'); list.innerHTML='<div class="loader" style="margin:2rem auto"></div>';
    try {
        let snap;
        try{snap=await getDocs(query(collection(db,'testimonials'),where('status','==','pending'),orderBy('timestamp','desc')));}catch{snap=await getDocs(query(collection(db,'testimonials'),where('status','==','pending')));}
        list.innerHTML='';
        if(snap.empty){list.innerHTML='<p style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:2rem;text-align:center">No pending reviews ✦</p>';return;}
        snap.forEach(d=>{
            const t=d.data(),c=document.createElement('div');c.className='pending-card';
            c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem"><div><strong style="font-size:.9rem">${esc(t.name)}</strong> <span style="color:var(--muted);font-size:.8rem">— ${esc(t.role||'')}</span><div style="color:var(--pink);font-size:.85rem">${'★'.repeat(t.rating||5)}</div></div><div style="display:flex;gap:.4rem"><button class="ab-edit" onclick="approveTest('${d.id}',this)">Approve</button><button class="ab-del" onclick="delTest('${d.id}',true)">Reject</button></div></div><p style="font-size:.85rem;color:var(--muted)">${esc(t.message)}</p>`;
            list.appendChild(c);
        });
    } catch { list.innerHTML='<p style="color:#DC2626;padding:2rem">Error loading.</p>'; }
}
window.approveTest = async (id,btn) => { btn.textContent='...'; await updateDoc(doc(db,'testimonials',id),{status:'approved'}); btn.closest('.pending-card').remove(); toast('Approved ✦','success'); loadTestimonials(); };
window.delTest = async (id,pending=false) => { if(!confirm('Delete?')) return; await deleteDoc(doc(db,'testimonials',id)); toast('Deleted','info'); if(pending)loadPendingTests();else loadTestimonials(); };

// ════════════════════════════════
//  REVEAL HELPER
// ════════════════════════════════
function revealNewItems() {
    const obs = new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.08});
    document.querySelectorAll('.reveal:not(.visible)').forEach(el=>obs.observe(el));
}

// ════════════════════════════════
//  MAIN
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', async () => {
    initTheme();
    initLoading();
    initMisc();
    initHeroAnim();
    initScrollAnim();
    initModals();
    initStars();
    setTimeout(initCursor, 500);

    await Promise.all([
        loadSiteSettings().catch(e=>console.warn('settings:',e)),
        loadProcess().catch(e=>console.warn('process:',e)),
        loadCases().catch(e=>console.warn('cases:',e)),
        loadTools().catch(e=>console.warn('tools:',e)),
        loadTimeline().catch(e=>console.warn('tl:',e)),
        loadTestimonials().catch(e=>console.warn('tests:',e)),
        initVisitors().catch(e=>console.warn('visitors:',e)),
    ]);
    initStats();

    // ── AUTH ──
    onAuthStateChanged(auth, async user => {
        isAdmin = !!user;
        g('login-btn').classList.toggle('hidden', isAdmin);
        g('logout-btn').classList.toggle('hidden', !isAdmin);
        ['add-case-btn','add-process-btn','add-tool-btn','add-timeline-btn','edit-stats-btn'].forEach(id=>{const b=g(id);if(b)b.classList.toggle('hidden',!isAdmin);});
        ['edit-about-btn','edit-social-btn','edit-status-btn','edit-role-btn','edit-tagline-btn','edit-hero-img-btn','edit-email-btn'].forEach(id=>{const b=g(id);if(b)b.style.display=isAdmin?'inline-flex':'none';});
        if(isAdmin && !g('reviews-nav-btn')) {
            const rb=document.createElement('button'); rb.id='reviews-nav-btn'; rb.className='nav-cta'; rb.textContent='⚡ Reviews';
            rb.onclick=()=>{openModal('testimonial-admin-modal');loadPendingTests();};
            g('logout-btn').before(rb);
        }
        if(g('reviews-nav-btn')) g('reviews-nav-btn').classList.toggle('hidden',!isAdmin);
        if(isAdmin) await initStaticData();
        await Promise.all([loadProcess(),loadCases(),loadTools(),loadTimeline(),loadTestimonials()]);
    });

    // ── Login/Logout ──
    g('login-btn').addEventListener('click',()=>openModal('login-modal'));
    g('login-form').addEventListener('submit',async e=>{e.preventDefault();const btn=g('login-submit-btn');btn.textContent='...';
        try{await signInWithEmailAndPassword(auth,g('email').value,g('password').value);closeModal('login-modal');toast('Welcome back, Karen ✦','success');}
        catch{g('login-error').textContent='Invalid credentials.';}finally{btn.textContent='Login';}});
    g('logout-btn').addEventListener('click',async()=>{await signOut(auth);toast('Logged out','info');});

    // ── Hero edits ──
    g('edit-status-btn').addEventListener('click',()=>{g('te-title').textContent='Edit Status';g('te-doc').value='hero';g('te-field').value='statusText';g('te-content').value=g('hero-status-text').textContent;openModal('text-edit-modal');});
    g('edit-role-btn').addEventListener('click',()=>{g('te-title').textContent='Edit Role';g('te-doc').value='hero';g('te-field').value='role';g('te-content').value=g('hero-role').textContent;openModal('text-edit-modal');});
    g('edit-tagline-btn').addEventListener('click',()=>{g('te-title').textContent='Edit Tagline';g('te-doc').value='hero';g('te-field').value='tagline';g('te-content').value=g('hero-tagline').textContent;openModal('text-edit-modal');});
    g('text-edit-form').addEventListener('submit',async e=>{e.preventDefault();
        const docN=g('te-doc').value,field=g('te-field').value,content=g('te-content').value;
        try{await setDoc(doc(db,'site_content',docN),{[field]:content},{merge:true});
            if(field==='role')g('hero-role').textContent=content;
            if(field==='tagline')g('hero-tagline').innerHTML=content;
            if(field==='statusText')g('hero-status-text').textContent=content;
            closeModal('text-edit-modal');toast('Updated ✦','success');}catch{toast('Error','error');}});

    // ── Hero image ──
    g('edit-hero-img-btn').addEventListener('click',()=>{g('hero-img-url').value=g('hero-image').src;openModal('hero-img-modal');});
    g('hero-img-form').addEventListener('submit',async e=>{e.preventDefault();const url=g('hero-img-url').value;
        try{await setDoc(doc(db,'site_content','heroImage'),{url},{merge:true});g('hero-image').src=url;closeModal('hero-img-modal');toast('Photo updated ✦','success');}catch{toast('Error','error');}});

    // ── About ──
    g('edit-about-btn').addEventListener('click',()=>{g('about-modal-text').value=g('about-text').textContent.trim();g('about-image-url').value=g('about-image').src;openModal('about-modal');});
    g('about-form').addEventListener('submit',async e=>{e.preventDefault();const text=g('about-modal-text').value,imageUrl=g('about-image-url').value;
        try{await setDoc(doc(db,'site_content','about'),{text,imageUrl},{merge:true});g('about-text').textContent=text;if(imageUrl)g('about-image').src=imageUrl;closeModal('about-modal');toast('About updated ✦','success');}catch{toast('Error','error');}});

    // ── Social ──
    g('edit-social-btn').addEventListener('click',async()=>{
        try{const s=await getDoc(doc(db,'site_content','social'));if(s.exists()){const d=s.data();g('sl-behance').value=d.behance||'';g('sl-dribbble').value=d.dribbble||'';g('sl-linkedin').value=d.linkedin||'';}}catch{}
        openModal('social-modal');});
    g('social-form').addEventListener('submit',async e=>{e.preventDefault();const behance=g('sl-behance').value,dribbble=g('sl-dribbble').value,linkedin=g('sl-linkedin').value;
        try{await setDoc(doc(db,'site_content','social'),{behance,dribbble,linkedin},{merge:true});
            ['behance','dribbble','linkedin'].forEach(k=>{const v={behance,dribbble,linkedin}[k];if(v){const a=g('social-'+k);if(a)a.href=v;const fa=g('fs-'+k);if(fa)fa.href=v;}});
            closeModal('social-modal');toast('Links updated ✦','success');}catch{toast('Error','error');}});

    // ── Email ──
    g('edit-email-btn').addEventListener('click',()=>{g('email-input').value=g('email-text').textContent;openModal('email-modal');});
    g('email-form').addEventListener('submit',async e=>{e.preventDefault();const email=g('email-input').value;
        try{await setDoc(doc(db,'site_content','contact'),{email},{merge:true});g('email-text').textContent=email;const ml=g('mailto-btn');if(ml)ml.href='mailto:'+email;closeModal('email-modal');toast('Email updated ✦','success');}catch{toast('Error','error');}});

    // ── Stats ──
    g('edit-stats-btn').addEventListener('click',()=>{g('se-projects').value=g('stat-projects')?.dataset.target||0;g('se-clients').value=g('stat-clients')?.dataset.target||0;g('se-hours').value=g('stat-hours')?.dataset.target||0;g('se-tools').value=g('stat-tools')?.textContent||'Figma';openModal('stats-modal');});
    g('stats-form').addEventListener('submit',async e=>{e.preventDefault();const projects=+g('se-projects').value,clients=+g('se-clients').value,hours=+g('se-hours').value,tools=g('se-tools').value;
        try{await setDoc(doc(db,'site_content','stats'),{projects,clients,hours,tools},{merge:true});
            [{id:'stat-projects',v:projects},{id:'stat-clients',v:clients},{id:'stat-hours',v:hours}].forEach(({id,v})=>{const el=g(id);if(el){el.dataset.target=v;el.textContent='0';}});
            const st=g('stat-tools');if(st)st.textContent=tools;
            closeModal('stats-modal');initStats();toast('Stats updated ✦','success');}catch{toast('Error','error');}});

    // ── Process ──
    g('add-process-btn').addEventListener('click',()=>{g('process-id').value='';g('process-form').reset();g('process-modal-title').innerText='Add Process Step';openModal('process-modal');});
    g('process-form').addEventListener('submit',async e=>{e.preventDefault();const id=g('process-id').value;
        const data={num:g('process-num').value,icon:g('process-icon').value,title:g('process-title-inp').value,desc:g('process-desc-inp').value};
        try{if(id)await setDoc(doc(db,'process',id),data,{merge:true});else await addDoc(collection(db,'process'),{...data,order:Date.now(),createdAt:serverTimestamp()});
            closeModal('process-modal');await loadProcess();toast('Saved ✦','success');}catch(err){toast('Error: '+err.message,'error',6000);}});

    // ── Case Study ──
    g('add-case-btn').addEventListener('click',()=>{g('case-id').value='';g('case-form').reset();g('case-imgs-wrap').innerHTML='';g('case-modal-title').innerText='Add Case Study';openModal('case-modal');});
    g('add-case-img-btn').addEventListener('click',()=>addImgRow());
    g('case-form').addEventListener('submit',async e=>{e.preventDefault();const id=g('case-id').value;
        const images=Array.from(document.querySelectorAll('.case-extra-img')).map(x=>({url:x.value})).filter(x=>x.url);
        const data={title:g('case-title').value,category:g('case-category').value,description:g('case-desc').value,challenge:g('case-challenge').value,solution:g('case-solution').value,tools:g('case-tools').value.split(',').map(t=>t.trim()).filter(Boolean),thumbnail:g('case-thumbnail').value,prototypeLink:g('case-prototype').value,images};
        try{if(id)await setDoc(doc(db,'caseStudies',id),data,{merge:true});else await addDoc(collection(db,'caseStudies'),{...data,createdAt:serverTimestamp()});
            closeModal('case-modal');loadCases();toast('Case study saved ✦','success');}catch(err){toast('Error: '+err.message,'error',6000);}});

    // ── Tool ──
    g('add-tool-btn').addEventListener('click',()=>{g('tool-id').value='';g('tool-form').reset();g('tool-lvl-display').textContent='80%';g('tool-modal-title').innerText='Add Tool';openModal('tool-modal');});
    g('tool-level').addEventListener('input',()=>{g('tool-lvl-display').textContent=g('tool-level').value+'%';});
    g('tool-form').addEventListener('submit',async e=>{e.preventDefault();const id=g('tool-id').value;
        const data={name:g('tool-name').value,icon:g('tool-icon').value,category:g('tool-category').value,level:+g('tool-level').value};
        try{if(id)await setDoc(doc(db,'tools',id),data,{merge:true});else await addDoc(collection(db,'tools'),{...data,createdAt:serverTimestamp()});
            closeModal('tool-modal');loadTools();toast('Tool saved ✦','success');}catch(err){toast('Error: '+err.message,'error');}});

    // ── Timeline ──
    g('add-timeline-btn').addEventListener('click',()=>{g('tl-id').value='';g('timeline-form').reset();g('tl-modal-title').innerText='Add Item';openModal('timeline-modal');});
    g('timeline-form').addEventListener('submit',async e=>{e.preventDefault();const id=g('tl-id').value;
        const data={year:g('tl-year').value,role:g('tl-role').value,company:g('tl-company').value,icon:g('tl-icon').value||'🎓',desc:g('tl-desc').value,tags:g('tl-tags').value.split(',').map(t=>t.trim()).filter(Boolean)};
        try{if(id)await setDoc(doc(db,'timeline',id),data,{merge:true});else await addDoc(collection(db,'timeline'),{...data,createdAt:serverTimestamp()});
            closeModal('timeline-modal');loadTimeline();toast('Saved ✦','success');}catch(err){toast('Error: '+err.message,'error');}});

    // ── Testimonials ──
    g('leave-feedback-btn').addEventListener('click',()=>openModal('testimonial-modal'));
    g('testimonial-form').addEventListener('submit',async e=>{e.preventDefault();const rating=+g('t-rating').value;if(!rating){toast('Please select a rating ⭐','error');return;}g('t-submit-btn').disabled=true;
        try{await addDoc(collection(db,'testimonials'),{name:g('t-name').value,role:g('t-role').value,message:g('t-message').value,rating,status:'pending',timestamp:serverTimestamp()});
            closeModal('testimonial-modal');g('testimonial-form').reset();document.querySelectorAll('#star-rating .star').forEach(s=>s.classList.remove('filled'));g('t-rating').value='0';
            toast('Review submitted ✦ Awaiting approval','success',5000);}catch{toast('Error','error');}finally{g('t-submit-btn').disabled=false;}});

    // ── Copy email ──
    g('copy-email-btn').addEventListener('click',()=>{
        navigator.clipboard.writeText(g('email-text').textContent).then(()=>{const m=g('copy-msg');m.classList.add('show');setTimeout(()=>m.classList.remove('show'),2500);toast('Email copied ✦','success',2000);});});

    g('year').textContent = new Date().getFullYear();
});
