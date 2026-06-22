/**
 * AI服务模块 - 使用智谱API进行文本和图片识别
 */

// 智谱API基础配置
const ZHIPU_API_KEY = "13968110e81a4cb1b255aa578b83f690.8K0K6FGm4VfeOFAI";
const ZHIPU_API_BASE_URL = "https://open.bigmodel.cn/api/paas/v4";

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
      // 文字报价工具的识别模板 - 重点识别国家、地址、邮编等信息，完全忽略尺寸信息
      systemPrompt = "你是一个专业的物流报价信息识别助手，专门用于提取文字报价相关信息。请严格按照要求提取信息，绝对不要包含任何与尺寸相关的信息，也不要处理任何尺寸相关的计算。";
      userPrompt = `请严格按照以下要求从文本中提取物流报价相关信息：
1. 重点识别：国家(country)、地址(address)、邮编(zipCode)、产品(product)、计费重(chargeableWeight)、件数(estimatedQuantity)等信息
2. 请完全忽略文本中的尺寸信息，绝对不要尝试提取或计算任何与尺寸相关的数据
3. 确保每个字段都使用英文名称作为键名
4. 如果只提供了总重量和总件数，请计算出计费重
5. 请以严格的JSON格式返回结果，不要包含任何额外的解释或说明文字，只返回识别到的字段：
{
  "country": "识别到的国家名称",
  "address": "识别到的地址",
  "zipCode": "识别到的邮编",
  "product": "识别到的产品",
  "chargeableWeight": "识别到的计费重",
  "estimatedQuantity": "识别到的件数"
}

文本内容：${text}`;
     } else if (toolType === 'fullContainerQuote') {
      // 整柜文字报价工具的识别模板 - 完全独立于其他工具的识别逻辑
      systemPrompt = "你是一个专业的整柜物流报价信息识别助手，需要从用户提供的文本中精准提取整柜物流报价相关信息。特别需要注意识别品名、HS编码和货值这三个独立字段。请以结构化的JSON格式返回识别结果，确保数据准确无误。";
      userPrompt = `请严格按照以下要求从文本中提取信息：
1. 重点识别：品名(productName)、HS编码(hsCode)、货值(declaredValue)、柜型(containerType)、起运港和目的港（合并为destination字段，格式：起运港-目的港，例如：天津港（CNTXG）-芝加哥（USCHI））、汇率(exchangeRate)、船公司(shippingCompany)、海运费(seaFreight)、国内港杂(domesticPortFee)、国外关税(foreignCustomsDuty)、国内拖车费(domesticTruckingFee)、国外拖车费(foreignTruckingFee)、收件地址(receiverAddress)、报价补充信息（放入note字段）等信息
2. 品名、HS编码、货值是三个独立字段，请务必分别识别
3. 确保每个字段都使用英文名称作为键名
4. 国外港杂(foreignPortFee)固定填入"700"
5. 请完全忽略任何与尺寸、重量相关的信息，也不要处理任何与文字报价或计算报价工具相关的内容
6. 请以严格的JSON格式返回结果，不要包含任何额外的解释或说明文字，只返回识别到的字段：
{
  "productName": "识别到的品名",
  "hsCode": "识别到的HS编码",
  "declaredValue": "识别到的货值",
  "containerType": "识别到的柜型",
  "destination": "识别到的起运港和目的港（格式：起运港-目的港）",
  "exchangeRate": "识别到的汇率",
  "shippingCompany": "识别到的船公司",
  "seaFreight": "识别到的海运费",
  "domesticPortFee": "识别到的国内港杂",
  "foreignCustomsDuty": "识别到的国外关税",
  "domesticTruckingFee": "识别到的国内拖车费",
  "foreignTruckingFee": "识别到的国外拖车费",
  "foreignPortFee": "700",
  "receiverAddress": "识别到的收件地址",
  "note": "识别到的报价补充信息"
}

文本内容：${text}`;
    } else if (toolType === 'inquiryOrganizer') {
      // 询价信息整理工具的识别模板
      systemPrompt = "你是一个专业的物流询价信息整理助手，需要从用户提供的文本中精准提取询价相关信息。请以结构化的JSON格式返回识别结果，确保数据准确无误。";
      userPrompt = `请严格按照以下要求从文本中提取信息：
1. 重点识别：国家(country)、品名(product)、尺寸(items)、总重量(totalWeight)、总方数(totalVolume)、邮编(zipCode)、地址(address)等信息
2. 尺寸信息需要包含长宽高、单件重量和件数，如果有多个尺寸的货物，请在items数组中为每个货物单独列出信息
3. 确保每个字段都使用英文名称作为键名
4. 请以严格的JSON格式返回结果，不要包含任何额外的解释或说明文字，只返回识别到的字段：
{
  "country": "识别到的国家名称",
  "product": "识别到的品名",
  "items": [
    {
      "length": 数值, // 单位：厘米
      "width": 数值, // 单位：厘米
      "height": 数值, // 单位：厘米
      "weight": 数值, // 单位：千克
      "quantity": 数值 // 件数
    }
    // 如有多个货物，继续添加
  ],
  "totalWeight": "识别到的总重量",
  "totalVolume": "识别到的总方数",
  "zipCode": "识别到的邮编",
  "address": "识别到的地址"
}

文本内容：${text}`;
    } else {
      // 计算工具的识别模板（默认）- 重点识别尺寸和重量信息，完全忽略地址信息
      systemPrompt = "你是一个专业的物流尺寸和重量识别助手，需要从用户提供的文本中精准提取货物的尺寸、重量和件数信息。请以结构化的JSON格式返回识别结果，确保数据准确无误。";
      userPrompt = `请严格按照以下要求从文本中提取信息：
1. 重点识别箱规尺寸信息：长(length)、宽(width)、高(height)，并将所有单位自动转换为厘米(cm)
2. 识别单件重量(weight)和件数(quantity)
3. 如果只提供了总重量和总件数，请计算出单件重量，并保留2位小数
4. 如果文本中包含多个不同尺寸的货物，请在items数组中为每个货物单独列出信息
5. 确保每个货物项目都有完整的长、宽、高、重量和件数，所有数值请使用数字类型
6. 请完全忽略文本中的国家、地址、邮编等非尺寸重量相关信息
7. 请以严格的JSON格式返回结果，不要包含任何额外的解释或说明文字：
{
  "items": [
    {
      "length": 数值, // 单位：厘米
      "width": 数值, // 单位：厘米
      "height": 数值, // 单位：厘米
      "weight": 数值, // 单位：千克，保留2位小数
      "quantity": 数值 // 件数
    }
    // 如有多个货物，继续添加
  ]
}

文本内容：${text}`;
    }

    const response = await fetch(`${ZHIPU_API_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${ZHIPU_API_KEY}`
      },
      body: JSON.stringify({
        model: "glm-4-plus",
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
        temperature: 0.1, // 降低温度提高准确性
        max_tokens: 2000
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
        model: "glm-4v-plus",
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