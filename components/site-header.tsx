"use client"

import * as React from "react"
import { useLocation, Link } from "react-router-dom"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Search as SearchIcon,
  Sun as SunIcon,
  Moon as MoonIcon,
  Bell as BellIcon,
  BadgeCheck as BadgeCheckIcon,
  LogOut as LogOutIcon,
  Shield as ShieldIcon,
  GraduationCap as GraduationCapIcon,
  Users as UsersIcon,
  Building2 as Building2Icon,
  Calendar as CalendarIcon,
  ChevronDown as ChevronDownIcon,
  Sparkles as SparklesIcon,
  CreditCard as CreditCardIcon,
  Settings as SettingsIcon,
  CheckCircle2 as CheckCircle2Icon,
  User as UserIcon,
  MessageSquare as MessageSquareIcon,
} from "lucide-react"
import { User, Role } from "@/src/types"
import { cn } from "@/lib/utils"
import { NotificationDropdown } from "@/components/notification-dropdown"

interface SiteHeaderProps {
  user?: User | null
  theme?: 'light' | 'dark'
  onToggleTheme?: () => void
  onSearchClick?: () => void
  onLogout?: () => void
}

const getCalendarRoute = (role?: Role) => {
  switch (role) {
    case 'student': return '/student/calendar'
    case 'supervisor': return '/supervisor/calendar'
    case 'adviser': return '/adviser/calendar'
    case 'admin': return '/admin/calendar'
    default: return '/student/calendar'
  }
}

