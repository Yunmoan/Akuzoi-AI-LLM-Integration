import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, FileText, ArrowLeft } from 'lucide-react';

export default function PrivacyPolicyPage() {
  const navigate = useNavigate();

  const handleBack = () => {
    // 如果有历史记录，则返回上一页
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // 如果没有历史记录，则跳转到登录页面
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* 返回按钮 */}
        <div className="mb-6">
          <Button
            onClick={handleBack}
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧隐私策略卡片 */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-6 h-6 text-green-600" />
                  阿库佐伊人工智能 LLM 集成服务 个人信息处理与隐私保护政策
                </CardTitle>
                                 <CardDescription className="text-gray-600">
                   2025年8月16日 更新
                 </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                                 {/* 介绍段落 */}
                 <div className="space-y-4">
                   <p>
                     ZGIT（至远·光辉信息技术）（以下简称"我们"）非常重视用户的隐私权益与数据安全。阿库佐伊人工智能 LLM 集成服务（以下简称"本平台"）是基于大语言模型技术的人工智能对话与内容生成服务平台。我们依据《中华人民共和国个人信息保护法》《数据安全法》《生成式人工智能服务管理暂行办法》等相关法律法规，制定本《个人信息处理与隐私保护政策》（以下简称"《隐私策略》"），帮助您了解在使用本平台过程中，我们如何收集、使用、存储、共享和保护您的个人信息。
                   </p>
                   <p>
                     在使用本平台提供的任何服务前，请务必仔细阅读并理解本《隐私策略》的全部内容。您选择使用本平台，即表示您已充分知悉并同意本《隐私策略》及其可能随时更新的内容。
                   </p>
                   <p>
                     我们保留在必要时修改本《隐私策略》的权利。建议您定期查阅最新版本。如发生争议，以最新公布的《隐私策略》为准。
                   </p>
                 </div>

                 {/* 第三方 SDK 与外部链接说明 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">第三方 SDK 与外部链接说明</h2>
                   <div className="space-y-3">
                     <p>
                       本平台在开发、调试、性能监控过程中，可能集成以下第三方 SDK 或服务工具（如 Sentry 错误监控、Google Analytics 分析组件、OAuth 登录接口等）。这些第三方服务可能有独立的隐私政策，不完全适用本《隐私策略》。我们将在官网公示所用第三方 SDK 列表及其隐私政策链接，供您查阅。
                     </p>
                     <p>
                       当您通过本平台跳转至第三方应用、网站或服务时，您的信息处理将遵循该第三方的隐私规则，本平台不保证其隐私保护水平与本策略一致。但我们要求所有接入方遵守中国现行法律法规，并出具合法合规的隐私声明。
                     </p>
                   </div>
                 </section>

                                 {/* 一、信息收集和使用 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">一、信息收集和使用</h2>
                   <p className="mb-4">为向您提供稳定、智能、个性化的服务，我们在您使用本平台的过程中，可能会收集以下类别的信息：</p>
                   
                   <div className="space-y-4">
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">用户基本信息</h3>
                       <p className="mb-2">在您注册或登录本平台时，我们会收集以下信息：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>用户名</li>
                         <li>密码（加密存储）</li>
                         <li>电子邮箱地址</li>
                         <li>统一身份标识（如 Natayark OpenID UID）</li>
                       </ul>
                       <p className="mt-2">上述信息用于账户创建、身份验证、登录管理及服务访问控制。</p>
                     </div>
                     
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">Web 与操作日志信息</h3>
                       <p className="mb-2">当您访问本平台网页、调用 API 接口或与 AI 助手交互时，系统会自动记录以下日志信息：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>请求时间戳</li>
                         <li>您的公网 IP 地址</li>
                         <li>浏览器类型、设备型号、操作系统</li>
                         <li>HTTP 请求头与响应状态码</li>
                         <li>对话会话 ID（Session ID）</li>
                         <li>API 调用频率、输入输出长度等统计信息</li>
                       </ul>
                       <p className="mt-2">此类信息用于系统运维、安全审计、反滥用检测及服务质量优化。</p>
                     </div>
                     
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">对话内容与交互数据</h3>
                       <p className="mb-2">您与智能体的全部对话内容（包括提问、回复、上下文记忆等），将被系统记录并存储。</p>
                       <p className="mb-2">请注意：您与智能体的每一次对话，即视为您明确同意该对话数据可用于以下用途：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>模型后续训练与微调；</li>
                         <li>算法研究与性能提升；</li>
                         <li>内容质量评估与人工标注；</li>
                         <li>匿名化后的数据分析与统计报告。</li>
                       </ul>
                       <p className="mt-2">我们将对用于训练的数据进行严格去标识化处理，确保无法关联到具体个人身份。</p>
                     </div>
                     
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">实名认证信息（状态同步机制）</h3>
                       <p className="mb-2">本平台不直接收集、存储或处理用户的实名身份信息（包括真实姓名、身份证号码、证件照片等）。所有实名认证流程均由统一身份认证系统 —— Natayark OpenID 完成，其隐私政策与数据处理规范请参见：《Natayark OpenID 个人信息处理与隐私保护政策》。</p>
                       <p className="mb-2">当您通过 Natayark OpenID 登录本平台时，我们仅通过安全接口获取一个加密验证后的实名状态标识，即：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>1-bit 实名状态码（取值为 true 或 false）</li>
                       </ul>
                       <p className="mb-2">该状态码用于：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>判断您是否已完成实名认证；</li>
                         <li>控制高风险功能的访问权限（如高频调用、API 接入等）；</li>
                         <li>满足监管对"实名制使用 AI 服务"的合规要求。</li>
                       </ul>
                       <p className="mt-2"><strong>重要说明：</strong></p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>本平台无法访问您的真实姓名、证件号、人脸照片等原始实名数据；</li>
                         <li>所有敏感信息均由 Natayark OpenID 系统独立加密保存，并遵循其自身的安全与审计机制；</li>
                         <li>若您在 Natayark OpenID 中注销实名信息，本平台的状态码将同步更新为 false。</li>
                       </ul>
                     </div>
                   </div>
                 </section>

                                 {/* 二、信息使用目的 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">二、信息使用目的</h2>
                   <p className="mb-3">除特别声明外，我们收集的个人信息将用于以下合法、正当、必要的目的：</p>
                   <ul className="list-disc list-inside ml-4 space-y-1">
                     <li>提供、维护和优化本平台的核心功能（如对话生成、上下文记忆、个性化响应）；</li>
                     <li>执行安全风控，识别并阻止垃圾信息、恶意攻击、越狱尝试等异常行为；</li>
                     <li>进行故障排查、系统调试、性能调优等技术性维护工作；</li>
                     <li>改善用户体验，优化模型输出质量；</li>
                     <li>履行法律法规规定的义务（如配合主管部门调查）；</li>
                     <li>在匿名化、聚合化基础上开展人工智能技术研究与产品创新。</li>
                   </ul>
                 </section>

                                 {/* 三、用户信息调用与共享 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">三、用户信息调用与共享</h2>
                   
                   <div className="space-y-4">
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">第三方应用授权</h3>
                       <p className="mb-2">本平台支持通过统一身份认证（如 Natayark OpenID）登录第三方服务。在您授权后，相关应用可获取以下基础信息：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>用户名</li>
                         <li>邮箱（经用户授权后）</li>
                         <li>UID（用户唯一标识）</li>
                         <li>账户注册时间</li>
                         <li>最后一次登录时间与 IP</li>
                         <li>账户状态标志位（正常/封禁）</li>
                         <li>实名认证状态（布尔值，是否已完成）</li>
                       </ul>
                       <p className="mt-2">我们不会向第三方应用提供您的密码、实名信息原文、对话历史或敏感日志。</p>
                     </div>
                     
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">数据披露限制</h3>
                       <p className="mb-2">未经您的明确同意，我们不会向任何无关第三方披露您的敏感个人信息。敏感信息至少包括：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>对话原始内容</li>
                         <li>密码、邮箱、手机号</li>
                         <li>Web 访问日志中的完整请求报文</li>
                         <li>与 AI 的完整交互轨迹</li>
                       </ul>
                       <p className="mt-2"><strong>例外情况：</strong></p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>当收到公安机关、国家安全机关、法院等依法出具的有效法律文书（如协查函、调令）时，我们将依法配合信息披露；</li>
                         <li>在涉及重大公共利益、人身安全或反诈反恐等紧急情况下，依据法律规定进行必要披露。</li>
                       </ul>
                     </div>
                   </div>
                 </section>

                                 {/* 四、信息储存与安全 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">四、信息储存与安全</h2>
                   
                   <div className="space-y-4">
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">存储方式</h3>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>对话数据：将以JSON形式明文保存在高加密强度的 MySQL 数据库。</li>
                         <li>日志数据：按日切片存储，保留周期通常不超过 180 天，超期后自动归档或删除。</li>
                         <li>实名状态码：以布尔字段形式存储，仅用于权限判断，不关联任何身份信息。</li>
                       </ul>
                     </div>
                   </div>
                 </section>

                                 {/* 五、信息删除与账户注销 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">五、信息删除与账户注销</h2>
                   
                   <div className="space-y-4">
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">自动删除机制</h3>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>Web 日志、操作日志、临时缓存数据将在 180 天内自动清除；</li>
                         </ul>
                     </div>
                     
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">用户主动删除请求</h3>
                       <p className="mb-2">您有权要求删除您的对话数据或账户信息。请通过以下方式联系我们：</p>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>联系邮箱：<a href="mailto:support@zyghit.cn" className="text-blue-600 hover:underline">support@zyghit.cn</a></li>
                         <li>请附带您的用户 ID 及相关验证信息</li>
                       </ul>
                       <p className="mt-2">我们将在收到请求并核实身份后完成处理，并反馈结果。</p>
                     </div>
                     
                     <div>
                       <h3 className="font-semibold text-gray-800 mb-2">账户注销</h3>
                       <ul className="list-disc list-inside ml-4 space-y-1">
                         <li>账户注销操作一经提交，立即生效，无冷却期，不可撤销；</li>
                         <li>注销后，您的用户名、密码、实名状态码、对话历史等将被永久删除；</li>
                         <li>原始数据将保留最多 12 个月，用于应对可能的政府调查或法律追责；若期间无相关要求，则彻底销毁；</li>
                         <li>注销不影响您此前使用服务所产生的法律责任或第三方权益。</li>
                       </ul>
                       <p className="mt-2">更多关于账号注销的免责条款，请参见《服务条款》。</p>
                     </div>
                   </div>
                 </section>

                 {/* 六、针对未成年人的特别说明 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">六、针对未成年人的特别说明</h2>
                   <p className="mb-3">本平台允许未成年人注册和使用服务，但必须满足以下条件：</p>
                   <ul className="list-disc list-inside ml-4 space-y-1">
                     <li>使用前须取得其父母或其他法定监护人的明确同意；</li>
                     <li>建议在监护人陪同下阅读本《隐私策略》并进行操作；</li>
                     <li>禁止使用他人身份信息进行实名认证。</li>
                   </ul>
                   <p className="mt-3">我们仅在监护人同意或为保护未成年人权益所必需时，收集和使用其个人信息。如发现未经证实监护人同意而收集的未成年人信息，我们将立即删除。</p>
                   <p className="mt-3">若您是监护人并对您所监护的未成年人信息有疑问，请通过 <a href="mailto:yunmoan@zyghit.cn" className="text-blue-600 hover:underline">yunmoan@zyghit.cn</a> 联系我们。</p>
                 </section>

                                 {/* 七、其他说明 */}
                 <section>
                   <h2 className="text-xl font-semibold text-gray-900 mb-4">七、其他说明</h2>
                   <div className="space-y-3">
                     <p>本平台生成内容可能存在虚构或偏差，请勿将其作为事实依据或专业决策来源。</p>
                     <p>本策略未尽事宜，参照《阿库佐伊人工智能 LLM 集成服务 服务条款》执行。</p>
                   </div>
                 </section>
              </CardContent>
            </Card>
          </div>

          {/* 右侧服务条款卡片 */}
          <div className="lg:col-span-1">
            <Card className="h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  服务条款
                </CardTitle>
                <CardDescription className="text-gray-600">
                  了解我们的服务条款
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">
                  详细的服务条款说明，包括服务内容、使用须知、免责声明等重要信息。
                </p>
                <Button 
                  onClick={() => window.open('/service-terms', '_blank')}
                  className="w-full"
                  variant="outline"
                >
                  查看服务条款
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• 服务内容及使用须知</p>
                  <p>• 个人信息与数据处理</p>
                  <p>• 免责声明</p>
                  <p>• 滥用界定</p>
                  <p>• 服务变更与终止</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
