# RAG 知识库方案

## 1. 为什么要补充 RAG

PM Resume Coach 的核心任务是帮助产品经理实习求职者把经历表达成岗位需要的能力证明。仅靠大模型通用能力，容易出现两个问题：

- 输出偏泛，像普通简历润色工具
- 对产品经理能力、AI 产品能力和真实性风险的判断不够稳定

因此，本项目补充轻量 RAG 知识库，用稳定语料约束 AI 的判断标准。

## 2. 知识库内容

当前知识库位于 `knowledge_base/`，包含：

| 文件 | 用途 |
| --- | --- |
| `pm_ability_model.md` | 产品经理实习能力模型 |
| `resume_expression_rules.md` | 简历表达规则与真实性边界 |
| `ai_product_rag_prompt_eval.md` | Prompt、RAG 和 AI 效果评测知识 |
| `ai_pm_job_mapping.md` | AI 产品、C 端、增长、内容等岗位能力映射 |

## 3. 本地 Agent 接入方式

本地 Node Agent 会在调用模型前：

1. 读取 `knowledge_base/` 下的 Markdown 文件
2. 按用户输入、JD、简历和当前任务做关键词检索
3. 选出最相关的知识片段
4. 将片段作为“参考知识库”注入 Prompt
5. 要求模型优先基于用户真实输入输出，知识库只用于判断标准和表达规则

数据流：

```text
用户输入 JD / 简历
  ↓
本地关键词检索
  ↓
召回产品能力模型、表达规则、AI 评测标准
  ↓
Prompt 注入参考知识库
  ↓
OpenAI Responses API
  ↓
结构化 JSON 输出
```

## 4. Dify 中如何接入

如果在 Dify 中继续升级，可以创建一个 Knowledge Base，并上传 `knowledge_base/` 下的 Markdown 文件。

建议接入节点：

- `JD Ability Analysis`：召回岗位能力模型和岗位映射
- `Resume Match Diagnosis`：召回能力模型和简历表达规则
- `Weak Expression Check`：召回简历表达规则
- `Experience Rewrite`：召回简历表达规则和 AI 产品能力词典
- `Risk Review & Final Report`：召回真实性风险规则和 AI 效果评测标准

推荐检索策略：

- Top K：3-5
- Score threshold：中等偏高，避免召回无关内容
- 知识库只作为判断标准，不替代用户简历事实

## 5. 关键产品判断

RAG 在这个项目里不是为了堆技术，而是解决三个产品问题：

- 稳定性：让不同输入下的能力判断标准一致
- 专业性：让输出更贴近 AI 产品经理和产品经理实习岗位
- 安全性：减少大模型虚构经历、编造数据和过度包装

## 6. 面试讲述方式

可以这样讲：

> 我没有把 RAG 当成炫技功能，而是先判断它是否解决真实问题。PM Resume Coach 需要稳定判断产品经理能力、AI 产品能力和简历真实性风险，所以我把能力模型、简历表达规则、Prompt 评测标准沉淀成知识库。Agent 在生成前会检索相关知识片段，把它们作为判断标准注入 Prompt，从而减少泛化建议和幻觉风险。

