import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Shield, ArrowLeft } from 'lucide-react';

export default function ServiceTermsPage() {
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
          {/* 左侧服务条款卡片 */}
          <div className="lg:col-span-2">
            <Card className="h-full">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <FileText className="w-6 h-6 text-blue-600" />
                  阿库佐伊人工智能 LLM 集成服务 服务条款
                </CardTitle>
                <CardDescription className="text-gray-600">
                  2025年8月16日 更新
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-gray-700 leading-relaxed">
                {/* 介绍段落 */}
                <div className="space-y-4">
                  <p>
                    本服务条款系 阿库佐伊人工智能 LLM 集成服务（下称"本平台"）与所有使用本平台所提供服务的主体（下称"用户"）之间，就本平台的使用所订立的有效合约。在使用本平台提供的任何服务前，请务必仔细阅读并充分理解本声明的全部内容。用户选择使用本平台即表示完全接受本协议及其可能随时更新的内容，视为已知悉并同意全部条款。
                  </p>
                  <p>
                    本平台保留随时修改本服务条款的权利。建议用户定期查阅最新版本的服务条款。如发生争议，以最新公布的服务条款为准。
                  </p>
                  <p>
                    最终解释权归 至远光辉信息技术 所有。
                  </p>
                </div>

                {/* 一、服务内容及使用须知 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">一、服务内容及使用须知</h2>
                  <div className="space-y-3">
                    <p>本平台是一个基于大语言模型（Large Language Model, LLM）技术的人工智能对话与内容生成服务平台，提供自然语言理解、文本生成、知识问答、辅助写作等智能化服务。</p>
                    <p>用户可通过统一身份认证（如 Natayark OpenID 或其他授权方式）登录本平台，使用其开放的 API 接口或前端交互界面获取服务。</p>
                    <p>本平台尊重并保护用户隐私，具体信息处理规则详见《阿库佐伊人工智能 LLM 集成服务 个人信息处理与隐私保护政策》。</p>
                    <p>本平台允许未成年人注册和使用服务。若用户属于法律法规规定的未成年人，在使用本平台服务前，应事先取得其家长或法定监护人的明确同意，并在其监督下进行操作。</p>
                    <p>本平台严禁任何人利用本平台生成或传播违法、有害、虚假、歧视性、侵犯他人合法权益的内容，或从事任何违反中国法律法规的行为。平台不保证完全杜绝此类行为的发生，但将依据法律和技术手段采取必要措施予以防范和处置。</p>
                    <p>因用户使用本平台引发的任何纠纷，包括但不限于内容侵权、名誉损害、数据泄露等，由相关责任方依法自行解决。本平台及其运营方不参与纠纷处理，亦不承担由此产生的任何法律责任。</p>
                    <p>用户在本平台内的所有操作均为其个人行为，平台不对用户生成内容的真实性、合法性、准确性进行审核或背书，也不对用户的使用行为进行日常监督。若发现其他用户存在违规行为，请及时联系管理员举报。</p>
                    <p>除本平台明示的服务条款外，因使用本平台而导致的意外、疏忽、技术故障、操作不当、账户安全问题（如密码泄露、未启用双重验证等）所造成的损失，本平台概不负责，亦不承担任何赔偿责任。</p>
                    <p>注册用户名不得包含敏感词汇、政治人物姓名、侮辱性语言或其他可能引发争议的表述，违者将被系统自动拦截或人工处理。</p>
                  </div>
                </section>

                {/* 二、个人信息与数据处理 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">二、个人信息与数据处理</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">对话数据的访问与使用</h3>
                      <div className="space-y-2">
                        <p>用户与智能体的全部对话内容，可能被本平台工作人员出于质量监控、安全审查、功能优化等目的进行查阅。</p>
                        <p>用户与"清"的对话，即视为您同意该对话数据可用于未来的模型训练、算法研究、数据分析与统计用途。我们将在合法合规的前提下对数据进行匿名化、去标识化处理，确保不泄露个人敏感信息。</p>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">隐私保护机制</h3>
                      <p>对话历史记录仅限本平台授权工作人员在必要范围内查看，不会向无关第三方公开。所有访问行为均受内部审计监管。</p>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 mb-2">用户数据删除请求权</h3>
                      <div className="space-y-2">
                        <p>出于隐私保护考虑，用户有权要求删除其对话历史数据。</p>
                        <p>如需执行删除操作，请通过邮件联系：<a href="mailto:support@zyghit.cn" className="text-blue-600 hover:underline">support@zyghit.cn</a>，并提供您的 用户 ID 及相关验证信息。我们将在核实身份后尽快处理您的请求。</p>
                        <p>用户理解并同意，为保障系统稳定与安全运行，部分日志数据（如操作时间戳、IP 地址、调用接口记录）可能在合理期限内保留，具体依据《隐私政策》执行。</p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 三、免责声明 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">三、免责声明</h2>
                  <div className="space-y-3">
                    <p>本平台需定期或不定期对系统架构、模型服务节点、API 接口等进行升级、维护或优化。我们将尽可能提前在官网或控制台发布公告，但因维护、升级、调度等原因导致的服务中断、延迟或性能波动，本平台不承担任何责任。</p>
                    <p>若用户违反本协议约定、滥用平台功能或违反国家法律法规，由此产生的一切法律、经济后果由用户自行承担，本平台不承担任何连带责任。</p>
                    <p>在以下不可抗力情形下造成的服务中断、数据丢失或系统异常，本平台不承担任何责任：</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>自然灾害（如地震、洪水、台风等）；</li>
                      <li>政府行为或法律法规变更导致的服务限制；</li>
                      <li>黑客攻击、病毒侵袭、网络攻击；</li>
                      <li>电信运营商、云服务商、CDN 或第三方技术提供商出现服务故障；</li>
                      <li>域名解析异常、网络拥塞、DNS 污染等互联网基础设施问题；</li>
                      <li>其他非本平台可控的外部因素。</li>
                    </ul>
                    <p>用户因以下行为造成的损失，本平台不承担责任：</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>将账号出借、共享、倒卖或用于非法牟利；</li>
                      <li>未按照官方文档配置 API 或调用参数，导致调用失败或异常输出；</li>
                      <li>使用本平台生成内容用于医疗、法律、金融投资等专业决策场景而未做人工复核；</li>
                      <li>因自身设备安全策略缺失导致账户被盗用或数据泄露。</li>
                    </ul>
                  </div>
                </section>

                {/* 四、滥用界定 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">四、滥用界定</h2>
                  <p className="mb-3">用户在使用本平台服务过程中，若出现下列行为之一，即视为滥用服务，本平台有权立即永久封禁相关账户，且不予申诉恢复：</p>
                  <ul className="list-disc list-inside ml-4 space-y-2">
                    <li>提供虚假身份信息（如伪造邮箱、手机号、实名认证资料）或冒用他人身份注册；</li>
                    <li>单个主体注册或操控多个账户以规避调用限制或进行自动化刷量；</li>
                    <li>利用本平台生成内容从事诈骗、造谣、煽动仇恨、传播违法信息等活动；</li>
                    <li>倒卖、转售、非法分发本平台账号或 API 访问权限；</li>
                    <li>对模型进行逆向工程、探针攻击、提示注入（Prompt Injection）、越狱尝试（Jailbreaking）等恶意测试；</li>
                    <li>大规模爬取、存储或商业化利用本平台生成内容而未获得授权；</li>
                    <li>其他经本平台判定为严重扰乱服务秩序或损害公共利益的行为。</li>
                  </ul>
                </section>

                {/* 五、服务变更、中断或终止 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">五、服务变更、中断或终止</h2>
                  <div className="space-y-3">
                    <p>本平台有权根据业务发展需要，随时调整服务内容、功能范围、接口权限或收费标准，无需事先单独通知用户。</p>
                    <p>如发生下列任一情形，本平台有权立即中断或终止向用户提供全部或部分服务，且不承担任何赔偿责任：</p>
                    <ul className="list-disc list-inside ml-4 space-y-1">
                      <li>用户被确认存在滥用行为；</li>
                      <li>用户违反本服务条款或相关法律法规；</li>
                      <li>用户账户涉及安全风险或被用于非法用途；</li>
                      <li>其他本平台认为有必要终止服务的情形。</li>
                    </ul>
                    <p>阿库佐伊工作人员有权基于平台安全、社区规范或运营需要，对特定用户实施拉黑处理，或拒绝继续为其提供与"清"的对话服务。此类决定一经作出，恕不另行解释。</p>
                    <p>服务终止后，用户可联系管理员查询原因并提交申诉。申诉结果由平台技术与合规团队综合评估决定。若申诉未通过，平台无义务提供补偿或恢复服务。</p>
                  </div>
                </section>

                {/* 六、账号注销 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">六、账号注销</h2>
                  <p>本平台使用 Natayark OpenID 作为基础账户信息服务，若要注销账户，您需要前往 Natayark OpenID 进行账号注销。</p>
                </section>

                {/* 七、其他说明 */}
                <section>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">七、其他说明</h2>
                  <div className="space-y-3">
                    <p>本平台生成的内容由人工智能自动产出，可能存在事实错误、逻辑偏差或虚构信息。所有输出内容仅供参考，不构成专业建议。建议用户在关键场景中结合人工判断进行核实。</p>
                    <p>用户不得将本平台生成内容直接用于学术论文、法律文书、医疗诊断、金融决策等高风险领域而不加审核。</p>
                    <p>更多关于数据处理、用户权利、儿童隐私保护等内容，请参阅配套文件：<a href="/privacy-policy" className="text-blue-600 hover:underline">《阿库佐伊人工智能 LLM 集成服务 个人信息处理与隐私保护政策》</a></p>
                  </div>
                </section>
              </CardContent>
            </Card>
          </div>

          {/* 右侧隐私政策卡片 */}
          <div className="lg:col-span-1">
            <Card className="h-fit sticky top-6">
              <CardHeader>
                <CardTitle className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-600" />
                  隐私政策
                </CardTitle>
                <CardDescription className="text-gray-600">
                  了解我们如何保护您的隐私
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-700 text-sm">
                  我们致力于保护您的个人信息安全，详细说明我们如何收集、使用和保护您的数据。
                </p>
                <Button 
                  onClick={() => window.open('/privacy-policy', '_blank')}
                  className="w-full"
                  variant="outline"
                >
                  查看隐私政策
                </Button>
                <div className="text-xs text-gray-500 space-y-1">
                  <p>• 信息收集与使用</p>
                  <p>• 数据保护措施</p>
                  <p>• 用户权利说明</p>
                  <p>• 未成年人保护</p>
                  <p>• 联系我们</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
