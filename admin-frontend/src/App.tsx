import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Buses from "./pages/Buses";
import RoutesPage from "./pages/Routes";
import Trips from "./pages/Trips";
import Bookings from "./pages/Bookings";
import Users from "./pages/Users";
import Terminals from "./pages/Terminals";
import Layout from "./components/Layout";
import Toast from "./components/Toast";
import { getToken } from "./services/auth";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="buses" element={<Buses />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="trips" element={<Trips />} />
          <Route path="bookings" element={<Bookings />} />
          <Route path="users" element={<Users />} />
          <Route path="terminals" element={<Terminals />} />
        </Route>
      </Routes>
      <Toast />
    </>
  );
}
