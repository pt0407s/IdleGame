
/* Shard Smith — Idle Clicker (Multi-Prestige) */
(() => {
  const el = {
    shards: document.getElementById('shards'),
    dust: document.getElementById('dust'),
    essence: document.getElementById('essence'),
    relics: document.getElementById('relics'),
    rate: document.getElementById('rate'),
    forgeBtn: document.getElementById('forgeBtn'),
    clickPower: document.getElementById('clickPower'),
    generatorsWrap: document.getElementById('generators'),
    upgradesWrap: document.getElementById('upgrades'),
    researchWrap: document.getElementById('research'),
    artifactsWrap: document.getElementById('artifacts'),
    achievementsWrap: document.getElementById('achievements'),
    potentialDust: document.getElementById('potentialDust'),
    potentialEssence: document.getElementById('potentialEssence'),
    potentialRelics: document.getElementById('potentialRelics'),
    ascendBtn: document.getElementById('ascendBtn'),
    transcendBtn: document.getElementById('transcendBtn'),
    eternityBtn: document.getElementById('eternityBtn'),
    tabs: Array.from(document.querySelectorAll('.tab')),
    panels: {
      generators: document.getElementById('tab-generators'),
      upgrades: document.getElementById('tab-upgrades'),
      research: document.getElementById('tab-research'),
      artifacts: document.getElementById('tab-artifacts'),
      achievements: document.getElementById('tab-achievements'),
      prestige: document.getElementById('tab-prestige'),
      settings: document.getElementById('tab-settings')
    },
    autosaveToggle: document.getElementById('autosaveToggle'),
    animToggle: document.getElementById('animToggle'),
    saveBtn: document.getElementById('saveBtn'),
    exportBtn: document.getElementById('exportBtn'),
    importBtn: document.getElementById('importBtn'),
    resetBtn: document.getElementById('resetBtn'),
    log: document.getElementById('log'),
    milestones: document.getElementById('milestones')
  };

  const state = {
    shards: 0,
    totalShards: 0,
    dust: 0,
    essence: 0,
    relics: 0,
    clickPower: 1,
    generators: [
      { id: 'miner', name: 'Miner', desc: 'Basic shard miner.', baseCost: 10, costMult: 1.15, baseProd: 0.1, owned: 0 },
      { id: 'drill', name: 'Drill', desc: 'Improved extraction.', baseCost: 100, costMult: 1.15, baseProd: 1.0, owned: 0 },
      { id: 'extractor', name: 'Extractor', desc: 'Automated refinery.', baseCost: 1200, costMult: 1.16, baseProd: 8.0, owned: 0 },
      { id: 'quarry', name: 'Quarry', desc: 'Industrial scale.', baseCost: 15000, costMult: 1.17, baseProd: 50.0, owned: 0 },
      { id: 'reactor', name: 'Reactor', desc: 'Shard fusion core.', baseCost: 200000, costMult: 1.18, baseProd: 300.0, owned: 0 },
    ],
    upgrades: [
      { id: 'click1', name: 'Stronger Tap', desc: 'Double click power.', cost: 50, purchased: false, apply: (s) => { s.clickPower *= 2; } },
      { id: 'boost1', name: 'Polished Tools', desc: '+25% generator output.', cost: 250, purchased: false, apply: (s) => { s._boostMult = (s._boostMult||1) * 1.25; } },
      { id: 'boost2', name: 'Efficient Pipelines', desc: '+50% generator output.', cost: 2500, purchased: false, apply: (s) => { s._boostMult = (s._boostMult||1) * 1.5; } },
      { id: 'click2', name: 'Forgemaster', desc: 'Triple click power.', cost: 5000, purchased: false, apply: (s) => { s.clickPower *= 3; } },
    ],
    research: [
      { id:'opt', name:'Optimization', desc:'Global output +10%. Costs: 2 Dust', costDust:2, costShards:0, purchased:false, apply:(s)=>{ s._researchMult = (s._researchMult||1)*1.10; } },
      { id:'auto', name:'Automation', desc:'Miners +0.05 base output. Costs: 5,000 shards', costDust:0, costShards:5000, purchased:false, apply:(s)=>{ s.generators[0].baseProd += 0.05; } },
      { id:'quantum', name:'Quantum Forge', desc:'Click power ×2. Costs: 25 Dust & 100k shards', costDust:25, costShards:100000, purchased:false, apply:(s)=>{ s.clickPower *= 2; } },
    ],
    artifacts: [
      { id:'pick', name:'Ancient Pick', desc:'Generators +15% output (persists through Transcend). Cost: 3 Essence', costEssence:3, purchased:false, apply:(s)=>{ s._artifactGenMult = (s._artifactGenMult||1)*1.15; } },
      { id:'gauntlet', name:'Runed Gauntlet', desc:'Click power ×1.5 (persists through Transcend). Cost: 5 Essence', costEssence:5, purchased:false, apply:(s)=>{ s._artifactClickMult = (s._artifactClickMult||1)*1.5; } },
      { id:'hourglass', name:'Temporal Hourglass', desc:'Offline progress cap +2 hours. Cost: 8 Essence', costEssence:8, purchased:false, apply:(s)=>{ s._offlineCapHours = (s._offlineCapHours||1) + 2; } },
    ],
    achievements: [
      { id: 'achv_click_100', name: 'Tappy Tapper', desc: 'Click 100 times.', unlocked: false, check: (s) => (s._clicks||0) >= 100, reward: (s) => { s.clickPower += 1; } },
      { id: 'achv_miner_10', name: 'Fleet of Miners', desc: 'Own 10 Miners.', unlocked: false, check: (s) => s.generators[0].owned >= 10, reward: (s) => { s._boostMult = (s._boostMult||1)*1.1; } },
      { id: 'achv_shards_1k', name: 'Cracked 1K', desc: 'Reach 1,000 shards.', unlocked: false, check: (s) => s.totalShards >= 1000, reward: (s) => { s.clickPower += 2; } },
      { id: 'achv_ascend', name: 'First Ascension', desc: 'Ascend once.', unlocked: false, check: (s) => (s._ascends||0) >= 1, reward: (s) => { s._boostMult = (s._boostMult||1)*1.2; } },
    ],
    _boostMult: 1,
    _researchMult: 1,
    _artifactGenMult: 1,
    _artifactClickMult: 1,
    _offlineCapHours: 1,
    _clicks: 0,
    _ascends: 0,
    _transcends: 0,
    _eternities: 0,
    _last: Date.now(),
    autosave: true,
    animations: true,
  };

  function log(msg) {
    const line = document.createElement('div');
    const ts = new Date().toLocaleTimeString();
    line.textContent = `[${ts}] ${msg}`;
    el.log.prepend(line);
  }

  const fmt = {
    n: (v) => {
      if (!Number.isFinite(v)) return '∞';
      const abs = Math.abs(v);
      if (abs < 1000) return v.toFixed(2).replace(/\.00$/, '');
      const units = ['K','M','B','T','Qa','Qi','Sx','Sp','Oc','No','Dc'];
      let u = -1; let val = abs;
      while (val >= 1000 && u < units.length-1) { val /= 1000; u++; }
      const s = (v<0?'-':'') + val.toFixed(2) + units[u];
      return s;
    }
  };

  function save() { localStorage.setItem('shard-smith-save', JSON.stringify(state)); log('Game saved.'); }
  function load() {
    const data = localStorage.getItem('shard-smith-save'); if (!data) return;
    try { Object.assign(state, JSON.parse(data)); log('Save loaded.'); } catch(e){ console.error(e); }
  }
  function exportSave(){
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    navigator.clipboard?.writeText(data); alert('Save copied to clipboard!');
  }
  function importSave(){
    const data = prompt('Paste your save string:'); if(!data) return;
    try{ Object.assign(state, JSON.parse(decodeURIComponent(escape(atob(data))))); save(); renderAll(); log('Save imported.'); }
    catch(e){ alert('Invalid save string'); }
  }

  // Keep numbers readable without hard stops
  function softcap(mult){
    const rate = computeRate(); if(rate < 1e6) return mult;
    const factor = 1 + Math.log10(rate/1e6)*0.15; return mult / factor;
  }

  // Layered global multiplier (Dust, Essence, Relics + Research)
  function globalMult(){
    const dustMult = 1 + Math.sqrt(state.dust);
    const essenceMult = 1 + Math.log1p(state.essence) * 0.75;
    const relicMult = 1 + Math.pow(state.relics, 0.25);
    return softcap(dustMult * essenceMult * relicMult * (state._researchMult || 1));
  }

  function generatorCost(g){ return g.baseCost * Math.pow(g.costMult, g.owned); }
  function canAfford(cost){ return state.shards >= cost; }

  function buyGenerator(idx, amount=1){
    const g = state.generators[idx]; let bought=0;
    for(let i=0;i<amount;i++){
      const c = generatorCost(g); if(!canAfford(c)) break;
      state.shards -= c; g.owned++; bought++;
    }
    if(bought>0){ renderGenerators(); renderTop(); }
  }
  function buyMaxGenerator(idx){
    const g=state.generators[idx]; let tempOwned=g.owned; let tempShards=state.shards; let afford=0;
    while(true){ const c=g.baseCost*Math.pow(g.costMult,tempOwned); if(tempShards>=c){ tempShards-=c; tempOwned++; afford++; } else break; if(afford>100000) break; }
    for(let i=0;i<afford;i++){ const c=generatorCost(g); state.shards-=c; g.owned++; }
    if(afford>0){ renderGenerators(); renderTop(); }
  }

  function computeRate(){
    let rate=0;
    const mult=(state._boostMult||1)*(state._artifactGenMult||1)*(state._researchMult||1);
    const layer = globalMult();
    for(const g of state.generators){ rate += g.owned * g.baseProd * mult * layer; }
    return rate;
  }

  function tick(dt){ const r=computeRate(); const gain=r*dt; state.shards+=gain; state.totalShards+=gain; }

  // Potential prestige gains (infinite scaling)
  function potentialDustGain(){ return Math.floor(Math.pow(state.totalShards/1e5, 0.5)); }
  function potentialEssenceGain(){ return Math.floor(Math.pow(state.totalShards/1e8, 0.4)); }
  function potentialRelicGain(){ return Math.floor(Math.pow(state.totalShards/1e11, 0.3)); }

  // Prestige actions
  function ascend(){
    const gain = potentialDustGain(); if(gain<=0){ alert('Not enough progress for Dust.'); return; }
    state.dust += gain; state._ascends=(state._ascends||0)+1;
    state.shards = 0; for(const g of state.generators) g.owned=0;
    log(`Ascended! +${gain} Dust`); renderAll(); checkAchievements(); save();
  }
  function transcend(){
    const gain = potentialEssenceGain(); if(gain<=0){ alert('Not enough progress for Essence.'); return; }
    state.essence += gain; state._transcends=(state._transcends||0)+1;
    state.shards=0; for(const g of state.generators) g.owned=0;
    state.dust = 0;
    state.upgrades.forEach(u=>u.purchased=false);
    state.research.forEach(r=>r.purchased=false);
    state._researchMult = 1;
    log(`Transcended! +${gain} Essence`); renderAll(); checkAchievements(); save();
  }
  function eternity(){
    const gain = potentialRelicGain(); if(gain<=0){ alert('Not enough progress for Relics.'); return; }
    state.relics += gain; state._eternities=(state._eternities||0)+1;
    state.shards=0; for(const g of state.generators) g.owned=0;
    state.dust=0; state.essence=0;
    state.upgrades.forEach(u=>u.purchased=false);
    state.research.forEach(r=>r.purchased=false);
    state.artifacts.forEach(a=>a.purchased=false);
    state._boostMult=1; state._researchMult=1; state._artifactGenMult=1; state._artifactClickMult=1; state._offlineCapHours=1;
    log(`Eternity! +${gain} Relics`); renderAll(); checkAchievements(); save();
  }

  function renderTop(){
    el.shards.textContent = fmt.n(state.shards);
    el.dust.textContent = fmt.n(state.dust);
    el.essence.textContent = fmt.n(state.essence);
    el.relics.textContent = fmt.n(state.relics);
    el.rate.textContent = fmt.n(computeRate()) + ' /s';
    el.clickPower.textContent = fmt.n(state.clickPower * (state._artifactClickMult||1));
    el.potentialDust.textContent = fmt.n(potentialDustGain());
    el.potentialEssence.textContent = fmt.n(potentialEssenceGain());
    el.potentialRelics.textContent = fmt.n(potentialRelicGain());
  }

  function renderGenerators(){
    el.generatorsWrap.innerHTML='';
    state.generators.forEach((g, idx) => {
      const card=document.createElement('div'); card.className='card';
      const left=document.createElement('div');
      const title=document.createElement('div'); title.className='title'; title.textContent=g.name;
      const desc=document.createElement('div'); desc.className='desc'; desc.textContent=g.desc;
      const meta=document.createElement('div'); meta.className='meta'; meta.textContent=`Base: ${fmt.n(g.baseProd)} × owned`;
      left.appendChild(title); left.appendChild(desc); left.appendChild(meta);

      const right=document.createElement('div');
      const cost=document.createElement('div'); cost.className='cost'; cost.textContent='Cost: ' + fmt.n(generatorCost(g));
      const buybar=document.createElement('div'); buybar.className='buybar';
      const b1=document.createElement('button'); b1.textContent='Buy 1'; b1.onclick=()=>buyGenerator(idx,1);
      const b10=document.createElement('button'); b10.textContent='Buy 10'; b10.onclick=()=>buyGenerator(idx,10);
      const bMax=document.createElement('button'); bMax.textContent='Buy Max'; bMax.onclick=()=>buyMaxGenerator(idx);
      const owned=document.createElement('div'); owned.className='owned'; owned.textContent='Owned: ' + g.owned;
      buybar.appendChild(b1); buybar.appendChild(b10); buybar.appendChild(bMax); buybar.appendChild(owned);
      right.appendChild(cost); right.appendChild(buybar);

      card.appendChild(left); card.appendChild(right);
      el.generatorsWrap.appendChild(card);
    });
  }

  function renderUpgrades(){
    el.upgradesWrap.innerHTML='';
    state.upgrades.forEach(u => {
      const card=document.createElement('div'); card.className='card';
      const left=document.createElement('div');
      const title=document.createElement('div'); title.className='title'; title.textContent=u.name;
      const desc=document.createElement('div'); desc.className='desc'; desc.textContent=u.desc;
      left.appendChild(title); left.appendChild(desc);

      const right=document.createElement('div');
      const cost=document.createElement('div'); cost.className='cost'; cost.textContent=u.purchased? 'Purchased' : ('Cost: ' + fmt.n(u.cost));
      const buy=document.createElement('button'); buy.textContent=u.purchased? '✔' : 'Buy'; buy.disabled=u.purchased;
      buy.onclick=()=>{ if(u.purchased) return; if(state.shards>=u.cost){ state.shards-=u.cost; u.purchased=true; u.apply(state); renderAll(); log('Purchased: '+u.name); } };
      right.appendChild(cost); right.appendChild(buy);

      card.appendChild(left); card.appendChild(right);
      el.upgradesWrap.appendChild(card);
    });
  }

  function renderResearch(){
    el.researchWrap.innerHTML='';
    state.research.forEach(r => {
      const card=document.createElement('div'); card.className='card';
      const left=document.createElement('div');
      const title=document.createElement('div'); title.className='title'; title.textContent=r.name;
      const desc=document.createElement('div'); desc.className='desc'; desc.textContent=r.desc;
      left.appendChild(title); left.appendChild(desc);

      const right=document.createElement('div');
      const cost=document.createElement('div'); cost.className='cost'; cost.textContent=r.purchased? 'Researched' : `Cost: ${r.costDust} Dust, ${fmt.n(r.costShards)} shards`;
      const buy=document.createElement('button'); buy.textContent=r.purchased? '✔' : 'Research'; buy.disabled=r.purchased;
      buy.onclick=()=>{ if(r.purchased) return; if(state.dust>=r.costDust && state.shards>=r.costShards){ state.dust-=r.costDust; state.shards-=r.costShards; r.purchased=true; r.apply(state); renderAll(); log('Researched: '+r.name); } else { alert('Insufficient Dust/Shards'); } };
      right.appendChild(cost); right.appendChild(buy);

      card.appendChild(left); card.appendChild(right);
      el.researchWrap.appendChild(card);
    });
  }

  function renderArtifacts(){
    el.artifactsWrap.innerHTML='';
    state.artifacts.forEach(a => {
      const card=document.createElement('div'); card.className='card';
      const left=document.createElement('div');
      const title=document.createElement('div'); title.className='title'; title.textContent=a.name;
      const desc=document.createElement('div'); desc.className='desc'; desc.textContent=a.desc;
      left.appendChild(title); left.appendChild(desc);

      const right=document.createElement('div');
      const cost=document.createElement('div'); cost.className='cost'; cost.textContent=a.purchased? 'Crafted' : ('Cost: '+a.costEssence+' Essence');
      const buy=document.createElement('button'); buy.textContent=a.purchased? '✔' : 'Craft'; buy.disabled=a.purchased;
      buy.onclick=()=>{ if(a.purchased) return; if(state.essence>=a.costEssence){ state.essence-=a.costEssence; a.purchased=true; a.apply(state); renderAll(); log('Crafted artifact: '+a.name); } else { alert('Insufficient Essence'); } };
      right.appendChild(cost); right.appendChild(buy);

      card.appendChild(left); card.appendChild(right);
      el.artifactsWrap.appendChild(card);
    });
  }

  function renderAchievements(){
    el.achievementsWrap.innerHTML='';
    state.achievements.forEach(a => {
      const card=document.createElement('div'); card.className='achv ' + (a.unlocked? '' : 'locked');
      const title=document.createElement('div'); title.className='title'; title.textContent=a.name + (a.unlocked? ' ⭐' : '');
      const desc=document.createElement('div'); desc.className='desc'; desc.textContent=a.desc;
      card.appendChild(title); card.appendChild(desc);
      el.achievementsWrap.appendChild(card);
    });
  }

  function renderMilestones(){
    const list=[
      'Reach 1,000 shards',
      'Buy 10 Miners',
      'Purchase Forgemaster upgrade',
      'Ascend to earn Dust',
      'Transcend to earn Essence',
      'Craft an Artifact',
      'Eternity for Relics'
    ];
    el.milestones.innerHTML='';
    for(const m of list){ const li=document.createElement('li'); li.textContent='• ' + m; el.milestones.appendChild(li); }
  }

  function renderAll(){ renderTop(); renderGenerators(); renderUpgrades(); renderResearch(); renderArtifacts(); renderAchievements(); renderMilestones(); }

  function checkAchievements(){
    state.achievements.forEach(a => { if(!a.unlocked && a.check(state)){ a.unlocked=true; a.reward(state); log('Achievement unlocked: '+a.name); renderAll(); } });
  }

  // Tabs
  el.tabs.forEach(t => {
    t.addEventListener('click', () => {
      el.tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');
      Object.values(el.panels).forEach(p=>p.classList.remove('active'));
      el.panels[t.dataset.tab].classList.add('active');
    });
  });

  // Click to forge
  el.forgeBtn.addEventListener('click', () => {
    const mult = (state._boostMult||1) * (state._artifactClickMult||1) * (state._researchMult||1) * globalMult();
    const amt = state.clickPower * mult;
    state.shards += amt; state.totalShards += amt; state._clicks = (state._clicks||0)+1;
    if (state.animations) {
      const spark=document.createElement('div'); spark.textContent='+'+fmt.n(amt);
      spark.style.position='absolute'; spark.style.left=(Math.random()*60+20)+'%'; spark.style.color='#64ffda';
      spark.style.filter='drop-shadow(0 0 6px #64ffda)'; spark.style.animation='spark 0.9s ease-out forwards'; spark.className='spark';
      document.body.appendChild(spark); setTimeout(()=>spark.remove(), 900);
    }
    renderTop(); checkAchievements();
  });

  // Buy modifiers via click on generator cards with Shift/Ctrl
  document.addEventListener('click', (ev) => {
    const t=ev.target; const card=t.closest('#generators .card'); if(!card) return;
    const idx=Array.from(el.generatorsWrap.children).indexOf(card);
    if (ev.ctrlKey) buyMaxGenerator(idx); else if (ev.shiftKey) buyGenerator(idx, 10);
  });

  // Prestige actions
  el.ascendBtn.addEventListener('click', ascend);
  el.transcendBtn.addEventListener('click', transcend);
  el.eternityBtn.addEventListener('click', eternity);

  el.autosaveToggle.addEventListener('change', () => state.autosave = el.autosaveToggle.checked);
  el.animToggle.addEventListener('change', () => state.animations = el.animToggle.checked);
  el.saveBtn.addEventListener('click', save);
  el.exportBtn.addEventListener('click', exportSave);
  el.importBtn.addEventListener('click', importSave);
  el.resetBtn.addEventListener('click', () => { if(confirm('Hard reset your save?')){ localStorage.removeItem('shard-smith-save'); location.reload(); } });

  // Game loop
  let last = performance.now();
  function loop(now){
    const dt = Math.min(0.5, (now-last)/1000); last=now; tick(dt); renderTop();
    if(state.autosave){ if((state._lastSaveTs||0)+10000 < Date.now()){ save(); state._lastSaveTs=Date.now(); } }
    requestAnimationFrame(loop);
  }

  // Offline progress on load (cap adjustable via artifact)
  function applyOfflineProgress(){
    const data = localStorage.getItem('shard-smith-save'); if(!data) return;
    try {
      const obj = JSON.parse(data); const lastTs = obj._last || Date.now(); Object.assign(state, obj);
      const capHours = state._offlineCapHours || 1; const dt = Math.min(capHours*3600, (Date.now()-lastTs)/1000);
      tick(dt); log(`Applied ${fmt.n(dt)}s of offline progress.`);
    } catch {}
  }
  function persistLast(){ state._last = Date.now(); localStorage.setItem('shard-smith-save', JSON.stringify(state)); }
  window.addEventListener('beforeunload', persistLast);

  // Init
  load(); applyOfflineProgress(); renderAll(); requestAnimationFrame(loop);
})();

