import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

  // 工具项目数据
  const tools = [
    {
      id: 'text-quote',
      title: '文字报价',
      description: '根据文字内容快速计算报价',
      icon: 'fa-file-alt',
      color: 'from-blue-400 to-indigo-500',
      link: '/text-quote'
    },
    {
      id: 'inquiry-organizer',
      title: '询价整理',
      description: 'AI识别信息并生成统一格式的询价信息',
      icon: 'fa-file-alt',
      color: 'from-indigo-400 to-purple-500',
      link: '/inquiry-organizer'
    },
    {
      id: 'full-container-text-quote',
      title: '整柜文字报价',
      description: '整柜运输费用计算与文字报价生成',
      icon: 'fa-shipping-fast',
      color: 'from-cyan-400 to-blue-500',
      link: '/full-container-text-quote'
    },
    {
      id: 'combined-calculator',
      title: '计算工具',
      description: '计算货物的体积重、计费重量和重货方价',
      icon: 'fa-calculator',
      color: 'from-green-400 to-teal-500',
      link: '/combined-calculator'
    },
    {
      id: 'weight-price-calculator',
      title: '核价工具',
      description: '输入相关信息自动计算总价并生成报价文本',
      icon: 'fa-calculator-dollar',
      color: 'from-amber-400 to-orange-500',
      link: '/weight-price-calculator'
    },
    {
      id: 'tracking-number-generator',
      title: '进仓单生成',
      description: '生成符合特定格式的物流单号',
      icon: 'fa-file-invoice',
      color: 'from-purple-400 to-pink-500',
      link: '/tracking-number-generator'
    },
    {
      id: 'broadcast-copywriter',
      title: '群发文案',
      description: 'AI 一键生成微信群发文案，营销推广与问候关怀全覆盖',
      icon: 'fa-paper-plane',
      color: 'from-rose-400 to-pink-500',
      link: '/broadcast-copywriter'
    }
  ];

export default function Home() {
  const { theme, toggleTheme, isDark } = useTheme();
  
  return (
    <div className="min-h-[calc(100vh-32px)] flex flex-col">
      {/* 头部区域 */}
      <header className="mb-12 text-center">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            沈家俊工具箱
          </h1>
          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            专业的物流与文字服务工具集合，让您的工作更加高效便捷
          </p>
        </motion.div>
        
        {/* 主题切换按钮 */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="mt-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
          onClick={toggleTheme}
        >
          {isDark ? (
            <i className="fa-solid fa-sun text-xl"></i>
          ) : (
            <i className="fa-solid fa-moon text-xl"></i>
          )}
        </motion.button>
      </header>
      
      {/* 工具卡片区域 */}
      <main className="flex-grow">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="h-[220px]"
              >
                <Link to={tool.link} className="block group h-full">
                   <div className={`h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-500 flex flex-col transform group-hover:-translate-y-2 group-hover:rotate-[0.5deg] shadow-lg group-hover:shadow-2xl relative`}>
                      {/* 3D效果背景渐变和光效 */}
                      <div className={`absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 dark:from-gray-800/0 dark:to-gray-700/10 pointer-events-none`}></div>
                      <div className={`absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent dark:from-gray-700/20 dark:to-transparent opacity-30 blur-sm pointer-events-none`}></div>
                      
                      {/* 增强的立体阴影层 */}
                      <div className={`absolute -inset-[1px] bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-20 blur-sm rounded-xl transform scale-[1.02] transition-all duration-500 pointer-events-none`}></div>
                      
                      {/* 渐变头部 */}
                      <div className={`h-2 bg-gradient-to-r ${tool.color}`}></div>
                      
                      {/* 内容区域 */}
                      <div className="p-5 flex flex-col flex-grow relative z-10">
                        <div className={`w-12 h-12 rounded-full mb-4 flex items-center justify-center bg-gradient-to-br ${tool.color} text-white shadow-lg transform transition-transform duration-300 group-hover:scale-110`}>
                          <i className={`fa-solid ${tool.icon} text-lg`}></i>
                        </div>
                        <h3 className="text-lg font-bold mb-2 dark:text-white">{tool.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 flex-grow line-clamp-2">{tool.description}</p>
                        <div className="flex items-center text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors">
                          <span className="text-sm">使用工具</span>
                          <i className="fa-solid fa-arrow-right ml-2 transform group-hover:translate-x-1 transition-transform"></i>
                        </div>
                      </div>
                      
                      {/* 底部装饰条 */}
                      <div className={`h-2 bg-gradient-to-r ${tool.color} opacity-70`}></div>
                    </div>
                </Link>
              </motion.div>
          ))}
        </div>
      </main>
      
      {/* 底部区域 */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 沈家俊工具箱 - 专业的工具集合</p>
      </footer>
    </div>
  );
}