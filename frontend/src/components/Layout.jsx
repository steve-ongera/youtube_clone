// components/Layout.jsx
import { Outlet } from "react-router-dom";
import Navbar  from "./Navbar";
import Sidebar from "./Sidebar";

export default function Layout() {
  return (
    <div className="app-layout">
      <Navbar />
      <div className="main-content">
        <Sidebar />
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}