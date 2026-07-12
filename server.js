const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const PUBLIC_DIR = path.join(ROOT, "prototype");
const KNOWLEDGE_DIR = path.join(ROOT, "knowledge_base");

function loadEnvFile() {
  const envPath = path.join(ROOT, ".env");
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const key = trimmed.slice(0, eqIndex).trim();
    const value = trimmed.slice(eqIndex + 1).trim().replace(/^["']|["']$/g, "");
    if (key && process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnvFile();

const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "一个",
  "以及",
  "如果",
  "用户",
  "简历",
  "岗位",
  "产品",
  "能力",
]);

function tokenize(text) {
  return [
    ...String(text || "")
      .toLowerCase()
      .matchAll(/[a-z0-9]+|[\u4e00-\u9fa5]{2,}/g),
  ]
    .map((match) => match[0])
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function splitKnowledge(content) {
  return content
    .split(/\n(?=##\s+)/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);
}

function loadKnowledgeBase() {
  if (!fs.existsSync(KNOWLEDGE_DIR)) return [];
  return fs
    .readdirSync(KNOWLEDGE_DIR)
    .filter((fileName) => fileName.endsWith(".md"))
    .flatMap((fileName) => {
      const filePath = path.join(KNOWLEDGE_DIR, fileName);
      const content = fs.readFileSync(filePath, "utf8");
      return splitKnowledge(content).map((chunk, index) => ({
        id: `${fileName}#${index + 1}`,
        source: fileName,
        text: chunk,
        tokens: tokenize(chunk),
      }));
    });
}

const KNOWLEDGE_CHUNKS = loadKnowledgeBase();

function retrieveKnowledge(action, input) {
  const query = [
    action,
    input.jobType,
    input.jd,
    input.resume,
    input.selectedExperience,
    JSON.stringify(input.jdAnalysis || {}),
    JSON.stringify(input.diagnosis || {}),
  ].join("\n");
  const queryTokens = new Set(tokenize(query));
  if (!queryTokens.size || !KNOWLEDGE_CHUNKS.length) return [];

  return KNOWLEDGE_CHUNKS.map((chunk) => {
    const overlap = chunk.tokens.filter((token) => queryTokens.has(token)).length;
    const actionBoost =
      (action === "analyze-jd" && /岗位|能力|AI 产品经理|C 端/.test(chunk.text)) ||
      (action === "diagnose" && /能力|表达|证据|真实性/.test(chunk.text)) ||
      (action === "rewrite" && /bullet|表达|过度包装|改写/.test(chunk.text))
        ? 3
        : 0;
    return { ...chunk, score: overlap + actionBoost };
  })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map(({ id, source, text, score }) => ({ id, source, text, score }));
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        req.destroy();
        reject(new Error("Request body is too large."));
      }
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

function resolveStaticPath(urlPath) {
  const requested = decodeURIComponent(urlPath === "/" ? "/index.html" : urlPath);
  const filePath = path.normalize(path.join(PUBLIC_DIR, requested));
  if (!filePath.startsWith(PUBLIC_DIR)) return null;
  return filePath;
}

function buildTaskPrompt(action, input, retrievedKnowledge) {
  const system = `你是 PM Resume Coach，一名面向产品经理实习求职者的 AI 简历优化助手。

你必须遵守：
1. 不得虚构用户没有提供的经历。
2. 不得编造具体数据，例如用户数、转化率、增长率、营收、DAU、GMV。
3. 如果简历缺少数据，只能提示用户补充真实数据。
4. 不得把“参与”“协助”改写成“主导”“负责整体”，除非原文能证明。
5. 输出必须具体、可执行，避免泛泛建议。
6. 只输出合法 JSON，不要输出 Markdown 代码块。
7. 参考知识库只用于能力判断、表达规则和风险边界，不得用知识库替代用户真实经历。`;

  const common = {
    jobType: input.jobType || "产品经理实习",
    jd: input.jd || "",
    resume: input.resume || "",
    selectedExperience: input.selectedExperience || "",
    jdAnalysis: input.jdAnalysis || null,
    diagnosis: input.diagnosis || null,
  };
  const knowledgeContext = retrievedKnowledge.length
    ? retrievedKnowledge.map((item) => `来源：${item.source}\n${item.text}`).join("\n\n---\n\n")
    : "未召回相关知识库片段。请只基于用户输入和通用产品经理简历原则输出。";

  if (action === "analyze-jd") {
    return `${system}

任务：基于目标岗位 JD，拆解产品经理实习岗位的能力要求。

输入：
${JSON.stringify(common, null, 2)}

参考知识库：
${knowledgeContext}

请输出 JSON，结构必须为：
{
  "jobDirection": "AI 产品/用户产品/增长产品/内容产品/平台产品/其他",
  "reason": "岗位方向判断理由",
  "capabilities": [
    {
      "name": "能力名称",
      "priority": "高/中/低",
      "jdEvidence": "来自 JD 的依据",
      "explanation": "能力解释",
      "resumeEvidenceSuggestion": "简历中应体现的证据"
    }
  ],
  "keywords": ["关键词1", "关键词2"],
  "resumeFocus": "后续简历优化最应突出的方向"
}`;
  }

  if (action === "diagnose") {
    return `${system}

任务：基于 JD 能力拆解和用户简历，诊断简历与岗位的匹配程度，并定位弱表达。

输入：
${JSON.stringify(common, null, 2)}

参考知识库：
${knowledgeContext}

请输出 JSON，结构必须为：
{
  "score": 0,
  "level": "高匹配/中匹配/低匹配",
  "summary": "核心诊断结论",
  "matched": [
    {
      "capability": "已体现能力",
      "evidence": "简历原文证据",
      "explanation": "为什么匹配 JD"
    }
  ],
  "missing": [
    {
      "capability": "缺失或薄弱能力",
      "problem": "问题说明",
      "suggestion": "建议补充的真实证据"
    }
  ],
  "issues": [
    {
      "level": "高/中/低",
      "title": "问题标题",
      "original": "简历原句",
      "tags": ["问题类型"],
      "advice": "具体修改方向"
    }
  ]
}`;
  }

  return `${system}

任务：基于目标岗位、JD 拆解、诊断结果和用户选择的项目经历，生成适合产品经理实习简历的改写版本。

输入：
${JSON.stringify(common, null, 2)}

参考知识库：
${knowledgeContext}

请输出 JSON，结构必须为：
{
  "original": "原始表达",
  "bullets": ["优化后的简历 bullet 1", "优化后的简历 bullet 2"],
  "reason": "逐条解释为什么这样改",
  "needUserInput": ["需要用户补充或确认的信息"],
  "risk": "真实性风险提醒"
}`;
}

function extractJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON.");
    return JSON.parse(match[0]);
  }
}

async function callOpenAI(action, input) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    const error = new Error("Missing OPENAI_API_KEY.");
    error.status = 400;
    throw error;
  }

  const retrievedKnowledge = retrieveKnowledge(action, input);
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      input: buildTaskPrompt(action, input, retrievedKnowledge),
      temperature: 0.2,
      max_output_tokens: 1800,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI API error: ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    throw error;
  }

  const text =
    data.output_text ||
    data.output?.flatMap((item) => item.content || []).find((content) => content.type === "output_text")?.text ||
    "";
  return {
    result: extractJson(text),
    knowledge: retrievedKnowledge.map(({ id, source, score }) => ({ id, source, score })),
  };
}

