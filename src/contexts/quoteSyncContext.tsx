import { createContext, useState, ReactNode } from "react";

// 定义共享数据接口
interface QuoteSyncData {
  chargeableWeight: string;
  estimatedQuantity: string;
  updateQuoteData: (chargeableWeight: string, estimatedQuantity: string) => void;
}

// 创建Context并设置默认值
export const QuoteSyncContext = createContext<QuoteSyncData>({
  chargeableWeight: "",
  estimatedQuantity: "",
  updateQuoteData: () => {}
});

// 创建Provider组件
interface QuoteSyncProviderProps {
  children: ReactNode;
}

export const QuoteSyncProvider = ({ children }: QuoteSyncProviderProps) => {
  const [syncData, setSyncData] = useState({
    chargeableWeight: "",
    estimatedQuantity: ""
  });

  // 更新同步数据的函数
  const updateQuoteData = (chargeableWeight: string, estimatedQuantity: string) => {
    setSyncData({
      chargeableWeight,
      estimatedQuantity
    });
  };

  return (
    <QuoteSyncContext.Provider value={{
      chargeableWeight: syncData.chargeableWeight,
      estimatedQuantity: syncData.estimatedQuantity,
      updateQuoteData
    }}>
      {children}
    </QuoteSyncContext.Provider>
  );
};