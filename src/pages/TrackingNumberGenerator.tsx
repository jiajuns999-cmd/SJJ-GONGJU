import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ToolShortcuts from "@/components/ToolShortcuts";

// 仓库地址配置
const WAREHOUSES = [
  {
    id: 'shanghai-express',
    name: '上海快递仓',
    address: '上海市青浦区华卫路18号湘诚仓西侧收货口 （快递仓）',
    contactInfo: '收件人：沈家俊 手机：15856928662',
    contactPerson: '卢主管',
    contactPhone: '15821166521',
    businessHours: '上午8:30-下午6:00'
  },
  {
    id: 'shanghai-sea',
    name: '上海海运仓',
    address: '上海市青浦区华卫路18号湘诚仓东侧收货口（海运仓）',
    contactInfo: '收件人：沈家俊 手机：15856928662',
    contactPerson: '王主管',
    contactPhone: '15736969891',
    businessHours: '上午8:30-下午6:00'
  },
  {
    id: 'dongguan',
    name: '东莞仓',
    address: '东莞市塘厦镇河畔路8号亿美佳产业园A14栋一楼湘诚华南分拨中心（湘诚国际物流）',
    contactInfo: '收件人：沈家俊 手机：15856928662',
    contactPerson: '贾主管',
    contactPhone: '18670619161',
    businessHours: '上午9:00-下午6:00'
  },
  {
    id: 'qingdao',
    name: '青岛仓',
    address: '青岛市城阳区流亭街道天河路88号普洛斯青岛空港国际物流园(东区)B3号库8-9号门',
    contactInfo: '收件人：沈家俊 手机：15856928662',
    contactPerson: '方主管',
    contactPhone: '18221461756',
    businessHours: '上午9:00-下午6:00'
  }
];

// 业务员配置
const SALES_PERSONS = [
  { id: 'sj', name: '沈家俊' },
  { id: 'dk', name: '丁可' },
  { id: 'zgj', name: '张国娟' },
  { id: 'yzl', name: '杨子良' },
  { id: 'lr', name: '刘瑞' }
];

// 业务员联系方式配置
const SALES_CONTACTS: Record<string, { name: string; phone: string }> = {
  'sj': { name: '沈家俊', phone: '15856928662' },
  'dk': { name: '丁可', phone: '18205546419' },
  'zgj': { name: '张国娟', phone: '18656443508' },
  'yzl': { name: '杨子良', phone: '18555283192' },
  'lr': { name: '刘瑞', phone: '17756437301' }
};

// 包装类型
const PACKAGE_TYPES = [
  { id: 'carton', name: '纸箱' },
  { id: 'wooden', name: '木箱' },
  { id: 'pallet', name: '托盘' }
];

    // 渠道选项列表 - 与文字报价工具保持一致
   const CHANNEL_OPTIONS = [
    { value: 'OA普船', label: 'OA普船' },
    { value: '美森正班', label: '美森正班' },
    { value: '美森加班', label: '美森加班' },
    { value: '合德快船', label: '合德快船' },
    { value: '休斯顿专线', label: '休斯顿专线' },
    { value: '芝加哥专线', label: '芝加哥专线' },
    { value: '纽约直航', label: '纽约直航' },
    { value: '萨凡纳专线', label: '萨凡纳专线' },
    { value: '欧洲海运', label: '欧洲海运' },
    { value: '欧洲空运', label: '欧洲空运' },
    { value: '英国海运', label: '英国海运' },
    { value: '英国空运', label: '英国空运' },
    { value: '美国空运', label: '美国空运' },
    { value: '联邦快递', label: '联邦快递' },
    { value: 'UPS快递', label: 'UPS快递' },
    { value: '铁路运输', label: '铁路运输' },
    { value: '卡车运输', label: '卡车运输' }
  ];