async function handleAgent(req, res) {
  try {
    const body = await readBody(req);
    const payload = JSON.parse(body || "{}");
    const action = payload.action;
    if (!["analyze-jd", "diagnose", "rewrite"].includes(action)) {
      return sendJson(res, 400, { error: "Unsupported action." });
    }
    const { result, knowledge } = await callOpenAI(action, payload.input || {});
    return sendJson(res, 200, { result, model: MODEL, knowledge });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      error: error.message || "Agent request failed.",
    });
  }
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "GET" && url.pathname === "/api/health") {
    return sendJson(res, 200, {
      ok: true,
      hasApiKey: Boolean(process.env.OPENAI_API_KEY),
      model: MODEL,
      knowledgeChunks: KNOWLEDGE_CHUNKS.length,
    });
  }

  if (req.method === "GET" && url.pathname === "/api/knowledge") {
    const query = url.searchParams.get("q") || "";
    return sendJson(res, 200, {
      chunks: retrieveKnowledge("diagnose", { jd: query, resume: query }).map(({ id, source, score, text }) => ({
        id,
        source,
        score,
        preview: text.slice(0, 240),
      })),
    });
  }

  if (req.method === "POST" && url.pathname === "/api/agent") {
    return handleAgent(req, res);
  }

  if (req.method !== "GET") {
    return sendJson(res, 405, { error: "Method not allowed." });
  }

  const filePath = resolveStaticPath(url.pathname);
  if (!filePath) return sendJson(res, 403, { error: "Forbidden." });

  fs.readFile(filePath, (error, content) => {
    if (error) return sendJson(res, 404, { error: "Not found." });
    const ext = path.extname(filePath);
    res.writeHead(200, { "content-type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`PM Resume Coach agent running at http://localhost:${PORT}`);
});
