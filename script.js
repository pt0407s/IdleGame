
/* Shard Smith — Idle Clicker */
(() => {
  const el = {
    shards: document.getElementById('shards'),
    dust: document.getElementById('dust'),
    rate: document.getElementById('rate'),
    forgeBtn: document.getElementById('forgeBtn'),
    clickPower: document.getElementById('clickPower'),
    generatorsWrap: document.getElementById('generators'),
    upgradesWrap: document.getElementById('upgrades'),
    achievementsWrap: document.getElementById('achievements'),
    potentialDust: document.getElementById('potentialDust'),
    ascendBtn: document.getElementById('ascendBtn'),
    tabs: Array.from(document.querySelectorAll('.tab')),
    panels: {
      generators: document.getElementById('tab-generators'),
      upgrades: document.getElementById('tab-upgrades'),
      achievements: document.getElementById('tab-achievements'),
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
    achievements: [
      { id: 'achv_click_100', name: 'Tappy Tapper', desc: 'Click 100 times.', unlocked: false, check: (s) => (s._clicks||0) >= 100, reward: (s) => { s.clickPower += 1; } },
      { id: 'achv_miner_10', name: 'Fleet of Miners', desc: 'Own 10 Miners.', unlocked: false, check: (s) => s.generators[0].owned >= 10, reward: (s) => { s._boostMult = (s._boostMult||1)*1.1; } },
      { id: 'achv_shards_1k', name: 'Cracked 1K', desc: 'Reach 1,000 shards.', unlocked: false, check: (s) => s.totalShards >= 1000, reward: (s) => { s.clickPower += 2; } },
      { id: 'achv_ascend', name: 'First Ascension', desc: 'Ascend once.', unlocked: false, check: (s) => (s._ascends||0) >= 1, reward: (s) => { s._boostMult = (s._boostMult||1)*1.2; } },
    ],
    _boostMult: 1,
    _clicks: 0,
    _ascends: 0,
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

  // Utils
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

  function save() {
    const data = JSON.stringify(state);
    localStorage.setItem('shard-smith-save', data);
    log('Game saved.');
  }

  function load() {
    const data = localStorage.getItem('shard-smith-save');
    if (!data) return;
    try {
      const obj = JSON.parse(data);
      Object.assign(state, obj);
      log('Save loaded.');
    } catch (e) {
      console.error(e);
      log('Failed to load save.');
    }
  }

  function exportSave() {
    const data = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
    navigator.clipboard?.writeText(data);
    alert('Save copied to clipboard!');
  }
  function importSave() {
    const data = prompt('Paste your save string:');
    if (!data) return;
    try {
      const obj = JSON.parse(decodeURIComponent(escape(atob(data))));
      Object.assign(state, obj);
      save();
      renderAll();
      log('Save imported.');
    } catch (e) { alert('Invalid save string'); }
  }

  function softcap(mult) {
    // Gentle softcap to avoid runaway: beyond 1e6 shards/sec, reduce growth
    const rate = computeRate();
    if (rate < 1e6) return mult;
    const factor = 1 + Math.log10(rate/1e6) * 0.15; // slow growth
    return mult / factor;
  }

  function globalMult() {
    return softcap(1 + Math.sqrt(state.dust));
  }

  function generatorCost(g) {
    return g.baseCost * Math.pow(g.costMult, g.owned);
  }

  function canAfford(cost) { return state.shards >= cost; }

  function buyGenerator(idx, amount=1) {
    const g = state.generators[idx];
    let bought = 0;
    for (let i=0; i<amount; i++) {
      const c = generatorCost(g);
      if (!canAfford(c)) break;
      state.shards -= c;
      g.owned++;
      bought++;
    }
    if (bought>0) { renderGenerators(); renderTop(); }
  }

  function buyMaxGenerator(idx) {
    const g = state.generators[idx];
    let afford = 0; let tempOwned = g.owned; let tempShards = state.shards;
    while (true) {
      const c = g.baseCost * Math.pow(g.costMult, tempOwned);
      if (tempShards >= c) { tempShards -= c; tempOwned++; afford++; } else break;
      if (afford > 100000) break; // safety
    }
    if (afford>0) {
      for (let i=0;i<afford;i++) {
        const c = generatorCost(g);
        state.shards -= c; g.owned++;
      }
      renderGenerators(); renderTop();
    }
  }

  function computeRate() {
    let rate = 0;
    const mult = (state._boostMult||1) * globalMult();
    for (const g of state.generators) {
      rate += g.owned * g.baseProd * mult;
    }
    return rate;
  }

  function tick(dt) {
    const rate = computeRate();
    const gain = rate * dt;
    state.shards += gain;
    state.totalShards += gain;
  }

  function potentialDustGain() {
    // Dust gain scales with total shards produced overall (not current)
    // sqrt(total/1e5) rounded down
    return Math.floor(Math.pow(state.totalShards / 1e5, 0.5));
  }

  function ascend() {
    const gain = potentialDustGain();
    if (gain <= 0) {
      alert('Not enough progress for Dust. Keep forging!');
      return;
    }
    state.dust += gain;
    state._ascends = (state._ascends||0) + 1;
    // Reset core resources & generators, keep upgrades purchased
    state.shards = 0;
    for (const g of state.generators) g.owned = 0;
    log(`Ascended! Gained ${gain} Dust.`);
    renderAll();
    checkAchievements();
    save();
  }

  function renderTop() {
    el.shards.textContent = fmt.n(state.shards);
    el.dust.textContent = fmt.n(state.dust);
    el.rate.textContent = fmt.n(computeRate()) + ' /s';
    el.clickPower.textContent = fmt.n(state.clickPower);
    el.potentialDust.textContent = fmt.n(potentialDustGain());
  }

  function renderGenerators() {
    el.generatorsWrap.innerHTML = '';
    state.generators.forEach((g, idx) => {
      const card = document.createElement('div'); card.className = 'card';
      const left = document.createElement('div');
      const title = document.createElement('div'); title.className = 'title'; title.textContent = `${g.name}`;
      const desc = document.createElement('div'); desc.className = 'desc'; desc.textContent = g.desc;
      const meta = document.createElement('div'); meta.className = 'meta'; meta.textContent = `Output: ${fmt.n(g.baseProd)} × owned`;
      left.appendChild(title); left.appendChild(desc); left.appendChild(meta);

      const right = document.createElement('div');
      const cost = document.createElement('div'); cost.className = 'cost'; cost.textContent = `Cost: ${fmt.n(generatorCost(g))}`;
      const buybar = document.createElement('div'); buybar.className = 'buybar';
      const b1 = document.createElement('button'); b1.textContent = 'Buy 1'; b1.onclick = () => buyGenerator(idx,1);
      const b10 = document.createElement('button'); b10.textContent = 'Buy 10'; b10.onclick = () => buyGenerator(idx,10);
      const bMax = document.createElement('button'); bMax.textContent = 'Buy Max'; bMax.onclick = () => buyMaxGenerator(idx);
      const owned = document.createElement('div'); owned.className = 'owned'; owned.textContent = `Owned: ${g.owned}`;
      buybar.appendChild(b1); buybar.appendChild(b10); buybar.appendChild(bMax); buybar.appendChild(owned);
      right.appendChild(cost); right.appendChild(buybar);

      card.appendChild(left); card.appendChild(right);
      el.generatorsWrap.appendChild(card);
    });
  }

  function renderUpgrades() {
    el.upgradesWrap.innerHTML = '';
    state.upgrades.forEach((u) => {
      const card = document.createElement('div'); card.className = 'card';
      const left = document.createElement('div');
      const title = document.createElement('div'); title.className='title'; title.textContent = u.name;
      const desc = document.createElement('div'); desc.className='desc'; desc.textContent = u.desc;
      left.appendChild(title); left.appendChild(desc);
      const right = document.createElement('div');
      const cost = document.createElement('div'); cost.className='cost'; cost.textContent = u.purchased? 'Purchased' : `Cost: ${fmt.n(u.cost)}`;
      const buy = document.createElement('button'); buy.textContent = u.purchased? '✔' : 'Buy';
      buy.disabled = u.purchased;
      buy.onclick = () => {
        if (u.purchased) return;
        if (state.shards >= u.cost) { state.shards -= u.cost; u.purchased = true; u.apply(state); renderAll(); log(`Purchased: ${u.name}`); }
      };
      right.appendChild(cost); right.appendChild(buy);
      card.appendChild(left); card.appendChild(right);
      el.upgradesWrap.appendChild(card);
    });
  }

  function renderAchievements() {
    el.achievementsWrap.innerHTML = '';
    state.achievements.forEach((a) => {
      const card = document.createElement('div'); card.className = 'achv ' + (a.unlocked? '' : 'locked');
      const title = document.createElement('div'); title.className='title'; title.textContent = a.name + (a.unlocked? ' ⭐':'' );
      const desc = document.createElement('div'); desc.className='desc'; desc.textContent = a.desc;
      card.appendChild(title); card.appendChild(desc);
      el.achievementsWrap.appendChild(card);
    });
  }

  function renderMilestones() {
    const list = [
      `Reach 1,000 shards`,
      `Buy 10 Miners`,
      `Purchase Forgemaster upgrade`,
      `Ascend to earn Dust`,
      `Reach 1 Dust`,
      `Reach 10 Dust`,
    ];
    el.milestones.innerHTML = '';
    for (const m of list) {
      const li = document.createElement('li'); li.textContent = '• ' + m; el.milestones.appendChild(li);
    }
  }

  function renderAll() {
    renderTop(); renderGenerators(); renderUpgrades(); renderAchievements(); renderMilestones();
  }

  function checkAchievements() {
    state.achievements.forEach((a) => {
      if (!a.unlocked && a.check(state)) { a.unlocked = true; a.reward(state); log(`Achievement unlocked: ${a.name}`); renderAll(); }
    });
  }

  // Tabs
  el.tabs.forEach(t => {
    t.addEventListener('click', () => {
      el.tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');
      Object.values(el.panels).forEach(p=>p.classList.remove('active'));
      el.panels[t.dataset.tab].classList.add('active');
    });
  });

  // Buttons
  el.forgeBtn.addEventListener('click', () => {
    const mult = (state._boostMult||1) * globalMult();
    const amt = state.clickPower * mult;
    state.shards += amt; state.totalShards += amt; state._clicks = (state._clicks||0)+1;
    if (state.animations) {
      const spark = document.createElement('div');
      spark.textContent = '+' + fmt.n(amt);
      spark.style.position = 'absolute'; spark.style.left = (Math.random()*60+20)+'%'; spark.style.color = '#64ffda';
      spark.style.filter = 'drop-shadow(0 0 6px #64ffda)';
      spark.style.animation = 'spark 0.9s ease-out forwards';
      spark.className = 'spark';
      document.body.appendChild(spark);
      setTimeout(()=> spark.remove(), 900);
    }
    renderTop(); checkAchievements();
  });

  // Key buys with modifiers
  document.addEventListener('click', (ev) => {
    const target = ev.target;
    if (target.closest('#generators .card')) {
      const idx = Array.from(el.generatorsWrap.children).indexOf(target.closest('.card'));
      if (ev.shiftKey) buyGenerator(idx, 10); else if (ev.ctrlKey) buyMaxGenerator(idx);
    }
  });

  el.ascendBtn.addEventListener('click', ascend);
  el.autosaveToggle.addEventListener('change', () => state.autosave = el.autosaveToggle.checked);
  el.animToggle.addEventListener('change', () => state.animations = el.animToggle.checked);
  el.saveBtn.addEventListener('click', save);
  el.exportBtn.addEventListener('click', exportSave);
  el.importBtn.addEventListener('click', importSave);
  el.resetBtn.addEventListener('click', () => { if (confirm('Hard reset your save?')) { localStorage.removeItem('shard-smith-save'); location.reload(); } });

  // Animation keyframes (injected for sparks)
  const style = document.createElement('style');
  style.textContent = `@keyframes spark { 0%{ transform: translateY(0); opacity:1 } 100%{ transform: translateY(-60px); opacity:0 } }`;
  document.head.appendChild(style);

  // Game loop
  let last = performance.now();
  function loop(now) {
    const dt = Math.min(0.5, (now-last)/1000); // clamp in case of hiccup
    last = now;
    tick(dt);
    renderTop();
    if (state.autosave) {
      if ((state._lastSaveTs||0) + 10000 < Date.now()) { save(); state._lastSaveTs = Date.now(); }
    }
    requestAnimationFrame(loop);
  }

  // Offline progress on load
  function applyOfflineProgress() {
    const data = localStorage.getItem('shard-smith-save');
    if (!data) return;
    try {
      const obj = JSON.parse(data);
      const lastTs = obj._last || Date.now();
      const dt = Math.min(3600, (Date.now() - lastTs)/1000); // up to 1 hour offline gains
      Object.assign(state, obj);
      tick(dt);
      log(`Applied ${fmt.n(dt)}s of offline progress.`);
    } catch {}
  }

  function persistLast() { state._last = Date.now(); localStorage.setItem('shard-smith-save', JSON.stringify(state)); }
  window.addEventListener('beforeunload', persistLast);

  // Init
  load();
  applyOfflineProgress();
  renderAll();
  requestAnimationFrame(loop);
})();
