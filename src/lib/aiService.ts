/**
 * AI服务模块 - 使用智谱API进行文本和图片识别
 */

// 智谱API基础配置
const ZHIPU_API_KEY = "sk-rkcwdaxjmgxvizijforsnzapizizmvvyinweutiqajjmytyd";
const ZHIPU_API_BASE_URL = "https://api.siliconflow.cn/v1";

/**
 * 调用智谱API进行文本识别 - 根据不同工具类型使用不同的识别模板
 * @param text 需要识别的文本
 * @param toolType 工具类型 ('textQuote' | 'fullContainerQuote' | 'calculator' | 'inquiryOrganizer')
 * @returns Promise<any> 识别后的结构化数据
 */
export async function recognizeTextWithZhipu(text: string, toolType: 'textQuote' | 'fullContainerQuote' | 'calculator' | 'inquiryOrganizer' = 'calculator'): Promise<any> {
  try {
    let systemPrompt = "";
    let userPrompt = "";
    
    // 根据工具类型设置完全独立的提示词，确保识别逻辑完全分离
    if (toolType === 'textQuote') {
      systemPrompt = "你是物流报价信息提取助手，只返回JSON，不输出任何解释。";
      userPrompt = `从以下文本提取物流报价信息，只返回JSON：
{"country":"","address":"","zipCode":"","product":"","chargeableWeight":"","estimatedQuantity":""}
不要提取尺寸信息。
文本：${text}`;
     } else if (toolType === 'fullContainerQuote') {
      systemPrompt = "你是整柜物流报价信息提取助手，只返回JSON，不输出任何解释。";
      userPrompt = `从以下文本提取整柜物流报价信息，只返回JSON：
{"productName":"","hsCode":"","declaredValue":"","containerType":"","destination":"起运港-目的港","exchangeRate":"","shippingCompany":"","seaFreight":"","domesticPortFee":"","foreignCustomsDuty":"","domesticTruckingFee":"","foreignTruckingFee":"","foreignPortFee":"700","receiverAddress":"","note":""}
费用字段只填纯数字，国外港杂固定"700"。
文本：${text}`;
    } else if (toolType === 'inquiryOrganizer') {
      systemPrompt = "你是物流询价信息提取助手，只返回JSON，不输出任何解释。";
      userPrompt = `从以下文本提取询价信息，只返回JSON（所有尺寸用厘米，重量用千克，数值用数字类型）：
{"country":"中国","product":"电子产品","items":[{"length":30,"width":20,"height":15,"weight":2.5,"quantity":10}],"totalWeight":"25","totalVolume":"0.09","zipCode":"10001","address":"纽约"}
以上仅为格式示例，请按实际文本内容填写。
文本：${text}`;
    } else {
      systemPrompt = "你是物流尺寸重量信息提取助手，只返回JSON，不输出任何解释。";
      userPrompt = `从以下文本提取货物尺寸重量信息，只返回JSON（尺寸统一为厘米，重量为千克，数值用数字类型不要带单位）：
{"items":[{"length":30,"width":20,"height":15,"weight":2.5,"quantity":10}]}
以上仅为格式示例，请按实际文本内容填写。忽略地址信息。
文本：${text}`;
    }

    const response = await fetch(`${ZHIPU_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-7B-Instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 800
      })
    });

    if (!response.ok) {
      throw new Error(`API请求失败: ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";
    
    // 尝试解析JSON结果
    try {
      // 提取JSON部分（有些情况下返回可能包含额外的文本说明）
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);
        
        // 确保返回的数据格式符合预期
        if (toolType === 'textQuote') {
          // 对于文字报价工具，确保返回的是扁平对象，并且不包含任何尺寸相关字段
          return {
            country: parsedData.country || '',
            address: parsedData.address || '',
            zipCode: parsedData.zipCode || '',
            product: parsedData.product || '',
            chargeableWeight: parsedData.chargeableWeight || '',
            estimatedQuantity: parsedData.estimatedQuantity || '',
            // 明确排除可能存在的尺寸相关字段
            length: undefined,
            width: undefined,
            height: undefined,
            items: undefined
          };
        } else if (toolType === 'calculator') {
          // 对于计算工具，确保返回的是包含items数组的对象，并且不包含任何地址相关字段
          return {
            items: Array.isArray(parsedData.items) ? parsedData.items : [],
            // 明确排除可能存在的地址相关字段
            country: undefined,
            address: undefined,
            zipCode: undefined,
            product: undefined
          };
        } else if (toolType === 'inquiryOrganizer') {
          // 对于询价整理工具，确保返回完整的结构
           return {
            country: parsedData.country || '',
            product: parsedData.product || '',
            items: Array.isArray(parsedData.items) ? parsedData.items : [],
            totalWeight: parsedData.totalWeight || '',
            totalVolume: parsedData.totalVolume || '',
            zipCode: parsedData.zipCode || '',
            address: parsedData.address || '',
            serviceProvider: parsedData.serviceProvider || '',
            channel: parsedData.channel || ''
          };
        }
        
        return parsedData;
      }
      const parsedResult = JSON.parse(result);
      return parsedResult;
    } catch (e) {
      console.error("JSON解析失败:", e);
      // 如果解析失败，返回包含原始文本的对象
      return { 
        rawText: result,
        error: "解析失败" 
      };
    }
  } catch (error) {
    console.error("智谱API调用错误:", error);
    throw error;
  }
}

