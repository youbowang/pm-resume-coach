# Agent 实现说明

## 1. 当前实现状态

PM Resume Coach 已从静态交互原型升级为本地可运行的 AI Agent 原型。

当前 Agent 支持 3 个真实 AI 任务：

1. JD 能力拆解
2. 简历匹配诊断
3. 项目经历改写

前端页面仍位于 `prototype/index.html`，但需要通过本地 Node 服务打开，才能调用真实 Agent。

## 2. 技术方案

当前版本采用轻量本地实现：

```text
浏览器前端
  ↓
/api/agent
  ↓
Node.js 本地服务
  ↓
OpenAI Responses API
  ↓
结构化 JSON 返回前端展示
```

## 3. 文件说明

| 文件 | 说明 |
| --- | --- |
| `server.js` | 本地 Agent 服务，负责静态文件托管和 OpenAI API 调用 |
| `package.json` | 启动脚本和基础项目信息 |
| `.env.example` | 环境变量示例，不包含真实密钥 |
| `prototype/index.html` | Agent 前端页面 |
| `prototype/app.js` | 前端交互和 API 调用逻辑 |
| `prototype/styles.css` | 原型样式 |

## 4. 启动方式

### 第一步：准备 API Key

在项目根目录创建 `.env` 文件，内容参考：

```text
OPENAI_API_KEY=你的 OpenAI API Key
OPENAI_MODEL=gpt-4.1-mini
```

不要把 `.env` 提交到 GitHub。当前 `.gitignore` 已忽略 `.env` 文件。

### 第二步：启动本地服务

在项目根目录运行：

```bash
npm start
```

启动后打开：

```text
http://localhost:3000
```

### 第三步：体验 Agent

在页面中依次完成：

1. 输入或填入示例 JD
2. 点击“分析 JD”
3. 输入或填入示例简历
4. 点击“开始诊断”
5. 点击“选择经历改写”

如果没有配置 `OPENAI_API_KEY`，页面会提示 Agent 调用失败。

## 5. Agent 动作设计

### 5.1 `analyze-jd`

输入：

- 岗位类型
- 目标 JD

输出：

- 岗位方向判断
- 核心能力要求
- JD 依据
- 简历关键词
- 后续简历优化重点

### 5.2 `diagnose`

输入：

- 岗位类型
- JD
- JD 能力拆解结果
- 简历内容

输出：

- 综合匹配度
- 已体现能力
- 缺失能力
- 弱表达列表
- 修改建议

### 5.3 `rewrite`

输入：

- 岗位类型
- JD 能力拆解结果
- 简历诊断结果
- 用户选择的项目经历

输出：

- 原始表达
- 优化后的简历 bullet
- 改写理由
- 需要用户补充的信息
- 真实性风险提醒

## 6. 安全边界

Agent Prompt 中包含以下约束：

- 不得虚构经历
- 不得编造具体数据
- 不得把“参与/协助”无依据改成“主导/负责整体”
- 缺少信息时必须提示用户补充真实数据
- 输出必须为结构化 JSON

## 7. 当前版本限制

当前 Agent 是 MVP 原型，仍有以下限制：

- 没有用户登录
- 没有数据库
- 不保存历史分析记录
- 没有文件上传，只支持文本粘贴
- 没有流式输出
- 没有自动化评测脚本

这些限制是有意保留的，因为当前阶段重点是验证核心 AI 产品流程。

## 8. 后续可迭代方向

- 增加流式输出，提升等待体验
- 增加 JSON Schema 校验，提升结构稳定性
- 增加测试样例和自动化 AI 评测脚本
- 支持简历 PDF / Word 上传
- 支持多岗位简历版本对比
- 增加面试追问生成 Agent

