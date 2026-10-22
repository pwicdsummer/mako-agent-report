'use strict';

const sourceFiles = {
  desktop: { path: 'MakoTalker-linux/README.md', title: 'MakoTalker 项目说明', note: '桌面伴侣、语音识别与合成、视觉模块、Letta 记忆、本地与云端模型切换；说明当前唯一启用的 Agent 为 mako_chat_agent。' },
  migration: { path: 'MakoTalker_MIGRATION_WINDOWS_TO_ARCH.md', title: 'Windows → Arch Linux 迁移记录', note: '记录平台兼容、依赖重建、原始数据保留和校验流程；包含 Codex 工作区与后续维护记录。', date: '文档更新：2026-09-14' },
  remote: { path: 'MakoTalker-linux/Mako_DLC/MakoRemote/README.md', title: 'Mako Remote 组织与迁移说明', note: '手机入口与无界面大脑服务复用主项目模型、角色记忆和语音权重；记录 DLC 迁移与验证。', date: '迁移记录：2026-10-12' },
  mobile: { path: 'MakoTalker-linux/Mako_DLC/MakoRemote/MakoMobile/README.md', title: '移动端使用与验收说明', note: '手机网页、历史对话、分段语音、服务启停、请求去重和恢复；包含仍需真机确认的交互边界。' },
  folio: { path: 'folio-canvas/README.md', title: 'Folio · 无界手记项目说明', note: '电脑与 iPad 共用画布、书写与圈选、本地存储、OCR、逐笔书写和 MAKO 助手；保留真机验证与复杂公式识别的限制。' },
  bridge: { path: 'folio-canvas/docs/MAKO-BRIDGE.md', title: 'Folio → MAKO 接口与记忆说明', note: '画布通过原 MAKO Brain 调用共享 Letta Agent；提问携带已选内容，并按原流程写入聊天归档。画布桥接不启动语音合成。', date: '接口实机记录：2026-10-19' },
  latency: { path: 'folio-canvas/docs/LATENCY-QA.md', title: '落笔到回答第一笔的延迟验收', note: '同一原文与箭头问题对照：20.227 秒 → 9.887 秒。计时包含等待、OCR、回答与首笔绘制，非平均值、P95 或固定上限。', date: '测量日期：2026-10-19' },
  voice: { path: 'experiments/tts-segmentation-20261005/comparison-notes.txt', title: 'TTS 切句策略 A/B 对照说明', note: 'A 使用 cut5；B 保留完整句与自然段，每段请求 cut0。声音权重、参考音频、采样参数、随机种子、语速及片段间隔保持一致。时长差异不代表自然度优劣。', date: '实验目录日期：2026-10-05' }
};

const agents = [
  { title: 'Codex', category: 'build', icon: '⌘', style: 'code', status: '开发协作', description: '把需求落到代码与验证。迁移记录中留下了兼容修复、数据校验和后续维护的协作线索。', footer: '需求 → 实现 → 验证', sources: ['migration'], detail: '开发协作记录来自迁移文档中的 Codex 工作区与维护说明。本报告不推算调用次数、使用时长、Token 数或开发贡献比例，也不据此认定所有功能均由 Codex 完成。' },
  { title: 'Letta', category: 'brain', icon: '∞', style: 'memory', status: '记忆中枢', description: '让对话保持连续。桌面、手机与画布复用同一个角色 Agent，衔接上下文、记忆工具与聊天归档。', footer: '一个 Agent，多个入口', sources: ['desktop', 'bridge', 'remote'], detail: '项目 README 标明唯一启用的 Letta Agent 为 mako_chat_agent。Folio 桥接说明确认它复用原 Agent 的角色提示、记忆与归档流程；这些是项目设计与记录，不是本报告发起的在线状态检测。' },
  { title: 'Ollama / Gemma', category: 'brain', icon: '◉', style: 'local', status: '本地推理', description: '为角色提供本地回答能力。由 Ollama 承载 Gemma，通过既有 Agent 服务进入各个交互入口。', footer: '本地模型 · 按需启停', sources: ['desktop', 'bridge', 'mobile'], detail: '项目文档记录本地模型 handle 为 ollama/my-gemma4:latest，并提供模型启停与后端切换说明。名称按文件原样整理，不在这里对模型厂商版本或当前运行状态作额外推断。' },
  { title: 'DeepSeek', category: 'brain', icon: '≈', style: 'cloud', status: '云端备选', description: '桌面端的另一条推理路径。项目提供本地模型与云端后端切换，同时保留原有 Agent 与记忆。', footer: '后端切换 · 延续上下文', sources: ['desktop', 'bridge'], detail: '云端路径依据 MakoTalker README 中的后端选择说明。Folio 桥接也明确指出：当共享 Agent 切换到大脑服务不支持的后端时，应报告不可用；不能从桌面的支持推断每个入口都支持全部后端。' },
  { title: 'GPT-SoVITS / Fish', category: 'sense', icon: '≋', style: 'voice', status: '语音表达', description: '把回复变成可以听见的声音。围绕本地合成、云端选项和切句对照，逐步调整停顿与播放体验。', footer: '语音合成 · 切句实验', sources: ['desktop', 'voice'], detail: '项目 README 描述 GPT-SoVITS 本地合成与 Fish Audio 云端选项；本报告所引用的 cut5 / cut0 对照属于 GPT-SoVITS 切句实验。没有把音频时长当成声音自然度评分。' },
  { title: 'ASR / Vision / OCR', category: 'sense', icon: '⌁', style: 'sense', status: '感知支撑', description: 'FunASR 理解声音，Qwen2-VL 处理视觉，画布 OCR 读取手写。不同输入，逐步转成 Agent 可用的上下文。', footer: '声音 · 屏幕 · 手写', sources: ['desktop', 'folio'], detail: '感知层按文档合并展示：桌面包含 FunASR、Silero VAD、CAM++ 与 Qwen2-VL；Folio 使用本地 OCR。它们不是独立开发 Agent，也不代表这些模型同时常驻或始终启用。' }
];

