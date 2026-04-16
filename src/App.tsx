import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import SignIn from "./pages/AuthPages/SignIn";
import AdminProtect from "./components/AdminProtect";
import { TooltipProvider } from "./components/ui/tooltip";
import HowToWork from "./pages/Online/howtowork";
import Product from "./pages/Online/product";
import SampleQrcode from "./pages/Offline/sample-qr-codes";
import Qrcode from "./pages/Offline/qr-codes";
import TestingNo from "./pages/Other/testingNo";
import Report from "./pages/Other/report";
import MoreDashboard from "./pages/Dashboard/ECommerce";
import PendingOfflineOrders from "./pages/OfflineOrders/PendingOfflineOrders";
import ConfirmOfflineOrders from "./pages/OfflineOrders/ConfirmOfflineOrders";
import ContactUs from "./pages/OnlineOrders/contactUs";
import useNewMessageNotifier from "./hooks/Usenewmessagenotifier";

// ─── Inner component so the hook can live inside <BrowserRouter> ─────────────
const AppRoutes = () => {
  // Polls every 30 s across ALL pages; shows one toast per new-message batch
  useNewMessageNotifier();

  return (
    <Routes>
      {/* Dashboard Layout */}
      <Route element={<AppLayout />}>
        <Route index element={<AdminProtect><MoreDashboard /></AdminProtect>} />

        {/* All Pages */}
        <Route path="offline/qr-codes"         element={<AdminProtect><Qrcode /></AdminProtect>} />
        <Route path="offline/sample-qr-codes"  element={<AdminProtect><SampleQrcode /></AdminProtect>} />
        <Route path="online/how-to-work"        element={<AdminProtect><HowToWork /></AdminProtect>} />
        <Route path="online/product"            element={<AdminProtect><Product /></AdminProtect>} />
        <Route path="testing-numbers"           element={<AdminProtect><TestingNo /></AdminProtect>} />
        <Route path="report-message"            element={<AdminProtect><Report /></AdminProtect>} />
        <Route path="offline-orders/confirm"    element={<AdminProtect><ConfirmOfflineOrders /></AdminProtect>} />
        <Route path="offline-orders/pending"    element={<AdminProtect><PendingOfflineOrders /></AdminProtect>} />
        <Route path="online-orders/contact-us"  element={<AdminProtect><ContactUs /></AdminProtect>} />

        {/* Fallback */}
        <Route path="*" element={<AdminProtect><MoreDashboard /></AdminProtect>} />
      </Route>

      {/* Auth Layout */}
      <Route element={<AuthLayout />}>
        <Route path="login" element={<SignIn />} />
      </Route>
    </Routes>
  );
};

// ─── Root App ─────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter basename="/">
      <TooltipProvider>
        <AppRoutes />
        <ToastContainer position="top-right" className="!z-[99999]" />
      </TooltipProvider>
    </BrowserRouter>
  );
}