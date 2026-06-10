import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

// 定义工具类型
interface Tool {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  link: string;
}

  // 工具数据
  const tools: Tool[] = [
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
  }
]

interface ToolShortcutsProps {
  excludeToolId?: string; // 排除当前工具
  showOnlyButtons?: boolean; // 只显示按钮，不显示工具框
}

const ToolShortcuts: React.FC<ToolShortcutsProps> = ({ excludeToolId, showOnlyButtons = false }) => {
  // 过滤掉当前工具
  const displayTools = excludeToolId 
    ? tools.filter(tool => tool.id !== excludeToolId)
    : tools;

  return (
    <>
      {/* 只显示按钮的版本 */}
      {showOnlyButtons ? (
        <div className="flex flex-wrap gap-2">
              {displayTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="h-auto"
                >
                  <Link
                    to={tool.link}
                     className={`flex items-center px-3 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-500 hover:bg-gray-50 dark:hover:bg-gray-750 shadow-sm hover:shadow-md transform hover:-translate-y-1 hover:rotate-[0.5deg] relative group`}
                   >
                     {/* 增强的立体阴影层 */}
                     <div className={`absolute -inset-[0.5px] bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-20 blur-sm rounded-lg transform scale-[1.03] transition-all duration-500 pointer-events-none`}></div>
                     
                     <div className={`w-6 h-6 rounded-full mr-2 flex items-center justify-center bg-gradient-to-br ${tool.color} text-white shadow-sm transform transition-transform duration-300 group-hover:scale-110`}>
                       <i className={`fa-solid ${tool.icon} text-xs`}></i>
                     </div>
                     <span className="text-xs font-medium dark:text-white relative z-10">{tool.title}</span>
                  </Link>
                </motion.div>
              ))}
        </div>
      ) : (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4 text-gray-700 dark:text-gray-300 flex items-center">
            <i className="fa-solid fa-tools mr-2 text-blue-500"></i>
            其他工具
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {displayTools.map((tool) => (
                <motion.div
                  key={tool.id}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="h-auto"
                >
                  <Link
                     to={tool.link}
                     className={`block h-full rounded-xl overflow-hidden bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 transition-all duration-500 shadow-md hover:shadow-xl transform hover:-translate-y-2 hover:rotate-[0.5deg] relative`}
                   >
                     {/* 3D效果背景渐变和光效 */}
                     <div className={`absolute inset-0 bg-gradient-to-br from-white/0 to-white/10 dark:from-gray-800/0 dark:to-gray-700/10 pointer-events-none`}></div>
                     <div className={`absolute inset-0 bg-gradient-to-tr from-white/30 to-transparent dark:from-gray-700/20 dark:to-transparent opacity-30 blur-sm pointer-events-none`}></div>
                     
                     {/* 增强的立体阴影层 */}
                     <div className={`absolute -inset-[0.5px] bg-gradient-to-r ${tool.color} opacity-0 group-hover:opacity-20 blur-sm rounded-xl transform scale-[1.02] transition-all duration-500 pointer-events-none`}></div>
                     
                     <div className={`h-1.5 bg-gradient-to-r ${tool.color}`}></div>
                     <div className="p-3 flex flex-col items-center text-center relative z-10">
                       <div className={`w-9 h-9 rounded-full mb-2 flex items-center justify-center bg-gradient-to-br ${tool.color} text-white shadow-md transform transition-transform duration-300 group-hover:scale-110`}>
                         <i className={`fa-solid ${tool.icon} text-sm`}></i>
                       </div>
                       <h4 className="text-xs font-medium mb-1 dark:text-white">{tool.title}</h4>
                       <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{tool.description}</p>
                     </div>
                     
                     {/* 底部装饰条 */}
                     <div className={`h-1.5 bg-gradient-to-r ${tool.color} opacity-70`}></div>
                  </Link>
                </motion.div>
              ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ToolShortcuts;