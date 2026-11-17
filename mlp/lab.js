(function () {
  'use strict';
  const {MLP, X, defaults} = window.MLPLab;
  const $ = id => document.getElementById(id);
  const form = $('config');
  let model, history, view = 0, running = false, timer = null, probe = [0, 1], experiments;
  const fmt = (n, digits = 5) => n.toFixed(digits);
  const signed = n => (n >= 0 ? '+' : '') + n.toFixed(6);
  function config() {
    const d = Object.fromEntries(new FormData(form));
    return {...d, hidden: Number(d.hidden), lr: Number(d.lr), epochs: Number(d.epochs), seed: 42};
  }
  function stop() {running = false; clearTimeout(timer); $('run').textContent = '▶ 继续训练';}
  function reset() {
    stop(); model = new MLP(config()); history = [model.snapshot()]; view = 0;
    $('timeline').max = 0; $('timeline').value = 0; $('run').textContent = '▶ 开始训练';
    $('run-status').textContent = '准备就绪 · 可先单步观察一次更新';
    $('config-note').textContent = !model.config.hidden ? '线性对照：没有隐藏层，使用零初始化的逻辑回归；XOR 上的全局最优平均 BCE 为 ln 2。阈值相等时按 1 分类。' : model.config.init === 'course' ? '课程给定参数的初始准确率为 50%；训练先学会四个样本的分类，再提高预测置信度。也可切换固定种子的随机初始化。' : '固定种子 42 的 Xavier 均匀随机初始化。相同配置可以复现；不同结构与激活函数不保证在 300 轮内学会 XOR。';
    render();
  }
  function advance(count) {
    for (let i = 0; i < count && model.epoch < model.config.epochs; i++) history.push(model.step());
    view = history.length - 1;
    $('timeline').max = view; $('timeline').value = view; render();
    if (model.epoch >= model.config.epochs) {stop(); $('run').textContent = '✓ 训练完成'; $('run-status').textContent = '训练完成 · 拖动进度条回看每一轮，或下载本次记录';}
  }
  function tick() {
    if (!running) return;
    advance(Math.max(1, Math.floor(model.config.epochs / 180)));
    if (running) timer = setTimeout(tick, 35);
  }
  $('run').addEventListener('click', () => {
    if (running) {stop(); $('run-status').textContent = '已暂停 · 可单步继续，或回看已有记录'; return;}
    if (model.epoch >= model.config.epochs) return;
    running = true; $('run').textContent = 'Ⅱ 暂停训练'; $('run-status').textContent = '训练中 · 正在执行前向传播、反向求导与参数更新'; tick();
  });
  $('step').addEventListener('click', () => {stop(); advance(1); if(model.epoch < model.config.epochs) $('run-status').textContent = '已完成一次参数更新 · 当前梯度已在新参数处重新计算';});
  $('reset').addEventListener('click', reset);
  form.addEventListener('submit', e => e.preventDefault());
  form.addEventListener('change', e => {
    const h = Number($('hidden').value), activation = $('activation').value;
    if (e.target.id === 'hidden' || e.target.id === 'activation') {
      if (h !== 2 || activation !== 'sigmoid') $('init').value = 'random';
    }
    $('init').options[0].disabled = h !== 2 || activation !== 'sigmoid';
    $('activation').disabled = !h; $('init').disabled = !h;
    reset();
  });
  $('timeline').addEventListener('input', () => {stop(); view = Number($('timeline').value); render(); $('run-status').textContent = `回看第 ${view} 轮 · 继续训练会从最新轮次 ${model.epoch} 接着更新`;});
  $('latest').addEventListener('click', () => {view = history.length - 1; $('timeline').value = view; render();});
  function applyConfig(c) {
    stop();
    Object.entries(c).forEach(([key, value]) => {if (form.elements[key]) form.elements[key].value = String(value);});
    $('init').options[0].disabled = c.hidden !== 2 || c.activation !== 'sigmoid';
    $('activation').disabled = !c.hidden; $('init').disabled = !c.hidden;
    // Disabled selects are omitted from FormData and use the core defaults.
    reset();
    $('experiment').scrollIntoView({behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  $('restore-course').addEventListener('click', () => applyConfig(defaults));
  function setProbe(x) {probe = x; render();}
  $('sample-buttons').addEventListener('click', e => {const b = e.target.closest('[data-sample]'); if (b) setProbe([...X[Number(b.dataset.sample)]]);});
  $('predictions').addEventListener('click', e => {const b = e.target.closest('[data-sample]'); if(b) setProbe([...X[Number(b.dataset.sample)]]);});
  $('decision').addEventListener('click', e => {
    const r = e.target.getBoundingClientRect(), px = (e.clientX - r.left) / r.width * 520, py = (e.clientY - r.top) / r.height * 370;
    if (px < 49 || px > 497 || py < 16 || py > 326) return;
    setProbe([Math.max(0, Math.min(1, (px - 49) / 448)), Math.max(0, Math.min(1, 1 - (py - 16) / 310))]);
  });
  function viewedModel() {const m = new MLP(model.config); m.p = [...history[view].p]; return m;}
  function render() {
    const s = history[view], m = viewedModel(), f = m.forward(probe);
    $('metric-epoch').innerHTML = `${s.epoch} <small>/ ${model.config.epochs}</small>`;
    $('metric-loss').textContent = fmt(s.loss);
    $('metric-accuracy').textContent = `${(s.accuracy * 100).toFixed(0)}%`;
    $('metric-params').innerHTML = `${s.p.length} <small>个</small>`;
    $('timeline-value').textContent = `第 ${s.epoch} 轮`;
    $('network-count').textContent = model.config.hidden ? `2 → ${model.config.hidden} → 1` : '2 → 1 · 线性对照';
    $('step').disabled = model.epoch >= model.config.epochs;
    $('run').disabled = model.epoch >= model.config.epochs;
    $('parameter-caption').textContent = `第 ${s.epoch} 轮 · 共 ${s.p.length} 个参数`;
    $('probe-result').textContent = `x = (${probe.map(n => n.toFixed(2)).join(', ')}) → P(1) = ${f.prob.toFixed(5)} → ${Number(f.prob >= 0.5)}`;
    $('predictions').innerHTML = s.predictions.map((p, i) => `<tr class="${probe[0] === p.x[0] && probe[1] === p.x[1] ? 'active' : ''}"><td><button class="sample-button" data-sample="${i}" aria-label="查看输入${p.x.join(',')}的前向计算">${p.x.join(', ')}</button></td><td>${p.target}</td><td>${p.prob.toFixed(5)}<span class="prob-bar"><b style="width:${p.prob * 100}%"></b></span></td><td><span class="result-badge ${p.label !== p.target ? 'wrong' : ''}">${p.label} ${p.label === p.target ? '✓' : '×'}</span></td></tr>`).join('');
    $('parameters').innerHTML = s.p.map((p, i) => `<tr><td>${model.names[i]}</td><td>${signed(model.initial[i])}</td><td class="${p < 0 ? 'negative-number' : ''}">${signed(p)}</td><td>${signed(s.grad[i])}</td><td>${signed(view ? p - history[view - 1].p[i] : 0)}</td></tr>`).join('');
    $('sample-buttons').querySelectorAll('button').forEach((b, i) => {const selected = probe[0] === X[i][0] && probe[1] === X[i][1]; b.setAttribute('aria-pressed', String(selected)); b.classList.toggle('selected', selected);});
    $('parameter-caption').parentElement.firstChild.textContent = `${s.p.length === 9 ? '九' : s.p.length}个参数，究竟怎样变化？ `;
    drawDecision(m); drawLoss(); drawNetwork(m, f);
  }
  function context(id, w, h) {
    const canvas = $(id), ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = w * ratio; canvas.height = h * ratio;
    const ctx = canvas.getContext('2d'); ctx.scale(ratio, ratio); ctx.clearRect(0, 0, w, h); return ctx;
  }
  function drawDecision(m) {
    const ctx = context('decision', 520, 370), left = 49, top = 16, w = 448, h = 310, n = 64;
    const points = Array.from({length: n + 1}, (_, y) => Array.from({length: n + 1}, (_, x) => m.forward([x / n, 1 - y / n]).prob));
    const color = p => {
      const a = p < 0.5 ? [184, 206, 188] : [245, 240, 228], b = p < 0.5 ? [245, 240, 228] : [218, 165, 137], t = p < 0.5 ? p * 2 : (p - .5) * 2;
      return `rgb(${a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',')})`;
    };
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {ctx.fillStyle = color(m.forward([(x + .5) / n, 1 - (y + .5) / n]).prob); ctx.fillRect(left + x * w / n, top + y * h / n, w / n + .6, h / n + .6);}
    ctx.strokeStyle = '#ffffff55'; ctx.lineWidth = 1;
    for(let t = 0; t <= 4; t++) {ctx.beginPath();ctx.moveTo(left + t * w / 4, top);ctx.lineTo(left + t * w / 4, top + h);ctx.moveTo(left, top + t * h / 4);ctx.lineTo(left + w, top + t * h / 4);ctx.stroke();}
    // Marching squares with linear interpolation; flat p=.5 has no unique contour.
    ctx.strokeStyle = '#fffdf8'; ctx.lineWidth = 2; ctx.beginPath();
    for(let y = 0; y < n; y++) for(let x = 0; x < n; x++) {
      const verts = [[x, y], [x+1,y], [x+1,y+1], [x,y+1]], cuts=[];
      for(let k=0;k<4;k++) {const a=verts[k], b=verts[(k+1)%4], va=points[a[1]][a[0]]-.5, vb=points[b[1]][b[0]]-.5;
        if((va<0&&vb>=0)||(va>=0&&vb<0)) {const t=va/(va-vb);cuts.push([left+(a[0]+(b[0]-a[0])*t)*w/n,top+(a[1]+(b[1]-a[1])*t)*h/n]);}}
      for(let k=0;k+1<cuts.length;k+=2) {ctx.moveTo(...cuts[k]);ctx.lineTo(...cuts[k+1]);}
    } ctx.stroke();
    ctx.strokeStyle='#c3c9b9';ctx.lineWidth=1;ctx.strokeRect(left,top,w,h);
    ctx.fillStyle='#79796e';ctx.font='11px sans-serif';ctx.textAlign='center';
    for(let i=0;i<=4;i++) {ctx.fillText((i/4).toFixed(i%4?2:0),left+i*w/4,top+h+20);ctx.textAlign='right';ctx.fillText((1-i/4).toFixed(i%4?2:0),left-11,top+i*h/4+4);ctx.textAlign='center';}
    ctx.fillStyle='#52694f';ctx.fillText('x₁',left+w/2,top+h+42);ctx.textAlign='left';ctx.fillText('x₂',8,13);
    X.forEach((x,i)=>{const px=left+x[0]*w,py=top+(1-x[1])*h;ctx.beginPath();if(i===1||i===2){ctx.moveTo(px,py-7);ctx.lineTo(px+7,py);ctx.lineTo(px,py+7);ctx.lineTo(px-7,py);ctx.closePath();}else ctx.arc(px,py,7,0,Math.PI*2);ctx.fillStyle=(i===1||i===2)?'#b5796c':'#526e5b';ctx.fill();ctx.strokeStyle='#fffdf6';ctx.lineWidth=2;ctx.stroke();ctx.font='bold 12px sans-serif';ctx.fillStyle='#504844';ctx.textAlign=x[0]?'right':'left';ctx.fillText(`(${x.join(',')}) · ${i===1||i===2?1:0}`,px+(x[0]?-12:12),py+(x[1]?21:-13));});
    const px=left+probe[0]*w,py=top+(1-probe[1])*h;ctx.beginPath();ctx.arc(px,py,12,0,Math.PI*2);ctx.strokeStyle='#bd9b51';ctx.lineWidth=2;ctx.stroke();
  }
  function drawLoss() {
    const ctx=context('loss-chart',520,250),left=53,top=20,w=441,h=181,max=Math.max(.72,...history.map(s=>s.loss))*1.05;
    ctx.font='10px sans-serif';ctx.textAlign='right';
    for(let i=0;i<=4;i++){const y=top+i*h/4;ctx.strokeStyle='#e2e5d9';ctx.beginPath();ctx.moveTo(left,y);ctx.lineTo(left+w,y);ctx.stroke();ctx.fillStyle='#858476';ctx.fillText((max*(1-i/4)).toFixed(2),left-10,y+4);}
    const maxEpoch=Math.max(1,model.config.epochs);ctx.textAlign='center';
    for(let i=0;i<=4;i++)ctx.fillText(Math.round(i*maxEpoch/4),left+i*w/4,top+h+18);
    ctx.fillText('epoch',left+w/2,top+h+40);ctx.textAlign='left';ctx.fillText('BCE',8,13);
    ctx.strokeStyle='#657e70';ctx.lineWidth=2;ctx.beginPath();
    history.forEach((s,i)=>{const x=left+s.epoch/maxEpoch*w,y=top+h-s.loss/max*h;if(!i)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();
    const s=history[view],px=left+s.epoch/maxEpoch*w,py=top+h-s.loss/max*h;
    ctx.strokeStyle='#c7b777';ctx.setLineDash([4,4]);ctx.beginPath();ctx.moveTo(px,top);ctx.lineTo(px,top+h);ctx.stroke();ctx.setLineDash([]);
    ctx.fillStyle='#657e70';ctx.beginPath();ctx.arc(px,py,4,0,Math.PI*2);ctx.fill();ctx.fillStyle='#52694f';ctx.font='11px sans-serif';ctx.textAlign=px>330?'right':'left';ctx.fillText(`${s.loss.toFixed(5)}`,px+(px>330?-9:9),Math.max(top+12,py-10));
  }
  function drawNetwork(m,f) {
    const h=m.config.hidden,p=m.p,input=[[67,115],[67,255]],output=[450,185],hidden=Array.from({length:h},(_,j)=>[260,h===2?100+j*170:48+j*274/(h-1)]);
    const parts=[];
    function line(a,b,weight,name) {const color=weight>=0?'#718d75':'#bc8d78';parts.push(`<g tabindex="0" role="img" aria-label="${name}，权重 ${weight.toFixed(6)}"><title>${name}: ${weight.toFixed(6)}</title><path d="M${a.join(' ')}L${b.join(' ')}" fill="none" stroke="${color}" stroke-width="${Math.min(6,.8+Math.abs(weight)*.55)}" opacity=".7"/><path d="M${a.join(' ')}L${b.join(' ')}" fill="none" stroke="transparent" stroke-width="15"/></g>`);}
    if(h) {input.forEach((a,i)=>hidden.forEach((b,j)=>line(a,b,p[i*h+j],`W[${i+1},${j+1}]`)));hidden.forEach((a,j)=>line(a,output,p[3*h+j],`v[${j+1}]`));}
    else input.forEach((a,i)=>line(a,output,p[i],`w${i+1}`));
    function node(a,label,value,bias,kind='hidden') {const r=h>4&&kind==='hidden'?17:25;parts.push(`<g><circle cx="${a[0]}" cy="${a[1]}" r="${r}" fill="${kind==='output'?'#eddfb9':'#edf1e6'}" stroke="${kind==='output'?'#b89c61':'#92a385'}" stroke-width="1.5"/><text x="${a[0]}" y="${a[1]-r-10}" text-anchor="middle" font-size="11" fill="#62725b">${label}</text><text x="${a[0]}" y="${a[1]+4}" text-anchor="middle" font-size="${r<20?9:12}" fill="#465e4d">${value.toFixed(3)}</text>${bias===null?'':`<title>${label} 偏置=${bias.toFixed(6)}，激活=${value.toFixed(6)}</title>`}</g>`);}
    input.forEach((a,i)=>node(a,`x${i+1}`,probe[i],null,'input'));hidden.forEach((a,j)=>node(a,`h${j+1}`,f.hidden[j],p[2*h+j]));node(output,'P(1)',f.prob,p[h?4*h:2],'output');
    parts.push(`<g font-size="10" fill="#8a8878" text-anchor="middle"><text x="67" y="352">输入层</text><text x="260" y="352">${h?m.config.activation:'无隐藏层'}</text><text x="450" y="352">Sigmoid 输出</text></g>`);
    $('network').innerHTML=parts.join('');
  }
  function download(name,content,type) {const a=document.createElement('a'),url=URL.createObjectURL(new Blob([content],{type}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  $('export-csv').addEventListener('click',()=>{
    const header=['epoch','loss','accuracy',...X.map(x=>`p_${x.join('')}`),...model.names.map((_,i)=>`theta_${i}`)];
    const rows=history.map(s=>[s.epoch,s.loss,s.accuracy,...s.predictions.map(p=>p.prob),...s.p].join(','));
    const metadata=JSON.stringify({config:model.config,parameterOrder:model.names});
    download('xor-training.csv','\uFEFF# '+metadata+'\n'+header.join(',')+'\n'+rows.join('\n'),'text/csv;charset=utf-8');
  });
  $('export-json').addEventListener('click',()=>download('xor-model.json',JSON.stringify({config:model.config,parameterOrder:model.names,initial:model.initial,viewedEpoch:view,snapshot:history[view],latestSnapshot:history.at(-1),trainingSet:{X,Y:[0,1,1,0]}},null,2),'application/json'));
  async function showExperiments() {
    try {
      const r=await fetch('experiments.json');if(!r.ok)throw new Error('HTTP '+r.status);experiments=await r.json();
      $('experiment-results').innerHTML=experiments.runs.map((run,i)=>`<tr><td>${run.name}</td><td>${run.initial.loss.toFixed(6)}</td><td>${run.final.loss.toFixed(6)}</td><td>${run.final.accuracy*100}%</td><td><button class="text-button" data-experiment="${i}">载入设置 ↗</button></td></tr>`).join('');
      const a=experiments.runs[0];$('observation-confidence').textContent=`课程配置从初始准确率 ${a.initial.accuracy*100}%、BCE ${a.initial.loss.toFixed(6)} 出发。第 ${a.firstPerfectEpoch} 轮首次达到 100% 准确率，此时 BCE 仍为 ${a.firstPerfectLoss.toFixed(6)}；300 轮后继续降到 ${a.final.loss.toFixed(6)}。分对之后，学习仍在提高置信度。`;
    }catch(e){$('experiment-results').innerHTML='<tr><td colspan="5">预运行记录加载失败。可直接运行上方实验，或打开 experiments.json 查看。</td></tr>';}
  }
  $('experiment-results').addEventListener('click',e=>{const b=e.target.closest('[data-experiment]');if(b&&experiments)applyConfig(experiments.runs[Number(b.dataset.experiment)].config);});
  reset(); showExperiments();
  // Readable state is also used by the numerical/browser verification scripts.
  window.mlpLab={getState:()=>({config:model.config,latest:model.epoch,view,running,snapshot:history[view],probe:[...probe]}),getHistory:()=>history};
})();
