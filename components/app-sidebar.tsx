"use client"

import * as React from "react"
import { NavLink } from "react-router-dom"
import { NavMain, NavGroup } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import {
  LayoutDashboard as LayoutDashboardIcon,
  Activity as ActivityIcon,
  Users as UsersIcon,
  Building2 as BuildingIcon,
  FileText as FileTextIcon,
  FileSpreadsheet as FileSpreadsheetIcon,
  ClipboardList as ClipboardListIcon,
  Bell as BellIcon,
  BarChart as BarChartIcon,
  Settings as SettingsIcon,
  GraduationCap as GraduationCapIcon,
  ClipboardCheck as ClipboardCheckIcon,
  Search as SearchIcon,
  UserCheck as UserCheckIcon,
  FilePlus2 as FilePlus2Icon,
  BookOpen as BookOpenIcon,
  Calendar as CalendarIcon,
  Award as AwardIcon,
  CheckCircle as CheckCircleIcon,
  LogOut as LogOutIcon,
  Clock3 as Clock3Icon,
} from "lucide-react"
import { User, Role } from "@/src/types"
import { usePhaseLock } from "@/src/hooks/usePhaseLock"
import { cn } from "@/src/lib/utils"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User | null
  onLogout?: () => void
  onSearchClick?: () => void
}

export function AppSidebar({ user, onLogout, onSearchClick, ...props }: AppSidebarProps) {
  const { locks } = usePhaseLock()
  const role: Role = user?.role || 'student'

  const getDashboardRoute = () => {
    switch (role) {
      case 'admin': return '/admin'
      case 'supervisor': return '/supervisor'
      case 'adviser': return '/adviser'
      case 'student': default: return '/student'
    }
  }

  const getNavGroups = (): NavGroup[] => {
    switch (role) {
      case 'admin':
        return [
          {
            group: 'Overview',
            items: [
              { title: 'Dashboard', url: '/admin', icon: LayoutDashboardIcon },
              { title: 'System Monitoring', url: '/admin/monitoring', icon: ActivityIcon },
            ],
          },
          {
            group: 'Management',
            items: [
              { title: 'Accounts', url: '/admin/users', icon: UsersIcon, badge: 3 },
              { title: 'Companies', url: '/admin/companies', icon: BuildingIcon },
              { title: 'Documents', url: '/admin/documents', icon: FileTextIcon, badge: 38 },
              { title: 'Review Center', url: '/admin/reviews', icon: ClipboardCheckIcon },
              { title: 'DTR Audit', url: '/admin/documents?filter=dtr', icon: FileSpreadsheetIcon },
              { title: 'Attendance Audit', url: '/admin/attendance', icon: Clock3Icon },
              { title: 'Templates', url: '/admin/templates', icon: ClipboardListIcon },
              { title: 'Announcements', url: '/admin/announcements', icon: BellIcon },
              { title: 'Reports', url: '/admin/reports', icon: BarChartIcon },
            ],
          },
          {
            group: 'System',
            items: [
              { title: 'Settings', url: '/admin/settings', icon: SettingsIcon },
            ],
          },
        ]

      case 'adviser':
        return [
          {
            group: 'Overview',
            items: [
              { title: 'Dashboard', url: '/adviser', icon: LayoutDashboardIcon },
            ],
          },
          {
            group: 'Management',
            items: [
              { title: 'My Students', url: '/adviser/students', icon: GraduationCapIcon },
              { title: 'Endorsements', url: '/adviser/endorsements', icon: ClipboardCheckIcon },
              { title: 'MOA Oversight', url: '/adviser/moa', icon: UsersIcon },
            ],
          },
          {
            group: 'Review Hub',
            items: [
              { title: 'Document Review', url: '/adviser/review', icon: SearchIcon, badge: 4 },
              { title: 'Review Center', url: '/adviser/reviews', icon: ClipboardCheckIcon },
              { title: 'DTR Verification', url: '/adviser/review?type=dtr', icon: FileSpreadsheetIcon },
              { title: 'Attendance Monitor', url: '/adviser/attendance', icon: Clock3Icon },
            ],
          },
          {
            group: 'Reports',
            items: [
              { title: 'Class Progress', url: '/adviser/class-reports', icon: BarChartIcon },
            ],
          },
        ]

      case 'student':
        return [
          {
            group: 'Overview',
            items: [
              { title: 'Dashboard', url: '/student', icon: LayoutDashboardIcon },
              { title: 'Time In / Out', url: '/student/attendance', icon: Clock3Icon },
              { title: 'Document Repository', url: '/student/documents', icon: FileTextIcon },
              { title: 'Review Center', url: '/student/reviews', icon: ClipboardCheckIcon },
              { title: 'Document Editor', url: '/student/editor', icon: FilePlus2Icon },
              { title: 'Practicum Calendar', url: '/student/calendar', icon: CalendarIcon },
            ],
          },
        ]

      case 'supervisor':
        return [
          {
            group: 'Overview',
            items: [
              { title: 'Dashboard', url: '/supervisor', icon: LayoutDashboardIcon },
            ],
          },
          {
            group: 'My Interns',
            items: [
              { title: 'Assigned Interns', url: '/supervisor/interns', icon: GraduationCapIcon },
            ],
          },
          {
            group: 'Review Hub',
            items: [
              { title: 'DTR Approval', url: '/supervisor/dtr', icon: CalendarIcon, badge: 5 },
              { title: 'Attendance Verification', url: '/supervisor/attendance', icon: Clock3Icon },
              { title: 'Weekly Journal Review', url: '/supervisor/journal', icon: BookOpenIcon, badge: 2 },
              { title: 'Review Center', url: '/supervisor/reviews', icon: ClipboardCheckIcon },
            ],
          },
        ]

      default:
        return []
    }
  }

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader className="p-2 border-b-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              render={<NavLink to={getDashboardRoute()} />}
              className="hover:bg-sidebar-accent cursor-pointer group/brand gap-2.5 px-2"
            >
              <img
                src="/images/Landing Page Icons/Logo.svg"
                alt="Web Practicum Logo"
                className="size-8 aspect-square object-contain shrink-0 transition-transform group-hover/brand:scale-105"
              />
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-bold tracking-tight text-sidebar-foreground">Web Practicum</span>
                <span className="truncate text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">STI Marikina</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        <NavMain groups={getNavGroups()} />
      </SidebarContent>

      <SidebarFooter className="p-2 border-t border-sidebar-border/60">
        <SidebarMenu className="gap-0.5">
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={onLogout}
              tooltip="Log out"
              className={cn(
                "transition-all duration-150 group/logout text-[13.5px] font-medium cursor-pointer px-3 py-2 rounded-lg gap-3 w-full",
                "text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent/80",
                "active:scale-[0.98]"
              )}
            >
              <LogOutIcon className="size-4.5 shrink-0 text-muted-foreground group-hover/logout:text-sidebar-foreground transition-all duration-150 group-hover/logout:translate-x-0.5" />
              <span className="truncate group-data-[collapsible=icon]:hidden">Log out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}
