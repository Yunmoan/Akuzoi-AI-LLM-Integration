import { AlertTriangle, Shield, Info, X } from 'lucide-react';
import { useState } from 'react';

interface SensitiveContentWarningProps {
  detection: {
    level: string;
    categories: string[];
    riskScore: number;
    totalCount: number;
    detectedWords?: Array<{
      word: string;
      category: string;
      level: string;
      matchType: string;
    }>;
  };
  onDismiss?: () => void;
  showDetails?: boolean;
}

// 敏感级别配置
const LEVEL_CONFIG = {
  block: {
    icon: Shield,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    title: '内容已被阻止',
    description: '检测到严重违规内容，消息已被系统阻止'
  },
  warn: {
    icon: AlertTriangle,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
    title: '内容警告',
    description: '检测到敏感内容，请注意使用规范'
  },
  review: {
    icon: Info,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    title: '内容审核',
    description: '内容需要人工审核，请耐心等待'
  },
  notice: {
    icon: Info,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    title: '内容提醒',
    description: '内容包含敏感词汇，请注意使用'
  }
};

// 分类名称映射
const CATEGORY_NAMES = {
  political: '政治敏感',
  violence: '暴力恐怖',
  porn: '色情内容',
  drugs: '毒品相关',
  gambling: '赌博相关',
  fraud: '诈骗相关',
  hate_speech: '仇恨言论',
  illegal_activities: '违法活动',
  controversial: '争议话题',
  spam: '垃圾信息'
};

export default function SensitiveContentWarning({ 
  detection, 
  onDismiss, 
  showDetails = false 
}: SensitiveContentWarningProps) {
  const [expanded, setExpanded] = useState(showDetails);
  
  const config = LEVEL_CONFIG[detection.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG.notice;
  const IconComponent = config.icon;

  const getRiskLevelText = (score: number) => {
    if (score >= 80) return '极高风险';
    if (score >= 60) return '高风险';
    if (score >= 40) return '中等风险';
    if (score >= 20) return '低风险';
    return '安全';
  };

  const getRiskLevelColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    if (score >= 20) return 'text-blue-600';
    return 'text-green-600';
  };

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} mb-4`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <IconComponent className={`w-5 h-5 mt-0.5 ${config.color} flex-shrink-0`} />
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${config.color}`}>
              {config.title}
            </h4>
            <p className="text-sm text-gray-700 mt-1">
              {config.description}
            </p>
            
            {/* 检测统计 */}
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-4 text-sm">
                <span className="text-gray-600">
                  检测到 <span className="font-medium text-gray-900">{detection.totalCount}</span> 个敏感内容
                </span>
                <span className="text-gray-600">
                  风险等级: <span className={`font-medium ${getRiskLevelColor(detection.riskScore)}`}>
                    {getRiskLevelText(detection.riskScore)}
                  </span>
                </span>
                <span className="text-gray-600">
                  风险评分: <span className={`font-medium ${getRiskLevelColor(detection.riskScore)}`}>
                    {detection.riskScore}
                  </span>
                </span>
              </div>
              
              {/* 分类标签 */}
              {detection.categories.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {detection.categories.map(category => (
                    <span
                      key={category}
                      className="px-2 py-1 text-xs bg-white border border-gray-200 rounded-md text-gray-700"
                    >
                      {CATEGORY_NAMES[category as keyof typeof CATEGORY_NAMES] || category}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* 详细信息 */}
            {detection.detectedWords && detection.detectedWords.length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center space-x-1"
                >
                  <span>{expanded ? '隐藏' : '显示'}详细信息</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {expanded && (
                  <div className="mt-2 space-y-2">
                    {detection.detectedWords.map((word, index) => (
                      <div key={index} className="text-sm bg-white p-2 rounded border">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-red-600">{word.word}</span>
                          <span className="text-xs text-gray-500">
                            {CATEGORY_NAMES[word.category as keyof typeof CATEGORY_NAMES] || word.category}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          级别: {word.level} | 匹配方式: {word.matchType}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