const projects = {
  desktop: { title: 'MakoTalker · 桌面 AI 伴侣', label: 'PROJECT 01 / DESKTOP COMPANION', intro: '从角色陪伴出发，把文字、声音、视觉与长期记忆整合到一个 PyQt5 桌面应用里。', points: ['语音链路包含 VAD、声纹验证与 FunASR 转写，支持语音对话与打断。', 'Letta 维护角色与记忆；本地 Ollama / Gemma 和云端 DeepSeek 提供项目中记录的推理后端。', 'GPT-SoVITS / Fish Audio 负责语音表达，桌面界面提供气泡对话、立绘与动画。', '迁移记录覆盖 Windows 到 Arch Linux 的平台兼容、依赖重建与关键文件校验。'], boundary: '功能描述来自 README 与迁移记录。本报告没有重新启动桌宠或验证摄像头、声卡、CUDA 与具体桌面环境。', sources: ['desktop', 'migration'] },
  mobile: { title: 'MAKO Remote · 让对话延续', label: 'PROJECT 02 / MOBILE EXPERIENCE', intro: '为原有 Mako 增加手机网页入口，由无界面大脑服务承接对话；模型、角色记忆和语音权重继续来自主项目。', points: ['移动端包含聊天历史、分段语音及播放设置，并支持恢复已有请求的结果。', '通过界面按需启停聊天模型与语音服务，保留手机入口。', '以请求账本和去重机制处理重复提交、中断恢复及不确定结果。', '2026-10-12 的组织迁移文档记录了隔离测试与资源校验。'], boundary: '文档中部分手机触摸、后台恢复、扬声器播放与主屏幕安装体验仍标为需要真机确认；本报告不宣称它们已全部验证。', sources: ['remote', 'mobile'] },
  folio: { title: 'Folio · 在画布上与 MAKO 思考', label: 'PROJECT 03 / HANDWRITING × AI', intro: '一款面向电脑与 iPad 的无限手写画布。笔记写入电脑；圈线标记、内容识别与 MAKO 回答把自然书写变成 AI 的入口。', points: ['钢笔、荧光笔、套索、文本、图片和便签构成基本画布工作流。', '粘贴文字直接读取；手写内容由本地 OCR 识别，支持校对与手动选区。', '共享 MAKO Agent 生成回答，并在原文旁用连接箭头与逐笔书写呈现。', '提供服务器保存、版本冲突提示、历史与备份；逐笔书写可暂停、调速和恢复。'], boundary: '真实 Apple Pencil 的压感、防误触及 Safari 体验仍需真机验证；复杂公式识别可能出错。延迟案例是桌面 Chromium 上的特定测试，非通用性能承诺。', sources: ['folio', 'bridge', 'latency'] },
  voice: { title: '语音实验室 · 用对照理解听感', label: 'PROJECT 04 / VOICE EXPERIMENTS', intro: '在同一段三段式日中双语回复上比较两种切句策略，让语音优化从“感觉有点不同”走向可复现的对照。', points: ['A：每个回复单元沿用 cut5。B：保留完整句与自然段，每段请求 cut0。', '固定声音权重、参考音频、采样参数、随机种子 20261005、语速 1.0 与片段间隔 0.3 秒。', '两组产物均记录为 32 kHz、单声道、16-bit PCM 的非静音 WAV。', '实验说明写明：未改生产配置，也未将测试内容写入 Letta 聊天记忆。'], boundary: '时长变化并不能证明自然度更好，结论需要直接试听。本报告展示实验方法，不提供未经确认的自然度排名。', sources: ['voice'] }
};

