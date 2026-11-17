"""Generate the standalone, printable report from measured experiment output."""
import html
import json
from pathlib import Path

root = Path(__file__).resolve().parent
data = json.loads((root / 'experiments.json').read_text())
base = data['runs'][0]
initial, final = base['initial'], base['final']
torch_result = json.loads((root / 'downloads/torch-results/torch-result.json').read_text())
comparison = abs(torch_result['final_loss'] - final['loss'])
rows = ''.join(f'<tr><td>{html.escape(r["name"])}</td><td>{r["initial"]["loss"]:.6f}</td><td>{r["final"]["loss"]:.6f}</td><td>{r["final"]["accuracy"]:.0%}</td></tr>' for r in data['runs'])
preds = ''.join(f'<tr><td>{p["x"]}</td><td>{p["target"]}</td><td>{initial["predictions"][i]["prob"]:.8f}</td><td>{p["prob"]:.8f}</td><td>{p["label"]}</td></tr>' for i, p in enumerate(final['predictions']))
params = ''.join(f'<tr><td>{name}</td><td>{a:+.8f}</td><td>{b:+.8f}</td></tr>' for name, a, b in zip(base['parameterOrder'], initial['p'], final['p']))
path = ' '.join(f'{"M" if i==0 else "L"}{55+epoch/300*640:.2f},{245-loss/.6*210:.2f}' for i,(epoch,loss,acc) in enumerate(base['lossHistory']))
report = f'''<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>第二次作业实验报告 · MLP 参数学习与可视化</title><link rel="icon" href="../assets/favicon.svg"><link rel="stylesheet" href="lab.css"><style>
.report{{max-width:900px;margin:0 auto;padding:45px 30px 70px}}.report-nav{{display:flex;justify-content:space-between;gap:20px;margin-bottom:45px;font-size:12px;color:var(--green)}}.report h1{{font-size:36px;line-height:1.65;letter-spacing:-.7px}}.report h2{{font-size:23px;border-bottom:1px solid var(--line);padding-bottom:10px;margin:40px 0 20px}}.report h3{{font:500 18px/1.7 var(--serif);margin:25px 0 12px}}.report p,.report li{{font-size:12px;line-height:2.1;margin-bottom:13px}}.report ul,.report ol{{padding-left:22px}}.report .meta{{color:var(--muted);font-size:10px;margin:17px 0 25px}}.report .lead{{border-left:3px solid var(--green);padding:18px 22px;background:var(--sage)}}.report pre{{padding:20px;background:#eeefe4;border-radius:6px;margin-block:17px}}.report table{{font-size:11px}}.report td{{padding-block:10px}}.report a{{text-decoration:underline;text-underline-offset:4px;text-decoration-color:#b7c5ad}}.report figure{{margin:20px 0}}.report figure svg{{width:100%;height:auto;display:block}}.report figcaption{{font-size:10px;color:var(--muted);text-align:center}}.report img{{width:100%;height:auto;border:1px solid var(--line)}}.report .note{{color:var(--muted);font-size:11px}}@media(max-width:600px){{.report{{padding:25px 20px 45px}}.report h1{{font-size:27px}}.report h2{{font-size:21px}}.report pre{{padding:15px;font-size:10px}}.report table{{min-width:470px}}}}@media print{{.report{{padding:0;max-width:none}}.report-nav{{display:none}}.report h1{{font-size:24px}}.report h2{{font-size:17px;margin-top:24px;break-after:avoid}}.report p,.report li{{font-size:10px;line-height:1.8}}.report table{{min-width:0}}.report td{{padding-block:6px}}.report figure,.report tr{{break-inside:avoid}}.report pre{{font-size:9px;white-space:pre-wrap}}}}
</style></head><body><main class="report">
<nav class="report-nav"><a href="./">← 返回 MLP 学习实验室</a><button class="text-button" onclick="window.print()">打印 / 保存为 PDF ↓</button></nav>
<p class="eyebrow">MAKO · LEARNING NOTES / ASSIGNMENT 02</p><h1>MLP 学习参数的实现与可视化<br>——基于 XOR 的实验报告</h1>
<p class="meta">作者：pwicdsummer &nbsp; · &nbsp; 日期：2026 年 11 月 17 日 &nbsp; · &nbsp; 课程：《人工智能概论》第二篇第 15 节</p>
<p class="lead">本作业复现课程中的 2→2→1 MLP，使用 Sigmoid、二元交叉熵和 Adam，以学习率 0.03 训练 300 轮。四个 XOR 训练样本的准确率从 50% 提升到 100%，平均 BCE 从 {initial['loss']:.6f} 降至 {final['loss']:.6f}。网页实现可交互展示参数、梯度、决策边界和损失，另附可运行的 PyTorch 与 TensorFlow 脚本。</p>

<h2>一、实验任务与目标</h2>
<p>根据“第二篇 15 节 MLP 学习参数的实现和可视化，并展示在自己的网站上”的要求，完成从数据、模型、损失、反向求导到参数更新的完整流程。以 XOR 为例，解释单层模型的局限，以及隐藏层如何形成非线性表示。</p>
<p>作业展示地址：<a href="https://pwicdsummer.github.io/mako-agent-report/mlp/">https://pwicdsummer.github.io/mako-agent-report/mlp/</a>；第一次作业的首页设有第二次作业入口。</p>

<h2>二、数据、网络与超参数</h2>
<p>输入顺序为 (0,0)、(0,1)、(1,0)、(1,1)，标签依次为 0、1、1、0。四个样本整批训练，无独立验证集或测试集。判断规则为 P(1) ≥ 0.5 输出 1，否则输出 0。</p>
<pre>X = [[0,0], [0,1], [1,0], [1,1]]    y = [[0], [1], [1], [0]]
W = [[2, -2], [-2, 2]]              b_hidden = [-1, -1]
v = [[3], [3]]                     b_output = [-2.5]
网络：2 个输入 → 2 个 Sigmoid 隐藏单元 → 1 个输出
优化：Adam；η = 0.03；β₁ = 0.9；β₂ = 0.999；ε = 10⁻⁸
精度：float64；轮数：300；批量大小：4；参数数：4 + 2 + 2 + 1 = 9</pre>
<p>W 的行对应输入特征、列对应隐藏单元，与课程的 XW 写法一致。网页没有调用预训练模型；所有参数均通过当前实验的真实梯度更新。</p>

<h2>三、学习参数的方法</h2>
<h3>1. 前向计算与二元交叉熵</h3>
<pre>H = σ(XW + b_hidden)
z = Hv + b_output，p = σ(z)，σ(u) = 1 / (1 + exp(−u))
L = −(1/N) Σ[yᵢ ln pᵢ + (1−yᵢ) ln(1−pᵢ)]，N = 4</pre>
<p>实际计算采用对数几率上的稳定形式 L = mean(max(z,0) + log(1 + exp(−|z|)) − yz)，避免直接对接近 0 的概率取对数。</p>
<h3>2. 反向传播</h3>
<pre>δ_output = (p − y) / N
∂L/∂v = Hᵀδ_output，∂L/∂b_output = Σδ_output
δ_hidden = (δ_output vᵀ) ⊙ H ⊙ (1−H)
∂L/∂W = Xᵀδ_hidden，∂L/∂b_hidden = Σδ_hidden</pre>
<p>反向传播依据链式法则求梯度；求梯度本身不改变参数。PyTorch 使用 loss.backward()，TensorFlow 使用 GradientTape，网页在 core.js 中显式实现以上公式。</p>
<h3>3. Adam 更新</h3>
<pre>gₜ = ∇L(θₜ₋₁)
mₜ = β₁mₜ₋₁ + (1−β₁)gₜ
sₜ = β₂sₜ₋₁ + (1−β₂)gₜ²
m̂ₜ = mₜ/(1−β₁ᵗ)，ŝₜ = sₜ/(1−β₂ᵗ)
θₜ = θₜ₋₁ − η m̂ₜ/(√ŝₜ + ε)</pre>
<p>这里使用 s 表示 Adam 的二阶矩，以免与网络输出权重 v 混淆。所有梯度均先根据同一组旧参数计算，再一次性更新各参数。每轮记录的是更新后的损失，另保留第 0 轮的初始状态。</p>
<h3>4. 一次可检查的数值更新</h3>
<p>初始 W₁₁ = 2，平均损失对它的梯度为 {initial['grad'][0]:.9f}。Adam 的第一次偏差修正得到 m̂₁ = g₁，ŝ₁ = g₁²，因此 W₁₁ 更新到约 2.030000。网页“单步 +1”可查看这一步及其余八个参数。</p>

<h2>四、基准实验结果</h2>
<p>第 {base['firstPerfectEpoch']} 轮首次达到 100% 训练准确率，此时 BCE 仍有 {base['firstPerfectLoss']:.6f}。之后准确率保持 100%，损失继续下降，说明“分类正确”和“预测置信度高”并不等价。</p>
<figure><svg viewBox="0 0 740 295" role="img" aria-label="默认实验300轮的真实交叉熵损失曲线"><rect x="0" y="0" width="740" height="295" fill="#fcfbf6"/>
<g stroke="#dfe4d6">{''.join(f'<path d="M55 {245-i*52.5}H695"/>' for i in range(5))}</g>
<g fill="#78776d" font-size="11" text-anchor="end">{''.join(f'<text x="45" y="{249-i*52.5}">{i*.15:.2f}</text>' for i in range(5))}</g>
<path d="{path}" fill="none" stroke="#657e70" stroke-width="2.7"/>
<g fill="#78776d" font-size="11" text-anchor="middle">{''.join(f'<text x="{55+i/300*640}" y="266">{i}</text>' for i in [0,50,100,150,200,250,300])}<text x="375" y="287">Epoch</text></g><text x="10" y="18" font-size="11" fill="#78776d">BCE</text><text x="565" y="215" font-size="12" fill="#425e50">最终 L = {final['loss']:.6f}</text></svg><figcaption>图 1：由 experiments.json 中的逐轮实测损失生成。</figcaption></figure>
<div class="table-scroll"><table><thead><tr><th>输入</th><th>目标</th><th>初始 P(1)</th><th>第 300 轮 P(1)</th><th>最终分类</th></tr></thead><tbody>{preds}</tbody></table></div>
<h3>九个参数的学习结果</h3><div class="table-scroll"><table><thead><tr><th>参数</th><th>初始值</th><th>第 300 轮</th></tr></thead><tbody>{params}</tbody></table></div>
<p>训练后 h₁ 对输入 (1,0) 的激活约为 {final['predictions'][2]['hidden'][0]:.6f}，h₂ 对 (0,1) 的激活同样较高；(0,0) 与 (1,1) 的两个隐藏激活都较低。输出层将两个中间特征组合起来，实现 XOR 分类。此处是连续的 Sigmoid 表示，并非直接把隐藏单元设为逻辑门。</p>

<h2>五、对照实验与分析</h2><p>除所列变量外，各组使用同样的数据、轮数和损失。随机初始化固定种子 42；无隐藏层对照使用零初始化逻辑回归，参数只有 3 个。</p>
<div class="table-scroll"><table><thead><tr><th>设置</th><th>初始 BCE</th><th>最终 BCE</th><th>训练准确率</th></tr></thead><tbody>{rows}</tbody></table></div>
<ol><li><b>学习率：</b>在这组数据和初始化下，0.003 的下降较慢，0.3 在 300 轮内的损失更低。这是本实验的局部结论，不能推导出学习率越大越好。</li><li><b>优化器：</b>同为 0.03 学习率时，SGD 的最终 BCE 高于 Adam。两者更新规则不同，相同学习率并不意味着相同步长。</li><li><b>初始化：</b>固定种子 42 的两隐藏单元模型在 300 轮后只有 50% 准确率，说明网络具有表达能力并不保证某次优化能成功。可在网页中增加轮数或隐藏单元进一步比较。</li><li><b>结构：</b>无隐藏层时，零参数对四个样本均给出 0.5，平均 BCE 为 ln 2 ≈ 0.693147，梯度为零。这是逻辑回归在对称 XOR 数据上的最优平均损失；一般线性分类器可以分对其中 3 个点，但无法同时分对全部四个点。此对照的 50% 是 BCE 最优状态按 ≥0.5 阈值分类的结果，并非所有线性参数的准确率上限。</li></ol>

<h2>六、可视化设计与操作</h2><ol><li>打开网站，点击“开始训练”，观察 BCE、四个样本的概率及分类结果；可暂停或单步执行。</li><li>决策图的颜色表示 P(1)，白线表示 P(1)=0.5；图中的四个标记才是训练样本。</li><li>网络图的连线颜色表示权重正负，粗细表示绝对值；节点内是当前选择输入的激活值。点击样本或图上任意位置可改变观察输入。</li><li>拖动“回看训练”滑块，检查历史参数、损失和预测；参数表给出初始值、当前值、当前梯度及上一次实际更新。</li><li>改变隐藏单元、优化器、学习率、激活函数或初始化后自动重置，避免混用不同配置的训练记录。可导出 CSV 和模型 JSON。</li></ol>

<h2>七、复现与验证</h2><pre># 任选一个 Python 框架
python -m pip install torch matplotlib
python xor_torch.py --epochs 300 --lr 0.03

python -m pip install tensorflow matplotlib
python xor_tensorflow.py --epochs 300 --lr 0.03

# 仓库中运行网页核心的数值自检与对照实验生成
node mlp/verify.cjs
python mlp/build-report.py</pre>
<p>已实际运行 PyTorch {html.escape(torch_result['version'])}，采用 CPU、float64。其最终 BCE 为 {torch_result['final_loss']:.17f}，与浏览器实现相差 {comparison:.3g}；四个概率最大绝对差小于 10⁻¹⁵。PyTorch 的原始 <a href="downloads/torch-results/torch-history.csv" download>301 行训练记录</a>、<a href="downloads/torch-results/torch-result.json">结果 JSON</a> 和训练图均随作业提供。</p>
<figure><img src="downloads/torch-results/torch-learning.png" alt="实际运行PyTorch生成的损失曲线与XOR决策边界" width="1800" height="720"><figcaption>图 2：PyTorch 脚本实际运行生成的结果；圆点与菱形区分两类目标。</figcaption></figure>
<p>针对 0、2、4、8 隐藏单元及 Sigmoid / Tanh 的手写梯度，中央有限差分的最大绝对误差约 1.18×10⁻¹¹；另检查了 160 组配置均无非有限损失，并验证 Adam 首步公式与固定配置的可复现性。TensorFlow 脚本已做语法检查，本次环境未安装 TensorFlow，尚未执行；其原生 Adam 的 ε 约定与 PyTorch 也可能产生微小数值差异。</p>

<h2>八、学习总结与边界</h2><p>这次实验把“神经网络学习”拆成了可检查的数值过程：前向计算产生预测，损失把预测与标签联系起来，反向传播提供每个参数的梯度，优化器依据梯度更新参数。隐藏层提供解决 XOR 的非线性表示，初始化和优化设置决定训练能否有效找到它。</p>
<p>本作业没有独立测试集；100% 是全部四个布尔输入的训练准确率。连续决策图是模型在布尔样本之间的插值，不是额外测试证据。此实验用于理解参数学习，不代表模型已具备复杂任务的泛化能力。</p>

<h2>参考与实现说明</h2><ol><li><a href="https://zhumy.github.io/Introduction_to_Artificial_Intelligence/#chapter-15">《人工智能概论》第二篇第 15 节</a>，第 66 页“多层网络怎样学习参数？Python 实现与反向传播”。网页核对日期：2026-11-17。</li><li><a href="https://docs.pytorch.org/docs/stable/generated/torch.optim.Adam.html">PyTorch Adam 文档</a>；<a href="https://www.tensorflow.org/api_docs/python/tf/keras/optimizers/Adam">TensorFlow Adam 文档</a>。</li><li><a href="https://github.com/pwicdsummer/mako-agent-report/tree/main/mlp">本作业的公开实现与数据</a>。课程给定网络、数据与初始化作为复现起点；网页手写计算核心、可视化、对照实验和报告在 AI Agent 辅助下完成，数值结果由实际运行生成。</li></ol>
<p class="note">本报告与交互页面使用相同实验数据。回到 <a href="./">学习实验室</a>，或查看 <a href="../">第一次作业</a>。</p>
</main></body></html>'''
(root / 'report.html').write_text(report, encoding='utf-8')
print('Wrote report.html from measured results.')