// 生成随机数字字符串
const generateRandomDigits = (length: number): string => {
  let result = '';
  const characters = '0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// 生成物流单号
const generateTrackingNumber = (existingNumbers: string[], salesPersonId: string, customCode: string): string => {
  let newNumber = '';
  const prefix = 'XC';
  
  // 获取当前日期，格式为YYMMDD
  const now = new Date();
  const year = String(now.getFullYear()).slice(2); // 获取年份后两位
  const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份补零
  const day = String(now.getDate()).padStart(2, '0'); // 日期补零
  
  // 基础日期部分：YYMMDD
  const datePart = `${year}${month}${day}`;
  
  // 生成当日序号部分（从01开始）
  let sequenceNumber = 1;
  
  // 确保生成的单号不重复
  do {
    // 生成两位随机数字
    const randomDigits = generateRandomDigits(2);
    
    // 完整日期顺序部分：YYMMDD+随机两位数字
    const dateRandomPart = `${datePart}${randomDigits}`;
    
    // 根据是否有自定义代码生成不同格式的单号
    if (customCode) {
      // 如果有自定义代码，使用格式：XC+日期+随机两位数字+自编代码
      newNumber = `${prefix}${dateRandomPart}${customCode}`;
    } else {
      // 如果没有自定义代码，使用格式：XC+日期+随机两位数字+随机两个字母
      const randomLetters = generateRandomLetters(2);
      newNumber = `${prefix}${dateRandomPart}${randomLetters}`;
    }
    
    sequenceNumber++;
  } while (existingNumbers.includes(newNumber));
  
  return newNumber;
};

// 生成随机字母字符串
const generateRandomLetters = (length: number): string => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

// 保存单号到localStorage
const saveTrackingNumbers = (numbers: string[]): void => {
  const existingNumbers = getSavedTrackingNumbers();
  const allNumbers = [...existingNumbers, ...numbers];
  // 只保存最近1000个单号，防止localStorage过大
  const recentNumbers = allNumbers.slice(-1000);
  localStorage.setItem('trackingNumbers', JSON.stringify(recentNumbers));
};

// 从localStorage获取已保存的单号
const getSavedTrackingNumbers = (): string[] => {
  try {
    const saved = localStorage.getItem('trackingNumbers');
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error('Failed to load saved tracking numbers:', error);
    return [];
  }
};

    // 导出单号为Word文件 - 优化标题居中并移除日期显示
  const exportAsWord = (numbers: string[], warehouseName: string, packageType: string, itemCount: string, channel: string, businessOwnerText: string): void => {
     // 获取当前选中的仓库完整信息
     const selectedWarehouse = WAREHOUSES.find(w => w.name === warehouseName);
     const warehouseAddress = selectedWarehouse?.address || '';
     const isDongguanWarehouse = selectedWarehouse?.id === 'dongguan';
    
     // 业务员信息由调用方传入（已处理手动输入优先逻辑）
    
     // 创建HTML内容作为Word文档，按照进仓单预览格式，并调整样式确保在A4纸上完整显示
     let htmlContent = `
      <html>
      <head>
        <meta charset="UTF-8">
        <title>进仓单</title>
        <style>
          /* 全局样式设置，确保A4页面大小和边距 */
          @page {
            size: A4;
            margin: 2cm;
          }
          
          body { 
            font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif; 
            margin: 0; 
            padding: 0;
            box-sizing: border-box;
          }
          
           /* 页眉样式 */
          .header {
            position: relative;
            padding-bottom: 20px;
            margin-bottom: 30px;
            border-bottom: 1px solid #ddd;
            text-align: center; /* 确保页眉内容居中 */
          }
          
          /* 进仓单标题 - 作为眉页显示 */
          .document-title {
            font-size: 36px;
            font-weight: bold;
            color: #000;
            margin: 0;
            padding: 0;
            text-align: center; /* 确保标题居中显示 */
          }
          
          /* 进仓单号样式 */
          .tracking-number { 
            font-family: Arial, monospace; 
            font-size: 32px; 
            font-weight: bold; 
            text-align: center; 
            color: #000;
            margin: 80px 0 20px 0;
            padding: 10px;
            border: 2px dashed #ccc;
            border-radius: 8px;
          }
          
          /* 业务归属样式 */
          .business-owner {
            font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
            font-size: 20px;
            font-weight: bold;
            text-align: center;
            color: #000;
            margin: 15px 0;
          }
          
          /* 信息表格样式 */
          .info-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 20px 0;
            font-size: 14px;
          }
          
          .info-table th, .info-table td { 
            padding: 8px 12px; 
            text-align: left; 
            border-bottom: 1px solid #ddd;
            vertical-align: top;
          }
          
          .info-table th { 
            font-weight: bold; 
            background-color: #f8fafc;
            color: #64748b;
            width: 30%;
            white-space: nowrap;
          }
          
          .info-table tbody tr:hover { 
            background-color: #f8fafc;
          }
          
          /* 图片容器样式 */
          .warehouse-map {
            text-align: center;
            margin: 20px 0;
          }
          
          .warehouse-map h3 {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          /* 图片样式，限制最大宽度和高度，确保在A4内显示 */
          .warehouse-map img {
            max-width: 100%;
            max-height: 250px;
            height: auto;
          }
          
          /* 页脚样式 */
          .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 12px;
            color: #666;
          }
        </style>
      </head>
      <body>
        <!-- 页眉区域 -->
        <div class="header">
          <h1 class="document-title">进仓单</h1>
        </div>
        
        <!-- 进仓单号 - 居中放大显示 -->
        ${numbers.map(number => `<div class="tracking-number">${number}</div>`).join('')}
        
        <!-- 业务归属 -->
           <div class="business-owner">业务归属：${businessOwnerText}</div>
        
        <!-- 进仓单信息表格 -->
        <table class="info-table">
          <tbody>
                <!-- 仓库地址 -->
                <tr>
                  <th>仓库地址</th>
                   <td>${warehouseAddress}</td>
                </tr>
                
                <!-- 仓库信息 -->
                <tr>
                  <th>仓库信息</th>
                  <td>${selectedWarehouse ? `${selectedWarehouse.contactPerson}，${selectedWarehouse.contactPhone}，${selectedWarehouse.businessHours}` : ''}</td>
                </tr>
            
            <!-- 件数 -->
            <tr>
              <th>件数</th>
              <td style="font-weight: bold;">${itemCount}</td>
            </tr>
            
            <!-- 包装类型 -->
            <tr>
              <th>包装类型</th>
              <td>${packageType}</td>
            </tr>
            
            <!-- 走货渠道（如果有） -->
            ${channel ? `
            <tr>
              <th>走货渠道</th>
              <td>${channel}</td>
            </tr>
            ` : ''}
          </tbody>
        </table>
        
        <!-- 仓库进仓示意图 - 调整图片大小确保在A4内显示 -->
        ${isDongguanWarehouse || selectedWarehouse?.id === 'qingdao' || selectedWarehouse?.id === 'shanghai-express' || selectedWarehouse?.id === 'shanghai-sea' ? `
        <div class="warehouse-map">

            <img src="${
              isDongguanWarehouse 
                ? "https://lf-code-agent.coze.cn/obj/x-ai-cn/285063883522/attachment/image_20260520163449.png" 
                : selectedWarehouse?.id === 'qingdao'
                  ? "https://lf-code-agent.coze.cn/obj/x-ai-cn/285063883522/attachment/image_20260520162134.png"
                  : "https://lf-code-agent.coze.cn/obj/x-ai-cn/285063883522/attachment/image_20251210170633.png"
            }" alt="${isDongguanWarehouse ? '东莞' : selectedWarehouse?.id === 'qingdao' ? '青岛' : '上海'}仓进仓示意图" style="max-width: 100%; max-height: 250px; height: auto;" />
        </div>
        ` : ''}
        
         <!-- 移除页脚中的生成日期 -->
      </body>
      </html>`;
     
    // 创建Blob对象
    const blob = new Blob(['\ufeff', htmlContent], { type: 'application/vnd.ms-word' });
    const url = URL.createObjectURL(blob);
    
    // 创建下载链接
    const a = document.createElement('a');
    a.href = url;
    
    // 构建文件名：进仓单+进仓单号+件数+包装类型+渠道
    const selectedPackageType = PACKAGE_TYPES.find(p => p.name === packageType)?.name || packageType;
    const mainTrackingNumber = numbers[0] || ''; // 取第一个单号作为文件名的一部分
    const fileName = `进仓单${mainTrackingNumber}-${itemCount}${selectedPackageType}${channel || ''}.doc`;
    
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    
    // 清理
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success('进仓单已导出为Word文件');
  };

