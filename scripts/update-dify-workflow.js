async (page) => {
  const appId = "797a77b9-cf47-43a1-a320-f9e634cd6ad9";
  const model = {
    provider: "langgenius/openai/openai",
    name: "gpt-4.1-mini-2025-04-14",
    mode: "chat",
    completion_params: { temperature: 0.2 },
  };

  const prompts = {
    jd: `你是产品经理实习求职辅导专家。请基于用户输入的岗位类型和目标 JD，拆解岗位能力要求。

输入：
岗位类型：{{#1783606417170.job_type#}}
目标 JD：{{#1783606417170.job_description#}}

要求：
1. 只基于 JD 内容分析，不要引入无关要求。
2. 如果 JD 信息不足，请明确说明不确定。
3. 输出要面向产品经理实习求职者，语言清晰具体。

请按 Markdown 输出：
## 岗位方向判断
## JD 依据
## 核心能力要求
列出 3-6 项，每项包含：能力名称、JD 依据、能力解释、简历中应体现的证据、优先级。
## 简历关键词
输出 8-12 个关键词。
## 简历优化重点`,

    diagnosis: `你是产品经理实习简历诊断专家。请基于 JD 能力拆解和用户简历，判断简历与岗位的匹配度。

JD 能力拆解：
{{#jd_analysis.text#}}

用户简历：
{{#1783606417170.resume_text#}}

要求：
1. 只基于简历已有内容判断，不要猜测用户做过什么。
2. 每个判断都要引用简历原文证据。
3. 不要改写简历，本步骤只做诊断。

请按 Markdown 输出：
## 综合匹配度
- 分数：0-100
- 结论：高匹配 / 中匹配 / 低匹配
- 核心理由：
## 已体现能力
每项包含：能力、简历证据、与 JD 的匹配说明。
## 缺失或薄弱能力
每项包含：能力、问题说明、建议补充的真实证据。
## 修改优先级
列出最应该先改的 3 个问题。`,

    weak: `你是产品经理简历表达诊断专家。请找出简历中最需要优化的弱表达。

JD 能力拆解：
{{#jd_analysis.text#}}

简历匹配诊断：
{{#match_diagnosis.text#}}

用户简历：
{{#1783606417170.resume_text#}}

重点识别：
1. 只有执行动作，没有目标、方法或结果。
2. 使用“参与”“协助”“整理”等弱动词，但没有说明个人贡献。
3. 缺少用户视角、需求分析、产品方案或数据结果。
4. 与目标 JD 的关键能力关联较弱。

请按 Markdown 输出 3-6 条：
## 弱表达列表
### 问题 N
- 原句：
- 问题类型：
- 为什么弱：
- 对应 JD 能力：
- 修改方向：
- 优先级：高 / 中 / 低`,

    rewrite: `你是产品经理实习简历改写专家。请基于 JD 拆解、匹配诊断、弱表达定位和用户重点优化经历，生成可放入简历的项目经历表达。

JD 能力拆解：
{{#jd_analysis.text#}}

匹配诊断：
{{#match_diagnosis.text#}}

弱表达定位：
{{#weak_expression.text#}}

重点优化经历：
{{#1783606417170.target_experience#}}

如果重点优化经历为空，请从用户简历中选择最需要优化的一段：
{{#1783606417170.resume_text#}}

严格规则：
1. 不得虚构项目、职责、数据、用户数量、增长结果或业务结果。
2. 不得把“参与”“协助”直接改成“主导”，除非原文能证明。
3. 如果缺少数据，只能提示用户补充真实数据。
4. 改写应突出产品经理能力：用户研究、需求分析、竞品分析、原型设计、数据分析、项目推进、AI 工具理解、Prompt 设计或效果评测。
5. 简历 bullet 建议 1-3 条。

请按 Markdown 输出：
## 原始表达
## 优化版本
- bullet 1
- bullet 2
- bullet 3
## 改写理由
## 需要用户补充的信息`,

    risk: `你是 AI 简历优化结果审核专家。请整合前面所有节点输出，生成最终报告，并重点检查真实性风险。

JD 能力拆解：
{{#jd_analysis.text#}}

简历匹配诊断：
{{#match_diagnosis.text#}}

弱表达定位：
{{#weak_expression.text#}}

项目经历改写：
{{#experience_rewrite.text#}}

请输出完整 Markdown 报告：
## 1. 岗位能力拆解
## 2. 简历匹配度诊断
## 3. 已体现能力
## 4. 缺失或薄弱能力
## 5. 简历弱表达定位
## 6. 项目经历改写
## 7. 改写理由
## 8. 需要用户补充的信息
## 9. 真实性风险提醒
明确指出哪些数据、职责、结果需要用户确认，哪些内容不能编造。
## 10. 下一步修改建议
给出 3 条最优先行动。`,
  };

  return page.evaluate(
    async ({ appId, prompts, model }) => {
      const token =
        document.cookie.match(/csrf_token=([^;]+)/)?.[1] ||
        document.cookie.match(/__Host-csrf_token=([^;]+)/)?.[1];
      const headers = { "content-type": "application/json" };
      if (token) headers["x-csrf-token"] = decodeURIComponent(token);

      const base = `/console/api/apps/${appId}/workflows/draft`;
      const draft = await (await fetch(base, { headers })).json();

      const makeLlm = (id, title, x, prompt) => ({
        id,
        type: "custom",
        data: {
          model,
          prompt_template: [{ role: "system", text: prompt }],
          context: { enabled: false, variable_selector: [] },
          vision: { enabled: false },
          type: "llm",
          title,
          selected: false,
        },
        position: { x, y: 282 },
        targetPosition: "left",
        sourcePosition: "right",
        positionAbsolute: { x, y: 282 },
        width: 242,
        height: 110,
      });

      const makeEdge = (source, target, sourceType, targetType) => ({
        id: `${source}-source-${target}-target`,
        type: "custom",
        source,
        sourceHandle: "source",
        target,
        targetHandle: "target",
        data: { sourceType, targetType, isInIteration: false, isInLoop: false },
        zIndex: 0,
      });

      const graph = {
        nodes: [
          {
            id: "1783606417170",
            type: "custom",
            data: {
              variables: [
                {
                  variable: "job_type",
                  label: "Job Type",
                  type: "select",
                  required: true,
                  options: ["AI Product", "User Product", "Growth Product", "Content Product", "Platform Product", "Not Sure"],
                },
                { variable: "job_description", label: "Target JD", type: "paragraph", required: true, max_length: 8000 },
                { variable: "resume_text", label: "Resume Text", type: "paragraph", required: true, max_length: 12000 },
                { variable: "target_experience", label: "Target Experience", type: "paragraph", required: false, max_length: 4000 },
              ],
              type: "start",
              title: "User Input",
              selected: false,
            },
            position: { x: 80, y: 282 },
            targetPosition: "left",
            sourcePosition: "right",
            positionAbsolute: { x: 80, y: 282 },
            width: 242,
            height: 260,
          },
          makeLlm("jd_analysis", "JD Ability Analysis", 390, prompts.jd),
          makeLlm("match_diagnosis", "Resume Match Diagnosis", 700, prompts.diagnosis),
          makeLlm("weak_expression", "Weak Expression Check", 1010, prompts.weak),
          makeLlm("experience_rewrite", "Experience Rewrite", 1320, prompts.rewrite),
          makeLlm("risk_summary", "Risk Review & Final Report", 1630, prompts.risk),
          {
            id: "end_report",
            type: "custom",
            data: {
              outputs: [{ variable: "resume_report", value_selector: ["risk_summary", "text"] }],
              type: "end",
              title: "Output Resume Report",
              selected: true,
            },
            position: { x: 1940, y: 282 },
            targetPosition: "left",
            sourcePosition: "right",
            positionAbsolute: { x: 1940, y: 282 },
            width: 242,
            height: 90,
          },
        ],
        edges: [
          makeEdge("1783606417170", "jd_analysis", "start", "llm"),
          makeEdge("jd_analysis", "match_diagnosis", "llm", "llm"),
          makeEdge("match_diagnosis", "weak_expression", "llm", "llm"),
          makeEdge("weak_expression", "experience_rewrite", "llm", "llm"),
          makeEdge("experience_rewrite", "risk_summary", "llm", "llm"),
          makeEdge("risk_summary", "end_report", "llm", "end"),
        ],
        viewport: { x: 0, y: 0, zoom: 0.55 },
      };

      const response = await fetch(base, {
        method: "POST",
        headers,
        body: JSON.stringify({
          graph,
          features: draft.features,
          environment_variables: draft.environment_variables || [],
          conversation_variables: draft.conversation_variables || [],
          rag_pipeline_variables: draft.rag_pipeline_variables || [],
          hash: draft.hash,
        }),
      });

      return { status: response.status, text: await response.text() };
    },
    { appId, prompts, model },
  );
}
