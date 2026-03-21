

// ── Mock Data (Local State) ──
let isAdmin = false;
const g = id => document.getElementById(id);
const esc = t => String(t||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');

let curX = -100, curY = -100, ringX = -100, ringY = -100, ringVx = 0, ringVy = 0;

let caseData = [
    { id: 'c1', title: 'E-Commerce Redesign', category: 'Web App', description: 'A complete overhaul of a fashion store.', challenge: 'Low conversion rates.', solution: 'Streamlined checkout process.', tools: ['Figma', 'Miro'], thumbnail: 'https://placehold.co/600x400/FFE4E6/BE185D?text=E-Commerce', images: [] },
    { id: 'c2', title: 'Health Tracker', category: 'Mobile App', description: 'Minimalist habit tracking experience.', challenge: 'User retention.', solution: 'Gamified UI elements.', tools: ['Sketch', 'Notion'], thumbnail: 'https://placehold.co/600x400/FFE4E6/BE185D?text=Health+App', images: [] }
];
let processData = [
    {id:'p1',num:'01',icon:'🔍',title:'Empathize', desc:'Deep-dive into user research, interviews, and journey mapping to understand the real problem.'},
    {id:'p2',num:'02',icon:'📌',title:'Define',    desc:'Synthesize insights into a clear problem statement and define success metrics.'},
    {id:'p3',num:'03',icon:'💡',title:'Ideate',    desc:'Rapid ideation sessions, competitive analysis, and creative concept exploration.'}
];
let toolsData = [
    {id:'t1',name:'Figma', icon:'🎨',category:'Design', level:90},
    {id:'t2',name:'Miro',  icon:'🗺',category:'Research', level:85}
];
let timelineData = [
    {id:'s1',year:'2023 – Present',role:'UI/UX Designer',company:'Freelance Projects',icon:'🎨',desc:'Designing user-centered digital products.',tags:['Figma','Prototyping']},
    {id:'s2',year:'2022 – 2023',role:'Design Intern',company:'Tech Studio',icon:'💻',desc:'Assisted in building design systems.',tags:['UI','Research']}
];
let testimonialsData = [
    {id:'r1',name:'Robert Romany',role:'Product Manager',message:'Karen completely transformed our app experience. Highly recommended!',rating:5,status:'approved'},
    {id:'r2',name:'karen A.',role:'Startup Founder',message:'Great attention to detail and user psychology.',rating:4,status:'pending'}
];

// ════════════════════════════════
//  UI FUNCTIONS (Theme, Cursor, Loaders)
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
function initLoading() {
    const screen = g('loading-screen'), bar = g('ls-bar');
    if (!screen) return;
    let p = 0;
    const iv = setInterval(() => { p += Math.random()*12+5; if(p>=100){p=100;clearInterval(iv);} if(bar) bar.style.width = p + '%'; }, 110);
    const hide = () => { clearInterval(iv); if(bar) bar.style.width='100%'; screen.classList.add('fade-out'); setTimeout(() => screen.style.display='none', 700); };
    if (document.readyState === 'complete') setTimeout(hide, 300);
    else window.addEventListener('load', () => setTimeout(hide, 300), {once:true});
    setTimeout(hide, 3000);
}
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
function initScrollAnim() {
    const revObs = new IntersectionObserver(entries => {
        entries.forEach(e => { if(e.isIntersecting) e.target.classList.add('visible'); });
    }, {threshold: 0.08});
    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));
    window.addEventListener('scroll', () => {
        const p = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        const el = g('scroll-progress'); if(el) el.style.width = (p*100) + '%';
    }, {passive:true});
}
function initMisc() {
    const btn = g('back-to-top');
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 400), {passive:true});
    btn.addEventListener('click', () => window.scrollTo({top:0, behavior:'smooth'}));
    const ham = g('hamburger'), nav = g('mobile-nav');
    ham.addEventListener('click', () => nav.classList.toggle('open'));
    document.querySelectorAll('.mn-link').forEach(l => l.addEventListener('click', () => nav.classList.remove('open')));
}
function initHeroAnim() { setTimeout(() => document.querySelectorAll('.hn-line').forEach(el => el.classList.add('anim')), 200); }
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
function initVisitors() { const disp = g('visitor-count-display'); if(disp) disp.textContent = '1,024 visitors'; }
function toast(msg, type='success', ms=3000) {
    const c = g('toast-container'), el = document.createElement('div');
    el.className = `toast ${type==='error'?'toast-error':''}`; el.textContent = (type==='success'?'✓ ':type==='error'?'✕ ':'ℹ ') + msg;
    c.appendChild(el);
    setTimeout(() => { el.style.opacity='0'; el.style.transform='translateY(8px)'; el.style.transition='.3s'; setTimeout(()=>el.remove(),300); }, ms);
}
function openModal(id)  { g(id).classList.remove('hidden'); document.body.style.overflow='hidden'; }
function closeModal(id) { g(id).classList.add('hidden');    document.body.style.overflow=''; }
function initModals() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
        m.addEventListener('click', e => { if(e.target === m || e.target.classList.contains('modal-close')) closeModal(m.id); });
    });
}
function initStars() {
    const stars = document.querySelectorAll('#star-rating .star'), inp = g('t-rating');
    stars.forEach(s => {
        s.addEventListener('mouseover', () => { const v=+s.dataset.val; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); });
        s.addEventListener('mouseout',  () => { const v=+inp.value||0; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); });
        s.addEventListener('click',     () => { const v=+s.dataset.val; inp.value=v; stars.forEach((x,i)=>x.classList.toggle('filled',i<v)); });
    });
}
function revealNewItems() {
    const obs = new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible');});},{threshold:.08});
    document.querySelectorAll('.reveal:not(.visible)').forEach(el=>obs.observe(el));
}

