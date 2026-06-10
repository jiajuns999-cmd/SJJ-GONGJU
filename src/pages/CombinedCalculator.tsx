import { useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import ToolShortcuts from "@/components/ToolShortcuts";
import { QuoteSyncContext } from '@/contexts/quoteSyncContext';
import AITextRecognizer from "@/components/AITextRecognizer";
import { extractField } from "@/lib/aiService";

// 定义货物信息接口
interface CargoItem {
  id: string;
  length: string; // 长度(cm)
  width: string; // 宽度(cm)
  height: string; // 高度(cm)
  weight: string; // 单件实重(kg)
  quantity: string; // 件数
}

// 定义计算结果接口
interface CargoCalculation {
  volumeWeight: number; // 体积重(kg)
  actualWeight: number; // 实际重量(kg)
  chargeableWeight: number; // 计费重量(kg)
  perimeter: number; // 周长(cm)
  volume: number; // 体积(CBM)
}

// 定义汇总结果接口
interface SummaryResult {
  totalActualWeight: number; // 总实重(kg)
  totalVolumeWeight: number; // 总体积重(kg)
  totalChargeableWeight: number; // 总计费重(kg)
  totalVolume: number; // 总方数(CBM)
  weightRatio: number; // 整批货物比重(kg/CBM)
  showWeightRatio: boolean; // 是否显示比重
}

// 定义重货方价计算结果接口
interface WeightPriceResult {
  weightVolume: number;
  chargeableVolume: number;
  totalPrice: number;
  unitPrice: number;
}

    // 渠道选项列表，与文字报价工具保持一致
     const CHANNEL_OPTIONS = [
      { value: "OA普船", label: "OA普船" },
     { value: "美森正班", label: "美森正班" },
     { value: "美森加班", label: "美森加班" },
     { value: "合德快船", label: "合德快船" },
     { value: "休斯顿专线", label: "休斯顿专线" },
     { value: "芝加哥专线", label: "芝加哥专线" },
     { value: "纽约直航", label: "纽约直航" },
     { value: "萨凡纳专线", label: "萨凡纳专线" },
     { value: "联邦快递", label: "联邦快递" },
     { value: "UPS快递", label: "UPS快递" },
     { value: "铁路运输", label: "铁路运输" },
     { value: "卡车运输", label: "卡车运输" },
     { value: "海运", label: "海运" },
     { value: "空运", label: "空运" }
   ];

// 定义分泡计算结果接口
interface BubbleDividingResult {
  actualChargeableWeight: number;
  actualTotalPrice: number;
  actualUnitPrice: number;
}

export default function CombinedCalculator() {
  const { isDark } = useTheme();
  const { updateQuoteData } = useContext(QuoteSyncContext);
  const navigate = useNavigate();
  
  // 货物列表状态
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([
    { id: '1', length: '', width: '', height: '', weight: '', quantity: '1' }
  ]);
  
   // 计算结果状态
  const [cargoResults, setCargoResults] = useState<Record<string, CargoCalculation>>({});
  const [summaryResult, setSummaryResult] = useState<SummaryResult>({
    totalActualWeight: 0,
    totalVolumeWeight: 0,
    totalChargeableWeight: 0,
    totalVolume: 0,
    weightRatio: 0,
    showWeightRatio: false
  });
  
  // 添加计算模式状态：'sea' 表示空海派，'express' 表示国际快递
  const [calculationMode, setCalculationMode] = useState<'sea' | 'express'>('sea');
  
  // 重货方价计算状态
  const [totalActualWeight, setTotalActualWeight] = useState<string>('');
  const [totalVolume, setTotalVolume] = useState<string>('');
  const [cubicPrice, setCubicPrice] = useState<string>('');
  const [costUnitPrice, setCostUnitPrice] = useState<string>(''); // 新增成本单价状态
  const [weightPriceResult, setWeightPriceResult] = useState<WeightPriceResult | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isListPriceMode, setIsListPriceMode] = useState(false); // 新增表价模式状态
  
  // 分泡计算状态
  const [bubbleDividingRatio, setBubbleDividingRatio] = useState<string>('70');
  const [listPrice, setListPrice] = useState<string>('');
  const [bubbleDividingTotalVolumeWeight, setBubbleDividingTotalVolumeWeight] = useState<string>('');
  const [bubbleDividingTotalActualWeight, setBubbleDividingTotalActualWeight] = useState<string>('');
  const [bubbleDividingResult, setBubbleDividingResult] = useState<BubbleDividingResult | null>(null);

  // 计算单个货物的结果
  const calculateCargoItem = useCallback((item: CargoItem): CargoCalculation | null => {
    const { length, width, height, weight, quantity } = item;
    
    // 验证输入
    if (!length || !width || !height || !weight || !quantity) {
      return null;
    }
    
    const len = parseFloat(length);
    const w = parseFloat(width);
    const h = parseFloat(height);
    const wgt = parseFloat(weight);
    const qty = parseInt(quantity);
    
    if (isNaN(len) || isNaN(w) || isNaN(h) || isNaN(wgt) || isNaN(qty) || 
        len <= 0 || w <= 0 || h <= 0 || wgt <= 0 || qty <= 0) {
      return null;
    }
    
    // 排序尺寸以计算周长
    const dimensions = [len, w, h].sort((a, b) => a - b);
    const perimeter = (dimensions[0] + dimensions[1]) * 2 + dimensions[2];
    
     // 计算体积(CBM)
    const volume = (len * w * h) / 1000000;
    
    // 根据选择的计算模式使用不同的体积重计算公式
    // 国际快递：长×宽×高/5000
    // 空海派：长×宽×高/6000
    const volumeWeight = (len * w * h) / (calculationMode === 'express' ? 5000 : 6000);
    
    // 单件计费不足12kg，按12kg计费
    const singleChargeableWeight = Math.max(wgt, volumeWeight, 12);
    
    return {
      volumeWeight,
      actualWeight: wgt,
      chargeableWeight: singleChargeableWeight,
      perimeter,
      volume
    };
  }, [calculationMode]);
  
  // 计算所有货物和汇总结果
  const calculateAll = useCallback(() => {
    const results: Record<string, CargoCalculation> = {};
    let totalActualWeight = 0;
    let totalVolumeWeight = 0;
    let totalChargeableWeight = 0;
    let totalVolume = 0;
    
    // 计算每个货物的结果
    cargoItems.forEach(item => {
      const result = calculateCargoItem(item);
      if (result && item.quantity) {
        const qty = parseInt(item.quantity);
        if (!isNaN(qty) && qty > 0) {
          results[item.id] = result;
          totalActualWeight += result.actualWeight * qty;
          totalVolumeWeight += result.volumeWeight * qty;
          totalChargeableWeight += result.chargeableWeight * qty;
          totalVolume += result.volume * qty;
        }
      }
    });
    
    // 计算总比重
    const weightRatio = totalVolume > 0 ? totalActualWeight / totalVolume : 0;
    const showWeightRatio = weightRatio >= 200;
    
    setCargoResults(results);
    // 计算单件最低12kg*件数的总重量
    let totalQuantity = 0;
    cargoItems.forEach(item => {
      if (item.quantity) {
        const qty = parseInt(item.quantity);
        if (!isNaN(qty) && qty > 0) {
          totalQuantity += qty;
        }
      }
    });
    
    // 计算最低总重量（件数 * 12kg）
    const minTotalWeight = totalQuantity * 12;
    
    // 计算最终的计费重：取总体积重、总实重和最低总重量的最大值
    const finalChargeableWeight = Math.max(totalActualWeight, totalVolumeWeight, minTotalWeight);
    
    setSummaryResult({
      totalActualWeight,
      totalVolumeWeight,
      totalChargeableWeight: finalChargeableWeight,
      totalVolume,
      weightRatio,
      showWeightRatio
    });
    
     // 同步到分泡计算
    // 注释掉自动同步，改为手动同步
    // setBubbleDividingTotalVolumeWeight(totalVolumeWeight.toFixed(2));
    // setBubbleDividingTotalActualWeight(totalActualWeight.toFixed(2));
    
    // 重置高级计算结果
    setWeightPriceResult(null);
    setBubbleDividingResult(null);
    
    toast.success('尺寸计算完成');
  }, [cargoItems, calculateCargoItem]);
  
  // 处理货物信息变更
  const handleCargoChange = useCallback((id: string, field: keyof CargoItem, value: string) => {
    setCargoItems(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);
  
  // 添加新货物
  const addCargoItem = useCallback(() => {
    const newId = (cargoItems.length + 1).toString();
    setCargoItems(prev => [...prev, {
      id: newId,
      length: '',
      width: '',
      height: '',
      weight: '',
      quantity: '1'
    }]);
  }, [cargoItems.length]);
  
  // 删除货物
  const removeCargoItem = useCallback((id: string) => {
    if (cargoItems.length <= 1) {
      toast.warning('至少保留一件货物');
      return;
    }
    setCargoItems(prev => prev.filter(item => item.id !== id));
    // 删除对应的计算结果
    setCargoResults(prev => {
      const newResults = { ...prev };
      delete newResults[id];
      return newResults;
    });
  }, [cargoItems.length]);
  
  // 控制弹窗显示的状态
  const [showWeightPriceResultModal, setShowWeightPriceResultModal] = useState(false);
  
  // 计算重货方价
  const calculateWeightPrice = useCallback(() => {
    // 验证输入
    if (!totalActualWeight || !totalVolume || !cubicPrice) {
      toast.error('请填写所有必填字段');
      return;
    }
    
    const weight = parseFloat(totalActualWeight);
    const volume = parseFloat(totalVolume);
    const price = parseFloat(cubicPrice);
    
    if (isNaN(weight) || isNaN(volume) || isNaN(price) || weight <= 0 || volume <= 0 || price <= 0) {
      toast.error('请输入有效的数值');
      return;
    }
    
    setIsCalculating(true);
    
  // 模拟计算延迟，增强用户体验
  setTimeout(() => {
    // 重货方数 = 总实重 / 363
    const weightVolume = weight / 363;
    
    // 计费方数计算规则
    let chargeableVolume;
    
    if (isListPriceMode) {
      // 表价模式：计费方数 = max(重货方数, 总方数)，最低按7个方计费
      chargeableVolume = Math.max(weightVolume, volume, 7);
    } else {
      // 非表价模式：计费方数 = max(重货方数, 总方数)，不设置最低方数限制
      chargeableVolume = Math.max(weightVolume, volume);
    }
    
    // 总价 = 计费方数 × 重货方价
    const totalPrice = chargeableVolume * price;
    
    // 重货单价 = 总价 / 总实重
    const unitPrice = totalPrice / weight;
    
    setWeightPriceResult({
      weightVolume,
      chargeableVolume,
      totalPrice,
      unitPrice
    });
    
    setIsCalculating(false);
    // 显示计算结果弹窗
    setShowWeightPriceResultModal(true);
    toast.success('重货方价计算完成');
  }, 500);
  }, [totalActualWeight, totalVolume, cubicPrice, isListPriceMode]);
  
  // 自动填充尺寸计算结果到重货方价计算
  const autoFillWeightPriceInputs = useCallback(() => {
    if (summaryResult.totalActualWeight > 0 && summaryResult.totalVolume > 0) {
      setTotalActualWeight(summaryResult.totalActualWeight.toFixed(2));
      setTotalVolume(summaryResult.totalVolume.toFixed(6));
      toast.success('已自动填充尺寸计算结果到重货方价计算');
    } else {
      toast.warning('请先完成尺寸计算');
    }
  }, [summaryResult]);
  
  // 复制计算结果
  const copyResults = useCallback(() => {
    const { totalActualWeight, totalVolumeWeight, totalChargeableWeight, totalVolume, weightRatio, showWeightRatio } = summaryResult;
    
    let resultText = `空海派尺寸计算结果：\n`;
    resultText += `总实重: ${totalActualWeight.toFixed(2)} kg\n`;
    resultText += `总体积重: ${totalVolumeWeight.toFixed(2)} kg\n`;
    resultText += `总计费重: ${totalChargeableWeight.toFixed(2)} kg\n`;
    resultText += `总方数: ${totalVolume.toFixed(6)} CBM\n`;
    
    if (showWeightRatio) {
      resultText += `整批货物比重: ${weightRatio.toFixed(2)} kg/CBM\n`;
    }
    
    if (weightPriceResult) {
      resultText += `\n重货方价计算结果：\n`;
      resultText += `重货方数: ${weightPriceResult.weightVolume.toFixed(2)} CBM\n`;
      resultText += `计费方数: ${weightPriceResult.chargeableVolume.toFixed(2)} CBM\n`;
      resultText += `总价: ${weightPriceResult.totalPrice.toFixed(2)} 元\n`;
      resultText += `重货单价: ${weightPriceResult.unitPrice.toFixed(2)} 元/kg\n`;
      
      // 如果有输入成本单价，添加到复制内容中
      if (costUnitPrice) {
        resultText += `成本单价: ${costUnitPrice} 元/kg\n`;
        const costPrice = parseFloat(costUnitPrice);
        if (!isNaN(costPrice)) {
          resultText += `${weightPriceResult.unitPrice < costPrice ? '重货单价更低' : costPrice < weightPriceResult.unitPrice ? '成本单价更低' : '两者价格相同'}\n`;
        }
      }
    }
    
    if (bubbleDividingResult) {
      resultText += `\n分泡计算结果：\n`;
      resultText += `实际计费重: ${bubbleDividingResult.actualChargeableWeight.toFixed(2)} kg\n`;
      resultText += `实际总价: ${bubbleDividingResult.actualTotalPrice.toFixed(2)} 元\n`;
      resultText += `实际成本单价: ${bubbleDividingResult.actualUnitPrice.toFixed(2)} 元/kg\n`;
    }
    
    navigator.clipboard.writeText(resultText);
    toast.success('计算结果已复制到剪贴板');
  }, [summaryResult, weightPriceResult, bubbleDividingResult, costUnitPrice]);
  
   // 清空所有数据
  const clearAll = useCallback(() => {
    setCargoItems([
      { id: '1', length: '', width: '', height: '', weight: '', quantity: '1' }
    ]);
    setCargoResults({});
    setSummaryResult({
      totalActualWeight: 0,
      totalVolumeWeight: 0,
      totalChargeableWeight: 0,
      totalVolume: 0,
      weightRatio: 0,
      showWeightRatio: false
    });
    setTotalActualWeight('');
    setTotalVolume('');
    setCubicPrice('');
    setCostUnitPrice(''); // 清空成本单价
    setWeightPriceResult(null);
    setBubbleDividingRatio('70');
    setListPrice('');
    setBubbleDividingTotalVolumeWeight('');
    setBubbleDividingTotalActualWeight('');
    setBubbleDividingResult(null);
    toast.info('已清空所有数据');
  }, []);
  
   // 计算分泡
  const calculateBubbleDividing = useCallback(() => {
    // 验证输入
    if (!listPrice || !bubbleDividingTotalVolumeWeight || !bubbleDividingTotalActualWeight) {
      toast.error('请填写所有必填字段');
      return;
    }
    
    const price = parseFloat(listPrice);
    const totalVolumeWeight = parseFloat(bubbleDividingTotalVolumeWeight);
    const totalActualWeight = parseFloat(bubbleDividingTotalActualWeight);
    
    if (isNaN(price) || isNaN(totalVolumeWeight) || isNaN(totalActualWeight) || 
        price <= 0 || totalVolumeWeight <= 0 || totalActualWeight <= 0) {
      toast.error('请输入有效的数值');
      return;
    }
    
     const ratio = parseFloat(bubbleDividingRatio) / 100;
     
     // 计算最低总实重（件数*最低计费重12）
     let totalQuantity = 0;
     cargoItems.forEach(item => {
       if (item.quantity) {
         const qty = parseInt(item.quantity);
         if (!isNaN(qty) && qty > 0) {
           totalQuantity += qty;
         }
       }
     });
     
     // 计算调整后的总实重，单件最低按12kg计算
     // 取用户输入的总实重和最低计费实重(件数*12kg)的较大值
     const adjustedTotalActualWeight = Math.max(totalActualWeight, totalQuantity * 12);
     
     // 计算调整后的总体积重，单件最低按12kg计算
     const adjustedTotalVolumeWeight = Math.max(totalVolumeWeight, totalQuantity * 12);
     
      // 当总体积重大于总实重时计算
      if (adjustedTotalVolumeWeight > adjustedTotalActualWeight) {
          // 计算实际计费重
        const actualChargeableWeight = adjustedTotalVolumeWeight - (adjustedTotalVolumeWeight - adjustedTotalActualWeight) * ratio;
        // 计算实际总价和单价
       const actualTotalPrice = actualChargeableWeight * price;
       const actualUnitPrice = totalVolumeWeight > 0 ? actualTotalPrice / totalVolumeWeight : 0;
     
      setBubbleDividingResult({ 
        actualChargeableWeight, 
        actualTotalPrice, 
        actualUnitPrice 
      });
      toast.success('分泡计算完成');
      // 显示计算结果弹窗
      setShowBubbleDividingResultModal(true);
    } else {
      toast.info('总体积重不大于总实重，无需分泡');
      setBubbleDividingResult(null);
    }
  }, [bubbleDividingTotalVolumeWeight, bubbleDividingTotalActualWeight, bubbleDividingRatio, listPrice, cargoItems]);
  
  // 控制分泡计算结果弹窗显示的状态
  const [showBubbleDividingResultModal, setShowBubbleDividingResultModal] = useState(false);
  
  return (
    <div className="min-h-[calc(100vh-32px)] flex flex-col">
      {/* 头部导航 */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Link 
            to="/" 
            className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline"
          >
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回首页
          </Link>
           <h1 className="text-2xl md:text-3xl font-bold">计算工具</h1>
          <div className="w-40"></div> {/* 占位，保持标题居中 */}
        </div>
       </header>

        {/* 其他工具快捷按钮 - 放置在上方 */}
        <div className="mb-6">
          <ToolShortcuts excludeToolId="combined-calculator" showOnlyButtons={true} />
        </div>

       {/* 主内容区 */}
      <main className="flex-grow">
        {/* 工具选项卡 */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="flex">
            <motion.button
              whileHover={{ backgroundColor: 'rgba(255,255,255,0.05)' }}
              className="flex-1 py-4 px-6 text-center font-medium border-b-2 border-blue-600 text-blue-600 dark:text-blue-400"
            >
              <i className="fa-solid fa-ruler-combined mr-2"></i>尺寸与重货方价计算
            </motion.button>
          </div>
        </div>

        {/* 空海派尺寸计算区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-8"
        >
           <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold dark:text-white flex items-center">
                <i className="fa-solid fa-calculator mr-2 text-blue-500"></i>
                {calculationMode === 'express' ? '国际快递' : '空海派'}尺寸计算
              </h2>
              <div className="flex gap-3">
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl overflow-hidden">
                  <button
                    onClick={() => setCalculationMode('sea')}
                    className={`px-4 py-2 transition-all flex items-center ${calculationMode === 'sea' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <i className="fa-solid fa-truck mr-2"></i>空海派
                  </button>
                  <button
                    onClick={() => setCalculationMode('express')}
                    className={`px-4 py-2 transition-all flex items-center ${calculationMode === 'express' ? 'bg-blue-600 text-white' : 'text-gray-700 dark:text-gray-300'}`}
                  >
                    <i className="fa-solid fa-plane mr-2"></i>国际快递
                  </button>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                   onClick={addCargoItem}
                   className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center"
                 >
                   <i className="fa-solid fa-plus mr-2"></i>添加货物
                 </motion.button>
                        <AITextRecognizer 
                       toolType="calculator"
                       onRecognize={(data) => {
                         // 检查是否有解析错误
                         if (data.error) {
                           toast.error("AI识别解析失败，请检查输入内容并重试");
                           return;
                         }
                         
                         // 处理标准格式的AI识别结果
                         if (Array.isArray(data.items) && data.items.length > 0) {
                           // 准备更新的货物项，只处理尺寸、重量和件数相关数据
                           const updatedCargoItems = data.items.map((item: any, index: number) => {
                             // 确保所有字段都是数字并保留2位小数
                             const length = item.length ? Number(item.length).toFixed(2) : '';
                             const width = item.width ? Number(item.width).toFixed(2) : '';
                             const height = item.height ? Number(item.height).toFixed(2) : '';
                             const weight = item.weight ? Number(item.weight).toFixed(2) : '';
                             const quantity = item.quantity ? String(Math.round(item.quantity)) : '1';
                             
                             return {
                               id: (index + 1).toString(),
                               length,
                               width,
                               height,
                               weight,
                               quantity
                             };
                           });
                           
                           // 设置货物项
                           setCargoItems(updatedCargoItems);
                           
                           // 计算总重量和总体积用于重货方价计算
                           const totalActualWeight = data.items.reduce((sum: number, item: any) => {
                             return sum + (Number(item.weight || 0) * Number(item.quantity || 1));
                           }, 0);
                           
                           const totalVolume = data.items.reduce((sum: number, item: any) => {
                             // 计算体积 (CBM) = 长×宽×高/1000000 × 件数
                             const volume = (Number(item.length || 0) * Number(item.width || 0) * Number(item.height || 0)) / 1000000;
                             return sum + (volume * Number(item.quantity || 1));
                           }, 0);
                           
                           setTotalActualWeight(totalActualWeight.toFixed(2));
                           setTotalVolume(totalVolume.toFixed(6));
                           
                           toast.success(`成功识别 ${data.items.length} 个货物信息，已自动转换单位为厘米`);
                         } else {
                           // 处理原始文本或非标准格式的结果
                           // 尝试从中提取尺寸和重量信息，完全忽略地址相关信息
                           try {
                             // 正则表达式提取常见的尺寸格式
                             const dimensionRegex = /(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)\s*([cm]m|米|毫米)?/gi;
                             const weightRegex = /(\d+(?:\.\d+)?)\s*(kg|千克|吨)\s*(\d+)\s*件/gi;
                             const totalWeightRegex = /总重量[:：]\s*(\d+(?:\.\d+)?)\s*(kg|千克|吨)/gi;
                             const quantityRegex = /件数[:：]\s*(\d+)/gi;
                             
                             let dimensions: any[] = [];
                             let match;
                             let totalWeight = 0;
                             let totalQuantity = 1;
                             let weightUnit = 'kg';
                             
                             // 提取尺寸信息
                             while ((match = dimensionRegex.exec(JSON.stringify(data))) !== null) {
                               let [, length, width, height, unit] = match;
                               let lengthCm = parseFloat(length);
                               let widthCm = parseFloat(width);
                               let heightCm = parseFloat(height);
                               
                               // 单位转换为厘米
                               if (unit === 'm' || unit === '米') {
                                 lengthCm *= 100;
                                 widthCm *= 100;
                                 heightCm *= 100;
                               } else if (unit === 'mm' || unit === '毫米') {
                                 lengthCm /= 10;
                                 widthCm /= 10;
                                 heightCm /= 10;
                               }
                               
                               dimensions.push({
                                 length: lengthCm.toFixed(2),
                                 width: widthCm.toFixed(2),
                                 height: heightCm.toFixed(2),
                                 weight: '',
                                 quantity: '1'
                               });
                             }
                             
                             // 提取总重量信息
                             match = totalWeightRegex.exec(JSON.stringify(data));
                             if (match) {
                               totalWeight = parseFloat(match[1]);
                               weightUnit = match[2] || 'kg';
                               
                               // 单位转换为千克
                               if (weightUnit === '吨') {
                                 totalWeight *= 1000;
                               }
                             }
                             
                             // 提取件数信息
                             match = quantityRegex.exec(JSON.stringify(data));
                             if (match) {
                               totalQuantity = parseInt(match[1]);
                             }
                             
                             // 提取重量和件数信息的另一种格式
                             match = weightRegex.exec(JSON.stringify(data));
                             if (match) {
                               totalWeight = parseFloat(match[1]);
                               weightUnit = match[2] || 'kg';
                               totalQuantity = parseInt(match[3]);
                               
                               // 单位转换为千克
                               if (weightUnit === '吨') {
                                 totalWeight *= 1000;
                               }
                             }
                             
                             // 如果有总重量和件数，计算单件重量
                             if (totalWeight > 0 && totalQuantity > 0) {
                               const unitWeight = (totalWeight / totalQuantity).toFixed(2);
                               
                               // 如果有尺寸信息，将重量分配给它们
                               if (dimensions.length > 0) {
                                 dimensions = dimensions.map((dim, index) => ({
                                   ...dim,
                                   weight: unitWeight,
                                   quantity: index === 0 ? String(totalQuantity) : '1'
                                 }));
                               } else {
                                 // 如果没有尺寸信息，创建一个默认的货物项
                                 dimensions.push({
                                   length: '',
                                   width: '',
                                   height: '',
                                   weight: unitWeight,
                                   quantity: String(totalQuantity)
                                 });
                               }
                             }
                             
                             // 如果提取到了尺寸信息，更新货物列表
                             if (dimensions.length > 0) {
                               const updatedCargoItems = dimensions.map((dim, index) => ({
                                 id: (index + 1).toString(),
                                 ...dim
                               }));
                               
                               setCargoItems(updatedCargoItems);
                               toast.success(`成功识别 ${dimensions.length} 个货物信息，已自动转换单位为厘米`);
                             } else {
                               toast.warning("未能识别到有效的货物尺寸信息，请检查输入内容");
                             }
                           } catch (e) {
                             console.error("手动提取信息失败:", e);
                             toast.error("AI识别失败，请尝试调整输入格式");
                           }
                         }
                       }}
                       placeholder="请输入货物尺寸信息文本，AI会精准识别长、宽、高（自动转换为厘米）、单件重量和件数信息。如果只提供总重量和件数，将自动计算单件重量。例如：货物尺寸30x40x50cm，每件重量5kg，共10件；或总重量150kg，30件。"
                     />
               </div>
             </div>
          
          {/* 货物信息输入表格 */}
          <div className="overflow-x-auto mb-6">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">货物</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">长度 (cm)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">宽度 (cm)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">高度 (cm)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">单件实重 (kg)</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">件数</th>
                  <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">操作</th>
                </tr>
              </thead>
              <tbody>
                {cargoItems.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="border-b border-gray-100 dark:border-gray-800"
                  >
                    <td className="py-3 px-4 text-sm font-medium">货物 {item.id}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.length}
                        onChange={(e) => handleCargoChange(item.id, 'length', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.width}
                        onChange={(e) => handleCargoChange(item.id, 'width', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.height}
                        onChange={(e) => handleCargoChange(item.id, 'height', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.weight}
                        onChange={(e) => handleCargoChange(item.id, 'weight', e.target.value)}
                        placeholder="0.00"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        step="0.01"
                        min="0"
                      />
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => handleCargoChange(item.id, 'quantity', e.target.value)}
                        placeholder="1"
                        className={`w-full px-3 py-2 rounded-lg border ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-gray-50 border-gray-200'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                        step="1"
                        min="1"
                      />
                    </td>
                     {/* 只有一个货物时不显示删除按钮 */}
                     <td className="py-3 px-4 text-center">
                      {cargoItems.length > 1 && (
                        <button
                          onClick={() => removeCargoItem(item.id)}
                          className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                          aria-label="删除货物"
                        >
                          <i className="fa-solid fa-trash-alt"></i>
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 计算按钮 */}
          <div className="mt-2 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={calculateAll}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center"
            >
              <i className="fa-solid fa-calculator mr-2"></i>计算尺寸与计费重
            </motion.button>
          </div>
        </motion.div>
        
        {/* 计算结果区域 */}
        {Object.keys(cargoResults).length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* 货物计算结果 */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 lg:col-span-1"
            >
              <h2 className="text-xl font-bold mb-6 dark:text-white">货物计算结果</h2>
              
              <div className="space-y-4">
                {cargoItems.map((item) => {
                  const result = cargoResults[item.id];
                  const qty = item.quantity ? parseInt(item.quantity) : 0;
                  
                  if (!result || qty <= 0) {
                    return (
                      <div key={item.id} className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
                        <p className="text-gray-500 dark:text-gray-400">货物 {item.id}：请填写完整信息</p>
                      </div>
                    );
                  }
                  
                  return (
                    <div key={item.id} className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                      <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-2">货物 {item.id} (×{qty})</h3>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">体积重：</span>
                          <span className="font-medium">{result.volumeWeight.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">实重：</span>
                          <span className="font-medium">{result.actualWeight.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">计费重：</span>
                          <span className="font-medium text-blue-600 dark:text-blue-400">{result.chargeableWeight.toFixed(2)} kg</span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">周长：</span>
                          <span className="font-medium">{result.perimeter.toFixed(2)} cm</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-gray-500 dark:text-gray-400">体积：</span>
                          <span className="font-medium">{result.volume.toFixed(6)} CBM</span>
                        </div>
                      </div>
                      
                      {/* 附加费提示 */}
                      {(result.perimeter > 265 || result.actualWeight >= 22) && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-xs text-yellow-800 dark:text-yellow-300">
                          <i className="fa-solid fa-exclamation-triangle mr-1"></i>
                          注意：此货物可能产生附加费
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </motion.div>
            
            {/* 汇总结果 */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 lg:col-span-2"
            >
               <div className="flex justify-between items-center mb-6">
                 <h2 className="text-xl font-bold dark:text-white">汇总结果</h2>
                 <div className="flex gap-3">
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={autoFillWeightPriceInputs}
                     className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center"
                   >
                     <i className="fa-solid fa-arrow-right-arrow-left mr-2"></i>同步到重货计算
                   </motion.button>
                      <motion.button
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={() => {
                         setBubbleDividingTotalVolumeWeight(summaryResult.totalVolumeWeight.toFixed(2));
                         
                         // 计算货物总件数
                         let totalQuantity = 0;
                         cargoItems.forEach(item => {
                           if (item.quantity) {
                             const qty = parseInt(item.quantity);
                             if (!isNaN(qty) && qty > 0) {
                               totalQuantity += qty;
                             }
                           }
                         });
                         
                         // 计算最低计费实重 (件数 * 12kg)
                         const minTotalActualWeight = totalQuantity * 12;
                         
                         // 取汇总结果的总实重和最低计费实重中的较大值
                         const finalTotalActualWeight = Math.max(summaryResult.totalActualWeight, minTotalActualWeight);
                         
                         setBubbleDividingTotalActualWeight(finalTotalActualWeight.toFixed(2));
                         toast.success('数据已同步到分泡计算');
                       }}
                       disabled={summaryResult.totalVolumeWeight === 0 && summaryResult.totalActualWeight === 0}
                       className={`px-4 py-2 ${summaryResult.totalVolumeWeight === 0 && summaryResult.totalActualWeight === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-teal-600 hover:bg-teal-700'} text-white rounded-xl transition-all flex items-center`}
                     >
                       <i className="fa-solid fa-sync-alt mr-2"></i>同步到分泡计算
                     </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          // 计算货物总件数
                          let totalQuantity = 0;
                          cargoItems.forEach(item => {
                            if (item.quantity) {
                              const qty = parseInt(item.quantity);
                              if (!isNaN(qty) && qty > 0) {
                                totalQuantity += qty;
                              }
                            }
                          });
                          
                          // 更新同步数据
                          updateQuoteData(
                            summaryResult.totalChargeableWeight.toFixed(2),
                            totalQuantity.toString()
                          );
                          
                          toast.success('数据已同步，正在跳转到文字报价工具');
                          
                          // 跳转到文字报价工具页面
                          setTimeout(() => {
                            navigate('/text-quote');
                          }, 500);
                        }}
                        disabled={summaryResult.totalChargeableWeight === 0}
                        className={`px-4 py-2 ${summaryResult.totalChargeableWeight === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-xl transition-all flex items-center`}
                      >
                        <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>同步到文字报价
                      </motion.button>
                 </div>
               </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">总实重</span>
                    <span className="font-bold text-green-600 dark:text-green-400">{summaryResult.totalActualWeight.toFixed(2)} kg</span>
                  </div>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">总体积重</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{summaryResult.totalVolumeWeight.toFixed(2)} kg</span>
                  </div>
                </div>
                
                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-300">总方数</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{summaryResult.totalVolume.toFixed(6)} CBM</span>
                  </div>
                </div>
                
                {summaryResult.showWeightRatio && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-300">整批货物比重</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{summaryResult.weightRatio.toFixed(2)} kg/CBM</span>
                    </div>
                  </div>
                )}
                
                <div className="md:col-span-2 bg-gradient-to-r from-blue-500 to-purple-600 p-5 rounded-xl text-white">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-lg font-medium">总计费重</span>
                    <span className="text-2xl font-bold">{summaryResult.totalChargeableWeight.toFixed(2)} kg</span>
                  </div>
                  <p className="text-xs text-white/80">
                    注：计费重量取实际重量和体积重量的较大值
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
         {/* 重货方价计算区域 */}
         <div className="grid grid-cols-1 gap-8 mb-8">
           {/* 重货方价计算 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
             <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white flex items-center">
                <i className="fa-solid fa-weight-hanging mr-2 text-amber-500"></i>
                重货方价计算
              </h2>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsListPriceMode(!isListPriceMode)}
                className={`py-2 px-4 rounded-xl font-medium flex items-center ${
                  isListPriceMode 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200'
                } transition-all`}
              >
                <i className={`fa-solid fa-${isListPriceMode ? 'check-square' : 'square'} mr-2`}></i>
                表价模式
              </motion.button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* 总实重输入 */}
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  总实重 (kg) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={totalActualWeight}
                    onChange={(e) => setTotalActualWeight(e.target.value)}
                    placeholder="输入总实重"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    step="0.01"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">kg</span>
                  </div>
                </div>
              </div>
              
              {/* 总方数输入 */}
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  总方数 (CBM) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={totalVolume}
                    onChange={(e) => setTotalVolume(e.target.value)}
                    placeholder="输入总方数"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    step="0.01"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">CBM</span>
                  </div>
                </div>
              </div>
              
  {/* 重货方价输入 */}
  <div>
    <label 
      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
    >
      重货方价 (元/CBM) <span className="text-red-500">*</span>
    </label>
    <div className="relative">
      <input
        type="number"
        value={cubicPrice}
        onChange={(e) => setCubicPrice(e.target.value)}
        placeholder="输入重货方价"
        className={`w-full px-4 py-3 rounded-xl border ${
          isDark 
            ? 'bg-gray-700 border-gray-600 text-white' 
            : 'bg-gray-50 border-gray-200'
        } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
        step="0.01"
        min="0"
      />
      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
        <span className="text-gray-500 dark:text-gray-400 text-sm">元/CBM</span>
      </div>
    </div>
  </div>
  
   {/* 表价模式选择按钮已移至标题旁 */}
            </div>
            
  {/* 新增成本单价输入框 */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
    <div className="md:col-span-3">
      <label 
        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        成本单价 (元/kg) <span className="text-gray-500">(选填)</span>
      </label>
      <div className="relative">
        <input
          type="number"
          value={costUnitPrice}
          onChange={(e) => setCostUnitPrice(e.target.value)}
          placeholder="输入成本单价"
          className={`w-full px-4 py-3 rounded-xl border ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white' 
              : 'bg-gray-50 border-gray-200'
          } focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`}
          step="0.01"
          min="0"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <span className="text-gray-500 dark:text-gray-400 text-sm">元/kg</span>
        </div>
      </div>
      
      {/* 表价模式说明 */}
      {isListPriceMode && (
        <div className="mt-2 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
          <p className="text-sm text-purple-700 dark:text-purple-300 flex items-start">
            <i className="fa-solid fa-info-circle mt-0.5 mr-2 text-purple-500"></i>
            表价模式：计费方数 = 重货方数和总方数中的较大值，最低按7个方计费
          </p>
        </div>
      )}
    </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={calculateWeightPrice}
                disabled={isCalculating}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  isCalculating 
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isCalculating ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    计算中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-calculator mr-2"></i>
                    计算重货方价
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
          
           {/* 分泡计算 */}
           <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold mb-6 dark:text-white flex items-center">
              <i className="fa-solid fa-wind mr-2 text-teal-500"></i>
              分泡计算
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* 总体积重输入 */}
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  总体积重 (kg) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bubbleDividingTotalVolumeWeight}
                    onChange={(e) => setBubbleDividingTotalVolumeWeight(e.target.value)}
                    placeholder="输入总体积重"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    step="0.01"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">kg</span>
                  </div>
                </div>
              </div>
              
              {/* 总实重输入 */}
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  总实重 (kg) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={bubbleDividingTotalActualWeight}
                    onChange={(e) => setBubbleDividingTotalActualWeight(e.target.value)}
                    placeholder="输入总实重"
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                    step="0.01"
                    min="0"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">kg</span>
                  </div>
                </div>
              </div>
              
              {/* 分泡系数选择 */}
              <div>
                <label 
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                >
                  分泡系数 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={bubbleDividingRatio}
                    onChange={(e) => setBubbleDividingRatio(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-gray-50 border-gray-200'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}
                  >
                    <option value="70">70%</option>
                    <option value="60">60%</option>
                    <option value="50">50%</option>
                    <option value="40">40%</option>
                    <option value="30">30%</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <i className="fa-solid fa-chevron-down text-gray-500 dark:text-gray-400"></i>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              {/* 表价输入 */}
              <label 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                表价 (元/kg) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="输入表价"
                  className={`w-full px-4 py-3 rounded-xl border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  step="0.01"
                  min="0"
                />
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <span className="text-gray-500 dark:text-gray-400 text-sm">元/kg</span>
                </div>
              </div>
            </div>
            
            {/* 操作按钮 */}
            <div className="flex justify-center">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={calculateBubbleDividing}
                disabled={!listPrice || !bubbleDividingTotalVolumeWeight || !bubbleDividingTotalActualWeight}
                className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center ${
                  !listPrice || !bubbleDividingTotalVolumeWeight || !bubbleDividingTotalActualWeight
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                    : 'bg-teal-600 hover:bg-teal-700 text-white'
                }`}
              >
                <i className="fa-solid fa-calculator mr-2"></i>计算分泡
              </motion.button>
            </div>
          </motion.div>
        </div>
        
        {/* 计算结果展示区域 */}
        <div className="grid grid-cols-1 gap-8 mb-8">
            {/* 重货方价计算结果弹窗 */}
            {showWeightPriceResultModal && weightPriceResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowWeightPriceResultModal(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold dark:text-white">重货方价计算结果</h2>
                    <button 
                      onClick={() => setShowWeightPriceResultModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="关闭"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 基本计算结果 */}
                    <div className="space-y-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">重货方数</span>
                          <span className="font-bold text-blue-600 dark:text-blue-400">{weightPriceResult.weightVolume.toFixed(2)} CBM</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          计算公式：总实重 / 363 = {totalActualWeight} / 363
                        </p>
                      </div>
                      
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">计费方数</span>
                          <span className="font-bold text-purple-600 dark:text-purple-400">{weightPriceResult.chargeableVolume.toFixed(2)} CBM</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          计算公式：取重货方数和总方数的较大值
                        </p>
                      </div>
                    </div>
                    
                    {/* 价格计算结果 */}
                    <div className="space-y-4">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-100 dark:border-green-800">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-600 dark:text-gray-300">总价</span>
                          <span className="font-bold text-green-600 dark:text-green-400">¥{weightPriceResult.totalPrice.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          计算公式：计费方数 × 重货方价 = {weightPriceResult.chargeableVolume.toFixed(2)} × {cubicPrice}
                        </p>
                      </div>
                      
                      {costUnitPrice ? (
                        // 有成本单价时，显示价格比较
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">重货单价</span>
                            <span className={`font-bold ${
                              parseFloat(costUnitPrice) > weightPriceResult.unitPrice 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded' 
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              ¥{weightPriceResult.unitPrice.toFixed(2)}/kg
                            </span>
                          </div>
                          <div className="flex justify-between items-center mt-2">
                            <span className="text-gray-600 dark:text-gray-300">成本单价</span>
                            <span className={`font-bold ${
                              parseFloat(costUnitPrice) < weightPriceResult.unitPrice 
                                ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300 px-2 py-0.5 rounded' 
                                : 'text-amber-600 dark:text-amber-400'
                            }`}>
                              ¥{costUnitPrice}/kg
                            </span>
                          </div>
                          {parseFloat(costUnitPrice) === weightPriceResult.unitPrice && (
                            <div className="mt-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                              两者价格相同
                            </div>
                          )}
                        </div>
                      ) : (
                        // 没有成本单价时，显示原有样式
                        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-100 dark:border-amber-800">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">重货单价</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">¥{weightPriceResult.unitPrice.toFixed(2)}/kg</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            计算公式：总价 / 总实重 = {weightPriceResult.totalPrice.toFixed(2)} / {totalActualWeight}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                    {/* 计算比较卡片 - 根据是否有成本单价显示不同内容 */}
                   {!costUnitPrice ? (
                     // 没有成本单价时，放大显示重货单价，用浅绿色作为底色
                     <motion.div
                       initial={{ opacity: 0, y: 10 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ duration: 0.5, delay: 0.1 }}
                       className="mt-6 p-6 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl text-white"
                     >
                       <div className="text-center">
                         <h3 className="font-bold text-lg mb-4">重货单价</h3>
                         <div className="bg-white/20 rounded-lg p-4 inline-block">
                           <p className="text-4xl font-bold">¥{weightPriceResult.unitPrice.toFixed(2)}/kg</p>
                         </div>
                         <p className="text-sm text-white/80 mt-4">
                           计算公式：总价 / 总实重 = {weightPriceResult.totalPrice.toFixed(2)} / {totalActualWeight}
                         </p>
                       </div>
                     </motion.div>
                   ) : (
                      // 有成本单价时，显示价格比较
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                        className="mt-6 p-5 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl text-white"
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="font-bold text-lg">计算比较</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            parseFloat(costUnitPrice) < weightPriceResult.unitPrice
                              ? 'bg-green-500/30 text-green-200'
                              : 'bg-amber-500/30 text-amber-200'
                          }`}>
                            {parseFloat(costUnitPrice) < weightPriceResult.unitPrice
                              ? '成本单价更低'
                              : parseFloat(costUnitPrice) > weightPriceResult.unitPrice
                              ? '重货单价更低'
                              : '两者价格相同'}
                          </span>
                        </div>
                        
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-2">
                           {/* 重货单价 */}
                           <div className={`flex-1 rounded-lg p-3 text-center ${
                             parseFloat(costUnitPrice) < weightPriceResult.unitPrice
                               ? 'bg-white/10'
                               : 'bg-gradient-to-br from-sky-400/50 to-sky-600/50 border border-sky-300/30 relative overflow-hidden'
                           }`}>
                            <p className="text-sm text-white/80 mb-1">重货单价</p>
                            <p className="text-2xl font-bold">¥{weightPriceResult.unitPrice.toFixed(2)}/kg</p>
                            {/* 皇冠小卡片 - 只在重货单价更低时显示 */}
                            {parseFloat(costUnitPrice) > weightPriceResult.unitPrice && (
                              <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">
                                <i className="fa-solid fa-crown mr-1"></i>最优
                              </div>
                            )}
                          </div>
                          
                          <div className="text-xl font-bold">VS</div>
                          
                           {/* 成本单价 */}
                           <div className={`flex-1 rounded-lg p-3 text-center ${
                             parseFloat(costUnitPrice) < weightPriceResult.unitPrice
                               ? 'bg-gradient-to-br from-sky-400/50 to-sky-600/50 border border-sky-300/30 relative overflow-hidden'
                               : 'bg-white/10'
                           }`}>
                            <p className="text-sm text-white/80 mb-1">成本单价</p>
                            <p className="text-2xl font-bold">¥{costUnitPrice}/kg</p>
                            {/* 皇冠小卡片 - 只在成本单价更低时显示 */}
                            {parseFloat(costUnitPrice) < weightPriceResult.unitPrice && (
                              <div className="absolute top-0 right-0 bg-yellow-500 text-white text-xs font-bold px-2 py-0.5 rounded-bl-lg">
                                <i className="fa-solid fa-crown mr-1"></i>最优
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                   )}
                  
                  <div className="mt-6 flex justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowWeightPriceResultModal(false)}
                      className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center"
                    >
                      <i className="fa-solid fa-check mr-2"></i>
                      确认
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          
           {/* 分泡计算结果弹窗 */}
           {showBubbleDividingResultModal && bubbleDividingResult && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowBubbleDividingResultModal(false)}
              >
                <motion.div 
                  initial={{ scale: 0.9, y: 20, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  exit={{ scale: 0.9, y: 20, opacity: 0 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold dark:text-white">分泡计算结果</h2>
                    <button 
                      onClick={() => setShowBubbleDividingResultModal(false)}
                      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      aria-label="关闭"
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* 实际计费重 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      className="bg-teal-50 dark:bg-teal-900/20 p-5 rounded-xl border border-teal-100 dark:border-teal-800"
                    >
                      <div className="text-center">
                        <h3 className="text-teal-800 dark:text-teal-300 text-lg font-medium mb-2">实际计费重</h3>
                        <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">{bubbleDividingResult.actualChargeableWeight.toFixed(2)} kg</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          计算公式：(总体积重-总实重)×分泡比例+总实重
                        </p>
                      </div>
                    </motion.div>
                    
                    {/* 实际总价 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.2 }}
                      className="bg-green-50 dark:bg-green-900/20 p-5 rounded-xl border border-green-100 dark:border-green-800"
                    >
                      <div className="text-center">
                        <h3 className="text-green-800 dark:text-green-300 text-lg font-medium mb-2">实际总价</h3>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400">¥{bubbleDividingResult.actualTotalPrice.toFixed(2)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          计算公式：实际计费重 × 表价
                        </p>
                      </div>
                    </motion.div>
                    
                    {/* 实际成本单价 */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                      className="bg-purple-50 dark:bg-purple-900/20 p-5 rounded-xl border border-purple-100 dark:border-purple-800"
                    >
                      <div className="text-center">
                        <h3 className="text-purple-800 dark:text-purple-300 text-lg font-medium mb-2">实际成本单价</h3>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">¥{bubbleDividingResult.actualUnitPrice.toFixed(2)}/kg</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          计算公式：实际总价 / 总体积重
                        </p>
                      </div>
                    </motion.div>
                  </div>
                  
                  {/* 计算说明 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                    className="mt-6 p-5 bg-gradient-to-r from-teal-600 to-green-600 rounded-xl text-white"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="font-bold text-lg">分泡计算说明</h3>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20">
                        {bubbleDividingRatio}% 分泡
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-2 mt-2">
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>总体积重:</strong> {bubbleDividingTotalVolumeWeight} kg
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>总实重:</strong> {bubbleDividingTotalActualWeight} kg
                        </p>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <p className="text-sm">
                          <strong>表价:</strong> {listPrice} 元/kg
                        </p>
                      </div>
                    </div>
                  </motion.div>
                  
                  <div className="mt-6 flex justify-center">
                    <motion.button whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowBubbleDividingResultModal(false)}
                      className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all flex items-center"
                    >
                      <i className="fa-solid fa-check mr-2"></i>
                      确认
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
        </div>
        
        {/* 操作按钮区域 */}
        {(weightPriceResult || bubbleDividingResult) && (
          <div className="flex justify-center mb-8">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={copyResults}
              className="px-6 py-3 rounded-xl font-medium bg-green-600 hover:bg-green-700 text-white transition-all flex items-center"
            >
              <i className="fa-solid fa-copy mr-2"></i>
              复制结果
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={clearAll}
              className="ml-3 px-6 py-3 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center"
            >
              <i className="fa-solid fa-undo-alt mr-2"></i>
              清空所有
            </motion.button>
          </div>
        )}
        
        {/* 计算规则说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5,delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold mb-4 dark:text-white">计算规则说明</h2>
          
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800">
                <h3 className="font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center">
                  <i className="fa-solid fa-calculator mr-2"></i>
                  空海派尺寸计算规则
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                   <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-blue-500"></i>
                    <span>总体积重 = 长×宽×高/5000×件数 <span className="text-sm text-gray-400">(国际快递模式)</span></span>
                  </li>
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-blue-500"></i>
                    <span>总体积重 = 长×宽×高/6000×件数 <span className="text-sm text-gray-400">(空海派模式)</span></span>
                  </li>
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-blue-500"></i>
                    <span>总实重 = 单件实重×件数</span>
                  </li>
                  <li className="flex items-start">
                     <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-blue-500"></i>
                     <span>计费重 = 总体积重、总实重和单件最低12kg*件数的结果中的较大值</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-blue-500"></i>
                    <span>单件计费不足12kg，按12kg计费</span>
                  </li>
                </ul>
              </div>
              
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center">
                  <i className="fa-solid fa-square-root-variable mr-2"></i>
                  重货方价计算规则
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-amber-500"></i>
                    <span>重货方数 = 总实重 / 363</span>
                  </li>
  <li className="flex items-start">
    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-amber-500"></i>
    <span>计费方数 =重货方数和总方数中的较大值</span>
  </li>
  <li className="flex items-start">
    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-amber-500"></i>
    <span>表价模式下，计费方数最低按7个方计费</span>
  </li>
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-amber-500"></i>
                     <span>总价 = 计费方数 × 重货方价</span>
                   </li>
                   <li className="flex items-start">
                     <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-amber-500"></i>
                     <span>重货单价 = 总价 / 总实重</span>
                   </li>
                </ul>
              </div>
              
              <div className="p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl border border-teal-100 dark:border-teal-800">
                <h3 className="font-medium text-teal-800 dark:text-teal-300 mb-3 flex items-center">
                  <i className="fa-solid fa-square-root-variable mr-2"></i>
                  分泡计算规则
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-teal-500"></i>
                     <span>当总体积重大于总实重时计算</span>
                   </li>
                   <li className="flex items-start">
                     <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-teal-500"></i>
                     <span>单件最低按12kg计算总实重</span>
                   </li>
                   <li className="flex items-start">
                     <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-teal-500"></i>
                      <span>实际计费重 = 总体积重-(总体积重-总实重)×分泡比例</span>
                   </li>
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-teal-500"></i>
                    <span>实际总价 = 实际计费重 × 表价</span>
                  </li>
                  <li className="flex items-start">
                    <i className="fa-solid fa-square-root-variable mt-0.5 mr-2 text-teal-500"></i>
                    <span>实际成本单价 = 实际总价 / 总体积重</span>
                  </li>
                </ul>
              </div>
            </div>
        </motion.div>
      </main>
      
      {/* 底部 */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 沈家俊工具箱 - 尺寸与重货方价计算</p>
      </footer>
      

      
    </div>
  );
}