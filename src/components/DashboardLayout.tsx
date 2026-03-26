import { ReactNode } from 'react';
import { useCRM } from '@/contexts/CRMContext';
import { LogOut, LayoutDashboard, Users, Upload, Calendar, UserCircle, ClipboardList, Database, BarChart3, FolderOpen, Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: ReactNode;
  id: string;
}

interface DashboardLayoutProps {
  children: ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

export default function DashboardLayout({ children, navItems, activeTab, onTabChange }: DashboardLayoutProps) {
  const { currentUser, logout } = useCRM();

  const roleLabels: Record<string, string> = { FM: 'Floor Manager', TC: 'Team Captain', BDM: 'Business Dev Manager', BO: 'Business Officer', BDO: 'Business Dev Officer' };

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex flex-col shrink-0 sticky top-0 h-screen">
        <div className="p-5 border-b border-sidebar-border">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9  flex items-center justify-center">
                       <img
            src="/image.png"
            alt="Lotus Logo"
            className="w-20 h-20 mx-auto  object-contain"
          />
            </div>
            <div>
              <h1 className="text-sm font-bold text-sidebar-foreground">Grow Lotus Fintech</h1>
              <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-widest">LMS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                activeTab === item.id
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-bold text-sidebar-primary">
              {currentUser?.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{currentUser?.name}</p>
              <p className="text-[11px] text-sidebar-foreground/50">{roleLabels[currentUser?.role || 'BO']}</p>
            </div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-sidebar-foreground/60 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-6 max-w-[1400px] mx-auto animate-fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}

export { LayoutDashboard, Users, Upload, Calendar, UserCircle, ClipboardList, Database, BarChart3, FolderOpen, Briefcase };
