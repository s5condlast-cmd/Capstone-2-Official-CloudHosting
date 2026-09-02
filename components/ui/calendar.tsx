import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  startMonth = new Date(2020, 0),
  endMonth = new Date(2040, 11),
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn(
        "group/calendar bg-transparent p-0 [--cell-radius:var(--radius-md)] [--cell-size:30px]",
        String.raw`rtl:**:[.rdp-button\_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button\_previous>svg]:rotate-180`,
        className
      )}
      captionLayout={captionLayout}
      startMonth={startMonth}
      endMonth={endMonth}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
        ...formatters,
      }}
      classNames={{
        root: cn("w-full flex justify-center", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-2 md:flex-row w-full max-w-[270px] items-center",
          defaultClassNames.months
        ),
        month: cn("flex w-full flex-col gap-2.5 relative items-center", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between z-10 pointer-events-none px-1 h-8",
          defaultClassNames.nav
        ),
        button_previous: cn(
          "pointer-events-auto size-7 p-0 flex items-center justify-center cursor-pointer select-none hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors aria-disabled:opacity-30",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          "pointer-events-auto size-7 p-0 flex items-center justify-center cursor-pointer select-none hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors aria-disabled:opacity-30",
          defaultClassNames.button_next
        ),
        month_caption: cn(
          "flex h-8 w-full items-center justify-center px-8 text-center relative z-20 pointer-events-auto",
          defaultClassNames.month_caption
        ),
        dropdowns: cn(
          "flex h-8 items-center justify-center gap-2 text-sm font-bold pointer-events-auto z-20",
          defaultClassNames.dropdowns
        ),
        dropdown_root: cn(
          "relative inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-sm font-bold hover:bg-muted/50 transition-colors cursor-pointer pointer-events-auto z-20",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn(
          "absolute inset-0 z-30 size-full opacity-0 cursor-pointer pointer-events-auto",
          defaultClassNames.dropdown
        ),
        caption_label: cn(
          "font-bold select-none text-sm tracking-tight text-foreground flex items-center gap-1 pointer-events-none",
          defaultClassNames.caption_label
        ),
        month_grid: cn("w-full border-collapse mt-1", defaultClassNames.month_grid),
        weekdays: cn("flex w-full justify-between mb-1 text-muted-foreground/70", defaultClassNames.weekdays),
        weekday: cn(
          "size-8 text-center text-xs font-semibold text-muted-foreground/80 select-none flex items-center justify-center",
          defaultClassNames.weekday
        ),
        week: cn("mt-0.5 flex w-full justify-between", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) select-none",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "text-[0.8rem] text-muted-foreground select-none",
          defaultClassNames.week_number
        ),
        day: cn(
          "size-8 text-center text-sm p-0 relative flex items-center justify-center",
          defaultClassNames.day
        ),
        range_start: cn(
          "relative isolate z-0 rounded-l-xl bg-muted after:absolute after:inset-y-0 after:right-0 after:w-4 after:bg-muted",
          defaultClassNames.range_start
        ),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn(
          "relative isolate z-0 rounded-r-xl bg-muted after:absolute after:inset-y-0 after:left-0 after:w-4 after:bg-muted",
          defaultClassNames.range_end
        ),
        today: cn(
          "rounded-xl bg-muted/80 text-foreground font-bold",
          defaultClassNames.today
        ),
        outside: cn(
          "text-muted-foreground/40 aria-selected:text-muted-foreground/50",
          defaultClassNames.outside
        ),
        disabled: cn(
          "text-muted-foreground opacity-40",
          defaultClassNames.disabled
        ),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4 stroke-[2]", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4 stroke-[2]", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("size-3.5 stroke-[2] text-muted-foreground/80", className)} {...props} />
          )
        },
        Select: ({ className, children, ...props }) => (
          <select
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            className={cn(
              "absolute inset-0 z-30 size-full cursor-pointer opacity-0 bg-popover text-popover-foreground",
              className
            )}
            {...props}
          >
            {children}
          </select>
        ),
        Option: ({ className, ...props }) => (
          <option
            className={cn("bg-popover text-popover-foreground py-1", className)}
            {...props}
          />
        ),
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        WeekNumber: ({ children, ...props }) => {
          return (
            <td {...props}>
              <div className="flex size-(--cell-size) items-center justify-center text-center">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  const isSelected =
    modifiers.selected &&
    !modifiers.range_start &&
    !modifiers.range_end &&
    !modifiers.range_middle

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={isSelected}
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn(
        "relative isolate z-10 flex size-8 min-w-8 aspect-square items-center justify-center p-0 text-sm font-semibold rounded-xl border-0 leading-none transition-colors hover:bg-muted/70 cursor-pointer text-foreground",
        modifiers.outside && "text-muted-foreground/40 font-normal",
        modifiers.today && !isSelected && "bg-muted/80 font-bold text-foreground",
        isSelected && "bg-primary text-primary-foreground font-bold hover:bg-primary/90",
        defaultClassNames.day,
        className
      )}
      {...props}
    />
  )
}

export { Calendar, CalendarDayButton }