/**
 * 构建图片识别的提示词（根据工具类型）——让视觉模型直接看图输出结构化JSON
 */
function buildImageRecognitionPrompts(toolType: string): { systemPrompt: string; userPrompt: string } {
  if (toolType === 'fullContainerQuote') {
    return {
      systemPrompt: "你是一个专业的整柜物流报价视觉识别助手。请仔细观察用户提供的图片（可能是报价单、聊天截图、表格等），从图片中精准提取整柜物流报价相关信息。图片中的信息可能以各种格式呈现（表格、自由文本、标签等），请结合上下文理解并提取。",
      userPrompt: `请仔细观察这张图片，提取所有与整柜物流报价相关的信息，并以严格的JSON格式返回：

【提取规则 — 请逐项仔细识别】
1. 品名(productName)：图片中描述的货物名称，中文或英文均可
2. HS编码(hsCode)：海关编码，如 9403.60.8080 或 940360
3. 货值(declaredValue)：申报货值，只提取纯数字，如 50000
4. 柜型(containerType)：如 20GP、40GP、40HQ、45HQ
5. 起运港-目的港(destination)：合并格式如"天津港（CNTXG）-芝加哥（USCHI）"
6. 汇率(exchangeRate)：纯数字如 7.2
7. 船公司(shippingCompany)：承运船公司名称
8. 海运费(seaFreight)：纯数字
9. 国内港杂(domesticPortFee)：纯数字，单位人民币
10. 国外关税(foreignCustomsDuty)：纯数字
11. 国内拖车费(domesticTruckingFee)：纯数字，单位人民币
12. 国外拖车费(foreignTruckingFee)：纯数字
13. 国外港杂(foreignPortFee)：固定填 "700"
14. 收件地址(receiverAddress)：国外收货地址
15. 报价补充(note)：备注、时效等补充信息

【重要规则】
- 所有费用字段只提取纯数字，不要带货币符号或单位
- 找不到的字段填空字符串 ""
- 只返回JSON，不要任何解释文字

返回格式：{"productName":"","hsCode":"","declaredValue":"","containerType":"","destination":"","exchangeRate":"","shippingCompany":"","seaFreight":"","domesticPortFee":"","foreignCustomsDuty":"","domesticTruckingFee":"","foreignTruckingFee":"","foreignPortFee":"700","receiverAddress":"","note":""}`
    };
  } else if (toolType === 'textQuote') {
    return {
      systemPrompt: "你是一个专业的物流报价视觉识别助手。请仔细观察图片提取文字报价信息。",
      userPrompt: `请仔细观察这张图片，提取物流文字报价信息，严格JSON格式返回：{"country":"","address":"","zipCode":"","product":"","chargeableWeight":"","estimatedQuantity":""}。不要提取尺寸信息。只返回JSON。`
    };
  } else if (toolType === 'inquiryOrganizer') {
    return {
      systemPrompt: "你是一个专业的物流询价视觉识别助手。请仔细观察图片提取询价信息。",
      userPrompt: `请仔细观察这张图片，提取询价信息，严格JSON格式返回：{"country":"","product":"","items":[{"length":数值cm,"width":数值cm,"height":数值cm,"weight":数值kg,"quantity":数值}],"totalWeight":"","totalVolume":"","zipCode":"","address":""}。只返回JSON。`
    };
  } else {
    return {
      systemPrompt: "你是一个专业的物流尺寸视觉识别助手。请仔细观察图片提取货物尺寸重量信息。",
      userPrompt: `请仔细观察这张图片，提取货物尺寸重量信息，严格JSON格式返回：{"items":[{"length":数值cm,"width":数值cm,"height":数值cm,"weight":数值kg,"quantity":数值}]}。注意将所有尺寸单位转换为厘米(cm)。只返回JSON。`
    };
  }
}

/**
 * 调用智谱API进行图片识别 — 使用 glm-4v-plus 视觉模型直接看图输出结构化JSON
 * 单步识别（不再先OCR再文本识别），避免信息损失，大幅提升准确率
 * @param imageBase64 图片的base64编码
 * @param toolType 工具类型 ('textQuote' | 'fullContainerQuote' | 'calculator' | 'inquiryOrganizer')
 * @returns Promise<any> 识别后的结构化数据
 */
