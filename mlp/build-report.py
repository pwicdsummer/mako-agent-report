"""Generate the printable report from the saved experiment results."""
import html
import json
from pathlib import Path

root = Path(__file__).resolve().parent
runs = json.loads((root / 'experiments.json').read_text())['runs']
base = runs[0]
initial, final = base['initial'], base['final']
torch_result = json.loads((root / 'downloads/torch-results/torch-result.json').read_text())
comparison = abs(torch_result['final_loss'] - final['loss'])


def table_rows(rows):
    return '\n'.join(
        '<tr>' + ''.join(f'<td>{html.escape(str(cell))}</td>' for cell in row) + '</tr>'
        for row in rows
    )


experiments = table_rows(
    (r['name'], f'{r["initial"]["loss"]:.6f}', f'{r["final"]["loss"]:.6f}', f'{r["final"]["accuracy"]:.0%}')
    for r in runs
)
predictions = table_rows(
    (tuple(p['x']), p['target'], f'{before["prob"]:.6f}', f'{p["prob"]:.6f}', p['label'])
    for before, p in zip(initial['predictions'], final['predictions'])
)
parameters = table_rows(
    (name, f'{before:+.6f}', f'{after:+.6f}')
    for name, before, after in zip(base['parameterOrder'], initial['p'], final['p'])
)

report = f'''<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>MLP 参数学习与可视化 · 实验报告</title>
  <link rel="stylesheet" href="lab.css">
</head>
<body>
  <main class="report wrap">
    <header class="page-header">
      <p class="course">人工智能概论 · 第 15 节实验 · pwicdsummer</p>
      <h1>MLP 参数学习与可视化实验报告</h1>
      <p>用 2 → 2 → 1 多层感知机学习 XOR。训练 300 轮后，二元交叉熵（BCE）从 <strong>{initial['loss']:.6f}</strong> 降到 <strong>{final['loss']:.6f}</strong>，四个训练样本全部分类正确。</p>
      <nav aria-label="报告操作">
        <a href="./">返回交互实验</a>
        <button class="text-button" onclick="window.print()">打印 / 保存 PDF</button>
      </nav>
    </header>

    <section class="section">
      <h2>数据与配置</h2>
      <p>输入依次为 (0,0)、(0,1)、(1,0)、(1,1)，标签为 0、1、1、0。四个样本组成一个批次。P(1) ≥ 0.5 判为 1。</p>
      <pre>隐藏层：2 个 Sigmoid 单元
初始参数：W = [[2, −2], [−2, 2]], bₕ = [−1, −1], v = [3, 3]ᵀ, bₒ = −2.5
优化器：Adam，η = 0.03，β₁ = 0.9，β₂ = 0.999，ε = 10⁻⁸
训练轮数：300    数值精度：float64</pre>
    </section>

    <section class="section">
      <h2>实现方法</h2>
      <p>前向传播计算隐藏激活 H = σ(XW + bₕ)、输出分数 z = Hv + bₒ 和概率 p = σ(z)。损失按 logits 计算，使用稳定形式 mean(max(z, 0) + log1p(exp(−|z|)) − yz)。</p>
      <pre>δₒ = (p − y) / 4
∇v = Hᵀδₒ,  ∇bₒ = Σδₒ
δₕ = (δₒvᵀ) ⊙ H ⊙ (1−H)
∇W = Xᵀδₕ,  ∇bₕ = Σδₕ</pre>
      <p>反向传播计算四组参数的梯度，Adam 对梯度的一阶矩与二阶矩做偏差修正后更新参数。网页手写求导，Python 版本使用 PyTorch autograd 或 TensorFlow GradientTape。</p>
      <p>第一步中，W₁₁ 的梯度为 {initial['grad'][0]:.9f}。Adam 将 W₁₁ 从 2 更新至约 2.030000。可在交互页选择「单步 +1」核对。</p>
    </section>

    <section class="section">
      <h2>默认配置结果</h2>
      <p>第 {base['firstPerfectEpoch']} 轮达到 100% 训练准确率，BCE 为 {base['firstPerfectLoss']:.6f}。分类结果随后保持不变，BCE 继续下降。</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">输入</th><th scope="col">目标</th><th scope="col">初始 P(1)</th><th scope="col">最终 P(1)</th><th scope="col">最终分类</th></tr></thead>
          <tbody>{predictions}</tbody>
        </table>
      </div>
      <figure>
        <img src="downloads/torch-results/torch-learning.png" alt="PyTorch 训练损失曲线和 XOR 最终决策边界" width="1800" height="720">
        <figcaption>PyTorch 训练损失与最终决策边界。圆点为目标 0，菱形为目标 1。</figcaption>
      </figure>
      <h3>参数变化</h3>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">参数</th><th scope="col">初始值</th><th scope="col">第 300 轮</th></tr></thead>
          <tbody>{parameters}</tbody>
        </table>
      </div>
      <p>训练后 h₁ 对 (1,0) 的激活约为 {final['predictions'][2]['hidden'][0]:.6f}，h₂ 对 (0,1) 的激活也达到该值。两个隐藏单元对 (0,0) 与 (1,1) 的激活均低于 0.034。</p>
    </section>

    <section class="section">
      <h2>对照结果</h2>
      <p>各组使用相同的四个样本，整批训练 300 轮。</p>
      <div class="table-scroll">
        <table>
          <thead><tr><th scope="col">配置</th><th scope="col">初始 BCE</th><th scope="col">最终 BCE</th><th scope="col">训练准确率</th></tr></thead>
          <tbody>{experiments}</tbody>
        </table>
      </div>
      <ul>
        <li>在课程初始化下，Adam 学习率 0.3 在 300 轮时的损失最低。同为 0.03 时，Adam 的最终损失低于 SGD。</li>
        <li>种子 42 随机初始化的两隐藏单元模型，在 300 轮内达到 50% 训练准确率。</li>
        <li>零初始化的线性模型梯度为 0，损失保持在 ln 2。XOR 两类样本分布在对角，线性边界无法完全分开。</li>
      </ul>
      <p>实验只使用四个布尔输入，报告中的准确率均为训练准确率。</p>
    </section>

    <section class="section">
      <h2>复现与验证</h2>
      <p>下载任一脚本，在对应 Python 环境中运行。脚本输出预测、参数和训练 CSV，安装 matplotlib 后附带训练图。</p>
      <pre># PyTorch
python -m pip install torch matplotlib
python xor_torch.py --epochs 300 --lr 0.03

# TensorFlow
python -m pip install tensorflow matplotlib
python xor_tensorflow.py --epochs 300 --lr 0.03</pre>
      <p>PyTorch CPU 的最终 BCE 与网页实现相差 {comparison:.2g}。网页梯度的中央有限差分最大绝对误差为 1.18 × 10⁻¹¹。TensorFlow 脚本通过语法检查，运行待验证。</p>
      <ul class="resource-list">
        <li><a href="downloads/xor_torch.py" download>PyTorch 脚本</a></li>
        <li><a href="downloads/xor_tensorflow.py" download>TensorFlow 脚本</a></li>
        <li><a href="downloads/torch-results/torch-history.csv" download>训练记录（CSV）</a></li>
        <li><a href="experiments.json" download>对照结果（JSON）</a></li>
        <li><a href="https://zhumy.github.io/Introduction_to_Artificial_Intelligence/#chapter-15">课程讲义 · 第 15 节</a></li>
      </ul>
    </section>
  </main>
</body>
</html>
'''
(root / 'report.html').write_text(report, encoding='utf-8')
