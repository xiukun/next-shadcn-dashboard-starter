'use client';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger
} from '@/components/ui/hover-card';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { navItems } from '@/config/nav-config';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useOrganization, useUser } from '@clerk/nextjs';
import { useFilteredNavItems } from '@/hooks/use-nav';
import { useUserPreferencesStore } from '@/stores/user-preferences-store';
import {
  IconBell,
  IconChevronRight,
  IconChevronsDown,
  IconCreditCard,
  IconLogout,
  IconUserCircle
} from '@tabler/icons-react';
import { SignOutButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';
import { OrgSwitcher } from '../org-switcher';

export default function AppSidebar() {
  const pathname = usePathname();
  const { isOpen } = useMediaQuery();
  const { user } = useUser();
  const { organization } = useOrganization();
  const router = useRouter();
  const filteredItems = useFilteredNavItems(navItems);
  const { sidebarCollapseMode } = useUserPreferencesStore();
  const { state: sidebarState } = useSidebar();

  React.useEffect(() => {
    // Side effects based on sidebar state changes
  }, [isOpen]);

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <OrgSwitcher />
      </SidebarHeader>
      <SidebarContent className='overflow-x-hidden'>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarMenu>
            {filteredItems.map((item) => {
              const Icon = item.icon ? Icons[item.icon] : Icons.logo;
              const hasSubmenu = item?.items && item?.items?.length > 0;
              const isCollapsed = sidebarState === 'collapsed';
              const showHoverCard =
                sidebarCollapseMode === 'expanded-submenu' &&
                isCollapsed &&
                hasSubmenu;

              // 在展开子项模式且折叠状态下，子菜单默认隐藏，只在悬停时通过 HoverCard 显示
              const shouldUseHoverOnly =
                sidebarCollapseMode === 'expanded-submenu' && isCollapsed;

              const menuItemContent = shouldUseHoverOnly ? (
                <SidebarMenuItem key={item.title}>
                  {item.url ? (
                    <SidebarMenuButton asChild isActive={pathname === item.url}>
                      <Link href={item.url}>
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200' />
                      </Link>
                    </SidebarMenuButton>
                  ) : (
                    <SidebarMenuButton
                      isActive={pathname === item.url}
                      onClick={(e) => {
                        // 阻止默认行为，不展开侧边栏
                        e.preventDefault();
                      }}
                    >
                      {item.icon && <Icon />}
                      <span>{item.title}</span>
                      <IconChevronRight className='ml-auto transition-transform duration-200' />
                    </SidebarMenuButton>
                  )}
                  {/* 在折叠状态下，子菜单默认隐藏，通过 HoverCard 显示 */}
                </SidebarMenuItem>
              ) : (
                <Collapsible
                  key={item.title}
                  asChild
                  defaultOpen={
                    sidebarCollapseMode === 'expanded-submenu'
                      ? true
                      : item.isActive
                  }
                  className='group/collapsible'
                >
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        tooltip={
                          sidebarCollapseMode === 'icon'
                            ? item.title
                            : undefined
                        }
                        isActive={pathname === item.url}
                      >
                        {item.icon && <Icon />}
                        <span>{item.title}</span>
                        <IconChevronRight className='ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90' />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub
                        className={
                          sidebarCollapseMode === 'expanded-submenu'
                            ? 'group-data-[collapsible=icon]:flex!'
                            : undefined
                        }
                      >
                        {item.items?.map((subItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={pathname === subItem.url}
                              className={
                                sidebarCollapseMode === 'expanded-submenu'
                                  ? 'group-data-[collapsible=icon]:flex!'
                                  : undefined
                              }
                            >
                              <Link href={subItem.url}>
                                <span>{subItem.title}</span>
                              </Link>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );

              if (!hasSubmenu) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={pathname === item.url}
                    >
                      <Link href={item.url}>
                        <Icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              }

              // 在展开子项模式且折叠状态下，使用 HoverCard 显示子菜单
              if (shouldUseHoverOnly && hasSubmenu) {
                return (
                  <HoverCard key={item.title} openDelay={200} closeDelay={100}>
                    <HoverCardTrigger asChild>
                      {menuItemContent}
                    </HoverCardTrigger>
                    <HoverCardContent
                      side='right'
                      align='start'
                      sideOffset={8}
                      className='w-56 p-2'
                    >
                      <div className='space-y-1'>
                        {item.items?.map((subItem) => (
                          <Link
                            key={subItem.title}
                            href={subItem.url}
                            className='hover:bg-accent hover:text-accent-foreground flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors'
                          >
                            <span
                              className={
                                pathname === subItem.url
                                  ? 'font-medium'
                                  : 'text-muted-foreground'
                              }
                            >
                              {subItem.title}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                );
              }

              return menuItemContent;
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size='lg'
                  className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
                >
                  {user && (
                    <UserAvatarProfile
                      className='h-8 w-8 rounded-lg'
                      showInfo
                      user={user}
                    />
                  )}
                  <IconChevronsDown className='ml-auto size-4' />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
                side='bottom'
                align='end'
                sideOffset={4}
              >
                <DropdownMenuLabel className='p-0 font-normal'>
                  <div className='px-1 py-1.5'>
                    {user && (
                      <UserAvatarProfile
                        className='h-8 w-8 rounded-lg'
                        showInfo
                        user={user}
                      />
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => router.push('/dashboard/profile')}
                  >
                    <IconUserCircle className='mr-2 h-4 w-4' />
                    Profile
                  </DropdownMenuItem>
                  {organization && (
                    <DropdownMenuItem
                      onClick={() => router.push('/dashboard/billing')}
                    >
                      <IconCreditCard className='mr-2 h-4 w-4' />
                      Billing
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem>
                    <IconBell className='mr-2 h-4 w-4' />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <IconLogout className='mr-2 h-4 w-4' />
                  <SignOutButton redirectUrl='/auth/sign-in' />
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
