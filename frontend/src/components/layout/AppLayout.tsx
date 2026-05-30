import { Outlet, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "../ui/Toaster";

export function AppLayout() {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <Sidebar />
      <main className="main">
        <Topbar />
        {/* key forces the fade-in animation on route change */}
        <div className="content" key={pathname}>
          <Outlet />
        </div>
      </main>
      <Toaster />
    </div>
  );
}
