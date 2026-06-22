import { Routes, Route, BrowserRouter } from "react-router-dom";
import Home from "@/pages/Home";
import TextQuote from "@/pages/TextQuote";
import TrackingNumberGenerator from "@/pages/TrackingNumberGenerator";
import CombinedCalculator from "@/pages/CombinedCalculator";
import WeightPriceCalculator from "@/pages/WeightPriceCalculator";
import FullContainerTextQuote from "@/pages/FullContainerTextQuote";
import InquiryOrganizer from "@/pages/InquiryOrganizer";
import BroadcastCopywriter from "@/pages/BroadcastCopywriter";
import AIModelBadge from "@/components/AIModelBadge";
import { useTheme } from "@/hooks/useTheme";
import { QuoteSyncProvider } from "@/contexts/quoteSyncContext";

export default function App() {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <QuoteSyncProvider>
      <BrowserRouter basename={process.env.NODE_ENV === 'production' ? '/SJJ-GONGJU' : ''}>
        <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
          <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/text-quote" element={<TextQuote />} />
              <Route path="/combined-calculator" element={<CombinedCalculator />} />
              <Route path="/tracking-number-generator" element={<TrackingNumberGenerator />} />
              <Route path="/weight-price-calculator" element={<WeightPriceCalculator />} />
              <Route path="/full-container-text-quote" element={<FullContainerTextQuote />} />
              <Route path="/inquiry-organizer" element={<InquiryOrganizer />} />
              <Route path="/broadcast-copywriter" element={<BroadcastCopywriter />} />
            </Routes>
            <AIModelBadge />
          </div>
        </div>
      </BrowserRouter>
    </QuoteSyncProvider>);
}
