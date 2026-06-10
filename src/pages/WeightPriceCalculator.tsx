import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ToolShortcuts from "@/components/ToolShortcuts";

const CHANNEL_OPTIONS = [{
    value: "OA普船",
    label: "OA普船"
}, {
    value: "美森正班",
    label: "美森正班"
}, {
    value: "美森加班",
    label: "美森加班"
}, {
    value: "合德快船",
    label: "合德快船"
}, {
    value: "休斯顿专线",
    label: "休斯顿专线"
}, {
    value: "芝加哥专线",
    label: "芝加哥专线"
}, {
    value: "纽约直航",
    label: "纽约直航"
}, {
    value: "萨凡纳专线",
    label: "萨凡纳专线"
}, {
    value: "欧洲海运",
    label: "欧洲海运"
}, {
    value: "欧洲空运",
    label: "欧洲空运"
}, {
    value: "英国海运",
    label: "英国海运"
}, {
    value: "英国空运",
    label: "英国空运"
}, {
    value: "美国空运",
    label: "美国空运"
}, {
    value: "联邦快递",
    label: "联邦快递"
}, {
    value: "UPS快递",
    label: "UPS快递"
}, {
    value: "铁路运输",
    label: "铁路运输"
}, {
    value: "卡车运输",
    label: "卡车运输"
}];

interface PriceVerificationData {
    warehouseNumber: string;
    channel: string;
    itemCount: string;
    chargeableWeight: string;
    unitPrice: string;
    customsFee: string;
    lengthFee: string;
    overweightFee: string;
    remoteFee: string;
    sailingDate: string;
    vesselName: string;
    discountPrice: string;
}

interface PriceVerificationHistory {
    id: string;
    timestamp: Date;
    channel: string;
    itemCount: string;
    totalPrice: string;
}