export async function recognizeImageWithZhipu(imageBase64: string, toolType: 'textQuote' | 'fullContainerQuote' | 'calculator' | 'inquiryOrganizer' = 'calculator'): Promise<any> {
  try {
    const { systemPrompt, userPrompt } = buildImageRecognitionPrompts(toolType);

    // 使用 chat/completions 端点，多模态消息格式传入图片
    const response = await fetch(`${ZHIPU_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: "Qwen/Qwen2.5-VL-72B-Instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageBase64 } }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("视觉识别API错误:", errorText);
      throw new Error(`图片识别失败: HTTP ${response.status}`);
    }

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content || "";

    if (!result) {
      throw new Error("图片识别未返回有效内容");
    }

    // 解析JSON结果
    try {
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsedData = JSON.parse(jsonMatch[0]);

        // 根据工具类型规范化返回数据
        if (toolType === 'fullContainerQuote') {
          return {
            productName: parsedData.productName || '',
            hsCode: parsedData.hsCode || '',
            declaredValue: parsedData.declaredValue || '',
            containerType: parsedData.containerType || '',
            destination: parsedData.destination || '',
            exchangeRate: parsedData.exchangeRate || '',
            shippingCompany: parsedData.shippingCompany || '',
            seaFreight: parsedData.seaFreight || '',
            domesticPortFee: parsedData.domesticPortFee || '',
            foreignCustomsDuty: parsedData.foreignCustomsDuty || '',
            domesticTruckingFee: parsedData.domesticTruckingFee || '',
            foreignTruckingFee: parsedData.foreignTruckingFee || '',
            foreignPortFee: parsedData.foreignPortFee || '700',
            receiverAddress: parsedData.receiverAddress || '',
            note: parsedData.note || ''
          };
        } else if (toolType === 'textQuote') {
          return {
            country: parsedData.country || '',
            address: parsedData.address || '',
            zipCode: parsedData.zipCode || '',
            product: parsedData.product || '',
            chargeableWeight: parsedData.chargeableWeight || '',
            estimatedQuantity: parsedData.estimatedQuantity || ''
          };
        } else if (toolType === 'inquiryOrganizer') {
          return {
            country: parsedData.country || '',
            product: parsedData.product || '',
            items: Array.isArray(parsedData.items) ? parsedData.items : [],
            totalWeight: parsedData.totalWeight || '',
            totalVolume: parsedData.totalVolume || '',
            zipCode: parsedData.zipCode || '',
            address: parsedData.address || ''
          };
        } else {
          return {
            items: Array.isArray(parsedData.items) ? parsedData.items : []
          };
        }
      }
      return JSON.parse(result);
    } catch (e) {
      console.error("JSON解析失败:", e, "原始结果:", result);
      return { rawText: result, error: "解析失败，请重试" };
    }
  } catch (error) {
    console.error("图片识别错误:", error);
    return {
      ...getMockImageRecognitionResult(toolType),
      isMock: true,
      rawText: error instanceof Error ? error.message : "图片识别API调用失败"
    };
  }
}

/**
 * 为图片识别提供模拟结果 - 在API不可用时使用
 */
function getMockImageRecognitionResult(toolType: string): any {
  switch (toolType) {
    case 'textQuote':
      return {
        country: "美国",
        address: "纽约市",
        zipCode: "10001",
        product: "电子产品",
        chargeableWeight: "500",
        estimatedQuantity: "20"
      };
    case 'fullContainerQuote':
      return {
        productName: "家具出口",
        hsCode: "9403.60",
        declaredValue: "50000",
        containerType: "40HQ",
        destination: "天津港（CNTXG）-芝加哥（USCHI）",
        exchangeRate: "7.2",
        shippingCompany: "马士基",
        seaFreight: "3200",
        domesticPortFee: "3500",
        foreignCustomsDuty: "500",
        domesticTruckingFee: "2000",
        foreignTruckingFee: "800",
        foreignPortFee: "700",
        receiverAddress: "芝加哥仓库",
        note: "请在7月前安排发货"
      };
    case 'inquiryOrganizer':
      return {
        country: "美国",
        product: "电子产品",
        items: [
          {
            length: 30,
            width: 40,
            height: 50,
            weight: 5,
            quantity: 10
          }
        ],
        totalWeight: "50",
        totalVolume: "0.06",
        zipCode: "10001",
        address: "纽约市"
      };
    default: // calculator
      return {
        items: [
          {
            length: 30,
            width: 40,
            height: 50,
            weight: 5,
            quantity: 10
          }
        ]
      };
  }
}

/**
 * 将图片文件转换为Base64编码
 * @param file 图片文件
 * @returns Promise<string> Base64编码的图片数据
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * 提取结构化数据中的字段值
 * @param data 结构化数据
 * @param keys 可能的字段名数组
 * @returns 找到的字段值或空字符串
 */
export function extractField(data: any, keys: string[]): string {
  if (!data || typeof data !== 'object') return '';
  
  for (const key of keys) {
    if (key in data) {
      return String(data[key]) || '';
    }
  }
  
  // 递归查找嵌套对象
  for (const prop in data) {
    if (typeof data[prop] === 'object') {
      const nestedResult = extractField(data[prop], keys);
      if (nestedResult) return nestedResult;
    }
  }
  
  return '';
}