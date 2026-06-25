import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ToolShortcuts from "@/components/ToolShortcuts";
import AITextRecognizer from "@/components/AITextRecognizer";

// 定义询价信息接口
interface InquiryData {
  country: string;
  product: string;
  items: Array<{
    length: number;
    width: number;
    height: number;
    weight: number;
    quantity: number;
  }>;
  totalWeight: string;
  totalVolume: string;
  zipCode: string;
  address: string;
  serviceProvider: string;
  channel: string;
  remarks: string;
}

export default function InquiryOrganizer() {
  const { isDark } = useTheme();
  
  // 询价数据状态
  const [inquiryData, setInquiryData] = useState<InquiryData>({
    country: "",
    product: "",
    items: [],
    totalWeight: "",
    totalVolume: "",
    zipCode: "",
    address: "",
    serviceProvider: "",
    channel: ""
  });
  
  // 生成的询价文本状态
  const [generatedText, setGeneratedText] = useState<string>("");
  
  // 自动计算总重量和总方数
  const calculateTotals = (items: InquiryData['items']) => {
    let totalWeight = 0;
    let totalVolume = 0;
    
    items.forEach(item => {
      // 计算总重量: 单件重量 * 件数
      totalWeight += item.weight * item.quantity;
      
      // 计算总方数: 长(米) * 宽(米) * 高(米) * 件数
      // 注意: 这里需要将厘米转换为米 (除以100)
      const volumeCBM = (item.length / 100) * (item.width / 100) * (item.height / 100) * item.quantity;
      totalVolume += volumeCBM;
    });
    
    return {
      totalWeight: totalWeight.toFixed(2),
      totalVolume: totalVolume.toFixed(2)
    };
  };
  
  // 处理输入变化
  const handleInputChange = (field: keyof InquiryData, value: string | number | any[]) => {
    setInquiryData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // 处理尺寸项变化
  const handleItemChange = (index: number, field: keyof InquiryData['items'][0], value: number) => {
    const updatedItems = [...inquiryData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value
    };
    
    // 计算并更新总重量和总方数
    const { totalWeight, totalVolume } = calculateTotals(updatedItems);
    
    setInquiryData(prev => ({
      ...prev,
      items: updatedItems,
      totalWeight,
      totalVolume
    }));
  };
  
  // 添加尺寸项
  const addItem = () => {
    const newItems = [...inquiryData.items, { length: 0, width: 0, height: 0, weight: 0, quantity: 1 }];
    
    // 计算并更新总重量和总方数
    const { totalWeight, totalVolume } = calculateTotals(newItems);
    
    setInquiryData(prev => ({
      ...prev,
      items: newItems,
      totalWeight,
      totalVolume
    }));
  };
  
  // 删除尺寸项
  const removeItem = (index: number) => {
    if (inquiryData.items.length <= 1) {
      toast.error("至少需要保留一个尺寸项");
      return;
    }
    const updatedItems = inquiryData.items.filter((_, i) => i !== index);
    
    // 计算并更新总重量和总方数
    const { totalWeight, totalVolume } = calculateTotals(updatedItems);
    
    setInquiryData(prev => ({
      ...prev,
      items: updatedItems,
      totalWeight,
      totalVolume
    }));
  };
  
   // 生成询价文本
   const generateInquiryText = (latestData?: InquiryData) => {
     const d = latestData ?? inquiryData;
     let text = `询价--${d.serviceProvider || ""}--${d.channel || ""}\n`;
     text += `国家；${d.country || ""}\n`;
     text += `品名；${d.product || ""}\n`;
     
     // 处理尺寸信息
     text += "尺寸:\n";
     if (d.items.length > 0) {
       d.items.forEach((item, index) => {
         if (item.length > 0 && item.width > 0 && item.height > 0) {
           text += `${index + 1}. 长${item.length}cm × 宽${item.width}cm × 高${item.height}cm × ${item.weight}kg × ${item.quantity}件\n`;
         }
       });
     }
     
     text += `总重量；${d.totalWeight || ""}\n`;
     text += `总方数；${d.totalVolume || ""}\n`;
     text += `邮编；${d.zipCode || ""}\n`;
     text += `地址；${d.address || ""}\n`;
     if (d.remarks) {
       text += `备注；${d.remarks}\n`;
     }
     
     setGeneratedText(text);
   };
  
  // 复制询价文本
  const copyInquiryText = () => {
    navigator.clipboard.writeText(generatedText);
    toast.success("询价文本已复制到剪贴板");
  };
  
  // 处理AI识别结果
  const handleAIRecognize = (data: any) => {
    // 处理识别结果并填充到表单
    const items = data.items && Array.isArray(data.items) ? data.items : [];
    
    // 计算并更新总重量和总方数
    const { totalWeight, totalVolume } = calculateTotals(items);
    
    // 保留已填写的 serviceProvider 和 channel，只更新 AI 识别字段
    setInquiryData(prev => ({
      ...prev,
      country: data.country || "",
      product: data.product || "",
      items,
      totalWeight: data.totalWeight || totalWeight,
      totalVolume: data.totalVolume || totalVolume,
      zipCode: data.zipCode || "",
      address: data.address || ""
    }));
    // useEffect 监听 inquiryData 变化，自动触发 generateInquiryText
  };
  
  // 重置表单
  const resetForm = () => {
    setInquiryData({
      country: "",
      product: "",
      items: [],
      totalWeight: "",
      totalVolume: "",
      zipCode: "",
      address: "",
      serviceProvider: "",
      channel: "",
      remarks: ""
    });
    setGeneratedText("");
    toast.info("已重置表单内容");
  };
  
  // 监听items变化，自动计算总重量和总方数
  useEffect(() => {
    if (inquiryData.items.length > 0) {
      const { totalWeight, totalVolume } = calculateTotals(inquiryData.items);
      setInquiryData(prev => ({
        ...prev,
        totalWeight,
        totalVolume
      }));
    }
  }, [inquiryData.items]);
  
  // 实时生成询价文本（传入最新 state 避免 stale closure）
  useEffect(() => {
    generateInquiryText(inquiryData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inquiryData]);
  
  return (
    <div className="min-h-[calc(100vh-32px)] flex flex-col">
      {/* 头部区域 */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link to="/" className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <i className="fa-solid fa-arrow-left mr-2"></i>返回首页
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">询价信息整理工具</h1>
          <div className="flex justify-end">
            <AITextRecognizer 
              toolType="inquiryOrganizer"
              onRecognize={handleAIRecognize}
              placeholder="请输入询价相关文本，AI将识别国家、品名、尺寸、总重量、总方数、邮编、地址等信息..."
            />
          </div>
        </div>
      </header>
      
      {/* 其他工具快捷按钮 */}
      <div className="mb-6">
        <ToolShortcuts excludeToolId="inquiry-organizer" showOnlyButtons={true} />
      </div>
      
      {/* 主要内容区域 */}
      <main className="flex-grow">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧表单区域 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold mb-6 dark:text-white">填写询价信息</h2>
            
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 服务商 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  服务商
                </label>
                <input 
                  type="text" 
                  value={inquiryData.serviceProvider}
                  onChange={(e) => handleInputChange('serviceProvider', e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="请输入服务商名称"
                />
              </div>
              
              {/* 渠道 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  渠道
                </label>
                <select 
                  value={inquiryData.channel}
                  onChange={(e) => handleInputChange('channel', e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none cursor-pointer`}
                >
                  <option value="">请选择渠道</option>
                  <option value="海卡DDP">海卡DDP</option>
                  <option value="海派DDP">海派DDP</option>
                  <option value="空卡DDP">空卡DDP</option>
                  <option value="空派DDP">空派DDP</option>
                </select>
              </div>
              
              {/* 国家 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  国家 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={inquiryData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="请输入国家名称"
                />
              </div>
              
              {/* 品名 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  品名 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={inquiryData.product}
                  onChange={(e) => handleInputChange('product', e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="请输入品名"
                />
              </div>
              
              {/* 尺寸信息 */}
              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    尺寸信息 <span className="text-red-500">*</span>
                  </label>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={addItem}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center"
                  >
                    <i className="fa-solid fa-plus mr-1"></i>添加尺寸项
                  </motion.button>
                </div>
                
                {inquiryData.items.length === 0 ? (
                  <div className="p-4 border border-dashed border-gray-300 dark:border-gray-600 rounded-xl text-center text-gray-500 dark:text-gray-400 mb-4">
                    <p className="mb-2">暂无尺寸信息</p>
                    <button 
                      onClick={addItem}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm transition-all"
                    >
                      添加尺寸项
                    </button>
                  </div>
                ) : (
                  inquiryData.items.map((item, index) => (
                    <div key={index} className="p-4 bg-gray-50 dark:bg-gray-750 rounded-xl border border-gray-200 dark:border-gray-700 mb-3">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-medium text-sm">尺寸项 {index + 1}</h3>
                        {inquiryData.items.length > 1 && (
                          <button
                            onClick={() => removeItem(index)}
                            className="text-red-500 hover:text-red-600"
                            aria-label="删除"
                          >
                            <i className="fa-solid fa-times"></i>
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-5 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">长 (cm)</label>
                          <input 
                            type="number" 
                            value={item.length}
                            onChange={(e) => handleItemChange(index, 'length', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                              isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">宽 (cm)</label>
                          <input 
                            type="number" 
                            value={item.width}
                            onChange={(e) => handleItemChange(index, 'width', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                              isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">高 (cm)</label>
                          <input 
                            type="number" 
                            value={item.height}
                            onChange={(e) => handleItemChange(index, 'height', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                              isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">重量 (kg)</label>
                          <input 
                            type="number" 
                            value={item.weight}
                            onChange={(e) => handleItemChange(index, 'weight', parseFloat(e.target.value) || 0)}
                            min="0"
                            step="0.01"
                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                              isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">件数</label>
                          <input 
                            type="number" 
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                            min="1"
                            step="1"
                            className={`w-full px-3 py-1.5 text-sm rounded-lg border ${
                              isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-white border-gray-200"
                            } focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all`}
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {/* 总重量 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  总重量
                </label>
                <input 
                  type="text" 
                  value={inquiryData.totalWeight}
                  readOnly
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-opacity-70`}
                  placeholder="自动计算"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <i className="fa-solid fa-calculator mr-1"></i>自动计算：单件重量 × 件数
                </p>
              </div>
              
              {/* 总方数 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  总方数
                </label>
                <input 
                  type="text" 
                  value={inquiryData.totalVolume}
                  readOnly
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-opacity-70`}
                  placeholder="自动计算"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <i className="fa-solid fa-calculator mr-1"></i>自动计算：长×宽×高(米) × 件数
                </p>
              </div>
              
              {/* 邮编 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  邮编
                </label>
                <input 
                  type="text" 
                  value={inquiryData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="请输入邮编"
                />
              </div>
              

               
               {/* 地址 */}
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   地址
                 </label>
                 <textarea
                   value={inquiryData.address}
                   onChange={(e) => handleInputChange('address', e.target.value)}
                   className={`w-full px-4 py-2 rounded-xl border ${
                     isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                   placeholder="请输入地址"
                   rows={3}
                 ></textarea>
               </div>
               
               {/* 备注 */}
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   备注
                 </label>
                 <textarea
                   value={inquiryData.remarks}
                   onChange={(e) => handleInputChange('remarks', e.target.value)}
                   className={`w-full px-4 py-2 rounded-xl border ${
                     isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                   placeholder="请输入备注信息（将同步到询价文本）"
                   rows={2}
                 ></textarea>
               </div>
            </div>
            
             {/* 操作按钮 */}
             <div className="flex flex-wrap gap-3">
               <motion.button
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={resetForm}
                 className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center"
               >
                 <i className="fa-solid fa-undo-alt mr-2"></i>重置表单
               </motion.button>
             </div>
          </motion.div>
          
          {/* 右侧询价文本区域 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-full flex flex-col"
          >
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
               <h2 className="text-xl font-bold dark:text-white">
                 <i className="fa-solid fa-file-alt mr-2 text-blue-500"></i>实时询价文本
               </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={copyInquiryText}
                disabled={!generatedText}
                className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center whitespace-nowrap ${
                  !generatedText 
                    ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" 
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
              >
                <i className="fa-solid fa-copy mr-1"></i>一键复制
              </motion.button>
            </div>
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl font-mono text-sm border border-gray-200 dark:border-gray-700 mb-6 flex-grow overflow-y-auto"
            >
              {generatedText ? (
                <pre className="whitespace-pre-wrap break-words text-left">{generatedText}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 dark:text-gray-400">
                  <i className="fa-solid fa-file-lines text-4xl mb-4"></i>
                  <p>点击"生成询价文本"按钮生成统一格式的询价信息</p>
                </div>
              )}
            </motion.div>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-start">
                <i className="fa-solid fa-info-circle mt-0.5 mr-1 text-blue-500"></i>
                生成的询价文本可直接用于询价，方便快捷，减少手动整理工作。
              </p>
               <p className="flex items-start mt-2">
                 <i className="fa-solid fa-calculator mt-0.5 mr-1 text-green-500"></i>
                 系统已自动计算总重量和总方数，并且实时更新询价文本。
               </p>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* 底部区域 */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 沈家俊工具箱 - 询价信息整理工具</p>
      </footer>
    </div>
  );
}