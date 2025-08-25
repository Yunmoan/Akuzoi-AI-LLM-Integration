// 轻量级提示词泄露/越狱检测
// 目标：在前端尽早识别明显的 prompt 套取与越狱尝试，并给出可解释的阻断理由

export type PromptGuardCategory =
  | 'prompt_leakage'
  | 'system_query'
  | 'jailbreak'
  | 'policy_probe';

export interface PromptGuardResult {
  isBlocked: boolean;
  score: number; // 0-100 简单风险评分
  matches: string[]; // 命中的规则摘要
  category: PromptGuardCategory | 'mixed';
}

interface Rule {
  id: string;
  description: string;
  category: PromptGuardCategory;
  pattern: RegExp;
  score: number; // 每条规则贡献的风险分
}

// 多语言规则集合（中英混合），尽量覆盖显性套取与越狱语句
const RULES: Rule[] = [
  // Prompt 泄露/系统提示套取
  {
    id: 'cn_reveal_system_prompt',
    description: '要求展示/输出系统提示词',
    category: 'prompt_leakage',
    pattern: /(展示|显示|输出|给出|告诉).*?(系统提示|提示词|隐藏指令|system\s*prompt|开发者消息|规则)/i,
    score: 45,
  },
  {
    id: 'en_reveal_system_prompt',
    description: 'ask to reveal system prompt',
    category: 'prompt_leakage',
    pattern: /(show|reveal|print|expose).*?(system\s*prompt|hidden\s*(rules|instructions)|developer\s*(message|prompt))/i,
    score: 50,
  },
  {
    id: 'cn_list_rules',
    description: '要求列出隐藏规则/指令',
    category: 'prompt_leakage',
    pattern: /(列出|罗列|完整).*?(隐藏|内部).*(规则|指令|设定)/i,
    score: 35,
  },

  // 系统/策略探测
  {
    id: 'cn_policy_probe',
    description: '探测内部策略/安全机制',
    category: 'policy_probe',
    pattern: /(你的(政策|策略|安全机制)|如何(过滤|审查)|越过(安全|限制))/i,
    score: 25,
  },
  {
    id: 'en_policy_probe',
    description: 'ask about internal policy/filter',
    category: 'policy_probe',
    pattern: /(what.*?(are|is).*?(policies|filters|moderation)|how.*?(to\s*bypass|to\s*override).*?(filter|policy))/i,
    score: 25,
  },

  // 越狱/忽略指令
  {
    id: 'cn_ignore_previous',
    description: '忽略以上/之前指令的越狱尝试',
    category: 'jailbreak',
    pattern: /(忽略(以上|之前|此前).*(指令|规则)|从现在开始你不再受.*?(限制|约束))/i,
    score: 40,
  },
  {
    id: 'en_ignore_previous',
    description: 'ignore previous instructions jailbreak',
    category: 'jailbreak',
    pattern: /(ignore\s+(all\s+)?previous\s+(instructions|rules)|from\s+now\s+on\s+you\s+are\s+not\s+bound\s+by)/i,
    score: 40,
  },
  {
    id: 'en_dan_mode',
    description: 'DAN / 角色越狱',
    category: 'jailbreak',
    pattern: /(DAN\s*mode|jailbreak\s*mode|pretend\s+to\s+be\s+without\s+restrictions)/i,
    score: 35,
  },
  {
    id: 'cn_roleplay_unrestricted',
    description: '伪装为不受限制的角色',
    category: 'jailbreak',
    pattern: /(扮演|假装).*(没有|不再).*(限制|约束)/i,
    score: 30,
  },
];

const BLOCK_THRESHOLD = 50; // 达到或超过即阻断发送

export function evaluatePromptLeakage(text: string): PromptGuardResult {
  const normalized = (text || '').trim();
  if (!normalized) {
    return { isBlocked: false, score: 0, matches: [], category: 'policy_probe' };
  }

  let totalScore = 0;
  const matched: string[] = [];
  const matchedCategories = new Set<PromptGuardCategory>();

  for (const rule of RULES) {
    if (rule.pattern.test(normalized)) {
      totalScore += rule.score;
      matched.push(rule.description);
      matchedCategories.add(rule.category);
    }
  }

  // 限制最大分数
  totalScore = Math.min(100, totalScore);

  let category: PromptGuardResult['category'] = 'mixed';
  if (matchedCategories.size === 1) {
    category = [...matchedCategories][0];
  }

  return {
    isBlocked: totalScore >= BLOCK_THRESHOLD,
    score: totalScore,
    matches: matched,
    category,
  };
}

export function getPromptGuardHint(result: PromptGuardResult): string {
  if (!result.matches.length) return '您的输入包含潜在风险，请规范使用。';
  const top3 = result.matches.slice(0, 3).join('、');
  return `检测到高风险内容：${top3}`;
}


