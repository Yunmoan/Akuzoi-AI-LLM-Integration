// 简单提示词相似度与越狱/套取检测（后端）
// 采用字符n-gram（默认3-gram）Jaccard相似度 + 关键短语匹配作为拦截依据

function normalizeText(text) {
  if (!text) return '';
  // 小写、去除常见标点与多余空白
  return String(text)
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function buildNGrams(text, n = 3) {
  const grams = new Set();
  if (!text) return grams;
  const str = text;
  if (str.length <= n) {
    grams.add(str);
    return grams;
  }
  for (let i = 0; i <= str.length - n; i++) {
    grams.add(str.slice(i, i + n));
  }
  return grams;
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

const KEYWORD_PATTERNS = [
  /(系统\s*提示|提示词|隐藏\s*(规则|指令)|system\s*prompt|developer\s*(prompt|message))/i,
  /(展示|显示|输出|给出|告诉).*?(系统|提示词|system\s*prompt|隐藏\s*(规则|指令))/i,
  /(ignore\s+previous\s+(instructions|rules)|从现在开始.*?不再.*?限制)/i,
  /(jailbreak|DAN\s*mode|越狱)/i,
];

function keywordTriggered(text) {
  return KEYWORD_PATTERNS.some((re) => re.test(text));
}

// 评估：返回 { blocked, score(0-100), reason }
function evaluateSystemPromptSimilarity(systemPrompt, userMessage) {
  const sys = normalizeText(systemPrompt || '');
  const usr = normalizeText(userMessage || '');

  const sysN = buildNGrams(sys, 3);
  const usrN = buildNGrams(usr, 3);
  const sim = jaccardSimilarity(sysN, usrN); // 0..1

  // 关键短语触发
  const kw = keywordTriggered(userMessage || '');

  // 组合得分：相似度40分+关键词最多60分
  const score = Math.min(100, Math.round(sim * 40 + (kw ? 60 : 0)));

  // 简单阈值策略
  const blocked = kw || sim >= 0.35 || (sim >= 0.25 && usr.length < 120);

  let reason = '';
  if (kw) {
    reason = '命中提示词/越狱关键词触发规则';
  } else if (sim >= 0.35) {
    reason = `与系统提示词内容相似度较高(sim=${sim.toFixed(2)})`;
  } else if (sim >= 0.25) {
    reason = `短文本与系统提示词相似度偏高(sim=${sim.toFixed(2)})`;
  }

  return { blocked, score, similarity: sim, reason };
}

module.exports = {
  evaluateSystemPromptSimilarity,
};


