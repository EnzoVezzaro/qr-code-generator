import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { QrCode, LogOut, Settings, User, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background px-4 md:px-6">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>
        <Link to="/dashboard" className="flex items-center gap-2">
          <QrCode className="h-6 w-6 text-accent" />
          <span className="text-lg font-bold">QR Access Manager</span>
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        {user && (
          <div className="hidden md:flex items-center text-sm text-muted-foreground">
            <span>Logged in as {user.email}</span>
          </div>
        )}
        
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="icon">
            <Link to="/account">
              <User className="h-5 w-5" />
              <span className="sr-only">Account</span>
            </Link>
          </Button>
          
          <Button asChild variant="ghost" size="icon">
            <Link to="/settings">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
            <span className="sr-only">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;