const getRoleBadge = (role?: Role) => {
  switch (role) {
    case 'admin':
      return { label: 'Admin', icon: ShieldIcon, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' }
    case 'adviser':
      return { label: 'Adviser', icon: UsersIcon, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' }
    case 'supervisor':
      return { label: 'Supervisor', icon: Building2Icon, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' }
    case 'student':
    default:
      return { label: 'Student', icon: GraduationCapIcon, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' }
  }
}

const routeTitleMap: Record<string, string> = {
  admin: "Admin",
  adviser: "Adviser",
  student: "Student",
  supervisor: "Supervisor",
  calendar: "Practicum Calendar",
  monitoring: "System Monitoring",
  users: "User Accounts",
  companies: "Companies",
  documents: "Document Verification",
  templates: "Document Templates",
  reports: "Reports & Analytics",
  settings: "System Settings",
  announcements: "Announcements",
  students: "My Students",
  endorsements: "Endorsements",
  moa: "Memorandum of Agreement",
  review: "Document Review",
  "class-reports": "Class Progress",
  "application-letter": "Application Letter",
  consent: "Consent Form",
  proposal: "Proposal Letter",
  endorsement: "Endorsement Letter",
  journal: "Weekly Journal",
  dtr: "Daily Time Record",
  "training-plan": "Training Plan",
  completion: "Integration Paper",
  evaluation: "Performance Appraisal",
  interns: "Assigned Interns",
  notifications: "Notifications",
  profile: "Profile Settings",
}

export function SiteHeader({ user, theme, onToggleTheme, onSearchClick, onLogout }: SiteHeaderProps) {
  const location = useLocation()

  // Generate breadcrumb items from URL path
  const pathSegments = location.pathname.split("/").filter(Boolean)

  const role = pathSegments[0] || user?.role || "student"
  const subPage = pathSegments[1]

  const roleLabel = routeTitleMap[role] || (role.charAt(0).toUpperCase() + role.slice(1))
  const pageLabel = subPage
    ? routeTitleMap[subPage] || (subPage.charAt(0).toUpperCase() + subPage.slice(1).replace(/-/g, " "))
    : "Dashboard"

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "ST"

  const roleInfo = getRoleBadge(user?.role)
  const RoleIcon = roleInfo.icon

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border bg-background/95 backdrop-blur-md px-4 lg:px-6 transition-[width,height] ease-linear">
      {/* Left: Sidebar Trigger & Breadcrumbs */}
      <div className="flex items-center gap-2 min-w-0">
        <SidebarTrigger className="-ml-1 cursor-pointer" />
        <Separator orientation="vertical" className="mx-1 h-4" />
        <Breadcrumb className="hidden sm:flex">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to={`/${role}`} />}>
                {roleLabel}
              </BreadcrumbLink>
            </BreadcrumbItem>
            {subPage && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground">
                    {pageLabel}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
            {!subPage && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="font-semibold text-foreground">
                    Dashboard
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </>
            )}
          </BreadcrumbList>
        </Breadcrumb>
        <span className="sm:hidden font-bold text-sm truncate text-foreground">
          {pageLabel}
        </span>
      </div>

      {/* Right: Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Search Command Palette Trigger */}
        {onSearchClick && (
          <Button
            variant="outline"
            size="sm"
            onClick={onSearchClick}
            className="hidden sm:inline-flex items-center justify-between text-xs text-muted-foreground hover:text-foreground h-8.5 w-48 md:w-56 lg:w-64 px-3 rounded-lg border-border/80 bg-muted/20 hover:bg-muted/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-2 min-w-0">
              <SearchIcon className="size-3.5 shrink-0" />
              <span className="truncate">Search...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-4.5 select-none items-center gap-0.5 rounded border border-border bg-muted px-1.5 font-mono text-[9.5px] font-medium text-muted-foreground opacity-100 shrink-0">
              <span className="text-[11px]">⌘</span>K
            </kbd>
          </Button>
        )}

        {/* Mobile Search Button */}
        {onSearchClick && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onSearchClick}
            className="sm:hidden size-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <SearchIcon className="size-4" />
            <span className="sr-only">Search</span>
          </Button>
        )}

        {/* Notifications Dropdown */}
        {user && <NotificationDropdown user={user} />}

        {/* Calendar Button */}
        {user && (
          <Link to={getCalendarRoute(user.role)}>
            <Button
              variant="ghost"
              size="icon"
              title="Daily Time Record / Calendar"
              className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <CalendarIcon className="size-4" />
              <span className="sr-only">Calendar</span>
            </Button>
          </Link>
        )}

        {/* Theme Toggle */}
        {onToggleTheme && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            {theme === "dark" ? (
              <SunIcon className="size-4" />
            ) : (
              <MoonIcon className="size-4" />
            )}
            <span className="sr-only">Toggle Theme</span>
          </Button>
        )}

        {/* User Profile on Topbar */}
        {user && (
          <div className="pl-1 sm:pl-2 ml-0.5 sm:ml-1">
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <button
                    type="button"
                    className="flex items-center gap-2.5 hover:bg-muted/80 rounded-xl py-1 px-2 transition-all cursor-pointer group/prof outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                }
              >
                <div className="flex flex-col items-end text-right hidden sm:flex min-w-0 max-w-[180px]">
                  <span className="text-[13px] md:text-[14px] font-bold text-foreground truncate leading-tight">
                    {user?.role === 'student' ? 'John Dwayne Guaniso' : user.name}
                  </span>
                </div>
                <div className="relative">
                  <div className="size-10 rounded-full bg-sky-400 dark:bg-sky-500 text-white flex items-center justify-center text-base font-bold shrink-0 shadow-2xs group-hover/prof:scale-105 transition-transform">
                    {initials[0]}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 size-4 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 flex items-center justify-center shadow-xs">
                    <ChevronDownIcon className="size-3 stroke-[2.5]" />
                  </div>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-52 rounded-xl p-1.5 shadow-xl border border-border bg-popover text-popover-foreground"
                side="bottom"
                align="end"
                sideOffset={8}
              >
                {/* Primary Nav Links */}
                <DropdownMenuGroup className="flex flex-col gap-0.5">
                  <DropdownMenuItem
                    render={<Link to={`/${user.role}/profile`} />}
                    className="cursor-pointer gap-3 px-3 py-2 text-sm font-medium hover:bg-accent rounded-lg"
                  >
                    <BadgeCheckIcon className="size-4.5 text-muted-foreground" />
                    <span>My Profile</span>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    render={<Link to={`/${user.role}/notifications`} />}
                    className="cursor-pointer gap-3 px-3 py-2 text-sm font-medium hover:bg-accent rounded-lg"
                  >
                    <BellIcon className="size-4.5 text-muted-foreground" />
                    <span>Notifications</span>
                  </DropdownMenuItem>

                  {user?.role === 'admin' && (
                    <DropdownMenuItem
                      render={<Link to="/admin/settings" />}
                      className="cursor-pointer gap-3 px-3 py-2 text-sm font-medium hover:bg-accent rounded-lg"
                    >
                      <SettingsIcon className="size-4.5 text-muted-foreground" />
                      <span>System Settings</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuGroup>

                {/* Accent Color Palette Switcher */}
                <DropdownMenuSeparator className="my-1.5" />
                <div className="px-2 py-1.5">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Accent Color</p>
                  <div className="flex items-center justify-between px-1">
                    {[
                      { id: 'default', color: 'bg-zinc-900 dark:bg-zinc-100', name: 'Monochrome' },
                      { id: 'theme-deep-sky', color: 'bg-[#3B82C4]', name: 'Deep Sky Blue' },
                      { id: 'theme-blue', color: 'bg-[#2563eb]', name: 'Modern Blue' },
                      { id: 'theme-indigo', color: 'bg-[#4f46e5]', name: 'Indigo' },
                      { id: 'theme-sti', color: 'bg-[#1d4ed8]', name: 'STI Inspired' }
                    ].map(t => {
                      const currentTheme = localStorage.getItem('app-theme') || 'default';
                      return (
                        <button
                          key={t.id}
                          title={t.name}
                          type="button"
                          onClick={() => {
                            ['theme-deep-sky', 'theme-blue', 'theme-indigo', 'theme-sti', 'theme-cyan'].forEach(cls => document.documentElement.classList.remove(cls));
                            if (t.id !== 'default') document.documentElement.classList.add(t.id);
                            localStorage.setItem('app-theme', t.id);
                          }}
                          className={cn(
                            "size-5 rounded-full transition-transform hover:scale-110 shadow-xs cursor-pointer",
                            t.color,
                            currentTheme === t.id && "ring-2 ring-offset-2 ring-primary ring-offset-background"
                          )}
                        />
                      );
                    })}
                  </div>
                </div>

                <DropdownMenuSeparator className="my-1.5" />

                {/* Log Out Action */}
                <DropdownMenuItem
                  className="cursor-pointer gap-3 px-3 py-2 text-sm font-semibold text-destructive focus:bg-destructive/10 focus:text-destructive rounded-lg"
                  onClick={onLogout}
                >
                  <LogOutIcon className="size-4.5" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>
    </header>
  )
}
