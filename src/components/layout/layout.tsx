import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './header';
import Sidebar from './sidebar';

const Layout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header toggleSidebar={toggleSidebar} />
      
      <div className="flex flex-1">
        <Sidebar isOpen={sidebarOpen} />
        
        <div 
          className="flex-1 md:ml-64 pt-4 px-4 md:px-8"
          onClick={closeSidebarOnMobile}
        >
          <main className="mx-auto max-w-7xl">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;