// ════════════════════════════════
//  DATA RENDERING (MOCK)
// ════════════════════════════════
function loadCases() {
    const grid = g('cases-grid'); grid.innerHTML = '';
    if(caseData.length === 0) { grid.innerHTML='<p style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:3rem;text-align:center;grid-column:1/-1">No case studies yet.</p>'; return; }
    caseData.forEach(cs => {
        const card = document.createElement('div'); card.className='case-card reveal'; card.dataset.cat=cs.category||'';
        card.onclick=()=>showCase(cs.id);
        const catClass = {Mobile:'mobile','Mobile App':'mobile','Web App':'web','Branding':'branding'}[cs.category]||'mobile';
        card.innerHTML=`<div class="case-card-img-wrap"><img class="case-card-img" src="${cs.thumbnail}" alt=""></div><div class="case-card-body"><div class="case-cat ${catClass}">${cs.category}</div><h3>${esc(cs.title)}</h3><p>${esc(cs.description)}</p><div class="case-card-tools">${(cs.tools||[]).map(t=>`<span class="cct">${esc(t)}</span>`).join('')}</div><div class="case-card-footer">${isAdmin?`<div style="display:flex;gap:.4rem"><button class="ab-edit" onclick="event.stopPropagation();editCase('${cs.id}')">Edit</button><button class="ab-del" onclick="event.stopPropagation();delCase('${cs.id}')">Del</button></div>`:'<span></span>'}<span class="case-view">View Study →</span></div></div>`;
        grid.appendChild(card);
    });
    initFilter(); revealNewItems();
}
function loadProcess() {
    const wrap = g('process-steps'); wrap.innerHTML = '';
    processData.forEach(p => {
        const c = document.createElement('div'); c.className = 'process-card reveal';
        c.innerHTML = `<div class="pnum">Step ${p.num}</div><span class="picon">${p.icon}</span><h3>${esc(p.title)}</h3><p>${esc(p.desc)}</p>${isAdmin?`<div class="admin-row"><button class="ab-edit" onclick="editProcess('${p.id}')">Edit</button><button class="ab-del" onclick="delProcess('${p.id}')">Del</button></div>`:''}`;
        wrap.appendChild(c);
    });
    revealNewItems();
}
function loadTools() {
    const grid = g('tools-grid'); grid.innerHTML = '';
    toolsData.forEach(t => {
        const c=document.createElement('div'); c.className='tool-card reveal';
        c.innerHTML=`<span class="tool-emoji">${t.icon}</span><div class="tool-name">${esc(t.name)}</div><div class="tool-cat">${esc(t.category)}</div><div class="tool-bar-bg"><div class="tool-bar-fill" data-level="${t.level}" style="width:0%"></div></div><div class="tool-pct">${t.level}%</div>${isAdmin?`<div class="admin-row"><button class="ab-edit" onclick="editTool('${t.id}')">Edit</button><button class="ab-del" onclick="delTool('${t.id}')">Del</button></div>`:''}`;
        grid.appendChild(c);
    });
    setTimeout(() => document.querySelectorAll('.tool-bar-fill').forEach(b => b.style.width=b.dataset.level+'%'), 100);
    revealNewItems();
}
function loadTimeline() {
    const list = g('timeline-list');
    Array.from(list.children).forEach(el=>{if(!el.classList.contains('timeline-line'))el.remove();});
    timelineData.forEach(item => {
        const w=document.createElement('div'); w.className='tl-item reveal';
        w.innerHTML=`<div class="tl-card"><div class="tl-date">${esc(item.year)} ${item.icon}</div><div class="tl-role">${esc(item.role)}</div><div class="tl-company">${esc(item.company)}</div><p class="tl-desc">${esc(item.desc)}</p><div class="tl-tags">${(item.tags||[]).map(t=>`<span class="tl-tag">${esc(t)}</span>`).join('')}</div>${isAdmin?`<div class="admin-row"><button class="ab-edit" onclick="editTl('${item.id}')">Edit</button><button class="ab-del" onclick="delTl('${item.id}')">Del</button></div>`:''}</div>`;
        list.appendChild(w);
    });
    revealNewItems();
}
function loadTestimonials() {
    const grid = g('testimonials-grid'); grid.innerHTML='';
    const approved = testimonialsData.filter(t => t.status === 'approved');
    if(approved.length===0){grid.innerHTML='<p style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:3rem;text-align:center;grid-column:1/-1">No reviews yet.</p>';return;}
    approved.forEach(t => {
        const stars='★'.repeat(t.rating)+'☆'.repeat(5-t.rating), ini=(t.name||'A').split(' ').map(w=>w[0]).join('').substring(0,2).toUpperCase();
        const card=document.createElement('div'); card.className='test-card reveal';
        card.innerHTML=`<div class="test-bigquote">"</div><div class="test-stars">${stars}</div><p class="test-msg">"${esc(t.message)}"</p><div class="test-author"><div class="test-avatar">${ini}</div><div><div class="test-name">${esc(t.name)}</div><div class="test-role">${esc(t.role)}</div></div>${isAdmin?`<div style="margin-left:auto"><button class="ab-del" onclick="delTest('${t.id}')">Del</button></div>`:''}</div>`;
        grid.appendChild(card);
    });
    revealNewItems();
}
function loadPendingTests() {
    const list=g('pending-list'); list.innerHTML='';
    const pending = testimonialsData.filter(t => t.status === 'pending');
    if(pending.length===0){list.innerHTML='<p style="color:var(--muted);font-family:var(--mono);font-size:.8rem;padding:2rem;text-align:center">No pending reviews ✦</p>';return;}
    pending.forEach(t => {
        const c=document.createElement('div');c.className='pending-card';
        c.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:.5rem"><div><strong style="font-size:.9rem">${esc(t.name)}</strong> <span style="color:var(--muted);font-size:.8rem">— ${esc(t.role)}</span><div style="color:var(--pink);font-size:.85rem">${'★'.repeat(t.rating)}</div></div><div style="display:flex;gap:.4rem"><button class="ab-edit" onclick="approveTest('${t.id}')">Approve</button><button class="ab-del" onclick="delTest('${t.id}',true)">Reject</button></div></div><p style="font-size:.85rem;color:var(--muted)">${esc(t.message)}</p>`;
        list.appendChild(c);
    });
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
//  MOCK CRUD ACTIONS (Delete & Edit)
// ════════════════════════════════
// Cases
window.showCase = id => {
    const cs = caseData.find(x=>x.id===id); if(!cs) return;
    g('cd-title').innerText=cs.title||''; g('cd-category').innerText=cs.category||'';
    g('cd-main-img').src=cs.thumbnail||''; g('cd-challenge').innerText=cs.challenge||''; g('cd-solution').innerText=cs.solution||'';
    g('cd-tools').innerHTML=(cs.tools||[]).map(t=>`<span class="cct">${esc(t)}</span>`).join('');
    openModal('case-detail-modal');
};
window.editCase = id => {
    const cs=caseData.find(x=>x.id===id); if(!cs) return;
    g('case-id').value=id; g('case-title').value=cs.title||''; g('case-category').value=cs.category||'Mobile App'; g('case-desc').value=cs.description||''; g('case-challenge').value=cs.challenge||''; g('case-solution').value=cs.solution||''; g('case-tools').value=(cs.tools||[]).join(', '); g('case-thumbnail').value=cs.thumbnail||'';
    g('case-modal-title').innerText='Edit Case Study'; openModal('case-modal');
};
window.delCase = id => { if(confirm('Delete?')){ caseData = caseData.filter(c=>c.id!==id); loadCases(); toast('Deleted'); } };

// Process
window.editProcess = id => {
    const d=processData.find(x=>x.id===id); if(!d) return;
    g('process-id').value=id; g('process-num').value=d.num; g('process-icon').value=d.icon; g('process-title-inp').value=d.title; g('process-desc-inp').value=d.desc; g('process-modal-title').innerText='Edit Step'; openModal('process-modal');
};
window.delProcess = id => { if(confirm('Delete?')){ processData = processData.filter(x=>x.id!==id); loadProcess(); toast('Deleted'); } };

// Tools
window.editTool = id => {
    const d=toolsData.find(x=>x.id===id); if(!d) return;
    g('tool-id').value=id; g('tool-name').value=d.name; g('tool-icon').value=d.icon; g('tool-category').value=d.category; g('tool-level').value=d.level; g('tool-lvl-display').textContent=d.level+'%'; g('tool-modal-title').innerText='Edit Tool'; openModal('tool-modal');
};
window.delTool = id => { if(confirm('Delete?')){ toolsData = toolsData.filter(x=>x.id!==id); loadTools(); toast('Deleted'); } };

// Timeline
window.editTl = id => {
    const d=timelineData.find(x=>x.id===id); if(!d) return;
    g('tl-id').value=id; g('tl-year').value=d.year; g('tl-role').value=d.role; g('tl-company').value=d.company; g('tl-icon').value=d.icon; g('tl-desc').value=d.desc; g('tl-tags').value=(d.tags||[]).join(', '); g('tl-modal-title').innerText='Edit Timeline Item'; openModal('timeline-modal');
};
window.delTl = id => { if(confirm('Delete?')){ timelineData = timelineData.filter(x=>x.id!==id); loadTimeline(); toast('Deleted'); } };

// Testimonials
window.approveTest = id => { testimonialsData.find(x=>x.id===id).status = 'approved'; loadPendingTests(); loadTestimonials(); toast('Approved ✦'); };
window.delTest = (id, pending=false) => { if(confirm('Delete?')){ testimonialsData = testimonialsData.filter(x=>x.id!==id); if(pending) loadPendingTests(); else loadTestimonials(); toast('Deleted'); } };


// ════════════════════════════════
//  MAIN INIT
// ════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initTheme(); initLoading(); initMisc(); initHeroAnim(); initScrollAnim(); initModals(); initStars(); setTimeout(initCursor, 500);
    
    // Load local mock data
    loadCases(); loadProcess(); loadTools(); loadTimeline(); loadTestimonials(); initStats(); initVisitors();
    
    // Helper to toggle Admin View
    const toggleAdminView = () => {
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
        
        // Refresh data views to show/hide edit/delete buttons
        loadCases(); loadProcess(); loadTools(); loadTimeline(); loadTestimonials();
    };

    // ── Fake Login / Logout ──
    g('login-btn').addEventListener('click',()=>openModal('login-modal'));
    g('login-form').addEventListener('submit', e => {
        e.preventDefault(); 
        isAdmin = true; // Any login works in mock mode
        closeModal('login-modal'); toast('Welcome to Admin Mode ✦');
        toggleAdminView();
    });
    g('logout-btn').addEventListener('click', () => { isAdmin = false; toast('Logged out'); toggleAdminView(); });

    // ── MOCK SAVE FORMS ──
    g('case-form').addEventListener('submit', e => { e.preventDefault();
        const id = g('case-id').value || 'c'+Date.now();
        const data = { id, title: g('case-title').value, category: g('case-category').value, description: g('case-desc').value, challenge: g('case-challenge').value, solution: g('case-solution').value, tools: g('case-tools').value.split(','), thumbnail: g('case-thumbnail').value };
        if(g('case-id').value) caseData = caseData.map(c => c.id===id ? data : c); else caseData.unshift(data);
        closeModal('case-modal'); loadCases(); toast('Saved ✦');
    });

    g('process-form').addEventListener('submit', e => { e.preventDefault();
        const id = g('process-id').value || 'p'+Date.now();
        const data = { id, num: g('process-num').value, icon: g('process-icon').value, title: g('process-title-inp').value, desc: g('process-desc-inp').value };
        if(g('process-id').value) processData = processData.map(c => c.id===id ? data : c); else processData.push(data);
        closeModal('process-modal'); loadProcess(); toast('Saved ✦');
    });

    g('tool-form').addEventListener('submit', e => { e.preventDefault();
        const id = g('tool-id').value || 't'+Date.now();
        const data = { id, name: g('tool-name').value, icon: g('tool-icon').value, category: g('tool-category').value, level: +g('tool-level').value };
        if(g('tool-id').value) toolsData = toolsData.map(c => c.id===id ? data : c); else toolsData.push(data);
        closeModal('tool-modal'); loadTools(); toast('Saved ✦');
    });

    g('timeline-form').addEventListener('submit', e => { e.preventDefault();
        const id = g('tl-id').value || 'tl'+Date.now();
        const data = { id, year: g('tl-year').value, role: g('tl-role').value, company: g('tl-company').value, icon: g('tl-icon').value, desc: g('tl-desc').value, tags: g('tl-tags').value.split(',') };
        if(g('tl-id').value) timelineData = timelineData.map(c => c.id===id ? data : c); else timelineData.unshift(data);
        closeModal('timeline-modal'); loadTimeline(); toast('Saved ✦');
    });

    g('testimonial-form').addEventListener('submit', e => { e.preventDefault();
        testimonialsData.unshift({ id: 'r'+Date.now(), name: g('t-name').value, role: g('t-role').value, message: g('t-message').value, rating: +g('t-rating').value, status: 'pending' });
        closeModal('testimonial-modal'); g('testimonial-form').reset(); document.querySelectorAll('#star-rating .star').forEach(s=>s.classList.remove('filled')); g('t-rating').value='0';
        toast('Review submitted ✦ Awaiting approval', 'success');
    });

    // Simple text edits
    g('text-edit-form').addEventListener('submit', e => { e.preventDefault();
        const field = g('te-field').value, content = g('te-content').value;
        if(field==='role') g('hero-role').textContent=content;
        if(field==='tagline') g('hero-tagline').innerHTML=content;
        if(field==='statusText') g('hero-status-text').textContent=content;
        closeModal('text-edit-modal'); toast('Updated ✦');
    });

    g('year').textContent = new Date().getFullYear();
});