const flows = {
  desktop: { eyebrow: 'SPEAK → UNDERSTAND → REMEMBER', title: '说一句话，让回应带着熟悉感。', description: '把麦克风输入转成文字，由已有角色与记忆承接，再生成可以听见的回答。', steps: [['声音输入', '麦克风 / VAD'], ['识别与验证', 'FunASR / CAM++'], ['理解与记忆', 'Letta + 推理模型'], ['语音与界面', 'TTS / 桌面气泡']], foot: '项目包含语音打断与立绘联动；实际能力取决于已启用的模块。' },
  mobile: { eyebrow: 'A NEW WINDOW, THE SAME COMPANION', title: '换到手机，延续同一段对话。', description: '手机网页承接输入，MAKO Brain 调用原有 Agent，再返回文字与可用的语音片段。', steps: [['手机输入', '移动网页'], ['请求管理', 'Brain / 请求账本'], ['共享 Agent', '角色 / 记忆工具'], ['返回与播放', '文字 / 分段语音']], foot: '手机服务继续使用主项目的模型、记忆与语音权重。' },
  canvas: { eyebrow: 'MARK → READ → THINK → WRITE', title: '圈出一个问题，等灵感落回纸上。', description: '标记画布内容后，识别选区原文与提问，再通过共享 MAKO 生成中文回答并逐笔写出。', steps: [['圈选与提问', '笔迹 / 准确文本'], ['读取原文', '本地 OCR / 校对'], ['MAKO 回答', '共享 Letta Agent'], ['落回画布', '连接箭头 / 逐笔']], foot: '画布桥接使用文本与记忆归档，不在此流程中启动 TTS。' }
};

const notes = [
  { title: '先接成一个小闭环，再慢慢长大', text: '从一个可用入口开始，把输入、理解、回应和保存连接起来。桌面、手机、画布逐步扩展，能复用的模型与记忆继续复用，让每一步都有可观察的结果。', sources: ['desktop', 'remote', 'bridge'] },
  { title: '让记忆连续，也让边界清楚', text: '多个入口复用同一个 Agent，才能延续角色与上下文；也要说清楚哪些内容会进入记忆、哪些只是临时实验。Folio 将提问接入原有归档，语音切句实验则明确不写入真实聊天。', sources: ['bridge', 'voice'] },
  { title: '一次只改变少数变量', text: '切句实验固定文字、声音权重、参考音频与随机种子，再比较两种策略。把变量控制住，才知道变化来自哪里；对声音的判断，也不能只靠文件时长。', sources: ['voice'] },
  { title: '从用户动作开始，测到真实结果', text: '延迟的终点不只是服务返回成功，而是用户真正看到回答的第一笔。拆开停笔等待、识别、推理与呈现，才看得见该优化的地方，也能保留测试条件。', sources: ['latency'] },
  { title: '迁移和迭代，都给数据留一条退路', text: '记忆、原始记录和不可再生资产需要保留；运行环境可以重建。通过备份、文件校验、版本冲突保护与隔离测试，让功能迭代不以丢失历史为代价。', sources: ['migration', 'remote', 'folio'] }
];

const escapeHTML = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const sourceListHTML = keys => `<ul class="source-list">${keys.map(key => {const source=sourceFiles[key];return `<li><strong>${source.title}</strong><code>${source.path}</code><p>${source.note}</p>${source.date ? `<small>${source.date}</small>` : ''}</li>`;}).join('')}</ul>`;

