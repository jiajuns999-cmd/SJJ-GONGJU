import { useState, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import ToolShortcuts from "@/components/ToolShortcuts";
import { QuoteSyncContext } from '@/contexts/quoteSyncContext';

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

export default function SizeCalculator() {
  const { isDark } = useTheme();
  const { updateQuoteData } = useContext(QuoteSyncContext);
  
  // 货物列表状态
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([
    { id: '1', length: '', width: '', height: '', weight: '', quantity: '1' },
    { id: '2', length: '', width: '', height: '', weight: '', quantity: '1' },
    { id: '3', length: '', width: '', height: '', weight: '', quantity: '1' }
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
  
  // 高级计算功能状态
  const [showWeightPriceCalc, setShowWeightPriceCalc] = useState(false);
  const [showBubbleDividingCalc, setShowBubbleDividingCalc] = useState(false);
  const [cubicPrice, setCubicPrice] = useState<string>('');
  const [weightPriceResult, setWeightPriceResult] = useState<{
    base: number;
    totalPrice: number;
    unitPrice: number;
  } | null>(null);
  
  // 添加计算模式状态：'sea' 表示空海派，'express' 表示国际快递
  const [calculationMode, setCalculationMode] = useState<'sea' | 'express'>('sea');
  const [bubbleDividingRatio, setBubbleDividingRatio] = useState<string>('70');
  const [listPrice, setListPrice] = useState<string>('');
  const [bubbleDividingResult, setBubbleDividingResult] = useState<{
    actualChargeableWeight: number;
    actualTotalPrice: number;
    actualUnitPrice: number;
  } | null>(null);
  
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
    
    // 重置高级计算结果
    setWeightPriceResult(null);
    setBubbleDividingResult(null);
    
    toast.success('计算完成');
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
  
  // 计算重货方价
  const calculateWeightPrice = useCallback(() => {
    if (!cubicPrice || isNaN(parseFloat(cubicPrice)) || parseFloat(cubicPrice) <= 0) {
      toast.error('请输入有效的方价');
      return;
    }
    
    const { totalActualWeight, totalVolume } = summaryResult;
    const price = parseFloat(cubicPrice);
    
    // 计算总实重/363和总方数，取较大值作为基数
    const weightBase = totalActualWeight / 363;
    // 方价计算最低按3方计算
    const cubicBase = Math.max(totalVolume, 3);
    const base = Math.max(weightBase, cubicBase);
    
    // 计算总价和单价
    const totalPrice = base * price;
    const unitPrice = totalActualWeight > 0 ? totalPrice / totalActualWeight : 0;
    
    setWeightPriceResult({ base, totalPrice, unitPrice });
    setShowWeightPriceCalc(false);
  }, [summaryResult, cubicPrice]);
  
  // 计算空派分泡
  const calculateBubbleDividing = useCallback(() => {
    if (!listPrice || isNaN(parseFloat(listPrice)) || parseFloat(listPrice) <= 0) {
      toast.error('请输入有效的表价');
      return;
    }
    
    const { totalVolumeWeight, totalActualWeight } = summaryResult;
    const ratio = parseFloat(bubbleDividingRatio) / 100;
    const price = parseFloat(listPrice);
    
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
    const minTotalActualWeight = totalQuantity * 12;
    const adjustedTotalActualWeight = Math.max(totalActualWeight, minTotalActualWeight);
    
     // 当总体积重大于总实重时计算
     if (totalVolumeWeight > adjustedTotalActualWeight) {
       // 计算实际计费重
       const actualChargeableWeight = totalVolumeWeight - (totalVolumeWeight - adjustedTotalActualWeight) * ratio;
      // 计算实际总价和单价
      const actualTotalPrice = actualChargeableWeight * price;
      const actualUnitPrice = totalVolumeWeight > 0 ? actualTotalPrice / totalVolumeWeight : 0;
      
      setBubbleDividingResult({ actualChargeableWeight, actualTotalPrice, actualUnitPrice });
    } else {
      toast.info('总体积重不大于总实重，无需分泡');
      setBubbleDividingResult(null);
    }
    
    setShowBubbleDividingCalc(false);
  }, [summaryResult, bubbleDividingRatio, listPrice, cargoItems]);
  
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
    setWeightPriceResult(null);
    setBubbleDividingResult(null);
    toast.info('已清空所有数据');
  }, []);
  
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
      resultText += `计算基数: ${weightPriceResult.base.toFixed(2)} 方\n`;
      resultText += `总价: ${weightPriceResult.totalPrice.toFixed(2)} 元\n`;
      resultText += `单价: ${weightPriceResult.unitPrice.toFixed(2)} 元/kg\n`;
    }
    
    if (bubbleDividingResult) {
      resultText += `\n空派分泡计算结果：\n`;
      resultText += `实际计费重: ${bubbleDividingResult.actualChargeableWeight.toFixed(2)} kg\n`;
      resultText += `实际总价: ${bubbleDividingResult.actualTotalPrice.toFixed(2)} 元\n`;
      resultText += `实际单价: ${bubbleDividingResult.actualUnitPrice.toFixed(2)} 元/kg\n`;
    }
    
    navigator.clipboard.writeText(resultText);
    toast.success('计算结果已复制到剪贴板');
  }, [summaryResult, weightPriceResult, bubbleDividingResult]);
  
  return (
    <div className="min-h-[calc(100vh-32px)] flex flex-col">
      {/* 头部导航 */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
            <i className="fa-solid fa-arrow-left mr-2"></i>
            返回首页
          </Link>
              <h1 className="text-2xl md:text-3xl font-bold">
                {calculationMode === 'express' ? '国际快递' : '空海派'}
                尺寸计算工具
              </h1>
              <div className="w-40"></div> {/* 占位，保持标题居中 */}
            </div>
       </header>

        {/* 其他工具快捷按钮 - 放置在上方 */}
        <div className="mb-6">
          <ToolShortcuts excludeToolId="size-calculator" showOnlyButtons={true} />
        </div>

       {/* 主内容区 */}
      <main className="flex-grow">
        {/* 货物信息输入区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 mb-8"
        >
              <div className="flex flex-wrap gap-3 items-center justify-between mb-6">
              <h2 className="text-xl font-bold dark:text-white">货物信息</h2>
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
                <button
                  onClick={addCargoItem}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center"
                >
                  <i className="fa-solid fa-plus mr-2"></i>添加货物
                </button>
              </div>
            </div>
          
          {/* 货物信息输入表格 */}
          <div className="overflow-x-auto">
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
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => removeCargoItem(item.id)}
                        className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        aria-label="删除货物"
                      >
                        <i className="fa-solid fa-trash-alt"></i>
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* 计算按钮 */}
          <div className="mt-6 flex justify-center">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={calculateAll}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center"
            >
              <i className="fa-solid fa-calculator mr-2"></i>计算计费重
            </motion.button>
          </div>
        </motion.div>
        
        {/* 计算结果区域 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
          
          {/* 汇总结果和高级计算 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 lg:col-span-2"
          >
            <h2 className="text-xl font-bold mb-6 dark:text-white">汇总结果</h2>
            
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
             
             {/* 高级计算功能按钮 */}
             <div className="flex flex-wrap gap-3 mb-6">
               {summaryResult.totalActualWeight > summaryResult.totalVolumeWeight && (
                 <motion.button
                   whileHover={{ scale: 1.03 }}
                   whileTap={{ scale: 0.97 }}
                   onClick={() => setShowWeightPriceCalc(true)}
                   className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-medium transition-all flex items-center"
                 >
                   <i className="fa-solid fa-weight-hanging mr-2"></i>重货方价计算
                 </motion.button>
               )}
               
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.97 }}
                 onClick={() => setShowBubbleDividingCalc(true)}
                 className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium transition-all flex items-center"
               >
                 <i className="fa-solid fa-wind mr-2"></i>空派分泡计算
               </motion.button>
               
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.97 }}
                 onClick={clearAll}
                 className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center"
               >
                 <i className="fa-solid fa-trash-alt mr-2"></i>清空所有
               </motion.button>
               
               <motion.button
                 whileHover={{ scale: 1.03 }}
                 whileTap={{ scale: 0.97 }}
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
                   
                   toast.success('数据已同步到文字报价工具');
                 }}
                 disabled={summaryResult.totalChargeableWeight === 0}
                 className={`px-5 py-2.5 ${summaryResult.totalChargeableWeight === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'} text-white rounded-xl font-medium transition-all flex items-center`}
               >
                 <i className="fa-solid fa-arrow-right-from-bracket mr-2"></i>同步到文字报价
               </motion.button>
             </div>
            
            {/* 复制结果按钮 */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={copyResults}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition-all flex items-center justify-center"
            >
              <i className="fa-solid fa-copy mr-2"></i>复制计算结果
            </motion.button>
          </motion.div>
        </div>
        
        {/* 重货方价计算弹窗 */}
        {showWeightPriceCalc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowWeightPriceCalc(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 dark:text-white">重货方价计算</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入方价 (元/方)
                </label>
                <input
                  type="number"
                  value={cubicPrice}
                  onChange={(e) => setCubicPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  step="0.01"
                  min="0"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  总实重: {summaryResult.totalActualWeight.toFixed(2)} kg
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  总方数: {summaryResult.totalVolume.toFixed(6)} CBM
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={calculateWeightPrice}
                  disabled={!cubicPrice || isNaN(parseFloat(cubicPrice)) || parseFloat(cubicPrice) <= 0}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    !cubicPrice || isNaN(parseFloat(cubicPrice)) || parseFloat(cubicPrice) <= 0
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-amber-600 hover:bg-amber-700 text-white'
                  }`}
                >
                  计算
                </button>
                
                <button
                  onClick={() => setShowWeightPriceCalc(false)}
                  className="px-4 py-2.5 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* 空派分泡计算弹窗 */}
        {showBubbleDividingCalc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowBubbleDividingCalc(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4 dark:text-white">空派分泡计算</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  选择分泡比例
                </label>
                <div className="flex flex-wrap gap-2">
                  {['70', '60', '50', '40', '30'].map(ratio => (
                    <button
                      key={ratio}
                      onClick={() => setBubbleDividingRatio(ratio)}
                      className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        bubbleDividingRatio === ratio
                          ? 'bg-teal-600 text-white'
                          : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
                      }`}
                    >
                      {ratio}%
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入表价 (元/kg)
                </label>
                <input
                  type="number"
                  value={listPrice}
                  onChange={(e) => setListPrice(e.target.value)}
                  placeholder="0.00"
                  className={`w-full px-4 py-2 rounded-xl border ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-gray-50 border-gray-200'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                  step="0.01"
                  min="0"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  总体积重: {summaryResult.totalVolumeWeight.toFixed(2)} kg
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  总实重: {summaryResult.totalActualWeight.toFixed(2)} kg
                </p>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={calculateBubbleDividing}
                  disabled={!listPrice || isNaN(parseFloat(listPrice)) || parseFloat(listPrice) <= 0}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-all ${
                    !listPrice || isNaN(parseFloat(listPrice)) || parseFloat(listPrice) <= 0
                      ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed' 
                      : 'bg-teal-600 hover:bg-teal-700 text-white'
                  }`}
                >
                  计算
                </button>
                
                <button
                  onClick={() => setShowBubbleDividingCalc(false)}
                  className="px-4 py-2.5 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all"
                >
                  取消
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        
        {/* 高级计算结果显示 */}
        {(weightPriceResult || bubbleDividingResult) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
          >
            <h2 className="text-xl font-bold mb-6 dark:text-white">高级计算结果</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {weightPriceResult && (
                <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-xl border border-amber-100 dark:border-amber-800">
                  <h3 className="font-medium text-amber-800 dark:text-amber-300 mb-3 flex items-center">
                    <i className="fa-solid fa-weight-hanging mr-2"></i>
                    重货方价计算结果
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">计算基数</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">{weightPriceResult.base.toFixed(2)} 方</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">总价</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">¥{weightPriceResult.totalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">单价</span>
                      <span className="font-bold text-amber-600 dark:text-amber-400">¥{weightPriceResult.unitPrice.toFixed(2)}/kg</span>
                    </div>
                  </div>
                </div>
              )}
              
              {bubbleDividingResult && (
                <div className="bg-teal-50 dark:bg-teal-900/20 p-5 rounded-xl border border-teal-100 dark:border-teal-800">
                  <h3 className="font-medium text-teal-800 dark:text-teal-300 mb-3 flex items-center">
                    <i className="fa-solid fa-wind mr-2"></i>
                    空派分泡计算结果
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">实际计费重</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">{bubbleDividingResult.actualChargeableWeight.toFixed(2)} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">实际总价</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">¥{bubbleDividingResult.actualTotalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">实际单价</span>
                      <span className="font-bold text-teal-600 dark:text-teal-400">¥{bubbleDividingResult.actualUnitPrice.toFixed(2)}/kg</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
        
        {/* 计算规则说明 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700"
        >
          <h2 className="text-xl font-bold mb-4 dark:text-white">计算规则说明</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-blue-600 dark:text-blue-400 mb-3">核心计算公式</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <i className="fa-solid fa-calculator mt-0.5 mr-2 text-blue-500"></i>
                  <span>总体积重 = 长×宽×高/5000×件数 <span className="text-sm text-gray-400">(国际快递模式)</span></span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-calculator mt-0.5 mr-2 text-blue-500"></i>
                  <span>总体积重 = 长×宽×高/6000×件数 <span className="text-sm text-gray-400">(空海派模式)</span></span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-calculator mt-0.5 mr-2 text-blue-500"></i>
                  <span>总实重 = 单件实重×件数</span>
                </li>
                <li className="flex items-start">
                   <i className="fa-solid fa-calculator mt-0.5 mr-2 text-blue-500"></i>
                   <span>计费重 = 总体积重、总实重和单件最低12kg*件数的结果中的较大值</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-calculator mt-0.5 mr-2 text-blue-500"></i>
                  <span>周长 = 两短边相加×2 + 最长边</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-medium text-amber-600 dark:text-amber-400 mb-3">特殊规则</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-circle mt-0.5 mr-2 text-amber-500"></i>
                  <span>单件计费不足12kg，按12kg计费</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-circle mt-0.5 mr-2 text-amber-500"></i>
                  <span>总比重 = 总实重 / 总方数（≥200时显示）</span>
                </li>
                <li className="flex items-start">
                  <i className="fa-solid fa-exclamation-circle mt-0.5 mr-2 text-amber-500"></i>
                  <span>符合特定条件将产生附加费</span>
                </li>
              </ul>
            </div>
          </div>
        </motion.div>
      </main>
      
      {/* 底部 */}
      <footer className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
        <p>© 2025 沈家俊工具箱 - 空海派尺寸计算</p>
      </footer>
    </div>
  );
}