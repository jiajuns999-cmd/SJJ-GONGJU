import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ToolShortcuts from "@/components/ToolShortcuts";
import AITextRecognizer from "@/components/AITextRecognizer";
import { extractField } from "@/lib/aiService";

// 定义报价历史记录接口
interface QuoteHistory {
  id: string;
  timestamp: Date;
  project: string;
  destination: string;
  totalPrice: string;
  note: string;
}

// 定义表单数据接口
interface FormData {
  productName: string; // 品名
  hsCode: string; // HS编码
  declaredValue: string; // 货值
  containerType: string; // 柜型字段
  destination: string;
  seaFreight: string;
  domesticPortFee: string;
  foreignCustomsDuty: string;
  domesticTruckingFee: string;
  foreignTruckingFee: string;
  foreignPortFee: string;
  exchangeRate: string;
  note: string;
  receiverAddress: string; // 收件地址字段
  shippingCompany: string; // 新增船公司字段
}

export default function FullContainerTextQuote() {
  const { isDark } = useTheme();
  
  // 表单数据状态
  const [formData, setFormData] = useState<FormData>({
    productName: "",
    hsCode: "",
    declaredValue: "",
    containerType: "", // 柜型字段
    destination: "",
    seaFreight: "",
    domesticPortFee: "",
    foreignCustomsDuty: "",
    domesticTruckingFee: "",
    foreignTruckingFee: "",
    foreignPortFee: "700", // 国外港杂默认填入700
    exchangeRate: "7.2", // 默认汇率
    note: "", // 备注字段
    receiverAddress: "", // 收件地址字段
    shippingCompany: "" // 新增船公司字段
  });
  
  // 计算结果状态
  const [usdTotal, setUsdTotal] = useState<string>("0.00");
  const [rmbTotal, setRmbTotal] = useState<string>("0.00");
  const [quoteTotal, setQuoteTotal] = useState<string>("0.00");
  const [generatedText, setGeneratedText] = useState<string | null>(null);
  
  // 历史记录状态
  const [history, setHistory] = useState<QuoteHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  // 加载历史记录
  useEffect(() => {
    const savedHistory = localStorage.getItem("fullContainerQuoteHistory");
    if (savedHistory) {
      try {
        const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })) as QuoteHistory[];
        setHistory(parsedHistory);
      } catch (error) {
        console.error("Failed to load quote history:", error);
      }
    }
  }, []);
  
  // 保存历史记录
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("fullContainerQuoteHistory", JSON.stringify(history));
    }
  }, [history]);
  
  // 实时计算各种费用
  useEffect(() => {
    // 计算美元费用总和
    const seaFreight = parseFloat(formData.seaFreight) || 0;
    const foreignCustomsDuty = parseFloat(formData.foreignCustomsDuty) || 0;
    const foreignTruckingFee = parseFloat(formData.foreignTruckingFee) || 0;
    const foreignPortFee = parseFloat(formData.foreignPortFee) || 0;
    
    const totalUSD = seaFreight + foreignCustomsDuty + foreignTruckingFee + foreignPortFee;
    setUsdTotal(totalUSD.toFixed(2));
    
    // 计算人民币费用总和
    const domesticPortFee = parseFloat(formData.domesticPortFee) || 0;
    const domesticTruckingFee = parseFloat(formData.domesticTruckingFee) || 0;
    
    const totalRMB = domesticPortFee + domesticTruckingFee;
    setRmbTotal(totalRMB.toFixed(2));
    
    // 计算最终报价总额
    const exchangeRate = parseFloat(formData.exchangeRate) || 0;
    const totalQuote = totalUSD * exchangeRate + totalRMB;
    setQuoteTotal(totalQuote.toFixed(2));
  }, [formData]);
  
  // 生成报价文本
  useEffect(() => {
    const text = buildQuoteText();
    setGeneratedText(text);
  }, [formData, usdTotal, rmbTotal, quoteTotal]);
  
  // 构建报价文本
  const buildQuoteText = () => {
    let quoteText = "";
    
  // 添加产品信息
  quoteText += `产品信息：${formData.productName || "未指定"}`;
  if (formData.hsCode) {
    quoteText += `
  HS编码：${formData.hsCode}`;
  }
  if (formData.declaredValue) {
    quoteText += `
  货值：${formData.declaredValue}`;
  }
  
   // 添加柜型信息
  if (formData.containerType) {
    quoteText += `
  柜型：${formData.containerType}`;
  }
  
  // 添加船公司信息
  if (formData.shippingCompany) {
    quoteText += `
  船公司：${formData.shippingCompany}`;
  }
    
    // 添加目的港
    if (formData.destination) {
      quoteText += `
目的港：${formData.destination}`;
    }
    
    // 添加收件地址
    if (formData.receiverAddress) {
      quoteText += `
收件地址：${formData.receiverAddress}`;
    }
    
    // 添加费用明细
    quoteText += `

费用明细：`;
    
    // 美元费用
    if (parseFloat(formData.seaFreight) > 0) {
      quoteText += `
- 海运费：$${formData.seaFreight}`;
    }
    
    if (parseFloat(formData.foreignCustomsDuty) > 0) {
      quoteText += `
- 国外关税：$${formData.foreignCustomsDuty}`;
    }
    
    if (parseFloat(formData.foreignTruckingFee) > 0) {
      quoteText += `
- 国外拖车费：$${formData.foreignTruckingFee}`;
    }
    
    if (parseFloat(formData.foreignPortFee) > 0) {
      quoteText += `
- 国外港杂：$${formData.foreignPortFee}`;
    }
    
    // 人民币费用
    if (parseFloat(formData.domesticPortFee) > 0) {
      quoteText += `
- 国内港杂：¥${formData.domesticPortFee}`;
    }
    
    if (parseFloat(formData.domesticTruckingFee) > 0) {
      quoteText += `
- 国内拖车费：¥${formData.domesticTruckingFee}`;
    }
    
    // 添加汇率信息
    quoteText += `

汇率：1美元 = ${formData.exchangeRate}人民币`;
    
    // 添加费用总计
    quoteText += `

费用总计：`;
    
    // 美元总计
    if (parseFloat(usdTotal) > 0) {
      quoteText += `
- 美元总计：$${usdTotal}`;
    }
    
    // 人民币总计
    if (parseFloat(rmbTotal) > 0) {
      quoteText += `
- 人民币总计：¥${rmbTotal}`;
    }
    
    // 最终报价
    quoteText += `

最终报价：¥${quoteTotal}`;
    
  // 添加备注信息
  if (formData.note) {
    quoteText += `
    
  备注：${formData.note}`;
  }
  
  // 不显示计算公式
    return quoteText;
  };
  
  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // 复制报价文本
  const copyQuoteText = () => {
    if (generatedText) {
      navigator.clipboard.writeText(generatedText);
      toast.success("报价文本已复制到剪贴板");
    }
  };
  
