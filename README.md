# MAKO · AI Agent 使用手记

基于 Mako 项目资料整理的中文 AI Agent 使用情况报告，用于公开展示与课程作业。

## 内容

- 工具足迹：开发协作、记忆与推理、语音与感知。
- 实践档案：MakoTalker、MAKO Remote、Folio 与语音实验。
- 三种交互工作流、五条协作心得、资料来源与文字报告下载。

## 发布

此目录是独立静态网站。GitHub Pages 选择 `Deploy from a branch`，分支 `main`，目录 `/ (root)` 即可。`.nojekyll` 使页面按原始静态文件发布。

## 资料与素材

整理日期：2026-10-22。项目事实和性能数据取自既有项目文档，不代表当前在线状态；测量条件在网站内注明。

视觉参考为用户提供的插画。插画及角色相关权利归原权利人；字体许可见 `assets/serif-OFL.txt`。项目示意图由 HTML/CSS 绘制。

结构参考：[Hugo 的 AI Agent 使用报告](https://hugohe8380.github.io/my-ai-agent-report/)。

此仓库只包含网站静态文件，不包含原项目的聊天、配置、密钥、记忆数据库或运行服务。

## 第二次作业：MLP 参数学习与可视化

访问 [MLP 学习实验室](https://pwicdsummer.github.io/mako-agent-report/mlp/)。基于课程第 15 节，复现 2→2→1 Sigmoid 网络、BCE 与 Adam（lr=0.03），300 轮训练 XOR。

- 浏览器内手写前向传播、反向求导与 Adam / SGD；可切换结构、激活函数、学习率和初始化。
- 动态决策边界、损失曲线、权重图、参数梯度、逐轮回看和 CSV / JSON 导出。
- 六组对照实验、完整实验报告、PyTorch / TensorFlow 可运行脚本。
- 数值自检：`node mlp/verify.cjs`；PyTorch 复现：`python mlp/downloads/xor_torch.py`。

准确率均指四个 XOR 训练样本的拟合效果，不包含独立测试集。
