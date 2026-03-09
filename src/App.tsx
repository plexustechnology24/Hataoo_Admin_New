import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AppLayout from "./layout/AppLayout";
import AuthLayout from "./layout/AuthLayout";
import SignIn from "./pages/AuthPages/SignIn";
import Ecommerce from "./pages/Dashboard/ECommerce";
import AdminProtect from "./components/AdminProtect";
import { TooltipProvider } from "./components/ui/tooltip";
import HowToWork from "./pages/Online/howtowork";
import Product from "./pages/Online/product";
import SampleQrcode from "./pages/Offline/sample-qr-codes";
import Qrcode from "./pages/Offline/qr-codes";


export default function App() {
  return (
    <BrowserRouter basename="/">
      <TooltipProvider>
      <Routes>
        {/* Dashboard Layout */}
        <Route element={<AppLayout />}>
          <Route index element={<AdminProtect><Ecommerce /></AdminProtect>} />

          {/* All Page */}
          <Route path="offline/qr-codes" element={<AdminProtect><Qrcode /></AdminProtect>} />
          <Route path="offline/sample-qr-codes" element={<AdminProtect><SampleQrcode /></AdminProtect>} />
          <Route path="online/how-to-work" element={<AdminProtect><HowToWork /></AdminProtect>} />
          <Route path="online/product" element={<AdminProtect><Product /></AdminProtect>} />
          {/* Fallback Route */}
          <Route path="*" element={<AdminProtect><Ecommerce /></AdminProtect>} />
        </Route>

        {/* Auth Layout */}
        <Route element={<AuthLayout />}>
          <Route path="login" element={<SignIn />} />
        </Route>
      </Routes>
      <ToastContainer position="top-right" className="!z-[99999]" />
      </TooltipProvider>
    </BrowserRouter>
  );
}