document.querySelector('#agent-grid').innerHTML = agents.map((agent,index) => `<article class="agent-card" data-category="${agent.category}"><div class="agent-card-top"><span class="agent-logo ${agent.style}" aria-hidden="true">${agent.icon}</span><span class="pill">${agent.status}</span></div><h3>${agent.title}</h3><p>${agent.description}</p><div class="agent-card-bottom"><span>${agent.footer}</span><button class="source-arrow" data-agent="${index}" aria-label="查看 ${escapeHTML(agent.title)} 的分工与资料">↗</button></div></article>`).join('');
document.querySelector('#notes-list').innerHTML = notes.map((note,index) => `<details class="note-item" ${index===0?'open':''}><summary><span class="note-index">0${index+1}</span><span>${note.title}</span><span class="note-plus" aria-hidden="true">+</span></summary><div class="note-body"><p>${note.text}</p><button class="inline-link" data-note="${index}">这条心得来自哪里 ↗</button></div></details>`).join('');

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  const category=button.dataset.filter;
  document.querySelectorAll('.filter').forEach(filter => {const active=filter===button;filter.classList.toggle('active',active);filter.setAttribute('aria-pressed',String(active));});
  let count=0;
  document.querySelectorAll('.agent-card').forEach(card => {card.hidden=category!=='all'&&card.dataset.category!==category;if(!card.hidden)count++;});
  document.querySelector('#filter-status').textContent=`已显示 ${count} 个工具分组`;
}));

function selectFlow(key,moveFocus=false){
  const flow=flows[key];
  document.querySelectorAll('[data-flow]').forEach(tab => {const active=tab.dataset.flow===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1;if(active&&moveFocus)tab.focus();});
  const panel=document.querySelector('#flow-panel');
  panel.setAttribute('aria-labelledby',`tab-${key}`);
  panel.innerHTML=`<span class="small-label">${flow.eyebrow}</span><h3>${flow.title}</h3><p class="flow-description">${flow.description}</p><div class="flow-steps">${flow.steps.map((step,index)=>`${index?'<span class="flow-arrow" aria-hidden="true">→</span>':''}<div class="flow-step"><span class="step-number">0${index+1}</span><strong>${step[0]}</strong><span>${step[1]}</span></div>`).join('')}</div><p class="flow-footnote"><span aria-hidden="true">↳</span>${flow.foot}</p>`;
}
document.querySelectorAll('[data-flow]').forEach(tab => {
  tab.addEventListener('click',()=>selectFlow(tab.dataset.flow));
  tab.addEventListener('keydown',event=>{const keys=Object.keys(flows);let next=keys.indexOf(tab.dataset.flow);if(['ArrowRight','ArrowDown'].includes(event.key))next=(next+1)%keys.length;else if(['ArrowLeft','ArrowUp'].includes(event.key))next=(next+keys.length-1)%keys.length;else if(event.key==='Home')next=0;else if(event.key==='End')next=keys.length-1;else return;event.preventDefault();selectFlow(keys[next],true);});
});
selectFlow('desktop');

const dialog=document.querySelector('#detail-dialog');
let dialogTrigger=null;
function showDialog(label,html){
  dialogTrigger=document.activeElement;
  document.querySelector('#dialog-label').textContent=label;
  document.querySelector('#dialog-body').innerHTML=html;
  dialog.showModal();dialog.scrollTop=0;document.body.style.overflow='hidden';
}
function showSources(key){
  if(key==='latency'){
    showDialog('MEASUREMENT NOTE / 2026.10.19',`<h2 id="dialog-title">这 10 秒，省在了哪里？</h2><p>计时从最后抬笔开始，直到浏览器绘制回答正文的第一笔。测试使用同一份真实手写矢量样本与箭头问题，在桌面 Chromium 中完成。</p><div class="metric-bars"><div class="metric-row"><span>修改前</span><div class="metric-track"><div class="metric-fill" style="width:100%"></div></div><b>20.227s</b></div><div class="metric-row"><span>修改后</span><div class="metric-track"><div class="metric-fill after" style="width:48.88%"></div></div><b>9.887s</b></div></div><ul><li>抬笔至 OCR 完成：14.428s → 4.280s，包含停笔等待和识别。</li><li>OCR 完成至回答返回：4.355s → 4.168s。</li><li>回答返回至正文首笔：1.444s → 1.439s。</li></ul><div class="dialog-boundary">这是单案例前后对照，不是平均值、P95 或固定上限。MAKO 已加载且空闲、reasoning 关闭；不含真实 iPad、Safari、Wi-Fi 或 VPN 的开销。数据摘自既有文档，本网站未重新运行该测试。</div>${sourceListHTML(['latency'])}`);
    return;
  }
  const intro=key==='toolbox'?'按文档中的实际角色，区分开发协作、Agent 记忆、推理模型与感知组件。未找到可比较的完整使用频次，因此本报告不做频率排名。':'这份页面参考 Hugo 的报告结构，并按 Mako 项目资料重新编排。项目事实来自下面列出的文档；“使用心得”是据此提炼的方法，不是逐字引用的个人自述。';
  const keys=key==='toolbox'?['migration','desktop','bridge','voice']:Object.keys(sourceFiles);
  showDialog('SOURCES & EDITORIAL NOTES',`<h2 id="dialog-title">资料与整理说明</h2><p>${intro}</p><div class="dialog-boundary">整理日期：2026-10-22。首页的 4 个实践方向为本报告的内容分组；1 个共享 Agent 与 3 个交互入口依据项目文档归纳。所有描述是资料快照，不代表当前服务在线状态，也不推算 Token、费用或使用时长。</div>${sourceListHTML(keys)}<h3>视觉与素材</h3><p>主视觉使用本次提供的插画；配色提取暖白、灰棕、鼠尾草绿、柔和金色与淡粉。项目卡片中的窗口、手机和画布为界面示意，不是产品截图。中文标题使用随站点分发的 Noto Serif SC 字体，许可见页脚。</p><h3>结构参考</h3><a class="inline-link" href="https://hugohe8380.github.io/my-ai-agent-report/" target="_blank" rel="noopener noreferrer">Hugo · AI Agent 使用报告 ↗</a>`);
}