export default function WeightPriceCalculator() {
    const {
        isDark
    } = useTheme();

    const [formData, setFormData] = useState<PriceVerificationData>({
        warehouseNumber: "",
        channel: "",
        itemCount: "",
        chargeableWeight: "",
        unitPrice: "",
        customsFee: "",
        lengthFee: "",
        overweightFee: "",
        remoteFee: "",
        sailingDate: "",
        vesselName: "",
        discountPrice: ""
    });

    const [isCustomsSelected, setIsCustomsSelected] = useState(false);
    const [isLengthSelected, setIsLengthSelected] = useState(false);
    const [isOverweightSelected, setIsOverweightSelected] = useState(false);
    const [isRemoteSelected, setIsRemoteSelected] = useState(false);
    const [isVesselSelected, setIsVesselSelected] = useState(false);
    const [calculatedTotal, setCalculatedTotal] = useState("0.00");
    const [showCalculatedTotal, setShowCalculatedTotal] = useState(false);
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [history, setHistory] = useState<PriceVerificationHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        const savedHistory = localStorage.getItem("priceVerificationHistory");

        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                })) as PriceVerificationHistory[];

                setHistory(parsedHistory);
            } catch (error) {
                console.error("Failed to load price verification history:", error);
            }
        }
    }, []);

    useEffect(() => {
        if (history.length > 0) {
            localStorage.setItem("priceVerificationHistory", JSON.stringify(history));
        }
    }, [history]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const toggleServiceOption = (serviceType: "customs" | "length" | "overweight" | "remote" | "vessel") => {
        switch (serviceType) {
        case "customs":
            setIsCustomsSelected(!isCustomsSelected);

            if (!isCustomsSelected) {
                setFormData(prev => ({
                    ...prev,
                    customsFee: ""
                }));
            }

            break;
        case "length":
            setIsLengthSelected(!isLengthSelected);

            if (!isLengthSelected) {
                setFormData(prev => ({
                    ...prev,
                    lengthFee: ""
                }));
            }

            break;
        case "overweight":
            setIsOverweightSelected(!isOverweightSelected);

            if (!isOverweightSelected) {
                setFormData(prev => ({
                    ...prev,
                    overweightFee: ""
                }));
            }

            break;
        case "remote":
            setIsRemoteSelected(!isRemoteSelected);

            if (!isRemoteSelected) {
                setFormData(prev => ({
                    ...prev,
                    remoteFee: ""
                }));
            }

            break;
        case "vessel":
            setIsVesselSelected(!isVesselSelected);

            if (!isVesselSelected) {
                setFormData(prev => ({
                    ...prev,
                    sailingDate: "",
                    vesselName: ""
                }));
            }

            break;
        }
    };

    useEffect(() => {
        const {
            chargeableWeight,
            unitPrice,
            customsFee,
            lengthFee,
            overweightFee,
            remoteFee
        } = formData;

        if (chargeableWeight && unitPrice) {
            const weight = parseFloat(chargeableWeight);
            const price = parseFloat(unitPrice);
            const customs = customsFee ? parseFloat(customsFee) : 0;
            const length = lengthFee ? parseFloat(lengthFee) : 0;
            const overweight = overweightFee ? parseFloat(overweightFee) : 0;
            const remote = remoteFee ? parseFloat(remoteFee) : 0;

            if (!isNaN(weight) && !isNaN(price)) {
                const total = weight * price + customs + length + overweight + remote;
                setCalculatedTotal(total.toFixed(2));
                setShowCalculatedTotal(true);
            }
        } else {
            setShowCalculatedTotal(false);
        }
    }, [formData]);

    useEffect(() => {
        const text = buildVerificationText();
        setGeneratedText(text);
    }, [formData, calculatedTotal, showCalculatedTotal]);

    const buildVerificationText = () => {
        const lines = [];
        lines.push(`入仓单号：${formData.warehouseNumber || ""}`);
        lines.push(`走货渠道：${formData.channel || ""}`);

        if (formData.itemCount) {
            lines.push(`收货件数：${formData.itemCount}`);
        }

        if (formData.chargeableWeight) {
            lines.push(`收货计费重：${formData.chargeableWeight} kg`);
        }

        if (formData.unitPrice) {
            lines.push(`单价：${formData.unitPrice} 元/kg`);
        }

        if (formData.customsFee) {
            lines.push(`报关费：${formData.customsFee} 元`);
        }

        if (formData.lengthFee) {
            lines.push(`超长费：${formData.lengthFee} 元`);
        }

        if (formData.overweightFee) {
            lines.push(`超重费：${formData.overweightFee} 元`);
        }

        if (formData.remoteFee) {
            lines.push(`偏远费：${formData.remoteFee} 元`);
        }

        if (showCalculatedTotal) {
            lines.push(`总价：¥${calculatedTotal}`);
        } else {
            lines.push(`总价：请填写完整信息后自动计算`);
        }

        if (formData.discountPrice) {
            lines.push(`优惠后总价：¥${formData.discountPrice}`);
        }

        if (formData.sailingDate) {
            lines.push(`预配船期：${formData.sailingDate}`);
        }

        if (formData.vesselName) {
            lines.push(`船名船次：${formData.vesselName}`);
        }

        let separatorLength = 60;

        if (lines.length > 0) {
            const lastLine = lines[lines.length - 1];
            separatorLength = lastLine.length;
        }

        const separator = "=".repeat(separatorLength);

        const reminders = [
            "收货数据 ；以及运费 ；请核对确认！谢谢!",
            "走货渠道；确认走货渠道！",
            "包税渠道；所有产品申报信息需要完整并如实申报",
            "报  关 件；请及时提供报关资料",
            "船      期；船期为预配船期，开船时间以实际为准！"
        ];

        const text = lines.join("\n") + "\n" + separator + "\n" + reminders.join("\n");
        return text;
    };

    const copyVerificationText = () => {
        if (generatedText) {
            navigator.clipboard.writeText(generatedText);
            toast.success("核价文本已复制到剪贴板");
        }
    };

    const saveVerification = () => {
        if (!formData.warehouseNumber || !formData.channel || !formData.itemCount || !formData.chargeableWeight || !formData.unitPrice) {
            toast.error("请填写所有必填字段");
            return;
        }

        const newHistoryItem: PriceVerificationHistory = {
            id: Date.now().toString(),
            timestamp: new Date(),
            channel: formData.channel,
            itemCount: formData.itemCount,
            totalPrice: calculatedTotal
        };

        setHistory(prev => {
            const updatedHistory = [newHistoryItem, ...prev].slice(0, 10);
            localStorage.setItem("priceVerificationHistory", JSON.stringify(updatedHistory));
            return updatedHistory;
        });

        toast.success("核价已保存到历史记录");
    };

    const resetForm = () => {
        setFormData({
            warehouseNumber: "",
            channel: "",
            itemCount: "",
            chargeableWeight: "",
            unitPrice: "",
            customsFee: "",
            lengthFee: "",
            overweightFee: "",
            remoteFee: "",
            sailingDate: "",
            vesselName: "",
            discountPrice: ""
        });

        setIsCustomsSelected(false);
        setIsLengthSelected(false);
        setIsOverweightSelected(false);
        setIsRemoteSelected(false);
        setShowCalculatedTotal(false);
        toast.info("已重置表单内容");
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem("priceVerificationHistory");
        toast.success("历史记录已清空");
    };

    return (
        <div className="min-h-[calc(100vh-32px)] flex flex-col">
            <header className="mb-8">
                <div
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <Link
                        to="/"
                        className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        <i className="fa-solid fa-arrow-left mr-2"></i>返回首页
                                  </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">核价工具</h1>
                    <div className="flex justify-end space-x-2">
                        <motion.button
                            whileHover={{
                                scale: 1.05
                            }}
                            whileTap={{
                                scale: 0.95
                            }}
                            onClick={() => setShowHistory(!showHistory)}
                            className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center ${isDark ? "bg-gray-800 text-gray-200 hover:bg-gray-700" : "bg-gray-100 text-gray-800 hover:bg-gray-200"} transition-all`}>
                            <i className="fa-solid fa-history mr-2"></i>核价历史
                                        </motion.button>
                    </div>
                </div>
            </header>
            <div className="mb-6">
                <ToolShortcuts excludeToolId="weight-price-calculator" showOnlyButtons={true} />
            </div>
            <main className="flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <motion.div
                        initial={{
                            opacity: 0,
                            x: -20
                        }}
                        animate={{
                            opacity: 1,
                            x: 0
                        }}
                        transition={{
                            duration: 0.5
                        }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                        <h2 className="text-xl font-bold mb-6 dark:text-white">核价信息输入</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div
                                className="md:col-span-2"
                                style={{
                                    borderRadius: "20px"
                                }}>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">其他服务
                                                     </label>
                                <div className="flex flex-wrap gap-2">
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05
                                        }}
                                        whileTap={{
                                            scale: 0.95
                                        }}
                                        onClick={() => toggleServiceOption("customs")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isCustomsSelected ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>报关
                                                           </motion.button>
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05
                                        }}
                                        whileTap={{
                                            scale: 0.95
                                        }}
                                        onClick={() => toggleServiceOption("length")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isLengthSelected ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>超长
                                                           </motion.button>
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05
                                        }}
                                        whileTap={{
                                            scale: 0.95
                                        }}
                                        onClick={() => toggleServiceOption("overweight")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isOverweightSelected ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>超重
                                                           </motion.button>
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05
                                        }}
                                        whileTap={{
                                            scale: 0.95
                                        }}
                                        onClick={() => toggleServiceOption("remote")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isRemoteSelected ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>偏远
                                                            </motion.button>
                                    <motion.button
                                        whileHover={{
                                            scale: 1.05
                                        }}
                                        whileTap={{
                                            scale: 0.95
                                        }}
                                        onClick={() => toggleServiceOption("vessel")}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${isVesselSelected ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>船名船期
                                                            </motion.button>
                                </div>
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">入仓单号 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="warehouseNumber"
                                    value={formData.warehouseNumber}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">走货渠道 <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="channel"
                                    value={formData.channel}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}>
                                    <option value="">请选择</option>
                                    {CHANNEL_OPTIONS.map(option => <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>)}
                                </select>
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">收货件数 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="itemCount"
                                    value={formData.itemCount}
                                    onChange={handleInputChange}
                                    min="1"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">收货计费重 (kg) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="chargeableWeight"
                                    value={formData.chargeableWeight}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">单价 (元/kg) <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    name="unitPrice"
                                    value={formData.unitPrice}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            {isCustomsSelected && <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">报关费 (元)
                                                       </label>
                                <input
                                    type="number"
                                    name="customsFee"
                                    value={formData.customsFee}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>}
                            {isLengthSelected && <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">超长费 (元)
                                                       </label>
                                <input
                                    type="number"
                                    name="lengthFee"
                                    value={formData.lengthFee}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>}
                            {isOverweightSelected && <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">超重费 (元)
                                                       </label>
                                <input
                                    type="number"
                                    name="overweightFee"
                                    value={formData.overweightFee}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>}
                            {isRemoteSelected && <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">偏远费 (元)
                                                       </label>
                                <input
                                    type="number"
                                    name="remoteFee"
                                    value={formData.remoteFee}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>}
                            {isVesselSelected && <>
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预配船期 <span className="text-gray-500">(选填)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="sailingDate"
                                        value={formData.sailingDate}
                                        onChange={handleInputChange}
                                        placeholder="如：2025-01-15"
                                        className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                                </div>
                                <div>
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">船名船次 <span className="text-gray-500">(选填)</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="vesselName"
                                        value={formData.vesselName}
                                        onChange={handleInputChange}
                                        className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                                </div>
                            </>}
                            <div
                                className="md:col-span-2"
                                style={{
                                    borderRadius: "13px"
                                }}>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">优惠后总价 (元) <span className="text-gray-500">(选填)</span>
                                </label>
                                <input
                                    type="number"
                                    name="discountPrice"
                                    value={formData.discountPrice}
                                    onChange={handleInputChange}
                                    min="0"
                                    step="0.01"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`} />
                            </div>
                        </div>
                        {showCalculatedTotal && <motion.div
                            initial={{
                                opacity: 0,
                                y: -10
                            }}
                            animate={{
                                opacity: 1,
                                y: 0
                            }}
                            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-green-800 dark:text-green-300">自动计算总价</span>
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">¥{calculatedTotal}</span>
                            </div>
                            <p className="text-xs text-green-700 dark:text-green-400 mt-1">计算公式：总价 = 单价 × 收货计费重{isCustomsSelected ? " + 报关费" : ""}{isLengthSelected ? " + 超长费" : ""}{isOverweightSelected ? " + 超重费" : ""}{isRemoteSelected ? " + 偏远费" : ""}
                            </p>
                        </motion.div>}
                        <div className="flex flex-wrap gap-3">
                            <motion.button
                                whileHover={{
                                    scale: 1.05
                                }}
                                whileTap={{
                                    scale: 0.95
                                }}
                                onClick={saveVerification}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all flex items-center">
                                <i className="fa-solid fa-save mr-2"></i>保存核价到历史
                                              </motion.button>
                            <motion.button
                                whileHover={{
                                    scale: 1.05
                                }}
                                whileTap={{
                                    scale: 0.95
                                }}
                                onClick={resetForm}
                                className="px-6 py-2.5 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all flex items-center">
                                <i className="fa-solid fa-undo-alt mr-2"></i>重置表单
                                              </motion.button>
                        </div>
                    </motion.div>
                    <motion.div
                        initial={{
                            opacity: 0,
                            x: 20
                        }}
                        animate={{
                            opacity: 1,
                            x: 0
                        }}
                        transition={{
                            duration: 0.5,
                            delay: 0.1
                        }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700 h-full flex flex-col">
                        <div className="flex flex-wrap justify-between items-center mb-4 gap-2">
                            <h2 className="text-xl font-bold dark:text-white">
                                <i className="fa-solid fa-sync-alt mr-2 text-blue-500 animate-pulse"></i>实时核价文本
                                              </h2>
                            <div className="flex items-center gap-2">
                                <motion.button
                                    whileHover={{
                                        scale: 1.05
                                    }}
                                    whileTap={{
                                        scale: 0.95
                                    }}
                                    onClick={copyVerificationText}
                                    disabled={!generatedText}
                                    className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center whitespace-nowrap ${!generatedText ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}`}>
                                    <i className="fa-solid fa-copy mr-1"></i>复制文本
                                                    </motion.button>
                                <span
                                    className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 whitespace-nowrap">自动同步更新
                                                    </span>
                            </div>
                        </div>
                        <motion.div
                            initial={{
                                scale: 0.95
                            }}
                            animate={{
                                scale: 1
                            }}
                            transition={{
                                duration: 0.3
                            }}
                            className="bg-gray-50 dark:bg-gray-700/30 p-6 rounded-xl font-mono text-sm border border-gray-200 dark:border-gray-700 mb-6 flex-grow overflow-y-auto">
                            {generatedText && <pre className="whitespace-pre-wrap break-words text-left">{generatedText}</pre>}
                        </motion.div>
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            <p className="flex items-start">
                                <i className="fa-solid fa-info-circle mt-0.5 mr-1 text-blue-500"></i>核价文本会随着您填写的信息实时更新，请检查所有信息无误后再使用。
                                              </p>
                        </div>
                    </motion.div>
                </div>
                <motion.div
                    initial={{
                        opacity: 0,
                        height: 0
                    }}
                    animate={{
                        opacity: showHistory ? 1 : 0,
                        height: showHistory ? "auto" : 0,
                        display: showHistory ? "block" : "none"
                    }}
                    transition={{
                        duration: 0.3
                    }}
                    className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold dark:text-white">核价历史记录</h2>
                        <button
                            onClick={clearHistory}
                            className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                            <i className="fa-solid fa-trash-alt mr-1"></i>清空历史
                                        </button>
                    </div>
                    {history.length === 0 ? <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <i className="fa-solid fa-history text-3xl mb-2 text-gray-400"></i>
                        <p>暂无核价历史记录</p>
                        <p className="text-xs mt-2">点击"保存核价到历史"按钮可保存当前核价</p>
                    </div> : <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">日期时间</th>
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">走货渠道</th>
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">收货件数</th>
                                    <th
                                        className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">总价</th>
                                </tr>
                            </thead>
                            <tbody>
                                {history.map(item => <tr
                                    key={item.id}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="py-3 px-4 text-sm">{item.timestamp.toLocaleString()}</td>
                                    <td className="py-3 px-4 text-sm">{item.channel}</td>
                                    <td className="py-3 px-4 text-sm">{item.itemCount}</td>
                                    <td
                                        className="py-3 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 text-right">¥{item.totalPrice}
                                    </td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>}
                </motion.div>
            </main>
            <footer
                className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
                <p>© 2025 沈家俊工具箱 - 专业核价工具</p>
            </footer>
        </div>
    );
}