"use client"

import * as React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import {
  Bell as BellIcon,
  Check as CheckIcon,
  X as XIcon,
  List as ListIcon,
  Settings as SettingsIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { User } from "@/src/types"

interface NotificationItem {
  id: string
  actor: string
  title: string
  target: string
  timestamp: string
  initials: string
  avatarColor: string
  read: boolean
  link?: string
}

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "notif-1",
    actor: "Dr. Sarah Johnson",
    title: "Requested revisions on",
    target: "Journal #4",
    timestamp: "Aug 27, 2:23 pm",
    initials: "SJ",
    avatarColor: "bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30",
    read: false,
    link: "/student/journal",
  },
  {
    id: "notif-2",
    actor: "Dr. Sarah Johnson",
    title: "Verified your",
    target: "MOA Document",
    timestamp: "Aug 27, 2:21 pm",
    initials: "SJ",
    avatarColor: "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    read: false,
    link: "/student/moa",
  },
  {
    id: "notif-3",
    actor: "Engr. Paolo Reyes",
    title: "Posted announcement:",
    target: "Midterm DTR Submission",
    timestamp: "Aug 27, 2:20 pm",
    initials: "PR",
    avatarColor: "bg-sky-500/20 text-sky-600 dark:text-sky-400 border-sky-500/30",
    read: false,
    link: "/student/dtr",
  },
  {
    id: "notif-4",
    actor: "Adviser Office",
    title: "Graded & approved:",
    target: "Parent Consent Form",
    timestamp: "Aug 17, 9:07 am",
    initials: "AO",
    avatarColor: "bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
    read: true,
    link: "/student/parent-consent",
  },
]

interface NotificationDropdownProps {
  user?: User | null
}

export function NotificationDropdown({ user }: NotificationDropdownProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS)
  const [isOpen, setIsOpen] = useState(false)
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.read).length

  const markAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation()
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const dismissNotification = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  const handleClickItem = (id: string, link?: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
    if (link) {
      setIsOpen(false)
      navigate(link)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground relative cursor-pointer"
          />
        }
      >
        <BellIcon className="size-4" />
        <span className="sr-only">Notifications</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full size-4 text-[10px] font-bold flex items-center justify-center shadow-xs">
            {unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-[360px] sm:w-[400px] rounded-2xl p-0 shadow-2xl border border-border bg-popover text-popover-foreground overflow-hidden"
        side="bottom"
        align="center"
        sideOffset={8}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-border/80 bg-muted/20">
          <h3 className="text-base font-bold text-foreground tracking-tight">Notifications</h3>
        </div>

        {/* Notification Items (LMS Style 3-Line List) */}
        <div className="max-h-[340px] overflow-y-auto divide-y divide-border/60">
          {notifications.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground">
              <BellIcon className="size-8 mx-auto mb-2 opacity-30 stroke-1" />
              <p className="text-xs font-medium">No notifications</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleClickItem(notif.id, notif.link)}
                className={cn(
                  "px-4 py-3 transition-colors cursor-pointer flex items-center gap-3.5 text-left group relative",
                  notif.read
                    ? "hover:bg-muted/40 opacity-75 hover:opacity-100"
                    : "bg-muted/20 hover:bg-muted/60"
                )}
              >
                {/* Avatar Initial / Photo Circle */}
                <div
                  className={cn(
                    "size-9.5 rounded-full border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs select-none",
                    notif.avatarColor
                  )}
                >
                  {notif.initials}
                </div>

                {/* Body (Name, Action, Timestamp) */}
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-[13.5px] font-bold text-foreground leading-tight truncate">
                    {notif.actor}
                  </p>
                  <p className="text-[12.5px] font-medium text-foreground/90 leading-tight mt-1 truncate">
                    <span className="text-muted-foreground">{notif.title}</span>{" "}
                    <strong className="font-semibold text-foreground">{notif.target}</strong>
                  </p>
                  <p className="text-[11.5px] text-muted-foreground/80 font-normal leading-tight mt-1">
                    {notif.timestamp}
                  </p>
                </div>

                {/* Dismiss / Mark Read Action Button */}
                <button
                  type="button"
                  title="Dismiss"
                  onClick={(e) => dismissNotification(e, notif.id)}
                  className="p-1 rounded-md text-muted-foreground/70 hover:text-foreground hover:bg-muted/80 transition-colors shrink-0 cursor-pointer opacity-70 group-hover:opacity-100"
                >
                  {notif.read ? (
                    <CheckIcon className="size-3.5 text-emerald-500" />
                  ) : (
                    <XIcon className="size-3.5" />
                  )}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer 3-Action Toolbar */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-t border-border text-xs font-semibold text-muted-foreground">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (user?.role) {
                navigate(`/${user.role}/notifications`)
              }
            }}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-muted"
          >
            <ListIcon className="size-3.5" />
            <span>See all</span>
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-muted"
          >
            <CheckIcon className="size-3.5" />
            <span>Mark all read</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false)
              if (user?.role) {
                navigate(`/${user.role}/notifications`)
              }
            }}
            className="flex items-center gap-1.5 hover:text-foreground transition-colors cursor-pointer py-1 px-1.5 rounded-md hover:bg-muted"
          >
            <SettingsIcon className="size-3.5" />
            <span>Configure</span>
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
