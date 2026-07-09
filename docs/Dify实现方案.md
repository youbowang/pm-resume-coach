# Dify 实现方案

## 1. 实现状态

PM Resume Coach 已在 Dify Cloud 中搭建为一个可运行的 Workflow App。

运行链接：

- [PM Resume Coach Dify Workflow](https://udify.app/workflow/OrSatus7QA7mEynb)

Dify 编辑页：

- <https://cloud.dify.ai/app/797a77b9-cf47-43a1-a320-f9e634cd6ad9/workflow>

## 2. 为什么使用 Dify

本项目的目标是展示 AI 产品经理能力，而不是重点展示后端工程能力。使用 Dify 可以更快完成真实 AI Agent 的搭建，并突出以下能力：

- 将产品流程拆成 AI 工作流
- 设计输入字段和输出结构
- 将 Prompt 产品化
- 配置可运行的模型节点
- 快速验证用户输入到 AI 输出的闭环

## 3. App 类型选择

本项目选择 Dify 的 **Workflow App**。

原因：

- 当前产品是单轮任务型流程
- 用户输入 JD 和简历后，希望一次性获得完整诊断报告
- Workflow 更适合结构化输入、固定步骤和稳定输出
- 第一版不需要多轮记忆能力

## 4. 工作流结构

当前 Workflow 采用 MVP 结构：

```text
User Input
  ↓
Generate Resume Report
  ↓
Output Resume Report
```

### 4.1 User Input

输入字段：

| 变量名 | 类型 | 说明 |
| --- | --- | --- |
| `job_type` | Select | 岗位类型 |
| `job_description` | Paragraph | 目标岗位 JD |
| `resume_text` | Paragraph | 用户简历内容 |
| `target_experience` | Paragraph | 用户希望重点优化的经历 |

### 4.2 Generate Resume Report

节点类型：LLM

模型：

```text
gpt-4.1-mini-2025-04-14
```

Temperature：

```text
0.2
```

选择低温度的原因：

- 简历诊断需要稳定性
- 不能过度发挥
- 需要降低虚构和夸大风险

### 4.3 Output Resume Report

输出字段：

| 变量名 | 来源 |
| --- | --- |
| `resume_report` | LLM 节点的 `text` 输出 |

## 5. 输出结构

Dify Workflow 最终输出一份 Markdown 报告，包含：

1. 岗位能力拆解
2. 简历匹配度诊断
3. 已体现能力
4. 缺失或薄弱能力
5. 简历弱表达定位
6. 项目经历改写
7. 改写理由
8. 需要用户补充的信息
9. 真实性风险提醒
10. 下一步修改建议

## 6. 关键 Prompt 约束

Prompt 中设置了以下约束：

- 不得虚构用户没有提供的经历
- 不得编造具体数据
- 缺少数据时只能提示用户补充真实数据
- 不得把“参与/协助”无依据改成“主导/负责整体”
- 输出必须具体、可执行
- 每条改写必须解释理由
- 对可能过度包装的内容必须提示风险

## 7. 后续迭代方向

当前 Dify 版本是 MVP。后续可以迭代为多节点工作流：

```text
User Input
  ↓
JD 能力拆解
  ↓
简历匹配诊断
  ↓
弱表达定位
  ↓
项目经历改写
  ↓
风险提醒与总结
  ↓
Output
```

这样可以让每个节点的输出更可控，也更适合做逐节点评测。

## 8. 面试讲述方式

可以这样介绍：

> 我先完成了 PM Resume Coach 的用户研究、竞品分析、PRD、Prompt 设计和 AI 效果评测。随后我用 Dify 搭建了一个 Workflow App，把用户输入、LLM 诊断和结构化输出串成完整闭环。这个版本可以真实输入目标 JD 和简历，输出岗位能力拆解、匹配诊断、弱表达定位、项目经历改写和真实性风险提醒。

