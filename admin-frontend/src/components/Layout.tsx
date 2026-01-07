import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { logout, getUser } from "../services/auth";

export default function Layout() {
  const navigate = useNavigate();
  const user = getUser();
  function onLogout() {
    logout();
    navigate("/login");
  }
  return (
    <>
      <div className="header">
        <div style={{ flex: 1 }}>Admin Dashboard</div>
        <div style={{ marginRight: 16 }}>{user?.email}</div>
        <button className="button" onClick={onLogout}>
          Logout
        </button>
      </div>
      <div className="container">
        <div className="sidebar card">
          <Link to="/" className="link">
            Overview
          </Link>
          <Link to="/buses" className="link">
            Buses
          </Link>
          <Link to="/routes" className="link">
            Routes
          </Link>
          <Link to="/terminals" className="link">
            Terminals
          </Link>
          <Link to="/trips" className="link">
            Trips
          </Link>
          <Link to="/bookings" className="link">
            Bookings
          </Link>
          <Link to="/users" className="link">
            Users
          </Link>
        </div>
        <div className="content">
          <Outlet />
        </div>
      </div>
    </>
  );
}
