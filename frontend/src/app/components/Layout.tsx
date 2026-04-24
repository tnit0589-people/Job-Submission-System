import { Outlet, Link, useLocation } from "react-router";
import { ClipboardCheck, FolderOpen } from "lucide-react";

export function layout() {
  const location = useLocation();

  const navItems = [
    { 
      path: "/", 
      label: "Submit Job", 
      icon: ClipboardCheck 
    },
    { 
      path: "/records",
      label: "Job Records",
      icon: FolderOpen,
    },
  ];

  return (
    <div className = "min-h-screen bg-gray-50">
      {/* Header */}
      <header className = "bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className = "flex items-center justify-between h-16">
            <div className = "flex items-center gap-3">
              <div className ="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ClipboardCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className = "font-semibold text-gray-900">
                  Contractor Portal
                </h1>
                <p className = "text-xs text-gray-500">
                  Job Completion System
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className = "bg-white border-b border-gray-200">
        <div className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className = "flex gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key = {item.path}
                  to = {item.path}
                  className = {`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                    isActive
                      ? "border-blue-600 text-blue-600"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                  }`}
                >
                  <Icon className = "w-4 h-4" />
                  <span className = "text-sm font-medium">
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className = "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}