export default function TrackingNumberGenerator() {
  const { isDark } = useTheme();
  const [itemCount, setItemCount] = useState<string>('1');
  const [packageType, setPackageType] = useState<string>('carton');
  const [warehouseId, setWarehouseId] = useState<string>('shanghai-express');
  const [channel, setChannel] = useState<string>('');
  const [salesPersonId, setSalesPersonId] = useState<string>('sj'); // 默认选择沈家俊
  const [trackingNumbers, setTrackingNumbers] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [savedNumbers, setSavedNumbers] = useState<string[]>([]);
  const [isNumbersExpanded, setIsNumbersExpanded] = useState(false);
  // 新增自定义代码状态
  const [customCode, setCustomCode] = useState<string>('');
  // 自定义业务员和电话（手动输入优先于下拉选择）
  const [customSalesPerson, setCustomSalesPerson] = useState<string>('');
  const [customPhone, setCustomPhone] = useState<string>('');
  
  // 加载已保存的单号
  useEffect(() => {
    const numbers = getSavedTrackingNumbers();
    setSavedNumbers(numbers);
  }, []);
  
  // 生成物流单号（每次生成一个）
  const generateTrackingNumbers = () => {
    setIsGenerating(true);
    
    // 模拟生成延迟
    setTimeout(() => {
      const allExistingNumbers = [...savedNumbers, ...trackingNumbers];
      // 传递自定义代码给生成函数
      const newNumber = generateTrackingNumber(allExistingNumbers, salesPersonId, customCode);
      
      // 保存新生成的单号
      saveTrackingNumbers([newNumber]);
      setSavedNumbers(prev => [...prev, newNumber]);
      
      setTrackingNumbers(prev => [...prev, newNumber]);
      setIsGenerating(false);
      toast.success('成功生成物流单号');
    }, 600);
  };
  
  // 复制单个物流单号
  const copyTrackingNumber = (number: string) => {
    navigator.clipboard.writeText(number);
    toast.success(`物流单号 ${number} 已复制`);
  };
  
  // 复制所有物流单号
  const copyAllTrackingNumbers = () => {
    if (trackingNumbers.length > 0) {
      const textToCopy = trackingNumbers.join('\n');
      navigator.clipboard.writeText(textToCopy);
      toast.success(`已复制全部 ${trackingNumbers.length} 个物流单号`);
    }
  };
  
  // 清空生成结果
  const clearResults = () => {
    setTrackingNumbers([]);
    toast.info('已清空结果');
  };
  
  // 导出进仓单为Word文件
  const handleExportWord = () => {
    if (trackingNumbers.length === 0) {
      toast.error('请先生成物流单号');
      return;
    }
    
    const selectedWarehouse = WAREHOUSES.find(w => w.id === warehouseId);
    const selectedPackageType = PACKAGE_TYPES.find(p => p.id === packageType);
    
  exportAsWord(
    trackingNumbers,
    selectedWarehouse?.name || '',
    selectedPackageType?.name || '',
    itemCount,
    channel,
    getSelectedSalesPerson()
  );
  };
  
  // 获取当前选中的仓库地址，包含业务员联系方式
  const getSelectedWarehouse = (): { name: string, address: string, contactInfo: string, contactPerson: string, contactPhone: string, businessHours: string } => {
    const warehouse = WAREHOUSES.find(w => w.id === warehouseId);
    
    // 获取选中的业务员联系方式
    const salesContact = SALES_CONTACTS[salesPersonId];
    const contactInfo = salesContact 
      ? `收件人：${salesContact.name} 手机：${salesContact.phone}` 
      : '收件人信息未设置';
    
    return warehouse ? { 
      name: warehouse.name, 
      address: warehouse.address,
      contactInfo: contactInfo,
      contactPerson: warehouse.contactPerson,
      contactPhone: warehouse.contactPhone,
      businessHours: warehouse.businessHours
    } : { 
      name: '', 
      address: '',
      contactInfo: '',
      contactPerson: '',
      contactPhone: '',
      businessHours: ''
    };
  };
  
    // 获取当前选中业务员的ID对应的后缀示例
  const getSelectedSalesPersonExampleFormat = (): string => {
    // 获取当前日期，格式为YYMMDD
    const now = new Date();
    const year = String(now.getFullYear()).slice(2); // 获取年份后两位
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 月份补零
    const day = String(now.getDate()).padStart(2, '0'); // 日期补零
    
    // 基础日期部分：YYMMDD
    const datePart = `${year}${month}${day}`;
    
    // 生成两位随机数字示例
    const randomDigitsExample = '01';
    
    // 根据用户要求返回示例格式
    if (customCode) {
      return `XC${datePart}${randomDigitsExample}${customCode}`;
    } else {
      return `XC${datePart}${randomDigitsExample}AB`;
    }
  };
  
  // 获取当前业务归属（手动输入优先，未填写则使用下拉选择）
  const getSelectedSalesPerson = (): string => {
    if (customSalesPerson.trim() && customPhone.trim()) {
      return `${customSalesPerson.trim()} 电话：${customPhone.trim()}`;
    }
    const salesContact = SALES_CONTACTS[salesPersonId];
    return salesContact ? `${salesContact.name} 电话：${salesContact.phone}` : '沈家俊 电话：15856928662';
  };
  
  // 此函数已被重命名，保留以确保兼容性
  
  // 获取当前选中的包装类型名称
  const getSelectedPackageTypeName = (): string => {
    const packageTypeItem = PACKAGE_TYPES.find(p => p.id === packageType);
    return packageTypeItem ? packageTypeItem.name : '';
  };
  
  // 切换单号列表的展开/折叠状态
  const toggleNumbersExpansion = () => {
    setIsNumbersExpanded(!isNumbersExpanded);
  };
  
  return (
    <div className="min-h-[calc(100vh-32px)] flex flex-col">
      {/* 头部导航 */}
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回首页
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold">物流单号生成工具</h1>
          <div className="w-40"></div> {/* 占位，保持标题居中 */}
        </div>
       </header>

        {/* 其他工具快捷按钮 - 放置在上方 */}
        <div className="mb-6">
          <ToolShortcuts excludeToolId="tracking-number-generator" showOnlyButtons={true} />
        </div>

       {/* 主内容区 */}
      <main className="flex-grow">
        {/* 设置区域 - 紧凑布局 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6"
        >
          <h2 className="text-xl font-bold mb-4 dark:text-white">生成设置</h2>
          
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
               {/* 件数 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   件数
                 </label>
                 <input
                   type="number"
                   value={itemCount}
                   onChange={(e) => setItemCount(e.target.value)}
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-gray-50 border-gray-200'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                   min="1"
                 />
               </div>
               
               {/* 包装类型 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   包装类型
                 </label>
                 <select
                   value={packageType}
                   onChange={(e) => setPackageType(e.target.value)}
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-gray-50 border-gray-200'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                 >
                   {PACKAGE_TYPES.map(type => (
                     <option key={type.id} value={type.id}>
                       {type.name}
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* 仓库地址 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   仓库地址
                 </label>
                 <select
                   value={warehouseId}
                   onChange={(e) => setWarehouseId(e.target.value)}
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-gray-50 border-gray-200'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                 >
                   {WAREHOUSES.map(warehouse => (
                     <option key={warehouse.id} value={warehouse.id}>
                       {warehouse.name}
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* 业务员 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   业务员
                 </label>
                 <select
                   value={salesPersonId}
                   onChange={(e) => setSalesPersonId(e.target.value)}
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-gray-50 border-gray-200'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                 >
                   {SALES_PERSONS.map(person => (
                     <option key={person.id} value={person.id}>
                       {person.name}
                     </option>
                   ))}
                 </select>
               </div>

               {/* 自定义业务员（手动输入） */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   业务员 <span className="text-xs text-gray-400">(手动输入)</span>
                 </label>
                 <input
                   type="text"
                   value={customSalesPerson}
                   onChange={(e) => setCustomSalesPerson(e.target.value)}
                   placeholder="填写后优先显示，覆盖上方选择"
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                       : 'bg-gray-50 border-gray-200 placeholder-gray-400'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                 />
               </div>

               {/* 自定义电话（手动输入） */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   电话 <span className="text-xs text-gray-400">(手动输入)</span>
                 </label>
                 <input
                   type="text"
                   value={customPhone}
                   onChange={(e) => setCustomPhone(e.target.value)}
                   placeholder="填写后优先显示，覆盖上方选择"
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                       : 'bg-gray-50 border-gray-200 placeholder-gray-400'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                 />
               </div>
               
               {/* 走货渠道 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   走货渠道
                 </label>
                 <select
                   value={channel}
                   onChange={(e) => setChannel(e.target.value)}
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-gray-50 border-gray-200'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                 >
                   <option value="">请选择</option>
                   {CHANNEL_OPTIONS.map(option => (
                     <option key={option.value} value={option.value}>
                       {option.label}
                     </option>
                   ))}
                 </select>
               </div>
               
               {/* 自编代码 */}
               <div>
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                   自编代码
                 </label>
                 <input
                   type="text"
                   value={customCode}
                   onChange={(e) => setCustomCode(e.target.value)}
                   placeholder="选填，如不需要可不填"
                   className={`w-full px-3 py-2 rounded-xl border ${
                     isDark 
                       ? 'bg-gray-700 border-gray-600 text-white' 
                       : 'bg-gray-50 border-gray-200'
                   } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                 />
               </div>
             </div>
          
          <div className="flex flex-wrap gap-3">
            {/* 生成按钮 */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={generateTrackingNumbers}
              disabled={isGenerating}
              className={`px-6 py-2.5 rounded-xl font-medium transition-all ${
                isGenerating 
                  ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                  生成中...
                </>
              ) : (
                <>
                  <i className="fa-solid fa-magic mr-2"></i>
                  生成物流单号
                </>
              )}
            </motion.button>
            
            {/* 复制全部按钮 */}
            {trackingNumbers.length > 0 && (
              <button
                onClick={copyAllTrackingNumbers}
                className="px-5 py-2.5 rounded-xl font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center"
              >
                <i className="fa-solid fa-copy mr-2"></i>
                复制全部
              </button>
            )}
            
            {/* 清空结果按钮 */}
            {trackingNumbers.length > 0 && (
              <button
                onClick={clearResults}
                className="px-5 py-2.5 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center"
              >
                <i className="fa-solid fa-trash-alt mr-2"></i>
                清空结果
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 mt-3">
            {/* 导出按钮组 */}
            {trackingNumbers.length > 0 && (
              <button
                onClick={handleExportWord}
                className="px-5 py-2.5 rounded-xl font-medium bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center"
              >
                <i className="fa-solid fa-file-word mr-2"></i>
                导出Word文档
              </button>
            )}
          </div>
        </motion.div>
        
        {/* 生成结果区域 - 可折叠 */}
        {trackingNumbers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-6"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">生成结果</h2>
              <button
                onClick={toggleNumbersExpansion}
                className="flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
              >
                <span className="mr-1 text-sm">{isNumbersExpanded ? '收起' : '展开'}</span>
                <i className={`fa-solid ${isNumbersExpanded ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
            </div>
            
            {isNumbersExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-2">
                  {trackingNumbers.map((number, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.03 }}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        isDark 
                          ? 'border-gray-700 hover:border-blue-600' 
                          : 'border-gray-200 hover:border-blue-300'
                      } bg-gray-50 dark:bg-gray-850 transition-all`}
                    >
                      <span className="font-mono text-sm">{number}</span>
                      <button
                        onClick={() => copyTrackingNumber(number)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-colors"
                        aria-label="复制"
                      >
                        <i className="fa-solid fa-copy"></i>
                      </button>
                    </motion.div>
                  ))}
                </div>
                
                <div className="mt-4 text-sm text-gray-500 dark:text-gray-400 flex justify-between items-center">
                  <p>共生成 {trackingNumbers.length} 个物流单号</p>
                  <p className="text-xs">
                    <i className="fa-solid fa-check-circle mr-1 text-green-500"></i>
                    已确保单号不重复
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* 生成格式说明 */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        <strong>单号格式：</strong>{customCode ? 'XC + 当日时间 + 随机两位数字 + 自编代码' : 'XC + 当日时间 + 随机两位数字 + 随机两个字母'}
                        <br />
                        <strong>示例：</strong>{getSelectedSalesPersonExampleFormat()}
                        <br />
                        <strong>说明：</strong>当日时间格式为YYMMDD（如260520）
                      </p>
             </div>
          </motion.div>
        )}
        
           {/* 进仓单预览区域 - 表格形式显示 */}
         <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.5, delay: 0.2 }}
           className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
         >
           <h2 className="text-xl font-bold mb-6 text-center dark:text-white">进仓单预览</h2>
           
           {/* 进仓单号 - 居中放大显示，放在最上方 */}
           {trackingNumbers.length > 0 && (
             <div className="p-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white text-center mb-6">
               <h3 className="text-lg font-medium mb-3">进仓单号</h3>
               <div className="grid grid-cols-1 gap-3">
                 {trackingNumbers.map((number, index) => (
                   <div 
                     key={index} 
                     className="font-mono text-2xl font-bold bg-white/10 py-3 px-4 rounded-lg"
                   >
                     {number}
                   </div>
                 ))}
               </div>
             </div>
           )}
           
           {/* 业务归属 - 放大显示 */}
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                业务归属：{getSelectedSalesPerson()}
              </div>
            </div>
           
           {/* 进仓单信息表格 */}
           <div className="overflow-x-auto w-full">
             <table className="min-w-full border-collapse">
               <thead>
                 <tr className={`text-left ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
                   <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-700">项目</th>
                   <th className="px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b dark:border-gray-700">内容</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                 {/* 仓库地址 */}
                 <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                     <div className="flex items-center">
                       <i className="fa-solid fa-map-marker-alt mr-2 text-blue-500"></i>
                       仓库地址
                     </div>
                   </td>
                   <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                       {getSelectedWarehouse().address}
                   </td>
                 </tr>
                 
                 {/* 仓库信息 */}
                 <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                     <div className="flex items-center">
                       <i className="fa-solid fa-building mr-2 text-green-500"></i>
                       仓库信息
                     </div>
                   </td>
                   <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                     {getSelectedWarehouse().contactPerson}，{getSelectedWarehouse().contactPhone}，{getSelectedWarehouse().businessHours}
                   </td>
                 </tr>
                
                {/* 件数 */}
                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <i className="fa-solid fa-box mr-2 text-green-500"></i>
                      件数
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300 font-semibold">
                    {itemCount}
                  </td>
                </tr>
                
                {/* 包装类型 */}
                <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    <div className="flex items-center">
                      <i className="fa-solid fa-cube mr-2 text-purple-500"></i>
                      包装类型
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                    {getSelectedPackageTypeName()}
                  </td>
                </tr>
                
                {/* 走货渠道 */}
                {channel && (
                  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <i className="fa-solid fa-truck mr-2 text-gray-500"></i>
                        走货渠道
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                      {channel}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* 导出按钮 */}
          {trackingNumbers.length > 0 && (
            <div className="mt-6">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExportWord}
                className="w-full px-6 py-3 rounded-xl font-medium bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center justify-center"
              >
                <i className="fa-solid fa-file-word mr-2"></i>
                导出Word文档
              </motion.button>
            </div>
          )}
          
          <div className="mt-8 text-xs text-gray-500 dark:text-gray-400 text-center">
            <p className="flex items-start justify-center">
              <i className="fa-solid fa-info-circle mt-0.5 mr-1 text-blue-500"></i>
              填写的信息会实时更新到预览中，生成单号后可导出为Word文档。
            </p>
          </div>
        </motion.div>
        
         {/* 仓库进仓示意图 - 根据选择的仓库显示 */}
        {(warehouseId === 'dongguan' || warehouseId === 'qingdao' || warehouseId === 'shanghai-express' || warehouseId === 'shanghai-sea') && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mt-6"
          >
              <div className="flex justify-center">
  <img 
     src={warehouseId === 'dongguan' 
      ? "https://lf-code-agent.coze.cn/obj/x-ai-cn/285063883522/attachment/image_20260520163449.png" 
      : warehouseId === 'qingdao'
        ? "https://lf-code-agent.coze.cn/obj/x-ai-cn/285063883522/attachment/image_20260520162134.png"
        : "https://lf-code-agent.coze.cn/obj/x-ai-cn/285063883522/attachment/image_20251210170633.png"
    } 
    alt={`${warehouseId === 'dongguan' ? '东莞' : warehouseId === 'qingdao' ? '青岛' : '上海'}仓进仓示意图`} 
    className="max-w-full h-auto rounded-lg"
  />
              </div>
          </motion.div>
        )}
      </main>
      
      {/* 底部 */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 沈家俊工具箱 - 物流单号生成</p>
      </footer>
      

      
    </div>
  );
}