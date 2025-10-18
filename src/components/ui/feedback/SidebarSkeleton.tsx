import { Skeleton } from '@/components/ui/skeleton';
import { 
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

/**
 * Loading skeleton for sidebar while auth data is loading
 * Prevents black/white flash during initial load
 */
export function SidebarSkeleton() {
  return (
    <Sidebar side="left" variant="sidebar" collapsible="icon">
      <SidebarContent className="bg-background border-r">
        <SidebarGroup>
          <SidebarGroupLabel className="px-4 py-2">
            <Skeleton className="h-4 w-24" />
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1 px-2">
              {[1, 2, 3].map((i) => (
                <SidebarMenuItem key={i}>
                  <div className="flex items-center gap-3 px-3 py-2">
                    <Skeleton className="h-5 w-5 shrink-0" />
                    <Skeleton className="h-4 w-20 flex-1" />
                  </div>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        
        <div className="mt-auto border-t p-4">
          <div className="flex items-center gap-3 px-3">
            <Skeleton className="h-5 w-5 shrink-0" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
