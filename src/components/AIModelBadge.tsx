import { useState } from "react";

const TEXT_MODEL = "deepseek-ai/DeepSeek-V4-Pro";
const VISION_MODEL = "Qwen/Qwen2.5-VL-72B-Instruct";

export default function AIModelBadge() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        onClick={() => setExpanded(!expanded)}
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-full
          bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm
          border border-gray-200 dark:border-gray-700
          shadow-sm hover:shadow-md
          cursor-pointer select-none
          transition-all duration-300
          ${expanded ? "max-w-xs" : "max-w-[120px]"}
        `}
      >
        <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
        <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
          {expanded ? (
            <span className="flex flex-col gap-0.5 whitespace-nowrap">
              <span>文本: {TEXT_MODEL}</span>
              <span>视觉: {VISION_MODEL}</span>
            </span>
          ) : (
            <span className="truncate">{TEXT_MODEL}</span>
          )}
        </span>
      </div>
    </div>
  );
}
