"use client"

import * as React from "react"
import { useNavigate } from "react-router-dom"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  ChevronsUpDownIcon,
  BadgeCheckIcon,
  BellIcon,
  LogOutIcon,
  SearchIcon,
  ShieldIcon,
  GraduationCapIcon,
  UsersIcon,
  Building2Icon
} from "lucide-react"
import { User, Role } from "@/src/types"
import { cn } from "@/lib/utils"

interface NavUserProps {
  user: User | null
  onLogout?: () => void
  onSearchClick?: () => void
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

export function NavUser({ user, onLogout, onSearchClick }: NavUserProps) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  if (!user) return null

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase()
    : "ST"

  const roleInfo = getRoleBadge(user.role)
  const RoleIcon = roleInfo.icon

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton size="lg" className="aria-expanded:bg-sidebar-accent cursor-pointer group/user" />
            }
          >
            <Avatar className="size-8 rounded-lg bg-primary/10 text-primary font-bold border border-border">
              <AvatarFallback className="rounded-lg text-xs font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="grid flex-1 text-left text-sm leading-tight min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="truncate font-semibold text-foreground text-xs">{user.name}</span>
              </div>
            </div>
            <ChevronsUpDownIcon className="ml-auto size-4 text-muted-foreground group-hover/user:text-foreground transition-colors" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-60 rounded-xl p-1.5 shadow-lg border border-border bg-popover"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="p-0 font-normal">
                <div className="flex items-center gap-2.5 px-2 py-2 text-left text-sm bg-muted/40 rounded-lg">
                  <Avatar className="size-9 rounded-lg bg-primary text-primary-foreground font-bold shrink-0">
                    <AvatarFallback className="rounded-lg text-xs font-bold bg-primary text-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-xs leading-tight min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="truncate font-bold text-foreground">{user.name}</span>
                    </div>
                    <div className="mt-1">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border",
                        roleInfo.color
                      )}>
                        <RoleIcon className="size-2.5" />
                        {roleInfo.label}
                      </span>
                    </div>
                  </div>
                </div>
              </DropdownMenuLabel>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuGroup>
              <DropdownMenuItem
                className="cursor-pointer text-xs font-medium gap-2.5 py-2 px-2 rounded-md hover:bg-accent"
                onClick={() => navigate(`/${user.role}/profile`)}
              >
                <BadgeCheckIcon className="size-4 text-muted-foreground" />
                <span>My Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-xs font-medium gap-2.5 py-2 px-2 rounded-md hover:bg-accent"
                onClick={() => navigate(`/${user.role}/notifications`)}
              >
                <BellIcon className="size-4 text-muted-foreground" />
                <span>Notifications</span>
              </DropdownMenuItem>
              {onSearchClick && (
                <DropdownMenuItem
                  className="cursor-pointer text-xs font-medium gap-2.5 py-2 px-2 rounded-md hover:bg-accent"
                  onClick={onSearchClick}
                >
                  <SearchIcon className="size-4 text-muted-foreground" />
                  <span>Quick Search (⌘K)</span>
                </DropdownMenuItem>
              )}
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="my-1.5" />
            <DropdownMenuItem
              className="cursor-pointer text-xs font-semibold gap-2.5 py-2 px-2 rounded-md text-destructive focus:bg-destructive/10 focus:text-destructive"
              onClick={onLogout}
            >
              <LogOutIcon className="size-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
