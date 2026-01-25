import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ScrollToTop from "./components/ScrollToTop";

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

import "./App.css";

function App() {
  useEffect(() => {
    const staticSEO = document.getElementById("seo-static-content");
    if (staticSEO) {
      staticSEO.remove();
    }
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
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

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="rooms" element={<RoomManagement />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="users" element={<Users />} />
            <Route path="promo-codes" element={<PromoCodes />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="content" element={<ContentManagement />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
