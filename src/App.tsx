import { Routes, Route, BrowserRouter } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import TextQuote from "@/pages/TextQuote";
import TrackingNumberGenerator from "@/pages/TrackingNumberGenerator";
import CombinedCalculator from "@/pages/CombinedCalculator";
import WeightPriceCalculator from "@/pages/WeightPriceCalculator";
import FullContainerTextQuote from "@/pages/FullContainerTextQuote";
import InquiryOrganizer from "@/pages/InquiryOrganizer";
import AIModelBadge from "@/components/AIModelBadge";
import { QuoteSyncProvider } from "@/contexts/quoteSyncContext";

export default function App() {
  return (
    <QuoteSyncProvider>
      <BrowserRouter basename={process.env.NODE_ENV === 'production' ? '/SJJ-GONGJU' : ''}>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/text-quote" element={<TextQuote />} />
            <Route path="/combined-calculator" element={<CombinedCalculator />} />
            <Route path="/tracking-number-generator" element={<TrackingNumberGenerator />} />
            <Route path="/weight-price-calculator" element={<WeightPriceCalculator />} />
            <Route path="/full-container-text-quote" element={<FullContainerTextQuote />} />
            <Route path="/inquiry-organizer" element={<InquiryOrganizer />} />
          </Routes>
          <AIModelBadge />
        </Layout>
      </BrowserRouter>
    </QuoteSyncProvider>
  );
}
