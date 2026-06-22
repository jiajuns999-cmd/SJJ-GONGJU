import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ToolShortcuts from "@/components/ToolShortcuts";

// ============ 人物设定 & AI 提示词 ============
const COMPANY_PROFILE = `我是一名做美线国际物流的货代，公司主营：
- 整柜/散货 DDP 双清到门
- 空派-海派-海卡-全覆盖
- 美国全境可派，全国上门提货
- 报价快、价稳、时效优`;

// 营销版子类型
const MARKETING_SUB_TYPES = [
  { value: "route", label: "优势线路", icon: "fa-route", desc: "展示公司主营线路和覆盖范围" },
  { value: "promotion", label: "促销广告", icon: "fa-bullhorn", desc: "限时优惠、特价活动等促销内容" },
  { value: "advantage", label: "渠道优势", icon: "fa-star", desc: "强调双清到门、全国提货等核心竞争力" },
  { value: "service", label: "服务介绍", icon: "fa-handshake", desc: "介绍公司服务体系与客户保障" },
];

// 问候版子类型
const GREETING_SUB_TYPES = [
  { value: "weekend", label: "周末问候", icon: "fa-calendar-check", desc: "轻松温馨的周末祝福" },
  { value: "holiday", label: "节假日祝福", icon: "fa-gift", desc: "节假日专属问候文案" },
  { value: "season", label: "季节问候", icon: "fa-cloud-sun", desc: "换季关怀与提醒" },
  { value: "morning", label: "早安/晚安", icon: "fa-sun", desc: "早晚暖心问候" },
];

// 语气风格
const TONE_STYLES = [
  { value: "professional", label: "专业稳重", icon: "fa-briefcase" },
  { value: "friendly", label: "亲切友好", icon: "fa-smile" },
  { value: "warm", label: "温暖贴心", icon: "fa-heart" },
  { value: "energetic", label: "活力满满", icon: "fa-bolt" },
];

// 节假日快捷选择
const HOLIDAYS = [
  "春节", "元宵节", "清明节", "劳动节", "端午节",
  "中秋节", "国庆节", "元旦", "情人节", "感恩节",
  "圣诞节", "新年快乐", "母亲节", "父亲节", "七夕节"
];

// ============ AI 文案生成 ============
const ZHIPU_API_KEY = "13968110e81a4cb1b255aa578b83f690.8K0K6FGm4VfeOFAI";
const ZHIPU_API_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

