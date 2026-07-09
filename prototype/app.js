const sampleJd = `岗位职责：
1. 参与 AI 工具类产品的用户需求分析，整理用户反馈并形成需求文档。
2. 协助设计 Prompt 使用流程、输出效果评测标准和产品优化方案。
3. 跟进产品功能迭代，和设计、研发、运营同学协作推进落地。

任职要求：
1. 对 AI 产品和大模型应用有兴趣，使用过 ChatGPT、Kimi、豆包等工具。
2. 具备用户研究、竞品分析、需求分析和原型设计能力。
3. 表达清晰，逻辑能力强，有产品项目或校园项目经验优先。`;

const sampleResume = `校园二手交易平台项目
- 参与校园二手交易平台项目，负责用户调研和需求整理，协助完成原型设计。
- 整理竞品资料，分析闲鱼、小红书等平台的交易流程。
- 参与项目展示，收集同学反馈并进行修改。

AI 求职助手课程项目
- 使用 AI 工具体验简历优化和面试问答功能，整理产品体验问题。
- 参与小组讨论，输出功能流程图和页面草图。`;

const state = {
  step: 0,
  jobType: "AI 产品",
};

const titles = [
  "输入目标岗位 JD",
  "查看 JD 能力拆解",
  "输入简历内容",
  "查看匹配诊断",
  "生成经历改写",
];

const capabilities = [
  {
    name: "AI 场景理解",
    priority: "高",
    text: "能判断 AI 工具适合解决什么用户问题，并把能力放入具体使用流程。",
  },
  {
    name: "Prompt 与评测",
    priority: "高",
    text: "能设计提示词、比较输出质量，并用标准判断 AI 结果是否可用。",
  },
  {
    name: "需求分析",
    priority: "高",
    text: "能从用户反馈中提炼需求，判断优先级，并形成可落地的产品方案。",
  },
  {
    name: "原型设计",
    priority: "中",
    text: "能把需求转化为清晰页面和流程，表达关键交互与信息结构。",
  },
  {
    name: "协作推进",
    priority: "中",
    text: "能和设计、研发、运营协作，跟进功能迭代和问题反馈。",
  },
  {
    name: "竞品分析",
    priority: "中",
    text: "能分析同类 AI 工具的流程、体验和差异化机会。",
  },
];

const keywords = ["用户研究", "需求分析", "Prompt", "效果评测", "原型设计", "竞品分析", "协作推进", "AI 工具体验"];

const matched = ["用户调研：简历中提到用户调研和反馈收集", "竞品分析：分析过闲鱼、小红书等交易流程", "原型设计：参与二手交易平台原型设计"];
const missing = ["Prompt 设计：缺少具体 Prompt 方案或测试过程", "AI 效果评测：缺少评价 AI 输出质量的指标", "数据结果：缺少调研人数、反馈数量或优化效果"];

const issues = [
  {
    level: "high",
    title: "表达偏执行，个人贡献不清晰",
    original: "参与校园二手交易平台项目，负责用户调研和需求整理，协助完成原型设计。",
    tags: ["弱动词", "缺少结果"],
    advice: "补充调研对象、需求分类、原型页面和个人负责范围。",
  },
  {
    level: "",
    title: "AI 产品能力体现不足",
    original: "使用 AI 工具体验简历优化和面试问答功能，整理产品体验问题。",
    tags: ["岗位相关性弱", "缺少评测"],
    advice: "补充 Prompt 测试、输出质量对比或评测维度。",
  },
  {
    level: "",
    title: "竞品分析缺少结论",
    original: "整理竞品资料，分析闲鱼、小红书等平台的交易流程。",
    tags: ["缺少结论"],
    advice: "说明你从竞品中发现了什么问题，以及如何影响后续方案。",
  },
];

const rewrittenBullets = [
  "围绕校园二手交易场景，访谈多名学生用户并归纳交易信任、商品筛选、沟通效率等核心需求，输出需求优先级和核心交易流程。",
  "协助设计发布商品、搜索筛选、站内沟通等关键页面原型，并根据用户反馈优化信息展示和操作路径。",
  "对比闲鱼、小红书等平台交易流程，提炼校园场景下的低信任成本和高效率沟通机会，为功能设计提供依据。",
];

