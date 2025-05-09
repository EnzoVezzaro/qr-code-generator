import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Calendar,
  Users,
  QrCode,
  Mail,
  BarChart2,
  Settings,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const NavItem = ({ to, icon: Icon, label }: { to: string; icon: React.ElementType; label: string }) => (
    <NavLink
      to={to}
      className={({ isActive }) => cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-foreground",
        isActive ? "bg-accent/10 text-accent font-medium" : "hover:bg-accent/10"
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <aside className={cn(
      "fixed inset-y-0 left-0 z-20 flex w-64 flex-col border-r bg-background transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
    )}>
      <div className="flex-1 overflow-auto py-4 px-3">
        <div className="mb-8 px-3">
          <h2 className="text-lg font-semibold">QR Access Manager</h2>
          <p className="text-xs text-muted-foreground">Manage events and access</p>
        </div>
        
        <nav className="space-y-1">
          <NavItem to="/dashboard" icon={Home} label="Dashboard" />
          <NavItem to="/events" icon={Calendar} label="Events" />
          <NavItem to="/participants" icon={Users} label="Participants" />
          <NavItem to="/check-in-manager" icon={QrCode} label="Check-in Manager" />
          
          {isAdmin && (
            <>
              <NavItem to="/email-templates" icon={Mail} label="Email Templates" />
              <NavItem to="/reports" icon={BarChart2} label="Reports & Analytics" />
            </>
          )}
        </nav>

        <div className="mt-8 space-y-1">
          <p className="px-3 text-xs font-medium text-muted-foreground mb-2">Settings</p>
          <NavItem to="/settings" icon={Settings} label="General Settings" />
          {isAdmin && (
            <NavItem to="/security" icon={Shield} label="Security & Access" />
          )}
        </div>
      </div>
      
      <div className="border-t p-4">
        <div className="rounded-lg bg-muted p-3">
          <p className="text-sm font-medium">Need help?</p>
          <p className="text-xs text-muted-foreground mt-1">Check our documentation or contact support</p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;