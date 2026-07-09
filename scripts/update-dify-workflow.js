async (page) => {
  const appId = "797a77b9-cf47-43a1-a320-f9e634cd6ad9";
  const prompt = `你是 PM Resume Coach，一名面向产品经理实习求职者的 AI 简历优化助手。

你的任务：基于用户输入的岗位类型、目标 JD、简历内容和重点优化经历，输出一份完整的产品经理实习简历优化报告。

严格规则：
1. 不得虚构用户没有提供的经历。
2. 不得编造具体数据，例如用户数、转化率、增长率、营收、DAU、GMV。
3. 如果缺少数据，只能提示用户补充真实数据。
4. 不得把“参与”“协助”无依据改成“主导”“负责整体”。
5. 输出必须具体、可执行，避免泛泛建议。
6. 每条改写都要解释理由。
7. 对可能过度包装或证据不足的表达，必须给出风险提醒。

用户输入：
岗位类型：{{#1783606417170.job_type#}}
目标 JD：{{#1783606417170.job_description#}}
简历内容：{{#1783606417170.resume_text#}}
重点优化经历：{{#1783606417170.target_experience#}}

请按以下 Markdown 结构输出：

## 1. 岗位能力拆解
- 岗位方向判断：
- 判断依据：
- 核心能力要求：列出 3-6 项，每项包含 JD 依据、能力解释、简历中应体现的证据。

## 2. 简历匹配度诊断
- 综合匹配度：0-100 分
- 匹配结论：高匹配 / 中匹配 / 低匹配
- 核心理由：

## 3. 已体现能力
列出简历中已经体现的能力，每项必须引用简历原文证据。

## 4. 缺失或薄弱能力
列出 JD 要求但简历体现不足的能力，并说明建议补充的真实证据。

## 5. 简历弱表达定位
列出 3-6 个问题：
- 原句：
- 问题类型：
- 为什么弱：
- 对应 JD 能力：
- 修改方向：

## 6. 项目经历改写
请输出 1-3 条适合放入简历的 bullet。只能基于用户已有信息改写。

## 7. 改写理由
逐条解释为什么这样改，以及比原表达强在哪里。

## 8. 需要用户补充的信息
列出如果补充后能显著提高简历质量的真实信息，例如调研人数、问卷数量、原型测试人数、结果反馈等。

## 9. 真实性风险提醒
指出哪些表述需要用户确认真实性，哪些地方不能编造。

## 10. 下一步修改建议
给出 3 条最优先的简历修改行动。`;

  return page.evaluate(
    async ({ appId, prompt }) => {
      const token =
        document.cookie.match(/csrf_token=([^;]+)/)?.[1] ||
        document.cookie.match(/__Host-csrf_token=([^;]+)/)?.[1];
      const headers = { "content-type": "application/json" };
      if (token) headers["x-csrf-token"] = decodeURIComponent(token);

      const base = `/console/api/apps/${appId}/workflows/draft`;
      const draft = await (await fetch(base, { headers })).json();

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
          {
            id: "llm_resume_report",
            type: "custom",
            data: {
              model: {
                provider: "langgenius/openai/openai",
                name: "gpt-4.1-mini-2025-04-14",
                mode: "chat",
                completion_params: { temperature: 0.2 },
              },
              prompt_template: [{ role: "system", text: prompt }],
              context: { enabled: false, variable_selector: [] },
              vision: { enabled: false },
              type: "llm",
              title: "Generate Resume Report",
              selected: false,
            },
            position: { x: 420, y: 282 },
            targetPosition: "left",
            sourcePosition: "right",
            positionAbsolute: { x: 420, y: 282 },
            width: 242,
            height: 110,
          },
          {
            id: "end_report",
            type: "custom",
            data: {
              outputs: [{ variable: "resume_report", value_selector: ["llm_resume_report", "text"] }],
              type: "end",
              title: "Output Resume Report",
              selected: true,
            },
            position: { x: 760, y: 282 },
            targetPosition: "left",
            sourcePosition: "right",
            positionAbsolute: { x: 760, y: 282 },
            width: 242,
            height: 90,
          },
        ],
        edges: [
          {
            id: "1783606417170-source-llm_resume_report-target",
            type: "custom",
            source: "1783606417170",
            sourceHandle: "source",
            target: "llm_resume_report",
            targetHandle: "target",
            data: { sourceType: "start", targetType: "llm", isInIteration: false, isInLoop: false },
            zIndex: 0,
          },
          {
            id: "llm_resume_report-source-end_report-target",
            type: "custom",
            source: "llm_resume_report",
            sourceHandle: "source",
            target: "end_report",
            targetHandle: "target",
            data: { sourceType: "llm", targetType: "end", isInIteration: false, isInLoop: false },
            zIndex: 0,
          },
        ],
        viewport: { x: 0, y: 0, zoom: 0.85 },
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
    { appId, prompt },
  );
}