function qs(selector) {
  return document.querySelector(selector);
}

function qsa(selector) {
  return [...document.querySelectorAll(selector)];
}

function setStep(nextStep) {
  state.step = Math.max(0, Math.min(4, nextStep));
  qsa(".screen").forEach((screen) => screen.classList.toggle("is-active", Number(screen.dataset.screen) === state.step));
  qsa(".step").forEach((step) => step.classList.toggle("is-active", Number(step.dataset.step) === state.step));
  qs("#screenTitle").textContent = titles[state.step];
}

function updateCount(inputId, countId) {
  const input = qs(inputId);
  qs(countId).textContent = `${input.value.trim().length} 字`;
}

function renderCapabilities() {
  qs("#jobDirection").textContent = state.jobType;
  qs("#capabilityGrid").innerHTML = capabilities
    .map(
      (item) => `
        <article class="capability-card">
          <h4>${item.name}</h4>
          <p>${item.text}</p>
          <span class="tag">优先级：${item.priority}</span>
        </article>
      `,
    )
    .join("");
  qs("#keywordRow").innerHTML = keywords.map((keyword) => `<span class="keyword">${keyword}</span>`).join("");
}

function renderDiagnosis() {
  qs("#matchedList").innerHTML = matched.map((item) => `<li>${item}</li>`).join("");
  qs("#missingList").innerHTML = missing.map((item) => `<li>${item}</li>`).join("");
  qs("#issueList").innerHTML = issues
    .map(
      (issue) => `
        <article class="issue ${issue.level}">
          <h4>${issue.title}</h4>
          <p><strong>原句：</strong>${issue.original}</p>
          <p>${issue.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</p>
          <p><strong>修改方向：</strong>${issue.advice}</p>
        </article>
      `,
    )
    .join("");
}

function renderRewrite() {
  qs("#originalText").textContent = issues[0].original;
  qs("#rewriteList").innerHTML = rewrittenBullets.map((item) => `<li>${item}</li>`).join("");
  qs("#rewriteReason").textContent =
    "优化版本补充了目标场景、用户调研、需求归纳、页面原型和竞品结论，比原句更能体现用户研究、需求分析、原型设计和竞品分析能力。";
  qs("#riskNote").textContent =
    "请确认调研人数、需求分类和页面范围是否真实。如果没有准确数量，应使用真实数据或保守表达，不能编造增长结果。";
}

function init() {
  qs("#jdInput").value = sampleJd;
  qs("#resumeInput").value = sampleResume;
  updateCount("#jdInput", "#jdCount");
  updateCount("#resumeInput", "#resumeCount");
  renderCapabilities();
  renderDiagnosis();
  renderRewrite();

  qsa(".step").forEach((button) => button.addEventListener("click", () => setStep(Number(button.dataset.step))));
  qsa("[data-next]").forEach((button) => button.addEventListener("click", () => setStep(state.step + 1)));
  qsa("[data-prev]").forEach((button) => button.addEventListener("click", () => setStep(state.step - 1)));

  qsa(".segment").forEach((button) => {
    button.addEventListener("click", () => {
      qsa(".segment").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      state.jobType = button.dataset.job;
      renderCapabilities();
    });
  });

  qs("#jdInput").addEventListener("input", () => updateCount("#jdInput", "#jdCount"));
  qs("#resumeInput").addEventListener("input", () => updateCount("#resumeInput", "#resumeCount"));
  qs("#fillJdBtn").addEventListener("click", () => {
    qs("#jdInput").value = sampleJd;
    updateCount("#jdInput", "#jdCount");
  });
  qs("#fillResumeBtn").addEventListener("click", () => {
    qs("#resumeInput").value = sampleResume;
    updateCount("#resumeInput", "#resumeCount");
  });
  qs("#analyzeJdBtn").addEventListener("click", () => setStep(1));
  qs("#diagnoseBtn").addEventListener("click", () => setStep(3));
  qs("#resetBtn").addEventListener("click", () => setStep(0));
  qs("#copyBtn").addEventListener("click", async () => {
    const text = rewrittenBullets.map((item) => `- ${item}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = text;
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }
    qs("#toast").classList.add("is-visible");
    window.setTimeout(() => qs("#toast").classList.remove("is-visible"), 1800);
  });
}

init();
