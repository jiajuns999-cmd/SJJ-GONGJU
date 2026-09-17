import { useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';

const navItems = [
  { to: '/', label: '首页' },
  { to: '/text-quote', label: '文字报价' },
  { to: '/full-container-text-quote', label: '整柜文字报价' },
  { to: '/combined-calculator', label: '计算工具' },
  { to: '/weight-price-calculator', label: '核价工具' },
  { to: '/tracking-number-generator', label: '进仓单生成' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { isDark, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const linkClass = (to: string) =>
    `px-3 py-1.5 rounded-lg text-sm transition-colors ${
      pathname === to
        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
        : 'text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10'
    }`;

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      <nav className="sticky top-0 z-50 backdrop-blur-lg bg-white/70 dark:bg-gray-900/70 border-b border-white/20 dark:border-gray-700/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <Link to="/" className="font-bold text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent whitespace-nowrap">
            沈家俊工具箱
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.slice(1).map((item) => (
              <Link key={item.to} to={item.to} className={linkClass(item.to)}>
                {item.label}
              </Link>
            ))}
            <button
              onClick={toggleTheme}
              aria-label="切换主题"
              className="ml-2 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200"
            >
              {isDark ? <i className="fa-solid fa-sun"></i> : <i className="fa-solid fa-moon"></i>}
            </button>
          </div>

          <button
            className="md:hidden p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200"
            onClick={() => setOpen((o) => !o)}
            aria-label="菜单"
          >
            <i className={`fa-solid ${open ? 'fa-xmark' : 'fa-bars'}`}></i>
          </button>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden overflow-hidden border-t border-white/20 dark:border-gray-700/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg"
            >
              <div className="px-4 py-2 flex flex-col">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setOpen(false)}
                    className={`px-3 py-2 rounded-lg text-sm ${pathname === item.to ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-700 dark:text-gray-200'}`}
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  onClick={() => {
                    toggleTheme();
                    setOpen(false);
                  }}
                  className="mt-1 px-3 py-2 rounded-lg text-sm text-left text-gray-700 dark:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10"
                >
                  {isDark ? '切换浅色模式' : '切换深色模式'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
