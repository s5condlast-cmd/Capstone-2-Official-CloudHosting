"use client"

import * as React from "react"
import { NavLink } from "react-router-dom"
import { NavMain, NavGroup } from "@/components/nav-main"
import {
  Sidebar,
  SidebarContent,
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
} from "lucide-react"
import { User, Role } from "@/src/types"
import { usePhaseLock } from "@/src/hooks/usePhaseLock"

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
              { title: 'DTR Audit', url: '/admin/documents?filter=dtr', icon: FileSpreadsheetIcon },
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
              { title: 'DTR Verification', url: '/adviser/review?type=dtr', icon: FileSpreadsheetIcon },
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
            ],
          },
          {
            group: 'Before OJT',
            items: [
              { title: 'Application Letter', url: '/student/application-letter', icon: FileTextIcon, locked: locks.beforeOjt },
              { title: 'Consent Form', url: '/student/consent', icon: UserCheckIcon, locked: locks.beforeOjt },
              { title: 'Proposal Letter', url: '/student/proposal', icon: FilePlus2Icon, locked: locks.beforeOjt },
              { title: 'Memorandum of Agreement', url: '/student/moa', icon: UsersIcon, locked: locks.beforeOjt },
              { title: 'Endorsement Letter', url: '/student/endorsement', icon: ClipboardCheckIcon, locked: locks.beforeOjt },
            ],
          },
          {
            group: 'In OJT',
            items: [
              { title: 'Weekly Journal', url: '/student/journal', icon: BookOpenIcon, locked: locks.inOjt },
              { title: 'Daily Time Record', url: '/student/dtr', icon: CalendarIcon, locked: locks.inOjt },
              { title: 'OJT Training Plan', url: '/student/training-plan', icon: ClipboardListIcon, locked: locks.inOjt },
            ],
          },
          {
            group: 'Final Phase',
            items: [
              { title: 'Integration Paper', url: '/student/completion', icon: AwardIcon, locked: locks.finals },
              { title: 'Performance Appraisal', url: '/student/evaluation', icon: CheckCircleIcon, locked: locks.finals },
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
              { title: 'Weekly Journal Review', url: '/supervisor/journal', icon: BookOpenIcon, badge: 2 },
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
            <NavLink to={getDashboardRoute()} className="block w-full">
              <SidebarMenuButton size="lg" className="hover:bg-sidebar-accent cursor-pointer group/brand gap-2.5 px-2">
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
            </NavLink>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="gap-0 py-2">
        <NavMain groups={getNavGroups()} />
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  )
}

