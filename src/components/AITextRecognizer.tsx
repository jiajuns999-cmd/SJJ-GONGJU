import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { recognizeTextWithZhipu, recognizeImageWithZhipu, fileToBase64 } from '../lib/aiService';

interface AITextRecognizerProps {
  onRecognize: (data: any) => void;
  placeholder?: string;
  toolType?: 'textQuote' | 'fullContainerQuote' | 'calculator' | 'inquiryOrganizer';
}

export default function AITextRecognizer({ 
  onRecognize, 
  placeholder = "请输入需要识别的物流文本信息...",
  toolType = 'calculator'
}: AITextRecognizerProps) {
  const [inputText, setInputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 全局粘贴监听：弹窗打开时支持 Ctrl+V 粘贴图片到识别区
  useEffect(() => {
    if (!showModal) return;

    const handleGlobalPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          e.preventDefault();
          const blob = items[i].getAsFile();
          if (blob) {
            if (blob.size > 10 * 1024 * 1024) {
              toast.error('图片文件大小不能超过10MB');
              return;
            }
            setSelectedImage(blob);
            setActiveTab('image');
            toast.success('已粘贴图片，点击"开始识别"进行识别');
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [showModal]);

  const handleRecognize = async () => {
    setIsProcessing(true);
     try {
      toast.info("AI识别中，请稍候...");
      
      let result;
      if (activeTab === 'text') {
        if (!inputText.trim()) {
          throw new Error("请输入需要识别的文本");
        }
        result = await recognizeTextWithZhipu(inputText, toolType);
      } else {
        if (!selectedImage) {
          throw new Error("请选择需要识别的图片");
        }
        
        // 将图片转换为base64
        const imageBase64 = await fileToBase64(selectedImage);
        result = await recognizeImageWithZhipu(imageBase64, toolType);
        
        // 如果是模拟结果，提示用户
        if (result.isMock) {
          toast.warning("当前使用模拟的图片识别结果");
        }
      }
      
      onRecognize(result);
      toast.success("AI识别成功！已自动填充相关信息");
      
      // 重置状态
      setShowModal(false);
      setInputText("");
      setSelectedImage(null);
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "AI识别失败，请重试");
      console.error("识别错误:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const pastedText = e.clipboardData.getData('text');
    setInputText(pastedText);
  };

  // 提供示例输入，根据工具类型提供不同的示例
  const handleExampleClick = () => {
    let examples: string[] = [];
    
    if (toolType === 'textQuote') {
      // 文字报价工具的示例
      examples = [
        "美国，纽约市，10001，电子产品，计费重500kg，20件",
        "英国，伦敦，EC1A 1BB，服装，计费重300kg，50件",
        "澳大利亚，悉尼，2000，家具，计费重1200kg，15件"
      ];
    } else if (toolType === 'fullContainerQuote') {
       // 整柜报价工具的示例
      examples = [
        "品名：实木餐桌，HS编码：9403.60，货值：50000，柜型：40HQ，起运港：天津港（CNTXG），目的港：芝加哥（USCHI），汇率：7.2，船公司：马士基，海运费：3200美元，国内港杂：3500元，国外关税：500美元，国外拖车费：800美元，国内拖车费：2000元，报价补充：请在7月前安排发货",
        "品名：手机配件，HS编码：8517.70，货值：30000，柜型：20GP，起运港：上海港（CNSHG）-目的港：汉堡（DEHAM），汇率：7.1，船公司：地中海航运，海运费：2800美元，国内港杂：3000元，国内拖车费：2200元"
      ];
    } else if (toolType === 'inquiryOrganizer') {
      // 询价整理工具的示例
      examples = [
        "美国，纽约，10001，电子产品，尺寸30x40x50cm，每件重量5kg，共10件，总重量50kg，总方数0.06CBM",
        "英国，伦敦，EC1A 1BB，服装，货物1：长60cm 宽50cm 高40cm 重量8kg 20件，货物2：长30cm 宽25cm 高20cm 重量3kg 15件，总重量205kg，总方数1.02CBM",
        "澳大利亚，悉尼，2000，家具，尺寸统一为120x80x70cm，每件重量30kg，共5件，总重量150kg，总方数4.032CBM"
      ];
    } else {
      // 计算工具的示例
      examples = [
        "货物信息：尺寸30x40x50cm，每件重量5kg，共10件",
        "货物1：长60cm 宽50cm 高40cm 重量8kg 20件\n货物2：长30cm 宽25cm 高20cm 重量3kg 15件",
        "总重量: 150kg, 件数: 30件, 尺寸统一为45x35x25cm"
      ];
    }
    
    const randomExample = examples[Math.floor(Math.random() * examples.length)];
    setInputText(randomExample);
  };

  // 处理图片选择
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // 检查文件类型是否为图片
      if (!file.type.startsWith('image/')) {
        toast.error("请选择有效的图片文件");
        return;
      }
      
      // 检查文件大小（限制为10MB）
      if (file.size > 10 * 1024 * 1024) {
        toast.error("图片文件大小不能超过10MB");
        return;
      }
      
      setSelectedImage(file);
    }
  };

  // 移除已选择的图片
  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {/* AI识别按钮 */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all flex items-center"
      >
        <i className="fa-solid fa-robot mr-2"></i>
        AI识别
      </motion.button>

      {/* 识别弹窗 */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold dark:text-white flex items-center">
                <i className="fa-solid fa-robot text-purple-500 mr-2"></i>
                AI智能识别
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="关闭"
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            {/* 切换标签 */}
            <div className="flex mb-4 border-b border-gray-200 dark:border-gray-700">
              <button
                className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                  activeTab === 'text' 
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('text')}
                disabled={isProcessing}
              >
                <i className="fa-solid fa-file-alt mr-2"></i>文本识别
              </button>
              <button
                className={`flex-1 py-2 px-4 text-center font-medium transition-colors ${
                  activeTab === 'image' 
                    ? 'border-b-2 border-purple-500 text-purple-600 dark:text-purple-400' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
                onClick={() => setActiveTab('image')}
                disabled={isProcessing}
              >
                <i className="fa-solid fa-image mr-2"></i>图片识别
              </button>
            </div>

            {/* 文本输入区域 */}
            {activeTab === 'text' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  输入需要识别的文本
                </label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onPaste={handlePaste}
                  placeholder={placeholder}
                  className={`w-full px-4 py-3 rounded-xl border h-48 ${
                    isProcessing
                      ? "bg-gray-100 dark:bg-gray-750 cursor-not-allowed"
                      : "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                  } focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all resize-none`}
                  disabled={isProcessing}
                />
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {toolType === 'textQuote' 
                      ? '提示：AI将自动识别国家、地址、邮编、产品、计费重、件数等信息，完全忽略尺寸信息' 
                      : toolType === 'fullContainerQuote'
                      ? '提示：AI将自动识别品名、HS编码、货值、柜型、起运港和目的港（格式：起运港-目的港）、汇率、船公司、海运费、国内外费用等信息，国外港杂固定为700美元'
                      : toolType === 'inquiryOrganizer'
                      ? '提示：AI将自动识别国家、品名、尺寸、总重量、总方数、邮编、地址等信息，并按统一格式整理'
                      : '提示：AI将自动识别长、宽、高（转换为厘米）、重量和件数，支持多尺寸货物识别，完全忽略地址信息'}
                  </p>
                  <button
                    onClick={handleExampleClick}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    disabled={isProcessing}
                  >
                    查看示例
                  </button>
                </div>
              </div>
            ) : (
              // 图片上传区域
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  上传需要识别的图片
                </label>
                
                {!selectedImage ? (
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`flex flex-col items-center justify-center border-2 border-dashed ${
                      isProcessing 
                        ? "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-750 cursor-not-allowed" 
                        : "border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors cursor-pointer"
                    } rounded-xl p-8 h-48`}
                    onClick={() => !isProcessing && fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      disabled={isProcessing}
                    />
                    <i className="fa-solid fa-cloud-arrow-up text-4xl text-gray-400 mb-2"></i>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      点击上传或直接 Ctrl+V 粘贴图片
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      支持 JPG、PNG、WEBP 格式，最大 10MB
                    </p>
                  </motion.div>
                ) : (
                  <div className="relative border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-gray-50 dark:bg-gray-700 h-48">
                    <img 
                      src={URL.createObjectURL(selectedImage)} 
                      alt="已选择的图片" 
                      className="w-full h-full object-contain"
                    />
                    <button
                      onClick={removeSelectedImage}
                      className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-80 hover:opacity-100 transition-opacity"
                      disabled={isProcessing}
                    >
                      <i className="fa-solid fa-times"></i>
                    </button>
                  </div>
                )}
                
                <div className="mt-2">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    提示：AI将自动识别图片中的{toolType === 'textQuote' 
                      ? '国家、地址、邮编、产品、计费重、件数等信息' 
                      : toolType === 'fullContainerQuote'
                      ? '品名、HS编码、货值、柜型、起运港和目的港、汇率、船公司、海运费、国内外费用等信息'
                      : toolType === 'inquiryOrganizer'
                      ? '国家、品名、尺寸、总重量、总方数、邮编、地址等信息'
                      : '长、宽、高、重量和件数等尺寸重量信息'}
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowModal(false)}
                className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-xl font-medium transition-all"
                disabled={isProcessing}
              >
                取消
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleRecognize}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  isProcessing
                    ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed"
                    : "bg-purple-600 hover:bg-purple-700 text-white"
                }`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>
                    识别中...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-magic mr-2"></i>
                    开始识别
                  </>
                )}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}