async function generateCopyWithAI(params: {
  type: "marketing" | "greeting";
  subType: string;
  tone: string;
  customPrompt?: string;
  holidayName?: string;
}): Promise<string> {
  const { type, subType, tone, customPrompt, holidayName } = params;

  let systemPrompt = "你是一名资深的新媒体文案策划专家，专门为国际物流货代公司撰写微信/微信群发文案。你的文案必须口语化、亲切自然、有温度，避免生硬的广告腔。";
  let userPrompt = "";

  if (type === "marketing") {
    const subTypeLabels: Record<string, string> = {
      route: "优势线路展示",
      promotion: "促销广告",
      advantage: "渠道优势",
      service: "服务介绍",
    };
    const subTypeExtra: Record<string, string> = {
      route: "需要展示公司的优势线路，强调美国全境覆盖、空派海派海卡产品线齐全，让客户一目了然知道你能做什么。",
      promotion: "需要有促销感但不生硬，可以适当制造紧迫感（如旺季来临、舱位紧张），引导客户主动询价。",
      advantage: "需要突出公司的核心优势：双清到门、全国上门提货、报价快价稳时效优，与同行形成差异化。",
      service: "需要介绍服务体系，让客户感受到专业和可靠，如运输全程可追踪、清关能力强、售后有保障等。",
    };

    userPrompt = `请为一家国际物流货代公司撰写一条微信群发文案。

【公司背景】
${COMPANY_PROFILE}

【文案类型】${subTypeLabels[subType] || "营销推广"}
【语气风格】${tone}
${subTypeExtra[subType] || ""}

【用户自定义补充】
${customPrompt || "无"}

【文案要求】
1. 长度：150-300字左右，适合微信阅读习惯
2. 格式：可适当使用emoji（不超过5个），段落分明（2-3段）
3. 结尾：必须包含引导客户回复/询价的 call to action
4. 风格：口语化、亲切自然、有温度，像朋友聊天而非广告轰炸
5. 可以在文案中适当加粗重点（用**重点**标记）
6. 只返回纯文案内容，不要加任何前缀说明如"以下是文案"等

请直接输出文案：`;
  } else {
    // greeting
    const greetingExtra: Record<string, string> = {
      weekend: "轻松温馨，提醒客户劳逸结合，顺便带一句「有物流需求随时找我」，不要硬推销。",
      holiday: `节日：${holidayName || "自定义"}。节日祝福为主，自然融入物流服务的便利性，不做硬广。`,
      season: "季节性问候，如夏季防暑、冬季保暖等，体现关怀，自然带过物流服务。",
      morning: "早安或晚安的暖心问候，简短温馨，30-80字，表达关心，可以简单带一句服务。",
    };

    userPrompt = `请为一家国际物流货代公司撰写一条微信群发问候文案。

【公司背景】
${COMPANY_PROFILE}

【问候类型】${subType === "holiday" && holidayName ? `${holidayName}节日祝福` : greetingExtra[subType] ? subType : "通用问候"}
【语气风格】${tone}

【文案要求】
1. 长度：问候版控制在 50-150 字（早安晚安版 30-80 字）
2. 格式：适当使用emoji（不超过3个），段落在1-2段
3. 风格：温暖、真诚、不说教，如朋友般自然问候
4. ${subType === "holiday" ? `围绕「${holidayName || "节日"}」主题展开祝福` : "以周末/早安/晚安/季节为主题展开"}
5. 最后可以自然带一句物流服务，但不强硬推销，像是顺带提一下
6. 只返回纯文案内容，不要加任何前缀说明

请直接输出文案：`;
  }

  try {
    const response = await fetch(`${ZHIPU_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`,
      },
      body: JSON.stringify({
        model: "glm-4-plus",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.8,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      throw new Error(`API请求失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "生成失败，请重试";
  } catch (error) {
    console.error("文案生成错误:", error);
    throw error;
  }
}

// ============ 模拟文案（API 不可用时的 fallback） ============
function getMockCopy(params: {
  type: "marketing" | "greeting";
  subType: string;
  tone: string;
  holidayName?: string;
}): string {
  const { type, subType, holidayName } = params;

  if (type === "marketing") {
    const mockMarketing: Record<string, string> = {
      route: `📦 美线物流，我们是最专业的那一个！

🚢 **整柜DDP双清到门** — 全国提货，直送美国全境
✈️ **空派/海派/海卡** — 产品线全覆盖，总有一个方案适合您
🏠 **全美可派** — 洛杉矶、纽约、芝加哥、达拉斯… 无死角覆盖

不管您做的是亚马逊FBA、海外仓一件代发，还是传统外贸，我们都能给您最稳的报价和最快的时效。

💬 近期有货要出？发我品名+地址，5分钟出报价！`,
      promotion: `📢 还在到处比价？来我这，一站搞定！

✅ 美线整柜DDP • 散货双清到门
✅ 空派快线5-7天签收，海派稳价不涨
✅ 全国上门提货，省心省力

🔥 近期舱位紧张，早订早锁价！
报价快 • 价格稳 • 时效优 — 这就是我们的底气。

需要了解最新运价？私我，秒回！💪`,
      advantage: `做美线物流，我们凭什么让客户一直选我们？

🏆 **3大核心优势：**
1️⃣ 双清包税到门，清关能力强，让你省心
2️⃣ 全国上门提货，你只管发货，剩下的交给我们
3️⃣ 报价快、价稳、时效优 — 这个行业，稳定比什么都重要

空派 • 海派 • 海卡 • 整柜 • 散货 — 没有我们做不到的路线。

💡 有货要出？发我品名和地址，给你一个惊喜的价格！`,
      service: `🤝 不止是物流，更是你的供应链伙伴

很多客户问我：你们和别人有什么不一样？

📋 我们的服务体系：
• 全程轨迹可追踪，货物到哪一目了然
• 专业清关团队，降低查验风险
• 售后7×12小时响应，出了问题有人管
• 报价透明，无隐藏费用

美线整柜/散货DDP｜空派海派海卡全覆盖
全国提货 • 全美可派 • 价稳时效优

💬 想做美线？找我聊聊，给你最实在的方案！`,
    };
    return mockMarketing[subType] || mockMarketing.route;
  }

  const mockGreeting: Record<string, string> = {
    weekend: `☀️ 周末愉快！

辛苦了一周，好好犒劳一下自己～
陪陪家人、约约朋友，或者就是睡个好觉 😌

休息好了，下周继续加油！
有物流需求随时找我，一直都在～`,
    holiday: `🎊 ${holidayName || "节日"}快乐！

愿您阖家幸福，事事顺心 🌸
感谢一路以来的信任与支持。

美线物流，我随时待命 💪
有货要出？报价秒回！`,
    season: `🌸 换季了，注意身体！

最近气温变化大，记得及时增减衣物
照顾好自己和家人～

物流的事交给我，您只管安心
美线DDP双清到门，全国提货，全美可派 💼`,
    morning: `🌅 早安！

新的一天，新的开始
愿你今天元气满满，好事连连 ☀️

有物流需求随时找我
一直在你身边～`,
  };
  return mockGreeting[subType] || mockGreeting.weekend;
}

export default function BroadcastCopywriter() {
  const { theme, toggleTheme, isDark } = useTheme();

  // 主类型
  const [copyType, setCopyType] = useState<"marketing" | "greeting">("marketing");
  // 子类型
  const [marketingSubType, setMarketingSubType] = useState("route");
  const [greetingSubType, setGreetingSubType] = useState("weekend");
  // 语气
  const [tone, setTone] = useState("professional");
  // 节日名称（问候版用）
  const [holidayName, setHolidayName] = useState("");
  const [showHolidayPicker, setShowHolidayPicker] = useState(false);
  // 自定义补充
  const [customPrompt, setCustomPrompt] = useState("");
  // 生成中
  const [isGenerating, setIsGenerating] = useState(false);
  // 生成的文案
  const [generatedCopy, setGeneratedCopy] = useState("");
  // 历史记录
  const [history, setHistory] = useState<string[]>([]);

  const handleGenerate = async () => {
    if (isGenerating) return;

    const subType = copyType === "marketing" ? marketingSubType : greetingSubType;

    setIsGenerating(true);
    setGeneratedCopy("");

    try {
      toast.info("AI 正在为您创作文案，请稍候...");
      const result = await generateCopyWithAI({
        type: copyType,
        subType,
        tone,
        customPrompt,
        holidayName: copyType === "greeting" && greetingSubType === "holiday" ? holidayName : undefined,
      });
      setGeneratedCopy(result);
      setHistory((prev) => [result, ...prev].slice(0, 20));
      toast.success("文案生成成功！");
    } catch {
      // API 失败时使用 mock
      const mock = getMockCopy({
        type: copyType,
        subType,
        tone,
        holidayName: copyType === "greeting" && greetingSubType === "holiday" ? holidayName : undefined,
      });
      setGeneratedCopy(mock);
      setHistory((prev) => [mock, ...prev].slice(0, 20));
      toast("当前使用离线示例文案，联网后可获得更精准的AI生成", {
        icon: "⚠️",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCopy).then(() => {
      toast.success("已复制到剪贴板！");
    });
  };

  const handleRefresh = () => {
    handleGenerate();
  };

  const activeSubType = copyType === "marketing" ? marketingSubType : greetingSubType;
  const subTypes = copyType === "marketing" ? MARKETING_SUB_TYPES : GREETING_SUB_TYPES;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-4xl mx-auto"
    >
      {/* 头部导航 */}
      <div className="flex items-center justify-between mb-8">
        <Link
          to="/"
          className={`flex items-center text-sm ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"} transition-colors`}
        >
          <i className="fa-solid fa-arrow-left mr-2"></i>
          返回工具箱
        </Link>
        <ToolShortcuts theme={theme} isDark={isDark} />
      </div>

      {/* 标题 */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 mb-2"
        >
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br from-rose-400 to-pink-500 text-white shadow-lg`}>
            <i className="fa-solid fa-paper-plane"></i>
          </span>
        </motion.div>
        <motion.h1
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-2xl font-bold dark:text-white"
        >
          群发文案
        </motion.h1>
        <motion.p
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-gray-500 dark:text-gray-400 mt-1"
        >
          AI 智能生成微信/微信群发文案，营销转化 + 客户关怀一站搞定
        </motion.p>
      </div>

      {/* 类型切换 - 大标签 */}
      <div className="flex justify-center mb-8">
        <div className={`flex rounded-2xl p-1 ${isDark ? "bg-gray-800" : "bg-gray-200"}`}>
          <button
            onClick={() => setCopyType("marketing")}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              copyType === "marketing"
                ? "bg-gradient-to-r from-rose-400 to-pink-500 text-white shadow-lg"
                : `${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`
            }`}
          >
            <i className="fa-solid fa-bullhorn"></i>
            营销版
          </button>
          <button
            onClick={() => setCopyType("greeting")}
            className={`px-6 py-3 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
              copyType === "greeting"
                ? "bg-gradient-to-r from-emerald-400 to-teal-500 text-white shadow-lg"
                : `${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`
            }`}
          >
            <i className="fa-solid fa-heart"></i>
            问候版
          </button>
        </div>
      </div>

      {/* 主体：左右布局 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 左侧：配置面板 */}
        <div className={`lg:col-span-2 rounded-2xl p-5 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm border ${isDark ? "border-gray-700" : "border-gray-100"}`}>
          <h3 className="font-semibold text-sm mb-4 flex items-center gap-2 dark:text-white">
            <i className="fa-solid fa-sliders text-gray-400"></i>
            文案配置
          </h3>

          {/* 子类型选择 */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              {copyType === "marketing" ? "营销类型" : "问候类型"}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {subTypes.map((st) => (
                <button
                  key={st.value}
                  onClick={() => {
                    if (copyType === "marketing") setMarketingSubType(st.value);
                    else setGreetingSubType(st.value);
                  }}
                  className={`p-3 rounded-xl text-left text-xs transition-all border ${
                    activeSubType === st.value
                      ? copyType === "marketing"
                        ? "border-rose-300 bg-rose-50 dark:border-rose-500/30 dark:bg-rose-500/10"
                        : "border-emerald-300 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10"
                      : `${isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-200 hover:border-gray-300"}`
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <i className={`fa-solid ${st.icon} text-xs ${
                      activeSubType === st.value
                        ? copyType === "marketing" ? "text-rose-500" : "text-emerald-500"
                        : "text-gray-400"
                    }`}></i>
                    <span className={`font-medium ${
                      activeSubType === st.value
                        ? copyType === "marketing"
                          ? "text-rose-700 dark:text-rose-300"
                          : "text-emerald-700 dark:text-emerald-300"
                        : "dark:text-gray-300"
                    }`}>{st.label}</span>
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 leading-tight">{st.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 节日选择（问候版 + holiday） */}
          {copyType === "greeting" && greetingSubType === "holiday" && (
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                选择节日
              </label>
              <div className="relative">
                <button
                  onClick={() => setShowHolidayPicker(!showHolidayPicker)}
                  className={`w-full px-4 py-2.5 rounded-xl text-sm text-left border flex items-center justify-between transition-all ${
                    isDark
                      ? "bg-gray-700 border-gray-600 text-gray-200"
                      : "bg-gray-50 border-gray-200 text-gray-700"
                  }`}
                >
                  <span>{holidayName || "点击选择节日"}</span>
                  <i className={`fa-solid fa-chevron-down text-xs transition-transform ${showHolidayPicker ? "rotate-180" : ""}`}></i>
                </button>
                {showHolidayPicker && (
                  <div className={`absolute z-10 mt-1 w-full rounded-xl border shadow-lg p-2 grid grid-cols-3 gap-1 max-h-48 overflow-y-auto ${
                    isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
                  }`}>
                    {HOLIDAYS.map((h) => (
                      <button
                        key={h}
                        onClick={() => { setHolidayName(h); setShowHolidayPicker(false); }}
                        className={`px-2 py-1.5 text-xs rounded-lg transition-colors ${
                          holidayName === h
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300"
                            : `${isDark ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-100 text-gray-600"}`
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* 自定义节日输入 */}
              <input
                type="text"
                value={holidayName}
                onChange={(e) => setHolidayName(e.target.value)}
                placeholder="或直接输入节日名称..."
                className={`mt-2 w-full px-4 py-2 rounded-xl text-sm border ${
                  isDark
                    ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                    : "bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400"
                } focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              />
            </div>
          )}

          {/* 语气风格 */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              语气风格
            </label>
            <div className="grid grid-cols-4 gap-2">
              {TONE_STYLES.map((ts) => (
                <button
                  key={ts.value}
                  onClick={() => setTone(ts.value)}
                  className={`p-2 rounded-xl text-center text-xs transition-all border ${
                    tone === ts.value
                      ? "border-purple-300 bg-purple-50 dark:border-purple-500/30 dark:bg-purple-500/10"
                      : `${isDark ? "border-gray-700 hover:border-gray-600" : "border-gray-200 hover:border-gray-300"}`
                  }`}
                >
                  <i className={`fa-solid ${ts.icon} block mb-1 ${
                    tone === ts.value ? "text-purple-500" : "text-gray-400"
                  }`}></i>
                  <span className={tone === ts.value ? "text-purple-700 dark:text-purple-300 font-medium" : "dark:text-gray-400"}>
                    {ts.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* 自定义补充 */}
          <div className="mb-5">
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
              补充要求 <span className="text-gray-400">（可选）</span>
            </label>
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="例如：强调一下最近的旺季促销、加入公司电话 xxx 等..."
              rows={3}
              className={`w-full px-4 py-3 rounded-xl text-sm border resize-none ${
                isDark
                  ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-500"
                  : "bg-gray-50 border-gray-200 text-gray-700 placeholder-gray-400"
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
            />
          </div>

          {/* 生成按钮 */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className={`w-full py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
              isGenerating
                ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                : copyType === "marketing"
                  ? "bg-gradient-to-r from-rose-400 to-pink-500 hover:from-rose-500 hover:to-pink-600 text-white shadow-lg hover:shadow-xl"
                  : "bg-gradient-to-r from-emerald-400 to-teal-500 hover:from-emerald-500 hover:to-teal-600 text-white shadow-lg hover:shadow-xl"
            }`}
          >
            {isGenerating ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                AI 创作中...
              </>
            ) : (
              <>
                <i className="fa-solid fa-wand-magic-sparkles"></i>
                生成文案
              </>
            )}
          </button>
        </div>

        {/* 右侧：生成结果 + 历史 */}
        <div className="lg:col-span-3 space-y-4">
          {/* 结果卡片 */}
          <div className={`rounded-2xl p-6 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm border ${isDark ? "border-gray-700" : "border-gray-100"} min-h-[300px]`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-sm flex items-center gap-2 dark:text-white">
                <i className="fa-solid fa-file-lines text-gray-400"></i>
                生成结果
              </h3>
              {generatedCopy && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className={`p-2 rounded-lg text-xs transition-colors ${
                      isDark ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    }`}
                    title="复制文案"
                  >
                    <i className="fa-solid fa-copy"></i>
                  </button>
                  <button
                    onClick={handleRefresh}
                    disabled={isGenerating}
                    className={`p-2 rounded-lg text-xs transition-colors ${
                      isDark ? "hover:bg-gray-700 text-gray-400 hover:text-gray-200" : "hover:bg-gray-100 text-gray-500 hover:text-gray-700"
                    }`}
                    title="重新生成"
                  >
                    <i className={`fa-solid fa-rotate-right ${isGenerating ? "fa-spin" : ""}`}></i>
                  </button>
                </div>
              )}
            </div>

            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-4">
                <div className="relative w-12 h-12">
                  <div className={`absolute inset-0 rounded-full animate-ping opacity-30 ${
                    copyType === "marketing" ? "bg-rose-400" : "bg-emerald-400"
                  }`}></div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    copyType === "marketing" ? "bg-rose-400" : "bg-emerald-400"
                  } text-white`}>
                    <i className="fa-solid fa-pen-fancy"></i>
                  </div>
                </div>
                <p className={`text-sm ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  AI 正在精心打磨文案...
                </p>
              </div>
            ) : generatedCopy ? (
              <div
                className={`prose prose-sm max-w-none ${isDark ? "prose-invert" : ""} whitespace-pre-wrap text-sm leading-relaxed`}
                dangerouslySetInnerHTML={{
                  __html: generatedCopy
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-inherit">$1</strong>')
                    .replace(/\n/g, "<br/>"),
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? "bg-gray-700" : "bg-gray-100"}`}>
                  <i className={`fa-solid fa-paper-plane text-2xl ${isDark ? "text-gray-500" : "text-gray-400"}`}></i>
                </div>
                <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  选择配置后点击「生成文案」
                </p>
                <p className={`text-xs ${isDark ? "text-gray-600" : "text-gray-300"}`}>
                  左侧配置营销/问候类型、语气风格等
                </p>
              </div>
            )}
          </div>

          {/* 历史记录 */}
          {history.length > 0 && (
            <div className={`rounded-2xl p-5 ${isDark ? "bg-gray-800" : "bg-white"} shadow-sm border ${isDark ? "border-gray-700" : "border-gray-100"}`}>
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2 dark:text-white">
                <i className="fa-solid fa-clock-rotate-left text-gray-400"></i>
                历史记录
                <span className={`text-xs ml-1 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  (最近 {history.length} 条)
                </span>
              </h3>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {history.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs cursor-pointer transition-colors ${
                      isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"
                    } ${idx === 0 ? (isDark ? "bg-gray-700/50" : "bg-gray-50") : ""}`}
                    onClick={() => setGeneratedCopy(item)}
                  >
                    <p className={`line-clamp-2 ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                      {item.slice(0, 100)}...
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
