// 敏感词检测服务 - 用于检查AI输出内容是否符合中国大陆法律
// 支持多级敏感词分类、模糊匹配、上下文检测等功能

const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class SensitiveWordService {
  constructor() {
    this.sensitiveWords = new Map(); // 敏感词库
    this.wordCategories = new Map(); // 词库分类
    this.loadSensitiveWords();
  }

  // 敏感词分类定义
  static get CATEGORIES() {
    return {
      POLITICAL: 'political',           // 政治敏感
      VIOLENCE: 'violence',             // 暴力恐怖
      PORN: 'porn',                     // 色情内容
      DRUGS: 'drugs',                   // 毒品相关
      GAMBLING: 'gambling',             // 赌博相关
      FRAUD: 'fraud',                   // 诈骗相关
      HATE_SPEECH: 'hate_speech',       // 仇恨言论
      ILLEGAL_ACTIVITIES: 'illegal_activities', // 违法活动
      CONTROVERSIAL: 'controversial',   // 争议话题
      SPAM: 'spam'                      // 垃圾信息
    };
  }

  // 敏感级别定义
  static get LEVELS() {
    return {
      BLOCK: 'block',      // 完全阻止
      WARN: 'warn',        // 警告提示
      REVIEW: 'review',    // 人工审核
      NOTICE: 'notice'     // 注意提醒
    };
  }

  // 加载敏感词库
  async loadSensitiveWords() {
    try {
      const wordsPath = path.join(__dirname, '../config/sensitive-words.json');
      const wordsData = await fs.readFile(wordsPath, 'utf8');
      const words = JSON.parse(wordsData);
      
      // 构建敏感词映射
      words.forEach(word => {
        this.sensitiveWords.set(word.word, {
          category: word.category,
          level: word.level,
          synonyms: word.synonyms || [],
          context: word.context || []
        });
      });

      // 构建分类映射
      Object.values(SensitiveWordService.CATEGORIES).forEach(category => {
        this.wordCategories.set(category, words.filter(w => w.category === category));
      });

      logger.info(`敏感词库加载完成，共 ${words.length} 个敏感词`);
    } catch (error) {
      logger.warn('敏感词库加载失败，使用默认词库:', error.message);
      this.loadDefaultWords();
    }
  }

  // 加载默认敏感词库
  loadDefaultWords() {
    const defaultWords = [
      // 政治敏感词
      { word: '台独', category: 'political', level: 'block' },
      { word: '藏独', category: 'political', level: 'block' },
      { word: '疆独', category: 'political', level: 'block' },
      { word: '港独', category: 'political', level: 'block' },
      { word: '法轮功', category: 'political', level: 'block' },
      { word: '六四', category: 'political', level: 'block' },
      { word: '天安门事件', category: 'political', level: 'block' },
      
      // 暴力恐怖
      { word: '恐怖袭击', category: 'violence', level: 'block' },
      { word: '自杀', category: 'violence', level: 'warn' },
      { word: '自残', category: 'violence', level: 'warn' },
      { word: '爆炸', category: 'violence', level: 'review' },
      
      // 色情内容
      { word: '色情', category: 'porn', level: 'block' },
      { word: '成人内容', category: 'porn', level: 'block' },
      { word: '性暗示', category: 'porn', level: 'warn' },
      
      // 毒品相关
      { word: '毒品', category: 'drugs', level: 'block' },
      { word: '大麻', category: 'drugs', level: 'block' },
      { word: '冰毒', category: 'drugs', level: 'block' },
      { word: '海洛因', category: 'drugs', level: 'block' },
      
      // 赌博相关
      { word: '赌博', category: 'gambling', level: 'block' },
      { word: '博彩', category: 'gambling', level: 'block' },
      { word: '六合彩', category: 'gambling', level: 'block' },
      
      // 诈骗相关
      { word: '传销', category: 'fraud', level: 'block' },
      { word: '非法集资', category: 'fraud', level: 'block' },
      { word: '电信诈骗', category: 'fraud', level: 'block' },
      
      // 仇恨言论
      { word: '种族歧视', category: 'hate_speech', level: 'block' },
      { word: '性别歧视', category: 'hate_speech', level: 'block' },
      { word: '宗教歧视', category: 'hate_speech', level: 'block' },
      
      // 违法活动
      { word: '洗钱', category: 'illegal_activities', level: 'block' },
      { word: '走私', category: 'illegal_activities', level: 'block' },
      { word: '非法交易', category: 'illegal_activities', level: 'block' },
      
      // 争议话题
      { word: '敏感话题', category: 'controversial', level: 'review' },
      { word: '争议内容', category: 'controversial', level: 'review' },
      
      // 垃圾信息
      { word: '垃圾广告', category: 'spam', level: 'warn' },
      { word: '恶意链接', category: 'spam', level: 'block' }
    ];

    defaultWords.forEach(word => {
      this.sensitiveWords.set(word.word, {
        category: word.category,
        level: word.level,
        synonyms: [],
        context: []
      });
    });

    logger.info('默认敏感词库加载完成');
  }

  // 检测文本中的敏感词
  detectSensitiveWords(text, options = {}) {
    if (!text || typeof text !== 'string') {
      return { isBlocked: false, detectedWords: [], level: 'safe' };
    }

    const {
      strictMode = false,        // 严格模式
      checkContext = true,       // 检查上下文
      minLevel = 'notice'        // 最低检测级别
    } = options;

    const detectedWords = [];
    const textLower = text.toLowerCase();
    const textNormalized = this.normalizeText(text);

    // 遍历敏感词库进行检测
    for (const [word, config] of this.sensitiveWords) {
      // 检查级别是否满足最低要求
      if (this.getLevelPriority(config.level) < this.getLevelPriority(minLevel)) {
        continue;
      }

      // 多种匹配方式
      let isMatched = false;
      let matchType = '';

      // 1. 精确匹配
      if (textLower.includes(word.toLowerCase())) {
        isMatched = true;
        matchType = 'exact';
      }
      // 2. 模糊匹配（处理同音字、形近字等）
      else if (this.fuzzyMatch(textNormalized, word)) {
        isMatched = true;
        matchType = 'fuzzy';
      }
      // 3. 同义词匹配
      else if (config.synonyms.some(syn => textLower.includes(syn.toLowerCase()))) {
        isMatched = true;
        matchType = 'synonym';
      }

      if (isMatched) {
        // 上下文检查（可选）
        let contextScore = 1.0;
        if (checkContext && config.context.length > 0) {
          contextScore = this.calculateContextScore(text, config.context);
        }

        detectedWords.push({
          word: word,
          category: config.category,
          level: config.level,
          matchType: matchType,
          contextScore: contextScore,
          position: this.findWordPosition(text, word),
          severity: this.calculateSeverity(config.level, contextScore, strictMode)
        });
      }
    }

    // 按严重程度排序
    detectedWords.sort((a, b) => b.severity - a.severity);

    // 判断是否阻止
    const maxLevel = detectedWords.length > 0 ? detectedWords[0].level : 'safe';
    const isBlocked = detectedWords.some(word => word.level === 'block') || 
                     (strictMode && detectedWords.some(word => word.level === 'warn'));

    return {
      isBlocked: isBlocked,
      detectedWords: detectedWords,
      level: maxLevel,
      totalCount: detectedWords.length,
      categories: [...new Set(detectedWords.map(w => w.category))],
      riskScore: this.calculateRiskScore(detectedWords)
    };
  }

  // 文本标准化
  normalizeText(text) {
    return text
      .toLowerCase()
      .replace(/[\u4e00-\u9fa5]/g, char => this.normalizeChineseChar(char))
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, '');
  }

  // 中文字符标准化（处理同音字、形近字）
  normalizeChineseChar(char) {
    // 这里可以扩展更多的字符映射规则
    const charMap = {
      '台': '台', '臺': '台',
      '独': '独', '獨': '独',
      '藏': '藏', '蔵': '藏',
      '疆': '疆', '彊': '疆'
    };
    return charMap[char] || char;
  }

  // 模糊匹配
  fuzzyMatch(text, word) {
    // 简单的编辑距离算法
    const distance = this.levenshteinDistance(text, word);
    const maxDistance = Math.floor(word.length * 0.3); // 允许30%的编辑距离
    return distance <= maxDistance;
  }

  // 编辑距离计算
  levenshteinDistance(str1, str2) {
    const matrix = [];
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    return matrix[str2.length][str1.length];
  }

  // 上下文评分
  calculateContextScore(text, contextKeywords) {
    let score = 0;
    const textLower = text.toLowerCase();
    
    contextKeywords.forEach(keyword => {
      if (textLower.includes(keyword.toLowerCase())) {
        score += 0.2; // 每个上下文关键词增加0.2分
      }
    });
    
    return Math.min(1.0, score);
  }

  // 查找敏感词位置
  findWordPosition(text, word) {
    const index = text.toLowerCase().indexOf(word.toLowerCase());
    if (index === -1) return -1;
    
    return {
      start: index,
      end: index + word.length,
      context: text.substring(Math.max(0, index - 10), index + word.length + 10)
    };
  }

  // 计算严重程度
  calculateSeverity(level, contextScore, strictMode) {
    const levelScores = {
      'block': 100,
      'warn': 70,
      'review': 50,
      'notice': 30
    };
    
    let score = levelScores[level] || 0;
    score += contextScore * 20; // 上下文加分
    
    if (strictMode && level === 'warn') {
      score += 20; // 严格模式下警告级别提升
    }
    
    return Math.min(100, score);
  }

  // 计算风险评分
  calculateRiskScore(detectedWords) {
    if (detectedWords.length === 0) return 0;
    
    const totalSeverity = detectedWords.reduce((sum, word) => sum + word.severity, 0);
    const avgSeverity = totalSeverity / detectedWords.length;
    const countMultiplier = Math.min(2.0, 1 + detectedWords.length * 0.1);
    
    return Math.min(100, Math.round(avgSeverity * countMultiplier));
  }

  // 获取级别优先级
  getLevelPriority(level) {
    const priorities = {
      'block': 4,
      'warn': 3,
      'review': 2,
      'notice': 1,
      'safe': 0
    };
    return priorities[level] || 0;
  }

  // 获取敏感词统计信息
  getStatistics() {
    const stats = {
      totalWords: this.sensitiveWords.size,
      categories: {},
      levels: {}
    };

    // 分类统计
    for (const [category, words] of this.wordCategories) {
      stats.categories[category] = words.length;
    }

    // 级别统计
    for (const word of this.sensitiveWords.values()) {
      stats.levels[word.level] = (stats.levels[word.level] || 0) + 1;
    }

    return stats;
  }

  // 添加敏感词（动态管理）
  addSensitiveWord(word, category, level, synonyms = [], context = []) {
    if (!SensitiveWordService.CATEGORIES[category.toUpperCase()]) {
      throw new Error(`无效的分类: ${category}`);
    }
    if (!SensitiveWordService.LEVELS[level.toUpperCase()]) {
      throw new Error(`无效的级别: ${level}`);
    }

    this.sensitiveWords.set(word, {
      category: category.toLowerCase(),
      level: level.toLowerCase(),
      synonyms: synonyms,
      context: context
    });

    // 更新分类映射
    if (!this.wordCategories.has(category.toLowerCase())) {
      this.wordCategories.set(category.toLowerCase(), []);
    }
    this.wordCategories.get(category.toLowerCase()).push({
      word: word,
      category: category.toLowerCase(),
      level: level.toLowerCase()
    });

    logger.info(`敏感词添加成功: ${word} (${category}/${level})`);
  }

  // 移除敏感词
  removeSensitiveWord(word) {
    const wordInfo = this.sensitiveWords.get(word);
    if (wordInfo) {
      this.sensitiveWords.delete(word);
      
      // 从分类映射中移除
      const categoryWords = this.wordCategories.get(wordInfo.category);
      if (categoryWords) {
        const index = categoryWords.findIndex(w => w.word === word);
        if (index !== -1) {
          categoryWords.splice(index, 1);
        }
      }
      
      logger.info(`敏感词移除成功: ${word}`);
      return true;
    }
    return false;
  }
}

module.exports = new SensitiveWordService();
