import { Calendar, Heart, Bell, User, Settings, LogOut, TrendingUp } from 'lucide-react';
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
}

export function UserDashboardSidebar({ onSignOut, onTabChange, currentTab }: UserDashboardSidebarProps) {
  const menuItems = [
    { id: 'overview', title: 'Overview', icon: TrendingUp },
    { id: 'bookings', title: 'My Bookings', icon: Calendar },
    { id: 'favorites', title: 'Favorites', icon: Heart },
    { id: 'notifications', title: 'Notifications', icon: Bell },
    { id: 'profile', title: 'Profile', icon: User },
    { id: 'licenses', title: 'Licenses', icon: User },
    { id: 'support', title: 'Support', icon: Settings },
  ];
  
  const isActive = (id: string) => currentTab === id;
  
  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.id)}
                    isActive={isActive(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        {/* Sign Out Button */}
        <div className="mt-auto p-4 border-t">
          <Button
            variant="ghost"
            onClick={onSignOut}
            className="w-full justify-start"
          >
            <LogOut className="h-5 w-5 mr-2" />
            <span>Sign Out</span>
          </Button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
