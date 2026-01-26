import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ScrollTracker from "./components/Tracking/ScrollTracker";
import { initAnalytics } from "./utils/analytics";

// Public Pages
import PublicLayout from "./layouts/PublicLayout";
import Home from "./pages/public/Home";
import Rooms from "./pages/public/Rooms";
import Meeting from "./pages/public/Meeting";
import Wedding from "./pages/public/Wedding";
import Facilities from "./pages/public/Facilities";
import Gallery from "./pages/public/Gallery";
import CheckReservation from "./pages/public/CheckReservation";
import Login from "./pages/auth/Login";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Admin Pages
import AdminLayout from "./layouts/AdminLayout";
import Dashboard from "./pages/admin/Dashboard";
import RoomManagement from "./pages/admin/RoomManagement";
import Reservations from "./pages/admin/Reservations";
import Users from "./pages/admin/Users";
import PromoCodes from "./pages/admin/PromoCodes";
import Reviews from "./pages/admin/Reviews";
import ContentManagement from "./pages/admin/ContentManagement";
import PermissionGuard from "./components/PermissionGuard";

import "./App.css";

function App() {
  useEffect(() => {
    initAnalytics();
    const staticSEO = document.getElementById("seo-static-content");
    if (staticSEO) {
      staticSEO.remove();
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <AnalyticsTracker />
        <ScrollTracker />
        <Toaster position="top-right" richColors />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<Home />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="meeting" element={<Meeting />} />
            <Route path="wedding" element={<Wedding />} />
            <Route path="facilities" element={<Facilities />} />
            <Route path="gallery" element={<Gallery />} />
            <Route path="check-reservation" element={<CheckReservation />} />
          </Route>

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />

          {/* Admin Routes - Protected by PermissionGuard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<PermissionGuard permKey="dashboard"><Dashboard /></PermissionGuard>} />
            <Route path="rooms" element={<PermissionGuard permKey="rooms"><RoomManagement /></PermissionGuard>} />
            <Route path="reservations" element={<PermissionGuard permKey="reservations"><Reservations /></PermissionGuard>} />
            <Route path="users" element={<PermissionGuard permKey="users"><Users /></PermissionGuard>} />
            <Route path="promo-codes" element={<PermissionGuard permKey="promo"><PromoCodes /></PermissionGuard>} />
            <Route path="reviews" element={<PermissionGuard permKey="reviews"><Reviews /></PermissionGuard>} />
            <Route path="content" element={<PermissionGuard permKey="content"><ContentManagement /></PermissionGuard>} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
