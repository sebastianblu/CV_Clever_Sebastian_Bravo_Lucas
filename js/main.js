 // -------------------------
    // Config / Utilities
    // -------------------------
    const SELECTORS = {
      themeToggle: '#theme-toggle',
      printBtn: '#btn-print',
      projectsWrap: '#projects',
      filterWrap: '#filter-wrap',
      kwElements: '.kw, .highlight',
      deadlink: '.deadlink'
    };

    // Set last updated
    document.getElementById('year').textContent = new Date().getFullYear();
    document.getElementById('last-update').textContent = new Date().toLocaleDateString();

    // -------------------------
    // Theme toggle with localStorage
    // -------------------------
    const themeToggle = document.querySelector(SELECTORS.themeToggle);
    const body = document.documentElement;
    const stored = localStorage.getItem('cv_theme');
    const prefer = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    function applyTheme(t){
      if(t === 'dark'){ body.setAttribute('data-theme','dark'); themeToggle.textContent = '☀️'; themeToggle.setAttribute('aria-pressed','true'); }
      else { body.removeAttribute('data-theme'); themeToggle.textContent = '🌙'; themeToggle.setAttribute('aria-pressed','false'); }
    }
    applyTheme(stored || (prefer ? 'dark' : 'light'));
    themeToggle.addEventListener('click',()=>{
      const now = body.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      applyTheme(now);
      localStorage.setItem('cv_theme', now);
    });

    // -------------------------
    // Print / Download PDF
    // -------------------------
    document.querySelector(SELECTORS.printBtn).addEventListener('click', ()=>{
      // Add a class to help printing if needed
      window.print();
    });

    // -------------------------
    // Project filtering
    // -------------------------
    const projectsEl = document.querySelector(SELECTORS.projectsWrap);
    const filters = document.querySelectorAll('#filter-wrap .filter-chip');

    function filterProjects(tag){
      const cards = projectsEl.querySelectorAll('.project-card');
      cards.forEach(c=>{
        const tags = c.dataset.tags ? c.dataset.tags.split(',') : [];
        if(tag === 'all' || tags.includes(tag)) c.style.display = '';
        else c.style.display = 'none';
      });
      filters.forEach(f=>f.setAttribute('aria-pressed','false'));
      document.querySelector(`#filter-wrap .filter-chip[data-filter="${tag}"]`).setAttribute('aria-pressed','true');
    }

    document.querySelectorAll('#filter-wrap .filter-chip').forEach(btn=>{
      btn.addEventListener('click', ()=> filterProjects(btn.dataset.filter));
    });

    // -------------------------
    // Keyword highlighting (animated pulse)
    // -------------------------
    function pulseHighlight(el){
      el.animate([{filter:'brightness(1.1) drop-shadow(0 0 0 rgba(79,70,229,0))'},{filter:'brightness(1.08) drop-shadow(0 6px 18px rgba(79,70,229,0.06))'}],{duration:600,iterations:1});
    }
    document.querySelectorAll('.kw, .highlight').forEach(el=>{
      el.addEventListener('mouseenter', ()=> pulseHighlight(el));
    });

    // -------------------------
    // Basic link validation (best-effort, may be blocked by CORS)
    // marks .deadlink elements as unreachable if fetch fails
    // -------------------------
    async function checkLinks(){
      const dead = document.querySelectorAll(SELECTORS.deadlink);
      dead.forEach(d=>{ d.setAttribute('aria-live','polite'); d.textContent = 'Ver demo (pendiente)' });
      for(const el of dead){
        const url = el.href || el.getAttribute('data-href');
        if(!url) continue;
        try{
          const r = await fetch(url, {method:'HEAD',mode:'no-cors'}); // mode no-cors: opaque, can't read status but will resolve if allowed
          // If fetch didn't throw, mark as ok (best effort)
          el.textContent = 'Demo';
        }catch(e){
          el.textContent = 'Demo (no disponible)';
          el.setAttribute('title','No se pudo verificar el enlace desde este origen');
        }
      }
    }
    // run in background (best-effort)
    setTimeout(checkLinks, 1200);

    // -------------------------
    // Accessibility: focus outlines on keyboard nav
    // -------------------------
    (function(){
      const handleFirstTab = (e) => {
        if(e.key === 'Tab'){
          document.body.classList.add('user-is-tabbing');
          window.removeEventListener('keydown', handleFirstTab);
        }
      };
      window.addEventListener('keydown', handleFirstTab);
    })();

    // -------------------------
    // Small enhancements: keyboard shortcuts
    // - T => toggle theme
    // - P => print
    // -------------------------
    window.addEventListener('keydown', (e)=>{
      if(e.key.toLowerCase()==='t'){ themeToggle.click(); }
      if(e.key.toLowerCase()==='p'){ document.querySelector(SELECTORS.printBtn).click(); }
    });

    // -------------------------
    // Replace placeholder avatar (if none set, show initials)
    // -------------------------
    (function avatarFallback(){
      const img = document.querySelector('.avatar');
      if(!img.getAttribute('src') || img.getAttribute('src').trim()===''){
        const name = "<Tu Nombre>";
        const initials = name.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="#4F46E5"/><stop offset="1" stop-color="#22D3EE"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><text x="50%" y="55%" font-size="120" text-anchor="middle" fill="#fff" font-family="Verdana">${initials}</text></svg>`;
        img.src = 'data:image/svg+xml;base64,' + btoa(svg);
        img.alt = name;
      }
    })();

    // -------------------------
    // Small: highlight stack keywords in page body automatically
    // -------------------------
    (function highlightKeywords(){
      const keywords = ['React','Node.js','Docker','AWS','Postgres','MongoDB','Kubernetes','CI/CD'];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
      const toWrap = [];
      while(walker.nextNode()){
        const node = walker.currentNode;
        if(node.parentElement && ['SCRIPT','STYLE','A','CODE'].includes(node.parentElement.tagName)) continue;
        const text = node.nodeValue;
        keywords.forEach(kw=>{
          const re = new RegExp('\\b'+kw.replace('.','\\.')+'\\b','g');
          if(re.test(text)) toWrap.push({node,kw});
        });
      }
      toWrap.forEach(item=>{
        const {node,kw} = item;
        const span = document.createElement('span');
        span.className = 'highlight';
        span.textContent = kw;
        const regex = new RegExp('\\b'+kw.replace('.','\\.')+'\\b');
        const parts = node.nodeValue.split(regex);
        if(parts.length>1){
          const after = node.splitText(node.nodeValue.indexOf(kw));
          after.nodeValue = after.nodeValue.substring(kw.length);
          node.parentNode.insertBefore(span, after);
          span.addEventListener('mouseenter', ()=> span.animate([{transform:'scale(1)'},{transform:'scale(1.02)'}],{duration:300,fill:'forwards'}));
        }
      });
    })();
