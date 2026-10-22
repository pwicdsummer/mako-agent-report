# MAKO · AI Agent 使用手记

和 AI 一起，把想法养成日常。

作者标识：pwicdsummer。整理日期：2026-10-22。

本报告依据 Mako 文件夹内的项目说明、迁移记录和实验文档编排。它是资料快照，不代表各项服务当前在线状态，也不推算使用次数、费用、Token 或使用时长。四个实践方向是本报告的内容分组。

## 工具足迹

| 工具或组件 | 项目中的分工 | 依据 |
| --- | --- | --- |
| Codex | 开发协作：迁移、兼容修复、校验与维护线索 | Windows → Arch 迁移记录 |
| Letta | 角色、上下文、记忆工具与聊天归档 | MakoTalker README、MAKO-BRIDGE |
| Ollama / Gemma | 本地推理后端 | MakoTalker README、MAKO-BRIDGE |
| DeepSeek | 桌面端可切换的云端推理后端 | MakoTalker README |
| GPT-SoVITS / Fish Audio | 本地合成、云端语音选项与切句实验 | MakoTalker README、TTS 对照说明 |
| FunASR / Qwen2-VL / OCR | 语音、视觉和手写输入的支撑组件 | MakoTalker 与 Folio README |

这些类别区分开发协作工具、Agent 中枢与支撑模型；不把模型数量当成 Agent 数量。Codex 的协作依据不等于全部功能的开发贡献归属。

## 四个实践方向

### 01 · MakoTalker

以茉子为主题的 PyQt5 桌面伴侣，组合了语音对话、视觉感知、长期记忆、气泡对话与角色动画。当前项目文档标明唯一启用的 Letta Agent 为 `mako_chat_agent`。Windows 到 Arch Linux 的迁移记录覆盖平台兼容、依赖重建与关键源文件校验。

功能为项目文档所述，未由本报告重新实机验证声卡、摄像头、CUDA 或桌面环境。

### 02 · MAKO Remote

通过手机网页与无界面大脑服务复用主项目模型、角色记忆和语音权重。包括聊天历史、分段语音、模型与语音服务启停、请求去重和中断恢复。2026-10-12 的组织迁移保留了验证记录。

部分手机触摸、后台恢复、扬声器播放及主屏幕安装体验在文档中仍需要真机确认。

### 03 · Folio · 无界手记

面向电脑与 iPad 的无限画布，把笔记保存在电脑上。粘贴文字直接读取，手写内容由本地 OCR 识别；圈选原文或标注问题后，通过原 MAKO Brain 调用共享 Letta Agent，在旁边以箭头与逐笔书写呈现中文回答。画布桥接不启动 TTS。

真实 Apple Pencil 的压感、防误触与 Safari 体验仍需真机验证，复杂公式识别可能出错。

### 04 · 语音实验室

2026-10-05 的切句实验，在同一段日中双语回复上对照 cut5 与保留完整句、自然段的 cut0。声音权重、参考音频、采样参数、随机种子、语速和片段间隔保持一致。两组 WAV 记录为非静音的 32 kHz、单声道、16-bit PCM。

实验未改生产配置，未写入 Letta 聊天记忆。时长不同不代表自然度更好，仍需试听判断。

## 三条交互工作流

1. 桌面语音：麦克风 / VAD → FunASR / 声纹验证 → Letta 与推理模型 → TTS 与桌面气泡。
2. 手机对话：移动网页 → Brain / 请求账本 → 共享 Agent → 文字与分段语音。
3. 手写画布：圈选与提问 → 本地 OCR / 校对 → 共享 MAKO 回答 → 连接箭头与逐笔书写。

多入口复用同一个角色和记忆；不代表每个入口都支持所有推理后端。

## 一个具体的延迟案例

日期：2026-10-19。来源：`folio-canvas/docs/LATENCY-QA.md`。

| 阶段 | 修改前 | 修改后 |
| --- | ---: | ---: |
| 最后抬笔 → OCR 完成 | 14.428s | 4.280s |
| OCR 完成 → MAKO 回答返回 | 4.355s | 4.168s |
| 回答返回 → 回答正文第一笔 | 1.444s | 1.439s |
| 完整事件 | 20.227s | 9.887s |

这是同一原文与箭头问题的单案例对照，不是平均值、P95 或固定上限。测试在桌面 Chromium 中完成，MAKO 已加载且空闲，reasoning 关闭；不包含真实 iPad、Safari、Wi-Fi 或 VPN 开销。本报告未重新运行该测试。

## 从记录里整理的五条方法

1. **先接成一个小闭环，再慢慢长大。** 把输入、理解、回应和保存串起来，让每一步有可观察的结果。
2. **让记忆连续，也让边界清楚。** 说清楚哪些提问进入共享记忆，哪些只属于临时实验。
3. **一次只改变少数变量。** 固定关键条件后再比较策略，避免用时长代替听感结论。
4. **从用户动作开始，测到真实结果。** 服务返回成功与用户看到答案之间，仍可能有等待。
5. **迁移和迭代，都给数据留一条退路。** 保留不可再生的原始数据，用备份、校验和隔离测试支持迭代。

以上为文档归纳，不是原作者逐字引述。

## 资料索引

- `MakoTalker-linux/README.md`
- `MakoTalker_MIGRATION_WINDOWS_TO_ARCH.md`
- `MakoTalker-linux/Mako_DLC/MakoRemote/README.md`
- `MakoTalker-linux/Mako_DLC/MakoRemote/MakoMobile/README.md`
- `folio-canvas/README.md`
- `folio-canvas/docs/MAKO-BRIDGE.md`
- `folio-canvas/docs/LATENCY-QA.md`
- `experiments/tts-segmentation-20261005/comparison-notes.txt`

结构参考：[Hugo 的 AI Agent 使用报告](https://hugohe8380.github.io/my-ai-agent-report/)。主视觉与配色来源：本次用户提供的插画。网站中项目卡片的窗口、手机与画布为界面示意，不是产品截图。