document.addEventListener('click',event=>{
  const projectButton=event.target.closest('[data-project]');
  if(projectButton){const p=projects[projectButton.dataset.project];showDialog(p.label,`<h2 id="dialog-title">${p.title}</h2><p>${p.intro}</p><h3>这项实践做了什么</h3><ul>${p.points.map(point=>`<li>${point}</li>`).join('')}</ul><div class="dialog-boundary">${p.boundary}</div><h3>资料出处</h3>${sourceListHTML(p.sources)}`);return;}
  const sourceButton=event.target.closest('[data-source]');if(sourceButton){showSources(sourceButton.dataset.source);return;}
  const agentButton=event.target.closest('[data-agent]');if(agentButton){const a=agents[Number(agentButton.dataset.agent)];showDialog('TOOL NOTE / '+a.status,`<h2 id="dialog-title">${a.title}</h2><p>${a.description}</p><div class="dialog-boundary">${a.detail}</div><h3>资料出处</h3>${sourceListHTML(a.sources)}`);return;}
  const noteButton=event.target.closest('[data-note]');if(noteButton){const n=notes[Number(noteButton.dataset.note)];showDialog('FIELD NOTE / SOURCE',`<h2 id="dialog-title">${n.title}</h2><p>${n.text}</p><div class="dialog-boundary">这是从项目文档归纳的协作方法，不是原作者的逐字引述。</div>${sourceListHTML(n.sources)}`);}
});
document.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
dialog.addEventListener('close',()=>{document.body.style.overflow='';dialogTrigger?.focus();});

const menuButton=document.querySelector('.menu-toggle');
const nav=document.querySelector('#main-nav');
function closeMenu(){nav.classList.remove('open');menuButton.setAttribute('aria-expanded','false');menuButton.setAttribute('aria-label','展开导航');}
menuButton.addEventListener('click',()=>{const open=menuButton.getAttribute('aria-expanded')!=='true';nav.classList.toggle('open',open);menuButton.setAttribute('aria-expanded',String(open));menuButton.setAttribute('aria-label',open?'收起导航':'展开导航');});
nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();menuButton.focus();}});

let scrollPending=false;
function updateProgress(){const max=document.documentElement.scrollHeight-window.innerHeight;document.querySelector('#reading-progress').style.width=`${max>0?Math.min(100,Math.max(0,window.scrollY/max*100)):0}%`;scrollPending=false;}
window.addEventListener('scroll',()=>{if(!scrollPending){scrollPending=true;requestAnimationFrame(updateProgress);}},{passive:true});
window.addEventListener('resize',updateProgress);updateProgress();
if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(entry.isIntersecting){document.querySelectorAll('#main-nav a').forEach(link=>link.classList.toggle('current',link.hash===`#${entry.target.id}`));}}},{rootMargin:'-15% 0px -50% 0px',threshold:0});document.querySelectorAll('main section[id]').forEach(section=>observer.observe(section));}
