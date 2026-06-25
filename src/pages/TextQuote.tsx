import { useState, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import ToolShortcuts from "@/components/ToolShortcuts";
import { QuoteSyncContext } from "@/contexts/quoteSyncContext";
import AITextRecognizer from "@/components/AITextRecognizer";
import { extractField } from "@/lib/aiService";

interface QuoteHistory {
    id: string;
    timestamp: Date;
    serviceType: string;
    product: string;
    totalPrice: string;
    country: string;
}

  // 欧盟国家列表
  const EU_COUNTRIES = [
    { value: "AT", label: "奥地利" },
    { value: "BE", label: "比利时" },
    { value: "BG", label: "保加利亚" },
    { value: "HR", label: "克罗地亚" },
    { value: "CY", label: "塞浦路斯" },
    { value: "CZ", label: "捷克" },
    { value: "DK", label: "丹麦" },
    { value: "EE", label: "爱沙尼亚" },
    { value: "FI", label: "芬兰" },
    { value: "FR", label: "法国" },
    { value: "DE", label: "德国" },
    { value: "GR", label: "希腊" },
    { value: "HU", label: "匈牙利" },
    { value: "IE", label: "爱尔兰" },
    { value: "IT", label: "意大利" },
    { value: "LV", label: "拉脱维亚" },
    { value: "LT", label: "立陶宛" },
    { value: "LU", label: "卢森堡" },
    { value: "MT", label: "马耳他" },
    { value: "NL", label: "荷兰" },
    { value: "PL", label: "波兰" },
    { value: "PT", label: "葡萄牙" },
    { value: "RO", label: "罗马尼亚" },
    { value: "SK", label: "斯洛伐克" },
    { value: "SI", label: "斯洛文尼亚" },
    { value: "ES", label: "西班牙" },
    { value: "SE", label: "瑞典" }
  ];
  
  // 东南亚国家列表
  const SEA_COUNTRIES = [
    { value: "SG", label: "新加坡" },
    { value: "MY", label: "马来西亚" },
    { value: "PH", label: "菲律宾" },
    { value: "TH", label: "泰国" },
    { value: "VN", label: "越南" },
    { value: "KH", label: "柬埔寨" }
  ];

const COUNTRIES = [{
    value: "US",
    label: "美国"
}, {
    value: "EU",
    label: "欧盟"
}, {
    value: "UK",
    label: "英国"
}, {
    value: "SEA",
    label: "东南亚"
}, {
    value: "AU",
    label: "澳洲"
}, {
    value: "CA",
    label: "加拿大"
}, {
    value: "AE",
    label: "阿联酋"
}];

const SERVICE_TYPES = [{
  value: "sea-truck",
  label: "海卡"
}, {
  value: "sea-express",
  label: "海派"
}, {
  value: "air-truck",
  label: "空卡"
}, {
  value: "air-express",
  label: "空派"
}, {
  value: "railway",
  label: "铁路"
}, {
  value: "truck-line",
  label: "卡航"
}, {
  value: "fedex",
  label: "联邦快递"
}, {
  value: "ups",
  label: "UPS"
}, {
  value: "dhl",
  label: "DHL"
}];

    // 渠道选项列表
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

export default function TextQuote() {
    const {
        isDark
    } = useTheme();
    
    const { chargeableWeight, estimatedQuantity } = useContext(QuoteSyncContext);

      const [formData, setFormData] = useState({
         country: "",
         serviceType: "sea-truck",
         quoteMode: "unitPrice",
         address: "",
         zipCode: "",  // 新增邮编字段
         product: "",
         chargeableWeight: "",
         unitPrice: "",
         totalPriceManual: "",
      freightCost: "",
  excessFee: "",
  excessLengthWeightFee: "",
  customsType: "",
  customsFee: "",
  privateAddressFee: "",
  remoteFee: "",
  channel: "",
  estimatedTime: "",
  estimatedQuantity: "",
  fastShip: false,
  slowShip: false,
  // 其他服务选项
  isRemote: false,
  isExcessLengthWeight: false,
  isPrivateAddress: false,
  isCustoms: false,
         fastShipUnitPrice: "",
         slowShipUnitPrice: "",
         cubicPrice: ""
     });
     
     // 控制报关类型选择框是否显示（默认不显示）
     const [showCustomsType, setShowCustomsType] = useState(false);

    const [fastShipTotalPrice, setFastShipTotalPrice] = useState("");
    const [slowShipTotalPrice, setSlowShipTotalPrice] = useState("");
    const [calculatedTotalPrice, setCalculatedTotalPrice] = useState("");
    const [generatedText, setGeneratedText] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [quoteHistory, setQuoteHistory] = useState<QuoteHistory[]>([]);
    const [showHistory, setShowHistory] = useState(false);
    
  // 新增状态：控制欧盟国家选择卡片显示和用户最终选择的国家
  const [showEuCountrySelect, setShowEuCountrySelect] = useState(false);
  const [selectedEuCountry, setSelectedEuCountry] = useState<string | null>(null);
  
  // 新增状态：控制东南亚国家选择卡片显示和用户最终选择的国家
  const [showSeaCountrySelect, setShowSeaCountrySelect] = useState(false);
  const [selectedSeaCountry, setSelectedSeaCountry] = useState<string | null>(null);
  
  // 新增状态：自定义国家输入
  const [customCountry, setCustomCountry] = useState("");
  
  // 渠道 Combobox 状态
  const [channelInputValue, setChannelInputValue] = useState("");
  const [showChannelDropdown, setShowChannelDropdown] = useState(false);
  
  // 同步 channelInputValue 与 formData.channel
  useEffect(() => {
    setChannelInputValue(formData.channel);
  }, [formData.channel]);

    useEffect(() => {
        const savedHistory = localStorage.getItem("quoteHistory");

        if (savedHistory) {
            try {
                const parsedHistory = JSON.parse(savedHistory).map((item: any) => ({
                    ...item,
                    timestamp: new Date(item.timestamp)
                })) as QuoteHistory[];

                setQuoteHistory(parsedHistory);
            } catch (error) {
                console.error("Failed to load quote history:", error);
            }
        }
    }, []);

     useEffect(() => {
         if (quoteHistory.length > 0) {
             localStorage.setItem("quoteHistory", JSON.stringify(quoteHistory));
         }
     }, [quoteHistory]);
     
     // 监听同步数据变化并更新表单
     useEffect(() => {
         if (chargeableWeight || estimatedQuantity) {
             setFormData(prev => ({
                 ...prev,
                 chargeableWeight: chargeableWeight || prev.chargeableWeight,
                 estimatedQuantity: estimatedQuantity || prev.estimatedQuantity
             }));
         }
     }, [chargeableWeight, estimatedQuantity]);
     
     // 监听同步数据变化并更新表单
     useEffect(() => {
         if (chargeableWeight || estimatedQuantity) {
             setFormData(prev => ({
                 ...prev,
                 chargeableWeight: chargeableWeight || prev.chargeableWeight,
                 estimatedQuantity: estimatedQuantity || prev.estimatedQuantity
             }));
         }
     }, [chargeableWeight, estimatedQuantity]);

    useEffect(() => {
        const {
            chargeableWeight,
            unitPrice,
            cubicPrice,
            customsFee,
            remoteFee,
            quoteMode,
            fastShipUnitPrice,
            fastShip
        } = formData;

        if (quoteMode === "unitPrice") {
            if (!chargeableWeight || !unitPrice) {
                setCalculatedTotalPrice("");
                setFastShipTotalPrice("");
                setSlowShipTotalPrice("");
                return;
            }

            const weight = parseFloat(chargeableWeight);
            const price = parseFloat(unitPrice);
     const customs = customsFee ? parseFloat(customsFee) : 0;
     const privateAddress = formData.privateAddressFee ? parseFloat(formData.privateAddressFee) : 0;
     const remote = remoteFee ? parseFloat(remoteFee) : 0;
     const excessLengthWeight = formData.excessLengthWeightFee ? parseFloat(formData.excessLengthWeightFee) : 0;

            if (isNaN(weight) || isNaN(price) || isNaN(customs) || isNaN(remote)) {
                setCalculatedTotalPrice("");
                setFastShipTotalPrice("");
                setSlowShipTotalPrice("");
                return;
            }

     const total = weight * price + customs + privateAddress + remote + excessLengthWeight;
     setCalculatedTotalPrice(total.toFixed(2));

            if (fastShip && fastShipUnitPrice) {
                const fastPrice = parseFloat(fastShipUnitPrice);

                if (!isNaN(fastPrice)) {
                     const fastTotal = weight * fastPrice + customs + privateAddress + remote + excessLengthWeight;
                     setFastShipTotalPrice(fastTotal.toFixed(2));
                } else {
                    setFastShipTotalPrice("");
                }
            } else {
                setFastShipTotalPrice("");
            }

            if (formData.slowShip && formData.slowShipUnitPrice) {
                const slowPrice = parseFloat(formData.slowShipUnitPrice);

                if (!isNaN(slowPrice)) {
                     const slowTotal = weight * slowPrice + customs + privateAddress + remote + excessLengthWeight;
                     setSlowShipTotalPrice(slowTotal.toFixed(2));
                } else {
                    setSlowShipTotalPrice("");
                }
            } else {
                setSlowShipTotalPrice("");
            }
        } else if (quoteMode === "cubicPrice") {
            if (!chargeableWeight || !cubicPrice) {
                setCalculatedTotalPrice("");
                setFastShipTotalPrice("");
                setSlowShipTotalPrice("");
                return;
            }

            const cubicMeters = parseFloat(chargeableWeight);
            const price = parseFloat(cubicPrice);
     const customs = customsFee ? parseFloat(customsFee) : 0;
     const privateAddress = formData.privateAddressFee ? parseFloat(formData.privateAddressFee) : 0;
     const remote = remoteFee ? parseFloat(remoteFee) : 0;
     const excessLengthWeight = formData.excessLengthWeightFee ? parseFloat(formData.excessLengthWeightFee) : 0;

            if (isNaN(cubicMeters) || isNaN(price) || isNaN(customs) || isNaN(remote)) {
                setCalculatedTotalPrice("");
                setFastShipTotalPrice("");
                setSlowShipTotalPrice("");
                return;
            }

     const total = cubicMeters * price + customs + privateAddress + remote + excessLengthWeight;
     setCalculatedTotalPrice(total.toFixed(2));

            if (fastShip && fastShipUnitPrice) {
                const fastPrice = parseFloat(fastShipUnitPrice);

                if (!isNaN(fastPrice)) {
                     const fastTotal = cubicMeters * fastPrice + customs + privateAddress + remote + excessLengthWeight;
                     setFastShipTotalPrice(fastTotal.toFixed(2));
                } else {
                    setFastShipTotalPrice("");
                }
            } else {
                setFastShipTotalPrice("");
            }

            if (formData.slowShip && formData.slowShipUnitPrice) {
                const slowPrice = parseFloat(formData.slowShipUnitPrice);

                if (!isNaN(slowPrice)) {
                     const slowTotal = cubicMeters * slowPrice + customs + privateAddress + remote + excessLengthWeight;
                     setSlowShipTotalPrice(slowTotal.toFixed(2));
                } else {
                    setSlowShipTotalPrice("");
                }
            } else {
                setSlowShipTotalPrice("");
            }
        } else if (quoteMode === "totalPrice") {
            if (!formData.freightCost) {
                setCalculatedTotalPrice("");
                setFastShipTotalPrice("");
                setSlowShipTotalPrice("");
                return;
            }

            const freight = parseFloat(formData.freightCost);
     const excess = formData.excessFee ? parseFloat(formData.excessFee) : 0;
     const privateAddress = formData.privateAddressFee ? parseFloat(formData.privateAddressFee) : 0;
     const remote = formData.remoteFee ? parseFloat(formData.remoteFee) : 0;
     const excessLengthWeight = formData.excessLengthWeightFee ? parseFloat(formData.excessLengthWeightFee) : 0;

            if (isNaN(freight) || isNaN(excess) || isNaN(remote)) {
                setCalculatedTotalPrice("");
                setFastShipTotalPrice("");
                setSlowShipTotalPrice("");
                return;
            }

     const total = freight + excess + privateAddress + remote + excessLengthWeight;
     setCalculatedTotalPrice(total.toFixed(2));

            if (fastShip && formData.fastShipUnitPrice) {
                const weight = chargeableWeight ? parseFloat(chargeableWeight) : 0;
                const fastPrice = parseFloat(formData.fastShipUnitPrice);
                const customs = customsFee ? parseFloat(customsFee) : 0;
                const remote = formData.remoteFee ? parseFloat(formData.remoteFee) : 0;
                const privateAddress = formData.privateAddressFee ? parseFloat(formData.privateAddressFee) : 0;

                if (!isNaN(weight) && !isNaN(fastPrice) && weight > 0) {
                     const fastTotal = weight * fastPrice + customs + privateAddress + remote + excessLengthWeight;
                     setFastShipTotalPrice(fastTotal.toFixed(2));
                } else {
                    setFastShipTotalPrice(total.toFixed(2));
                }
            } else if (fastShip) {
                setFastShipTotalPrice(total.toFixed(2));
            }

            setSlowShipTotalPrice(total.toFixed(2));
        }
    }, [
        formData.chargeableWeight,
        formData.unitPrice,
        formData.cubicPrice,
        formData.customsFee,
        formData.remoteFee,
        formData.quoteMode,
        formData.freightCost,
        formData.excessFee,
        formData.fastShipUnitPrice,
        formData.slowShipUnitPrice,
        formData.fastShip,
        formData.slowShip,
        formData.privateAddressFee,
        formData.isRemote,
        formData.isExcessLengthWeight
    ]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const {
            name,
            value
        } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleQuoteModeChange = (mode: string) => {
        setFormData(prev => ({
            ...prev,
            quoteMode: mode
        }));
    };

    const handleShipSpeedChange = (type: "fast" | "slow") => {
        setFormData(prev => ({
            ...prev,
            [`${type}Ship`]: !prev[`${type}Ship`]
        }));
  };

  // 处理其他服务选项变更
  const handleOtherServiceChange = (serviceType: "isRemote" | "isExcessLengthWeight" | "isPrivateAddress" | "isCustoms") => {
    setFormData(prev => ({
      ...prev,
      [serviceType]: !prev[serviceType]
    }));
  };

  // 获取国家名称，优先使用用户输入的自定义国家
  const getCountryName = (countryCode: string): string => {
    // 优先使用自定义输入的国家，即使没有选择预设国家
    if (customCountry.trim()) {
      return customCountry.trim();
    }
    
    // 其次检查东南亚国家
    if (countryCode === "SEA" && selectedSeaCountry) {
      const seaCountry = SEA_COUNTRIES.find(c => c.value === selectedSeaCountry);
      return seaCountry ? seaCountry.label : selectedSeaCountry;
    }
    
    // 检查欧盟国家
    if (countryCode === "EU" && selectedEuCountry) {
      const euCountry = EU_COUNTRIES.find(c => c.value === selectedEuCountry);
      return euCountry ? euCountry.label : selectedEuCountry;
    }
    
    // 最后检查其他国家
    const country = COUNTRIES.find(c => c.value === countryCode);
    return country ? country.label : countryCode;
  };

    const getServiceTypeName = (serviceType: string): string => {
        const service = SERVICE_TYPES.find(s => s.value === serviceType);
        return service ? service.label : serviceType;
    };

    const getNotes = (): string => {
        const {
            country,
            serviceType
        } = formData;

        if (country === "US" && serviceType === "sea-truck") {
            return "注意事项⚠\n1.收货体积或者重量变化超过8%,需重新确认价格\n2.后端收货人自行卸货，如果需要卸货服务+100美金，尺寸要求在（单边不超220cm，或单拖不超700KG）\n3.产品需要的资质认证需齐全，因产品资质认证不齐全，或产品不符合美国进口要求，造成的后果费用等客户自担\n4.计费重=体积重（长*宽*高m*167）和实重取大值（哪个大按哪个计费）";
        }

        if (country === "US" && (serviceType === "sea-express" || serviceType === "air-express")) {
            return "注意事项⚠\n1.纸箱包装，（其他包装算异形，需要加收异形附加费）\n2.尺寸要求，单件实重12-22kg之间 最长边不超120CM\n3.周长不超255，计算公式（两短边相加*2）+最长边\n4.偏远费35/件 或者45/美金一票，两者取其大\n5.计费规则，计费重=体积重（长*宽*高m*167）和实重取大值（哪个大按哪个计费）";
        }

        if (country === "EU" && serviceType === "sea-truck") {
            return "注意事项⚠\n产品需要打木架/木箱，内包装做好防护减震措施，且需要打叉车脚10cm左右";
        }

        if (country === "EU" && serviceType === "air-express") {
            return "注意事项⚠\nUPS派送尺寸要求\n1.单边长不超过99cm，或次长不超过76cm，或单件不超实重24kg（材重不超28kg）\n2.单件实重 12kg--24k之间\n3.周长不超 295cm计算公式；两短边相加*2+最长边\n4.单件不足12KG按照12KG收取 单票单件最低计费21 \n特别说明:以下情况发货人自行承担责任\nA.产品不具备CE认证,没有贴CE标签等原因导致海关扣关。\nB.产品没有如实申报、侵犯知识产权或者欧盟禁止进口导致海关扣关。\nC.产品配件不符合欧盟国家的要求导致海关扣关。";
        }

        if (country === "EU" && serviceType === "sea-express") {
            return "注意事项⚠\nUPS派送尺寸要求\n1.单边长不超过100cm，或次长不超过76cm，或单件不超实重24kg（材重不超28kg）\n单件实重 12kg--24k之间\n2.周长不超 295cm计算公式；两短边相加*2+最长边\nDPD派送尺寸要求\n1.单件实重不超30kg\n2.长度≤120cm,宽度≤60cm,高度≤60cm\n3.周长限制  长+(宽+高)*2小于295cm\n特别声明:\n货物需要按实际申报、不侵犯知识产权、负责进口国要求、如货物涉及FDA、FCC、UL、CE、蓝牙、HDMI、LaceyAct、DOT(不限于以上列举)等认证以及涉及到知识产权问题，或者目的地海关认定货物是品牌货物需要发货人提供授权文件,需及时提供相应授权书或认证报告";
        }

        if (country === "UK" && serviceType === "sea-express") {
            return "注意事项⚠\n上海 深圳 船期 五截一开  货满了会提前截单\nDPD派送尺寸要求\n1.单件实重不超30kg\n2.长度≤100cm,宽度≤70cm,高度≤60cm\n3.周长限制  长+(宽+高)*2小于295cm\n特别说明:以下情况发货人自行承担责任\nA.产品不具备CE认证,没有贴CE标签等原因导致海关扣关。\nB.产品没有如实申报、侵犯知识产权或者欧盟禁止进口导致海关扣关。\nC.产品配件不符合欧盟国家的要求导致海关扣关。";
        }

        if (country === "UK" && serviceType === "air-express") {
            return "注意事项⚠\nDPD派送尺寸要求\n1.单件实重不超30kg\n2.长度≤90cm,宽度≤65cm,高度≤55cm\n3.周长限制  长+(宽+高)*2小于295cm\n特别说明:以下情况发货人自行承担责任\nA.产品不具备CE认证,没有贴CE标签等原因导致海关扣关。\nB.产品没有如实申报、侵犯知识产权或者欧盟禁止进口导致海关扣关。\nC.产品配件不符合欧盟国家的要求导致海关扣关。";
        }

        if (country === "CA" && serviceType === "sea-express") {
            return "注意事项⚠\n1材积除6000计费,重量取货物的体积重量和实际重量中数值较大的一方。                      \nUPS派送尺寸要求\n2.单边长不超过120cm，或次长不超过74cm，或单件不超实重24kg（材重不超28kg）\n单件实重 12KG--22KG之间\n3.周长不超 260cm计算公式，周长=两短边相加*2+最长边";
        }

        if (country === "CA" && serviceType === "air-express") {
            return "注意事项⚠\n1材积除6000计费,重量取货物的体积重量和实际重量中数值较大的一方。                      \nUPS派送尺寸要求\n2.单边长不超过120cm，或次长不超过74cm，或单件不超实重24kg（材重不超28kg）\n单件实重 12KG--22KG之间\n3.周长不超 260cm计算公式，周长=两短边相加*2+最长边\n4.不接带电产品";
        }

        if (country === "SEA" && (serviceType === "sea-express" || serviceType === "air-express")) {
            return "注意事项⚠\n1.单件重量超过68KG,尺寸超过150*80*80CM，需要加收RMB200/票；需要打卡脚9CM高,\n（注：超大超重货物，若需请叉车上货卸货，具体费用实报实销）\n2.最低一方起收\n3.以下地址派送不到：军营，机场内，保税区，医院，监狱，离岛，果园深处（山里）等";
        }

        if (serviceType === "fedex" || serviceType === "ups" || serviceType === "dhl") {
            return "特别声明；\n国际快递需要收件人清关交税，如收件人拒付，\n税金自动弹回国内，寄件人支付关税!\n材积除5000计费,货物实重与体积重取大值计费";
        }

        return "注意事项⚠\n请确认货物符合运输要求，具体细节请咨询客服";
    };

  const buildQuoteText = () => {
  let quoteText = "";
  
  // 按照用户要求的顺序依次添加各信息项
  // 1. 国家
  quoteText += `国家：${getCountryName(formData.country)}`;
  
  // 2. 服务类型
  quoteText += `
 服务类型：${getServiceTypeName(formData.serviceType)}`;
  
  // 3. 报价渠道（将渠道显示为报价渠道）
  if (formData.channel) {
    quoteText += `
  报价渠道：${formData.channel}`;
  }
  
  // 4. 邮编
  if (formData.zipCode) {
    quoteText += `
  邮编：${formData.zipCode}`;
  }
  
  // 4. 地址
  if (formData.address) {
    quoteText += `
 地址：${formData.address}`;
  }
  
  // 5. 产品
  if (formData.product) {
    quoteText += `
 产品：${formData.product}`;
  }
  
  // 6. 预估件数（显示为件数）
  if (formData.estimatedQuantity) {
    quoteText += `
 件数：${formData.estimatedQuantity}`;
  }
  
  // 7. 计费重
  if (formData.chargeableWeight) {
    quoteText += `
 ${formData.quoteMode === "cubicPrice" ? "计费方数" : "计费重"}：${formData.chargeableWeight} ${formData.quoteMode === "cubicPrice" ? "CBM" : "kg"}`;
  }
  
  // 8. 单价
  if (formData.quoteMode === "unitPrice" && formData.unitPrice) {
    quoteText += `
 单价：${formData.unitPrice} /kg`;
  }
  
  if (formData.quoteMode === "cubicPrice" && formData.cubicPrice) {
    quoteText += `
 方价：${formData.cubicPrice} /CBM`;
  }
  
  // 9. 私人地址费用
  if (formData.privateAddressFee) {
    quoteText += `
 私人地址费用：${formData.privateAddressFee} 元`;
  }
  
  // 10. 偏远费
  if (formData.remoteFee) {
    quoteText += `
 偏远费：${formData.remoteFee} 元`;
  }
  
  // 11. 超长超重费
  if (formData.excessLengthWeightFee) {
    quoteText += `
 超长超重费：${formData.excessLengthWeightFee} 元`;
  }
  
  // 12. 报关费
  if (formData.customsFee) {
    quoteText += `
 报关费：${formData.customsFee} 元`;
  }
  
  // 13. 总价
  quoteText += `
 总价：${calculatedTotalPrice ? `${calculatedTotalPrice} 元` : "请填写完整信息后自动计算"}`;
  
  // 14. 预估时效
  if (formData.estimatedTime) {
    quoteText += `
 预估时效：${formData.estimatedTime} 天左右`;
  }
  
  // 15. 报关类型
  if (formData.customsType) {
    quoteText += `
 报关类型：${formData.customsType === "customs" ? "单证报关" : "买单报关"}`;
  }
  
  // 16. 收货人自卸货（不含卸货服务）
  if (formData.serviceType === "sea-truck" || formData.serviceType === "air-truck") {
    quoteText += `
 收货人自卸货（不含卸货服务）`;
  }
  
  // 慢船价格
  if (formData.slowShip) {
    if ((formData.quoteMode === "unitPrice" || formData.quoteMode === "cubicPrice") && formData.slowShipUnitPrice) {
      quoteText += `
 慢船${formData.quoteMode === "cubicPrice" ? "方价" : "单价"}：${formData.slowShipUnitPrice} ${formData.quoteMode === "cubicPrice" ? "/CBM" : "/kg"}`;
    }
    
    if (slowShipTotalPrice) {
      quoteText += `
 慢船总价：${slowShipTotalPrice} 元`;
    }
  }
  
  // 快船价格
  if (formData.fastShip) {
    quoteText += `
-------快船价格-------`;
    
    if ((formData.quoteMode === "unitPrice" || formData.quoteMode === "cubicPrice") && formData.fastShipUnitPrice) {
      quoteText += `
 快船${formData.quoteMode === "cubicPrice" ? "方价" : "单价"}：${formData.fastShipUnitPrice} ${formData.quoteMode === "cubicPrice" ? "/CBM" : "/kg"}`;
    }
    
    if (fastShipTotalPrice) {
      quoteText += `
 快船总价：${fastShipTotalPrice} 元`;
    }
    
    quoteText += `
---------------------`;
  }
  
  // 17. 注意时效（包含在注意事项中）
  quoteText += `
${getNotes()}`;
  
  return quoteText;
  };

      useEffect(() => {
        const text = buildQuoteText();
        setGeneratedText(text);
     }, [formData, calculatedTotalPrice, selectedEuCountry, selectedSeaCountry, customCountry]);

    const saveQuoteText = () => {
        setIsGenerating(true);

        setTimeout(() => {
            const newHistoryItem: QuoteHistory = {
                id: Date.now().toString(),
                timestamp: new Date(),
                serviceType: getServiceTypeName(formData.serviceType),
                product: formData.product || "未指定",
                totalPrice: calculatedTotalPrice || "未计算",
                country: getCountryName(formData.country)
            };

            setQuoteHistory(prev => {
                const updatedHistory = [newHistoryItem, ...prev].slice(0, 10);
                localStorage.setItem("quoteHistory", JSON.stringify(updatedHistory));
                return updatedHistory;
            });

            setIsGenerating(false);
            toast.success("报价已保存到历史记录");
        }, 600);
    };

    const copyQuoteText = () => {
        if (generatedText) {
            navigator.clipboard.writeText(generatedText);
            toast.success("报价文本已复制到剪贴板");
        }
    };

// 导出报价单功能
    const exportQuoteAsDocument = () => {
        if (!generatedText) return;
        
        // 分割文本，提取注意事项之前的内容
        const parts = generatedText.split('注意事项⚠');
        const quoteContent = parts[0].trim();
        const notesContent = parts.length > 1 ? '注意事项⚠' + parts[1] : '';
        
        // 将报价内容转换为表格行
        const quoteLines = quoteContent.split('\n').map(line => line.trim()).filter(line => line);
        
        // 创建HTML内容
        let tableRows = '';
        quoteLines.forEach(line => {
            const [key, value] = line.split('：');
            if (key && value) {
                tableRows += `
                    <tr>
                        <td class="border px-4 py-2 font-medium">${key}</td>
                        <td class="border px-4 py-2">${value}</td>
                    </tr>
                `;
            }
        });
        
        // 处理注意事项，确保按1.2.3分段显示并左对齐
        let formattedNotesContent = '';
        if (notesContent) {
            // 移除"注意事项⚠"前缀
            const notesText = notesContent.replace('注意事项⚠', '').trim();
            // 确保按1.2.3分段显示并左对齐
            formattedNotesContent = notesText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line)
                .join('<br>');
        }
        
        // 构建HTML文档，设置严格的A4纸张尺寸
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="zh-CN">
        <head>
            <meta charset="UTF-8">
            <title>报价单</title>
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
                .quote-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 15px;
                    font-size: 14px;
                }
                .quote-table th {
                    background-color: #f2f2f2;
                    text-align: left;
                }
                .quote-table th, .quote-table td {
                    border: 1px solid #ddd;
                    padding: 6px 8px;
                }
                .notes-section {
                    background-color: #f9f9f9;
                    padding: 12px;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    font-family: "Microsoft YaHei", "SimSun", Arial, sans-serif;
                    font-size: 13px;
                    line-height: 1.5;
                }
                .notes-title {
                    font-weight: bold;
                    color: #d9534f;
                    margin-bottom: 8px;
                }
                .notes-content {
                    text-align: left;
                    line-height: 1.6;
                }
            </style>
        </head>
        <body>
            <div class="a4-container">
                <div class="company-header">
                    <div class="company-name">上海湘诚国际物流有限公司</div>
                    <div>报价单</div>
                </div>
                
                <table class="quote-table">
                    ${tableRows}
                </table>
                
                ${formattedNotesContent ? `
                <div class="notes-section">
                    <div class="notes-title">注意事项</div>
                    <div class="notes-content">${formattedNotesContent}</div>
                </div>
                ` : ''}
            </div>
        </body>
        </html>
        `;
        
        // 创建Blob对象和下载链接
        const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/vnd.ms-word' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // 设置文件名：时间(不要年份)+国家+渠道+件数
        const date = new Date();
        // 格式：MM-DD
        const shortDate = `${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        const country = getCountryName(formData.country);
        const channel = formData.channel || '无渠道';
        const itemCount = formData.estimatedQuantity || '无件数';
        
        a.download = `${shortDate}_${country}_${channel}_${itemCount}.doc`;
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        
        // 清理
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        toast.success("报价单已导出为Word文档");
    };

    const resetForm = () => {
        setFormData({
            country: "US",
            serviceType: "sea-truck",
            quoteMode: "unitPrice",
            address: "",
            product: "",
            chargeableWeight: "",
            unitPrice: "",
            totalPriceManual: "",
            freightCost: "",
            excessFee: "",
            customsType: "",
            customsFee: "",
            privateAddressFee: "",
            remoteFee: "",
            channel: "",
            estimatedTime: "",
             estimatedQuantity: "",
             fastShip: false,
             slowShip: false,
             cubicPrice: "",
             fastShipUnitPrice: "",
             slowShipUnitPrice: "",
             zipCode: "",  // 重置邮编字段
  isRemote: false,
  isExcessLengthWeight: false,
  isPrivateAddress: false,
  isCustoms: false
         });

        setCalculatedTotalPrice("");
        toast.info("已重置表单内容");
    };

    const clearHistory = () => {
        setQuoteHistory([]);
        localStorage.removeItem("quoteHistory");
        toast.info("已清空报价历史记录");
    };

    const getFieldName = (field: string): string => {
        const fieldNames: Record<string, string> = {
            "address": "地址",
            "product": "产品",
            "chargeableWeight": "计费重",
            "unitPrice": "单价",
            "channel": "渠道",
            "estimatedTime": "预估时效",
            "estimatedQuantity": "预估件数",
            "privateAddressFee": "私人地址费用"
     };

    // 编辑历史报价的函数
    const editQuote = (quote: QuoteHistory) => {
        // 获取服务类型对象
        const serviceType = SERVICE_TYPES.find(s => s.label === quote.serviceType);
        
        // 设置表单数据，将历史记录中的值填充到表单
        setFormData(prev => ({
            ...prev,
            // 保留国家和服务类型
            serviceType: serviceType ? serviceType.value : prev.serviceType,
            product: quote.product === "未指定" ? "" : quote.product,
            // 其他字段可以根据需要重置或保留当前值
        }));
        
        // 显示提示信息
        toast.success(`已加载 "${quote.country} - ${quote.serviceType}" 的报价进行编辑`);
    };

        return fieldNames[field] || field;
    };

     return (
        <div className="min-h-[calc(100vh-32px)] flex flex-col">
            {}
            <header className="mb-8">
                <div
                    className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <Link
                        to="/"
                        className="flex items-center text-lg font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                        <i className="fa-solid fa-arrow-left mr-2"></i>返回首页
                    </Link>
                    <h1 className="text-2xl md:text-3xl font-bold text-center md:text-left">文字报价工具</h1>
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
                             <i className="fa-solid fa-history mr-2"></i>报价历史
                         </motion.button>
                 <AITextRecognizer 
                          toolType="textQuote"
                          onRecognize={(data) => {
                            // 检查是否有解析错误
                            if (data.error) {
                              toast.error("AI识别解析失败，请检查输入内容并重试");
                              return;
                            }
                            
                            // 确保只处理文字报价相关数据，严格过滤掉任何可能混入的尺寸相关字段
                            // 计费重、预估件数只保留纯数字（去掉单位等）
                            const cleanNumber = (val: any) => {
                              if (!val) return '';
                              const str = String(val);
                              // 提取数字（包括小数）
                              const match = str.match(/[\d.]+/);
                              return match ? match[0] : '';
                            };
                            const textQuoteData = {
                              country: data.country || '',
                              address: data.address || '',
                              zipCode: data.zipCode || '',
                              product: data.product || '',
                              chargeableWeight: cleanNumber(data.chargeableWeight),
                              estimatedQuantity: cleanNumber(data.estimatedQuantity)
                              // 明确不包含任何尺寸相关字段
                            };
                            
                            // 处理识别结果并填充到表单，只更新与文字报价相关的字段
                            setFormData(prev => ({
                              ...prev,
                              country: textQuoteData.country,
                              address: textQuoteData.address,
                              zipCode: textQuoteData.zipCode,
                              product: textQuoteData.product,
                              chargeableWeight: textQuoteData.chargeableWeight,
                              estimatedQuantity: textQuoteData.estimatedQuantity
                            }));
                            
                            // 当识别到国家时，自动处理国家选择逻辑
                            const recognizedCountry = textQuoteData.country;
                            if (recognizedCountry) {
                              // 检查是否为欧盟国家
                              const isEuCountry = EU_COUNTRIES.some(country => 
                                country.label.includes(recognizedCountry) || 
                                recognizedCountry.includes(country.label)
                              );
                              
                              // 检查是否为东南亚国家
                              const isSeaCountry = SEA_COUNTRIES.some(country => 
                                country.label.includes(recognizedCountry) || 
                                recognizedCountry.includes(country.label)
                              );
                              
                              // 检查是否为预设国家
                              const presetCountry = COUNTRIES.find(country => 
                                country.label.includes(recognizedCountry) || 
                                recognizedCountry.includes(country.label)
                              );
                              
                              // 设置相应的状态
                              if (isEuCountry) {
                                setShowEuCountrySelect(true);
                              } else if (isSeaCountry) {
                                setShowSeaCountrySelect(true);
                              } else if (presetCountry) {
                                // 选择预设国家
                                setFormData(prev => ({ ...prev, country: presetCountry.value }));
                                setSelectedEuCountry(null);
                                setSelectedSeaCountry(null);
                              } else {
                                // 设置为自定义国家
                                setCustomCountry(recognizedCountry);
                              }
                              
                              toast.success(`已自动识别并选择国家: ${recognizedCountry}`);
                            }
                            
                            // 如果识别到了数据，显示成功提示
                            const hasData = Object.values(textQuoteData).some(value => value !== undefined && value !== null && value !== '');
                            if (hasData) {
                              toast.success("AI识别成功！已自动填充相关信息");
                            } else {
                              toast.warning("未识别到有效信息，请检查输入内容");
                            }
                          }}
                          placeholder="请输入物流报价相关文本，AI将重点识别国家、地址、邮编、产品、计费重、件数等信息..."
                         />
                     </div>
                  </div>
               </header>
              
               {/* 其他工具快捷按钮 - 放置在上方 */}
               <div className="mb-8">
                 <ToolShortcuts excludeToolId="text-quote" showOnlyButtons={true} />
               </div>
              
              {}
            <main className="flex-grow">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {}
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
                        <div className="flex flex-wrap gap-3 mb-6">
                            <button
                                onClick={saveQuoteText}
                                disabled={isGenerating}
                                className={`px-6 py-2.5 rounded-xl font-medium transition-all ${isGenerating ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                                {isGenerating ? <>
                                    <i className="fa-solid fa-spinner fa-spin mr-2"></i>保存中...
                               </> : <>
                                    <i className="fa-solid fa-save mr-2"></i>保存报价到历史
                               </>}
                            </button>
                            <button
                                onClick={resetForm}
                                className="px-6 py-2.5 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all">
                                <i className="fa-solid fa-undo-alt mr-2"></i>重置表单
                            </button>
                        </div>
                        {}
            <div
                className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 rounded-xl mb-6 text-white">
                <h2 className="text-xl font-bold mb-4">选择国家</h2>
                <div className="flex flex-wrap gap-2 mb-4">
                    {COUNTRIES.map(country => <motion.button
                        key={country.value}
                        whileHover={{
                            scale: 1.05
                        }}
                        whileTap={{
                            scale: 0.95
                        }}
                      onClick={() => {
                                      setFormData(prev => ({
                                          ...prev,
                                          country: country.value
                                      }));
                                      // 当选择欧盟时显示欧盟国家选择卡片
                                      if (country.value === "EU") {
                                          setShowEuCountrySelect(true);
                                      } 
                                      // 当选择东南亚时显示东南亚国家选择卡片
                                      else if (country.value === "SEA") {
                                          setShowSeaCountrySelect(true);
                                      } 
                                      else {
                                          // 清除之前选择的国家
                                          setSelectedEuCountry(null);
                                          setSelectedSeaCountry(null);
                                      }
                                      // 选择预设国家时清除自定义输入
                                      setCustomCountry("");
                                  }}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${formData.country === country.value ? "bg-white text-blue-600" : "bg-white/20 hover:bg-white/30"}`}>
                        {country.label}
                    </motion.button>)}
                </div>
                
                {/* 自定义国家输入框 - 合并到国家选择卡片内 */}
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-1">填写国家</label>
                  <input
                      type="text"
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="如果预设国家中没有您需要的，可以在此输入"
                      className={`w-full px-3 py-1.5 rounded-xl border bg-white/20 border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 transition-all`} 
                  />
                  <p className="text-xs text-white/70 mt-0.5">
                    说明：如填写自定义国家，将优先显示此内容；如不填写，则使用上方选择的国家
                  </p>
                </div>
            </div>
            <h2 className="text-xl font-bold mb-6 dark:text-white">填写报价信息</h2>
             {}
             {/* 其他服务选择项 - 恢复为按钮选择模式 */}
                                <div className="col-span-2 mb-6">
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
                                            onClick={() => handleOtherServiceChange("isRemote")}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.isRemote ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>
                                            偏远
                                        </motion.button>
                                        <motion.button
                                            whileHover={{
                                                scale: 1.05
                                            }}
                                            whileTap={{
                                                scale: 0.95
                                            }}
                                            onClick={() => handleOtherServiceChange("isExcessLengthWeight")}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.isExcessLengthWeight ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>
                                            超长超重
                                        </motion.button>
                                        <motion.button
                                            whileHover={{
                                                scale: 1.05
                                            }}
                                            whileTap={{
                                                scale: 0.95
                                            }}
                                            onClick={() => handleOtherServiceChange("isPrivateAddress")}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.isPrivateAddress ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>
                                            私人地址
                                        </motion.button>
                                        <motion.button
                                            whileHover={{
                                                scale: 1.05
                                            }}
                                            whileTap={{
                                                scale: 0.95
                                            }}
                                            onClick={() => handleOtherServiceChange("isCustoms")}
                                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${formData.isCustoms ? "bg-blue-600 text-white" : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"}`}>
                                            报关
                                        </motion.button>
                                    </div>
                                </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                             {}
                               {/* 服务类型 */}
                               <div>
                                   <label
                                       className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">服务类型
                                                          </label>
                                   <select
                                       name="serviceType"
                                       value={formData.serviceType}
                                       onChange={handleInputChange}
                                       className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}>
                                       {SERVICE_TYPES.map(service => (
                                           <option key={service.value} value={service.value}>
                                               {service.label}
                                           </option>
                                       ))}
                                   </select>
                               </div>
                               
                               {/* 报价模式 */}
                               <div>
                                   <label
                                       className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">报价模式
                                                          </label>
                                   <select
                                       value={formData.quoteMode}
                                       onChange={(e) => handleQuoteModeChange(e.target.value)}
                                       className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}>
                                       <option value="unitPrice">单价模式</option>
                                       <option value="totalPrice">总价模式</option>
                                       <option value="cubicPrice">方价模式</option>
                                   </select>
                               </div>
                               
                             {}
                             {}
                             {/* 渠道，地址一行 */}
                            <div className="relative">
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">渠道
                                                       </label>
                                <input
                                    type="text"
                                    value={channelInputValue}
                                    onChange={(e) => {
                                      setChannelInputValue(e.target.value);
                                      setFormData(prev => ({ ...prev, channel: e.target.value }));
                                    }}
                                    onFocus={() => setShowChannelDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowChannelDropdown(false), 200)}
                                    placeholder="请选择或输入渠道"
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`}
                                />
                                {/* 下拉选项 */}
                                {showChannelDropdown && (
                                  <div className={`absolute z-10 w-full mt-1 max-h-40 overflow-auto rounded-xl border shadow-lg ${isDark ? "bg-gray-700 border-gray-600" : "bg-white border-gray-200"}`}>
                                    {CHANNEL_OPTIONS.filter(opt =>
                                      !channelInputValue || opt.label.includes(channelInputValue) || opt.value.includes(channelInputValue)
                                    ).map(option => (
                                      <div
                                        key={option.value}
                                        onMouseDown={() => {
                                          setFormData(prev => ({ ...prev, channel: option.value }));
                                          setChannelInputValue(option.label);
                                          setShowChannelDropdown(false);
                                        }}
                                        className={`px-4 py-2 cursor-pointer text-sm ${isDark ? "hover:bg-gray-600 text-white" : "hover:bg-blue-50 text-gray-800"}`}
                                      >
                                        {option.label}
                                      </div>
                                    ))}
                                  </div>
                                )}
                            </div>
                            {/* 地址输入框 */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">地址
                                                       </label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            {}
                            {/* 邮编输入框 */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">邮编
                                                       </label>
                                <input
                                    type="text"
                                    name="zipCode"
                                    value={formData.zipCode}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            {/* 产品输入框 */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">产品
                                                      </label>
                                <input
                                    type="text"
                                    name="product"
                                    value={formData.product}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            {}
                            {/* 计费重，单价一行 */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{formData.quoteMode === "cubicPrice" ? "计费方数" : "计费重"}
                                                      </label>
                                <input
                                    type="text"
                                    name="chargeableWeight"
                                    value={formData.chargeableWeight}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                             {}
                             {(formData.quoteMode === "unitPrice" || formData.quoteMode === "cubicPrice") && <div>
                                 <label
                                     className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{formData.quoteMode === "cubicPrice" ? "方价" : "单价"}
                                                         </label>
                                 <input
                                     type="text"
                                     name={formData.quoteMode === "cubicPrice" ? "cubicPrice" : "unitPrice"}
                                     value={formData.quoteMode === "cubicPrice" ? formData.cubicPrice : formData.unitPrice}
                                     onChange={handleInputChange}
                                     placeholder=""
                                     className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                             </div>}
                             {}
                             {/* 条件显示的私人地址费用 */}
                             {formData.isPrivateAddress && <div>
                                 <label
                                     className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">私人地址费用
                                              </label>
                                 <input
                                     type="text"
                                     name="privateAddressFee"
                                     value={formData.privateAddressFee}
                                     onChange={handleInputChange}
                                     placeholder=""
                                     className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                             </div>}
                             {/* 条件显示的偏远费 */}
                             {formData.isRemote && <div>
                                 <label
                                     className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">偏远费
                                              </label>
                                 <input
                                     type="text"
                                     name="remoteFee"
                                     value={formData.remoteFee}
                                     onChange={handleInputChange}
                                     placeholder=""
                                     className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                             </div>}
                             {}
                             {/* 条件显示的报关费 */}
                             {formData.isCustoms && <div>
                                 <label
                                     className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">报关费
                                              </label>
                                 <input
                                     type="text"
                                     name="customsFee"
                                     value={formData.customsFee}
                                     onChange={handleInputChange}
                                     placeholder=""
                                     className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                             </div>}
                            {/* 报关类型一行 */}
            {/* 报关类型选择框（默认不显示） */}
            {showCustomsType && (
              <div>
                  <label
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">报关类型
                                 </label>
                  <select
                      name="customsType"
                      value={formData.customsType}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none`}>
                      <option value="">请选择</option>
                      <option value="customs">单证报关</option>
                      <option value="buy">买单报关</option>
                  </select>
              </div>
            )}
                             {}
                             {/* 报关类型选择框已隐藏 */}
                            {}
                            {/* 预估件数，预估时效一行 */}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预估件数
                                                  </label>
                                <input
                                    type="text"
                                    name="estimatedQuantity"
                                    value={formData.estimatedQuantity}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            {}
                            <div>
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">预估时效
                                                  </label>
                                <input
                                    type="text"
                                    name="estimatedTime"
                                    value={formData.estimatedTime}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>
                            {}
                            {formData.fastShip && (formData.quoteMode === "unitPrice" || formData.quoteMode === "cubicPrice") && <div className="md:col-span-2">
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">快船{formData.quoteMode === "cubicPrice" ? "方价" : "单价"}
                                                        </label>
                                <input
                                    type="text"
                                    name="fastShipUnitPrice"
                                    value={formData.fastShipUnitPrice}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-green-500 transition-all`} />
                            </div>}
                            {}
                            {formData.quoteMode === "totalPrice" && <>
                                <div className="md:col-span-2">
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">运费
                                                           </label>
                                    <input
                                        type="text"
                                        name="freightCost"
                                        value={formData.freightCost}
                                        onChange={handleInputChange}
                                        placeholder=""
                                        className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                                </div>
                                <div className="md:col-span-2">
                                    <label
                                        className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">超长超重费
                                                           </label>
                                    <input
                                        type="text"
                                        name="excessFee"
                                        value={formData.excessFee}
                                        onChange={handleInputChange}
                                        placeholder=""
                                        className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                                </div>
                            </>}
                            {}
                            {/* 条件显示的超长超重费 */}
                            {formData.isExcessLengthWeight && <div className="md:col-span-2">
                                <label
                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">超长超重费
                                                        </label>
                                <input
                                    type="text"
                                    name="excessLengthWeightFee"
                                    value={formData.excessLengthWeightFee}
                                    onChange={handleInputChange}
                                    placeholder=""
                                    className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all`} />
                            </div>}
                        </div>
                        {}
                        {calculatedTotalPrice && <motion.div
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
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">¥{calculatedTotalPrice}</span>
                            </div>
                             <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                 {formData.quoteMode === "unitPrice" ? "计算公式：总计 = 计费重 × 单价 + 报关费 + 私人地址费用 + 偏远费 + 超长超重费" : 
                                  formData.quoteMode === "cubicPrice" ? "计算公式：总计 = 计费方数 × 方价 + 报关费 + 私人地址费用 + 偏远费 + 超长超重费" : 
                                  "计算公式：总计 = 运费 + 超长超重费 + 私人地址费用 + 偏远费 + 超长超重费"}
                             </p>
                        </motion.div>}
                        {}
                        {formData.fastShip && <motion.div
                            initial={{
                                opacity: 0,
                                y: -10
                            }}
                            animate={{
                                opacity: 1,
                                y: 0
                            }}
                            className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-100 dark:border-green-800">
                            <div className="mb-2">
                                <span className="font-medium text-green-800 dark:text-green-300">-------快船价格-------</span>
                            </div>
                            {}
                            {(formData.quoteMode === "unitPrice" || formData.quoteMode === "cubicPrice") && formData.fastShipUnitPrice && <div className="flex justify-between items-center mb-2">
                                <span className="font-medium text-green-800 dark:text-green-300">快船{formData.quoteMode === "cubicPrice" ? "方价" : "单价"}</span>
                                <span className="text-lg font-bold text-green-600 dark:text-green-400">¥{formData.fastShipUnitPrice}{formData.quoteMode === "cubicPrice" ? "/CBM" : "/kg"}</span>
                            </div>}
                            {}
                            {fastShipTotalPrice && <div className="flex justify-between items-center">
                                <span className="font-medium text-green-800 dark:text-green-300">快船总价</span>
                                <span className="text-xl font-bold text-green-600 dark:text-green-400">¥{fastShipTotalPrice}</span>
                            </div>}
                            {fastShipTotalPrice && <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                                {}计算公式：快船总计 = {formData.quoteMode === "cubicPrice" ? "计费方数 × 快船方价" : "计费重 × 快船单价"} + 报关费 + 私人地址费用 + 偏远费 + 超长超重费
                            </p>}
                        </motion.div>}
                        {}
                        <div
                            className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-100 dark:border-yellow-800">
                            <h3
                                className="font-medium text-yellow-800 dark:text-yellow-300 mb-2 flex items-center">
                                <i className="fa-solid fa-exclamation-triangle mr-2"></i>注意事项
                                               </h3>
                            <pre
                                className="text-sm text-yellow-700 dark:text-yellow-400 whitespace-pre-wrap font-mono">
                                {getNotes()}
                            </pre>
                        </div>
                        {formData.slowShip && (formData.quoteMode=== "unitPrice" || formData.quoteMode === "cubicPrice") && <div>
                            <label
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">慢船{formData.quoteMode === "cubicPrice" ? "方价" : "单价"}
                            </label>
                            <input
                                type="text"
                                name="slowShipUnitPrice"
                                value={formData.slowShipUnitPrice}
                                onChange={handleInputChange}
                                placeholder=""
                                className={`w-full px-4 py-2 rounded-xl border ${isDark ? "bg-gray-700 border-gray-600 text-white" : "bg-gray-50 border-gray-200"} focus:outline-none focus:ring-2 focus:ring-amber-500 transition-all`} />
                        </div>}
                    </motion.div>
                    {}
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
                    <i className="fa-solid fa-sync-alt mr-2 text-blue-500 animate-pulse"></i>实时报价文本
                </h2>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyQuoteText}
                        disabled={!generatedText}
                        className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center whitespace-nowrap ${!generatedText ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" : "bg-green-600 hover:bg-green-700 text-white"}`}>
                        <i className="fa-solid fa-copy mr-1"></i>复制文本
                    </button>
                    <button
                        onClick={exportQuoteAsDocument}
                        disabled={!generatedText}
                        className={`px-4 py-1.5 rounded-xl font-medium transition-all flex items-center whitespace-nowrap ${!generatedText ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" : "bg-blue-600 hover:bg-blue-700 text-white"}`}>
                        <i className="fa-solid fa-file-export mr-1"></i>导出报价单
                    </button>
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
                        {}
                        {}
                        {formData.slowShip && slowShipTotalPrice && <motion.div
                            initial={{
                                opacity: 0,
                                y: -10
                            }}
                            animate={{
                                opacity: 1,
                                y: 0
                            }}
                            className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
                            <div className="flex justify-between items-center">
                                <span className="font-medium text-amber-800 dark:text-amber-300">慢船总价</span>
                                <span className="text-xl font-bold text-amber-600 dark:text-amber-400">¥{slowShipTotalPrice}</span>
                            </div>
                        </motion.div>}
                        {}
                        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
                            <p className="flex items-start">
                                <i className="fa-solid fa-info-circle mt-0.5 mr-1 text-blue-500"></i>
                                报价文本会随着您填写的信息实时更新，请检查所有信息无误后再使用。
                            </p>
                        </div>
                    </motion.div>
                </div>
                {}
                <motion.div
                    initial={{
                        opacity: 0,
                        height: 0
                    }}
                    animate={{
                        opacity: showHistory ? 1 : 0,
                        height: showHistory ? "auto" : 0,
                        display: showHistory ? "block" : "none"
                    }}transition={{
                        duration: 0.3
                    }}
                    className="mt-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-100 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold dark:text-white">报价历史记录</h2>
                        <button
                            onClick={clearHistory}
                            className="text-sm text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors">
                            <i className="fa-solid fa-trash-alt mr-1"></i>清空历史
                        </button>
                    </div>
                    {quoteHistory.length === 0 ? <div className="text-center py-6 text-gray-500 dark:text-gray-400">
                        <i className="fa-solid fa-history text-3xl mb-2 text-gray-400"></i>
                        <p>暂无报价历史记录</p>
                        <p className="text-xs mt-2">点击"保存报价到历史"按钮可保存当前报价</p>
                    </div> : <div className="overflow-x-auto">
                        <table className="w-full min-w-[640px]">
                            <thead>
                                <tr className="border-b border-gray-200 dark:border-gray-700">
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">日期时间</th>
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">国家</th>
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">服务类型</th>
                                    <th
                                        className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">产品</th>
                                    <th
                                        className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">总价</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quoteHistory.map(item => <tr
                                    key={item.id}
                                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                                    <td className="py-3 px-4 text-sm">{item.timestamp.toLocaleString()}</td><td className="py-3 px-4 text-sm">{item.country}</td>
                                    <td className="py-3 px-4 text-sm">{item.serviceType}</td>
                                    <td className="py-3 px-4 text-sm">{item.product}</td>
                                    <td
                                        className="py-3 px-4 text-sm font-medium text-blue-600 dark:text-blue-400 text-right">¥{item.totalPrice}</td>
                                </tr>)}
                            </tbody>
                        </table>
                    </div>}
                </motion.div>
            </main>
            {}
            <footer
                className="mt-12 pt-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400">
                <p>© 2025 沈家俊工具箱 - 专业文字报价工具</p>
             </footer>
             
             {/* 欧盟国家选择卡片 */}
            {showEuCountrySelect && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                    onClick={() => setShowEuCountrySelect(false)}
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20 }}
                        animate={{ scale: 1, y: 0 }}
                        exit={{ scale: 0.9, y: 20 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center">
                            <i className="fa-solid fa-globe-europe mr-2 text-blue-500"></i>
                            选择欧盟国家
                        </h3><div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                            {EU_COUNTRIES.map(country => (
                                <motion.button
                                    key={country.value}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                          setSelectedEuCountry(country.value);
                          setShowEuCountrySelect(false);
                          setCustomCountry(""); // 选择预设国家时清除自定义输入
                          toast.success(`已选择：${country.label}`);
                                    }}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                        selectedEuCountry === country.value
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                    }`}
                                >
                                    {country.label}
                                </motion.button>
                            ))}
                        </div>
                        
                        <div className="flex justify-end">
                            <button
                                onClick={() => setShowEuCountrySelect(false)}
                                className="px-4 py-2 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all"
                            >
                                关闭
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
             )}
             
             {/* 东南亚国家选择卡片 */}
             {showSeaCountrySelect && (
                 <motion.div
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                     className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
                     onClick={() => setShowSeaCountrySelect(false)}
                 >
                     <motion.div
                         initial={{ scale: 0.9, y: 20 }}
                         animate={{ scale: 1, y: 0 }}
                         exit={{ scale: 0.9, y: 20 }}
                         className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-xl max-h-[80vh] overflow-y-auto"
                         onClick={(e) => e.stopPropagation()}
                     >
                         <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center">
                             <i className="fa-solid fa-map-marked-alt mr-2 text-green-500"></i>
                             选择东南亚国家
                         </h3>
                         
                         <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                             {SEA_COUNTRIES.map(country => (
                                 <motion.button
                                     key={country.value}
                                     whileHover={{ scale: 1.05 }}
                                     whileTap={{ scale: 0.95 }}
                                     onClick={() => {
                                          setSelectedSeaCountry(country.value);
                                          setShowSeaCountrySelect(false);
                                          setCustomCountry(""); // 选择预设国家时清除自定义输入
                                          toast.success(`已选择：${country.label}`);
                                     }}
                                     className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                         selectedSeaCountry === country.value
                                             ? "bg-green-600 text-white"
                                             : "bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                                     }`}
                                 >
                                     {country.label}
                                 </motion.button>
                             ))}
                         </div>
                         
                         <div className="flex justify-end">
                             <button
                                 onClick={() => setShowSeaCountrySelect(false)}
                                 className="px-4 py-2 rounded-xl font-medium bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 transition-all"
                             >
                                 关闭
                             </button>
                         </div>
                     </motion.div>
                 </motion.div>
             )}
        </div>
    );
}