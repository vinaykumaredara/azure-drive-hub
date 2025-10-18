import { Calendar, User, LogOut, TrendingUp } from 'lucide-react';
import { memo } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface UserDashboardSidebarProps {
  onSignOut: () => void;
  onTabChange: (tab: string) => void;
  currentTab: string;
  userName?: string;
}

/**
 * User dashboard sidebar with memoization for performance
 * Displays navigation menu and user info
 */
export const UserDashboardSidebar = memo(function UserDashboardSidebar({ 
  onSignOut, 
  onTabChange, 
  currentTab,
  userName 
}: UserDashboardSidebarProps) {
  const menuItems = [
    { id: 'overview', title: 'Overview', icon: TrendingUp },
    { id: 'bookings', title: 'My Bookings', icon: Calendar },
    { id: 'profile', title: 'Profile', icon: User },
  ];
  
  const isActive = (id: string) => currentTab === id;
  
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarContent className="bg-background border-r">
        {/* User Info */}
        {userName && (
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-medium truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">User Dashboard</p>
          </div>
        )}
        
        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2 text-sm font-semibold text-muted-foreground">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive(item.id)}
                    className="w-full justify-start gap-3 px-3 py-2"
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Sign Out Button */}
        <div className="mt-auto border-t p-4">
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start gap-3 px-3"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            <span>Sign Out</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
});