// 导出报价单为Word文档
  const exportQuoteAsWord = () => {
    if (!generatedText) return;
    
    // 创建表格HTML内容
    let tableRows = `
      <tr>
        <th class="border px-4 py-2 bg-gray-100 text-left">项目</th>
        <th class="border px-4 py-2 bg-gray-100 text-left">内容</th>
      </tr>
    `;
    
    // 添加产品信息
    if (formData.productName) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">品名</td>
          <td class="border px-4 py-2">${formData.productName}</td>
        </tr>
      `;
    }
    
    // 添加HS编码
    if (formData.hsCode) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">HS编码</td>
          <td class="border px-4 py-2">${formData.hsCode}</td>
        </tr>
      `;
    }
    
    // 添加货值
    if (formData.declaredValue) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">货值</td>
          <td class="border px-4 py-2">${formData.declaredValue}</td>
        </tr>
      `;
    }
    
     // 添加柜型信息
  if (formData.containerType) {
    tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">柜型</td>
          <td class="border px-4 py-2">${formData.containerType}</td>
        </tr>
      `;
  }
  
  // 添加船公司信息
  if (formData.shippingCompany) {
    tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">船公司</td>
          <td class="border px-4 py-2">${formData.shippingCompany}</td>
        </tr>
      `;
    }
    
    // 添加目的港
    if (formData.destination) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">目的港</td>
          <td class="border px-4 py-2">${formData.destination}</td>
        </tr>
      `;
    }
    
    // 添加收件地址
    if (formData.receiverAddress) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">收件地址</td>
          <td class="border px-4 py-2">${formData.receiverAddress}</td>
        </tr>
      `;
    }
    
    // 添加汇率
    tableRows += `
      <tr>
        <td class="border px-4 py-2 font-medium">汇率</td>
        <td class="border px-4 py-2">1美元 = ${formData.exchangeRate}人民币</td>
      </tr>
    `;
    
    // 添加费用明细标题
    tableRows += `
      <tr>
        <td class="border px-4 py-2 font-medium bg-blue-50" colspan="2">费用明细</td>
      </tr>
    `;
    
    // 添加美元费用
    if (parseFloat(formData.seaFreight) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">海运费</td>
          <td class="border px-4 py-2">$${formData.seaFreight}</td>
        </tr>
      `;
    }
    
    if (parseFloat(formData.foreignCustomsDuty) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">国外关税</td>
          <td class="border px-4 py-2">$${formData.foreignCustomsDuty}</td>
        </tr>
      `;
    }
    
    if (parseFloat(formData.foreignTruckingFee) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">国外拖车费</td>
          <td class="border px-4 py-2">$${formData.foreignTruckingFee}</td>
        </tr>
      `;
    }
    
    if (parseFloat(formData.foreignPortFee) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">国外港杂</td>
          <td class="border px-4 py-2">$${formData.foreignPortFee}</td>
        </tr>
      `;
    }
    
    // 添加人民币费用
    if (parseFloat(formData.domesticPortFee) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">国内港杂</td>
          <td class="border px-4 py-2">¥${formData.domesticPortFee}</td>
        </tr>
      `;
    }
    
    if (parseFloat(formData.domesticTruckingFee) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">国内拖车费</td>
          <td class="border px-4 py-2">¥${formData.domesticTruckingFee}</td>
        </tr>
      `;
    }
    
    // 添加费用总计标题
    tableRows += `
      <tr>
        <td class="border px-4 py-2 font-medium bg-green-50" colspan="2">费用总计</td>
      </tr>
    `;
    
    // 添加美元总计
    if (parseFloat(usdTotal) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">美元总计</td>
          <td class="border px-4 py-2">$${usdTotal}</td>
        </tr>
      `;
    }
    
    // 添加人民币总计
    if (parseFloat(rmbTotal) > 0) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium">人民币总计</td>
          <td class="border px-4 py-2">¥${rmbTotal}</td>
        </tr>
      `;
    }
    
    // 添加最终报价
    tableRows += `
      <tr>
        <td class="border px-4 py-2 font-bold text-lg">最终报价</td>
        <td class="border px-4 py-2 font-bold text-lg text-blue-600">¥${quoteTotal}</td>
      </tr>
    `;
    
    // 添加备注
    if (formData.note) {
      tableRows += `
        <tr>
          <td class="border px-4 py-2 font-medium bg-yellow-50" colspan="2">备注</td>
        </tr>
        <tr>
          <td class="border px-4 py-2" colspan="2">${formData.note}</td>
        </tr>
      `;
    }
    
    // 构建完整的HTML内容，并设置为A4纸张大小
    const htmlContent = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>整柜报价单</title>
        <style>
            /* 严格设置A4纸张尺寸和边距 */
            @page {
                size: A4;
                margin: 1cm; /* 1厘米边距 */
            }
            body {
                font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
                margin: 0;
                padding: 0;
                width: 210mm; /* A4宽度 */
                height: 297mm; /* A4高度 */
                box-sizing: border-box;
            }
            /* 主容器，确保内容在A4尺寸内 */
            .a4-container {
                width: 100%;
                max-width: 210mm;
                min-height: 297mm;
                padding: 1cm;
                box-sizing: border-box;
            }
            .company-header {
                text-align: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 2px solid #000;
            }
            .company-name {
                font-size: 20px;
                font-weight: bold;
                margin-bottom: 8px;
            }
            .quote-title {
                font-size: 18px;
                font-weight: bold;
                text-align: center;
                margin-bottom: 15px;
            }
            .quote-table {
                width: 100%;
                border-collapse: collapse;
                margin-bottom: 15px;
                font-size: 13px;
            }
            .quote-table th, .quote-table td {
                border: 1px solid #ddd;
                padding: 6px 8px;
            }
            .quote-table th {
                background-color: #f2f2f2;
                text-align: left;
            }
            .quote-table tr:nth-child(even) {
                background-color: #f9f9f9;
            }
            .quote-table tr:hover {
                background-color: #f1f1f1;
            }
            .footer {
                margin-top: 30px;
                text-align: center;
                font-size: 11px;
                color: #666;
            }
        </style>
    </head>
    <body>
        <div class="a4-container">
            <div class="company-header">
                <div class="company-name">上海湘诚国际物流有限公司</div>
                <div class="quote-title">整柜报价单</div>
            </div>
            
            <table class="quote-table">
                ${tableRows}
            </table>
            
            <div class="footer">
                <p>报价日期: ${new Date().toLocaleDateString()}</p>
                <p>© 2025 上海湘诚国际物流有限公司 - 整柜报价单</p>
            </div>
        </div>
    </body>
    </html>
    `;
    
    // 创建Blob对象和下载链接
    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    // 设置文件名
    const date = new Date();
    const shortDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    const productName = formData.productName || '未命名项目';
    const destination = formData.destination || '未指定目的港';
    
    a.download = `${shortDate}_${productName}_${destination}_整柜报价单.doc`;
    
    // 触发下载
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("报价单已导出为Word文档");
  };
  
  // 保存报价到历史记录
  const saveQuote = () => {
    if (!formData.productName || !formData.destination) {
      toast.error("请至少填写品名和目的港");
      return;
    }
    
    const newHistoryItem: QuoteHistory = {
      id: Date.now().toString(),
      timestamp: new Date(),
      project: formData.productName,
      destination: formData.destination,
      totalPrice: quoteTotal,
      note: ""
    };
    
    setHistory(prev => {
      const updatedHistory = [newHistoryItem, ...prev].slice(0, 10); // 保留最近10条记录
      localStorage.setItem("fullContainerQuoteHistory", JSON.stringify(updatedHistory));
      return updatedHistory;
    });
    
    toast.success("报价已保存到历史记录");
  };
  
  // 重置表单
  const resetForm = () => {
    setFormData({
      productName: "",
      hsCode: "",
      declaredValue: "",
      containerType: "", // 重置柜型字段
      destination: "",
      seaFreight: "",
      domesticPortFee: "",
      foreignCustomsDuty: "",
      domesticTruckingFee: "",
      foreignTruckingFee: "",
      foreignPortFee: "",
      exchangeRate: "7.2",
      note: "", // 重置备注字段
      receiverAddress: "" // 重置收件地址字段
    });
    toast.info("已重置表单内容");
  };
  
  // 清空历史记录
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("fullContainerQuoteHistory");
    toast.info("已清空报价历史记录");
  };
  
  return (
    <div className="min-h-[calc(100vh-32px)] flex flex-col">
      {/* 头部区域 */}
      <header className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <Link to="/" className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <i className="fa-solid fa-arrow-left mr-2"></i>返回首页
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">整柜文字报价工具</h1>
          <div className="flex justify-end space-x-2">
             <motion.button
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => setShowHistory(!showHistory)}
               className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center ${
                 isDark ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"
               } transition-all`}
             >
               <i className="fa-solid fa-history mr-2"></i>报价历史
             </motion.button>
              <AITextRecognizer 
               toolType="fullContainerQuote"
               onRecognize={(data) => {
                 // 处理识别结果并填充到表单
                  setFormData(prev => ({
                    ...prev,
                    productName: data.productName || '',
                    hsCode: data.hsCode || '',
                    declaredValue: data.declaredValue || '',
                    containerType: data.containerType || '',
                    destination: data.destination || '',
                    seaFreight: data.seaFreight || '',
                    domesticPortFee: data.domesticPortFee || '',
                    foreignCustomsDuty: data.foreignCustomsDuty || '',
                    domesticTruckingFee: data.domesticTruckingFee || '',
                    foreignTruckingFee: data.foreignTruckingFee || '',
                    foreignPortFee: data.foreignPortFee || '700', // 国外港杂固定填入700
                    exchangeRate: data.exchangeRate || prev.exchangeRate, // 汇率按识别信息填入
                    receiverAddress: data.receiverAddress || '',
                    note: data.note || '',
                    shippingCompany: data.shippingCompany || '' // 新增船公司字段
                  }));
               }}
               placeholder="请输入整柜报价相关文本，AI将识别项目、柜型、目的港、各项费用等信息..."
             />
           </div>
         </div>
        </header>
       
        {/* 其他工具快捷按钮 - 放置在上方 */}
        <div className="mb-6">
          <ToolShortcuts excludeToolId="full-container-text-quote" showOnlyButtons={true} />
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
            <h2 className="text-xl font-bold mb-6 dark:text-white">填写报价信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* 品名 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   品名 <span className="text-red-500">*</span>
                 </label>
                 <input 
                   type="text" 
                   name="productName" 
                   value={formData.productName}
                   onChange={handleInputChange}
                   className={`w-full px-4 py-2 rounded-xl border ${
                     isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                   placeholder="请输入品名"
                 />
               </div>

               {/* HS编码 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   HS编码 <span className="text-gray-500">(选填)</span>
                 </label>
                 <input 
                   type="text" 
                   name="hsCode" 
                   value={formData.hsCode}
                   onChange={handleInputChange}
                   className={`w-full px-4 py-2 rounded-xl border ${
                     isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                   placeholder="请输入HS编码"
                 />
               </div>

               {/* 货值 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                   货值 <span className="text-gray-500">(选填)</span>
                 </label>
                 <input 
                   type="text" 
                   name="declaredValue" 
                   value={formData.declaredValue}
                   onChange={handleInputChange}
                   className={`w-full px-4 py-2 rounded-xl border ${
                     isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                   placeholder="请输入货值"
                 />
               </div>
               
                {/* 船公司 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    船公司 <span className="text-gray-500">(选填)</span>
                  </label>
                  <input 
                    type="text" 
                    name="shippingCompany" 
                    value={formData.shippingCompany}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="请输入船公司名称"
                  />
                </div>
                
                {/* 柜型 - 下拉选择框 */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    柜型 <span className="text-gray-500">(选填)</span>
                 </label>
                 <select
                   name="containerType"
                   value={formData.containerType}
                   onChange={handleInputChange}
                   className={`w-full px-4 py-2 rounded-xl border ${
                     isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                 >
                   <option value="">请选择柜型</option>
                   <option value="40HQ">40HQ</option>
                   <option value="40GP">40GP</option>
                   <option value="20GP">20GP</option>
                   <option value="45HQ">45HQ</option>
                 </select>
               </div>
              
              {/* 目的港 */}
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  目的港 <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="destination" 
                  value={formData.destination}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="请输入目的港名称"
                />
              </div>
              
              {/* 新增收件地址 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  收件地址 <span className="text-gray-500">(选填)</span>
                </label>
                <textarea
                  name="receiverAddress"
                  value={formData.receiverAddress}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="请输入收件地址"
                  rows={2}
                ></textarea>
              </div>
              
              {/* 汇率 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  汇率
                </label>
                <input 
                  type="number" 
                  name="exchangeRate" 
                  value={formData.exchangeRate}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  placeholder="1美元兑人民币汇率"
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-800 mb-4">
                  <p className="text-sm text-blue-800 dark:text-blue-300 flex items-start">
                    <i className="fa-solid fa-info-circle mt-0.5 mr-2 text-blue-500"></i>
                    以下费用以美元计算
                  </p>
                </div>
              </div>
              
              {/* 海运费 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  海运费 ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input 
                    type="number" 
                    name="seaFreight" 
                    value={formData.seaFreight}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* 国外关税 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  国外关税 ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input 
                    type="number" 
                    name="foreignCustomsDuty" 
                    value={formData.foreignCustomsDuty}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* 国外拖车费 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  国外拖车费 ($)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input 
                    type="number" 
                    name="foreignTruckingFee" 
                    value={formData.foreignTruckingFee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* 国外港杂 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  国外港杂 ($)
                </label>
                 <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">$</span>
                  </div>
                  <input 
                    type="number" 
                    name="foreignPortFee" 
                    value={formData.foreignPortFee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="700.00"
                  />
                </div>
              </div>
              
              <div className="md:col-span-2">
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-xl border border-green-100 dark:border-green-800 mb-4">
                  <p className="text-sm text-green-800 dark:text-green-300 flex items-start">
                    <i className="fa-solid fa-info-circle mt-0.5 mr-2 text-green-500"></i>
                    以下费用以人民币计算
                  </p>
                </div>
              </div>
              
              {/* 国内港杂 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  国内港杂 (¥)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">¥</span>
                  </div>
                  <input 
                    type="number" 
                    name="domesticPortFee" 
                    value={formData.domesticPortFee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="0.00"
                  />
                </div>
              </div>
              
              {/* 国内拖车费 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  国内拖车费 (¥)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500">¥</span>
                  </div>
                  <input 
                    type="number" 
                    name="domesticTruckingFee" 
                    value={formData.domesticTruckingFee}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                    className={`w-full pl-8 pr-4 py-2 rounded-xl border ${
                      isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    placeholder="0.00"
                  />
                </div>
             </div>
             
             {/* 备注输入框 */}
             <div className="md:col-span-2">
               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                 备注 <span className="text-gray-500">(选填)</span>
               </label>
               <textarea
                 name="note"
                 value={formData.note}
                 onChange={handleInputChange}
                 className={`w-full px-4 py-2 rounded-xl border ${
                   isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"
                 } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                 placeholder="请输入备注信息，将显示在报价文本中"
                 rows={3}
               ></textarea>
             </div>
            </div>
            
            {/* 费用总计显示 */}
            <div className="space-y-4 mb-6">
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-blue-800 dark:text-blue-300">美元总计</span>
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">$ {usdTotal}</span>
                </div>
                <p className="text-xs text-blue-700 dark:text-blue-400 mt-1">
                  计算公式：海运费 + 国外关税 + 国外拖车费 + 国外港杂
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium text-green-800 dark:text-green-300">人民币总计</span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">¥ {rmbTotal}</span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                  计算公式：国内港杂 + 国内拖车费
                </p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="p-4 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl text-white"
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">最终报价</span>
                  <span className="text-2xl font-bold">¥ {quoteTotal}</span>
                </div>
                <p className="text-xs text-white/80 mt-1">
                  计算公式：美元总计 × 汇率 + 人民币总计
                </p>
              </motion.div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex flex-wrap gap-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={saveQuote}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center"
              >
                <i className="fa-solid fa-save mr-2"></i>保存报价到历史
              </motion.button>
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
          
          {/* 右侧报价文本区域 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-full flex flex-col"
          >
            <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
              <h2 className="text-xl font-bold dark:text-white">
                <i className="fa-solid fa-sync-alt mr-2 text-blue-500 animate-pulse"></i>实时报价文本
              </h2>
               <div className="flex items-center gap-2">
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={copyQuoteText}
                   disabled={!generatedText}
                   className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center whitespace-nowrap ${
                     !generatedText 
                       ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" 
                       : "bg-green-600 hover:bg-green-700 text-white"
                   }`}
                 >
                   <i className="fa-solid fa-copy mr-1"></i>复制文本
                 </motion.button>
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={exportQuoteAsWord}
                   disabled={!generatedText}
                   className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center whitespace-nowrap ${
                     !generatedText 
                       ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" 
                       : "bg-blue-600 hover:bg-blue-700 text-white"
                   }`}
                 >
                   <i className="fa-solid fa-file-export mr-1"></i>导出报价单
                 </motion.button>
                 <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 whitespace-nowrap">
                   自动同步更新
                 </span>
               </div>
            </div>
            
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl font-mono text-sm border border-gray-200 dark:border-gray-700 mb-6 flex-grow overflow-y-auto"
            >
              {generatedText && <pre className="whitespace-pre-wrap break-words text-left">{generatedText}</pre>}
            </motion.div>
            
            <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
              <p className="flex items-start">
                <i className="fa-solid fa-info-circle mt-0.5 mr-1 text-blue-500"></i>
                报价文本会随着您填写的信息实时更新，请检查所有信息无误后再使用。
              </p>
            </div>
          </motion.div>
        </div>
        
        {/* 报价历史记录 */}
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ 
            opacity: showHistory ? 1 : 0,
            height: showHistory ? "auto" : 0,
            display: showHistory ? "block" : "none"
          }}
          transition={{ duration: 0.3 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold dark:text-white">报价历史记录</h2>
            <button
              onClick={clearHistory}
              className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
            >
              <i className="fa-solid fa-trash-alt mr-1"></i>清空历史
            </button>
          </div>
          
          {history.length === 0 ? (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <i className="fa-solid fa-history text-3xl mb-2 text-gray-400"></i>
              <p>暂无报价历史记录</p>
              <p className="text-xs mt-2">点击"保存报价到历史"按钮可保存当前报价</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">日期时间</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">项目</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">目的港</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">最终报价</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map(item => (
                    <tr 
                      key={item.id}
                      className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm">{item.timestamp.toLocaleString()}</td>
                      <td className="py-3 px-4 text-sm">{item.project}</td>
                      <td className="py-3 px-4 text-sm">{item.destination}</td>
                      <td className="py-3 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 text-right">
                        ¥{item.totalPrice}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </main>
      
      {/* 底部区域 */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 沈家俊工具箱 - 整柜文字报价工具</p>
      </footer>
       
    </div>
  );
}