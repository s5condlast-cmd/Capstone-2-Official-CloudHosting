"use client"

import * as React from "react"
import { NavLink, useLocation } from "react-router-dom"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Lock as LockIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export interface NavItem {
  title: string
  url: string
  icon?: React.ElementType
  badge?: number | string
  locked?: boolean
}

export interface NavGroup {
  group: string
  items: NavItem[]
}

interface NavMainProps {
  groups: NavGroup[]
}

export function NavMain({ groups }: NavMainProps) {
  const location = useLocation()

  return (
    <div className="flex flex-col gap-1 px-1">
      {groups.map((group) => (
        <SidebarGroup key={group.group} className="py-1 px-1">
          {group.group && (
            <SidebarGroupLabel className="text-[11px] font-bold tracking-wider uppercase text-muted-foreground/80 px-3 py-1.5 select-none">
              {group.group}
            </SidebarGroupLabel>
          )}
          <SidebarMenu className="gap-0.5">
            {group.items.map((item) => {
              const Icon = item.icon
              const isExact = item.url === '/admin' || item.url === '/student' || item.url === '/adviser' || item.url === '/supervisor'
              const isActive = isExact
                ? location.pathname === item.url
                : location.pathname.startsWith(item.url.split('?')[0])

              if (item.locked) {
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={`${item.title} (Phase Locked)`}
                      className="opacity-45 cursor-not-allowed select-none text-[13.5px] font-medium text-muted-foreground px-3 py-2 rounded-lg gap-3"
                    >
                      {Icon && <Icon className="size-4.5 shrink-0 text-muted-foreground/70" />}
                      <span className="truncate">{item.title}</span>
                      <LockIcon className="ml-auto size-3.5 text-muted-foreground/70" />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              }

              return (
                <SidebarMenuItem key={item.title}>
                  <NavLink to={item.url} className="block w-full">
                    <SidebarMenuButton
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        "transition-all duration-150 group/btn text-[13.5px] font-medium cursor-pointer px-3 py-2 rounded-lg gap-3",
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : "text-sidebar-foreground/85 hover:text-sidebar-foreground hover:bg-sidebar-accent/80"
                      )}
                    >
                      {Icon && (
                        <Icon className={cn(
                          "size-4.5 shrink-0 transition-colors",
                          isActive
                            ? "text-primary-foreground"
                            : "text-muted-foreground group-hover/btn:text-sidebar-foreground"
                        )} />
                      )}
                      <span className="truncate">{item.title}</span>
                      {item.badge !== undefined && (
                        <SidebarMenuBadge className={cn(
                          "ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full tabular-nums",
                          isActive
                            ? "bg-primary-foreground/20 text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {item.badge}
                        </SidebarMenuBadge>
                      )}
                    </SidebarMenuButton>
                  </NavLink>
                </SidebarMenuItem>
              )
            })}
          </SidebarMenu>
        </SidebarGroup>
      ))}
    </div>
  )
}

