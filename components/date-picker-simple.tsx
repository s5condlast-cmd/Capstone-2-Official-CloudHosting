"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export function DatePickerSimple({
  id = "date",
  label = "Date",
  date,
  onDateChange,
}: {
  id?: string
  label?: string
  date?: Date
  onDateChange?: (date: Date | undefined) => void
}) {
  const [open, setOpen] = React.useState(false)
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(date)

  const selectedDate = date !== undefined ? date : internalDate

  const handleSelect = (newDate: Date | undefined) => {
    if (onDateChange) {
      onDateChange(newDate)
    } else {
      setInternalDate(newDate)
    }
    setOpen(false)
  }

  return (
    <Field className="w-full">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              id={id}
              className="w-full justify-start font-normal h-9 text-sm rounded-xl border-input bg-card shadow-2xs hover:bg-muted/40 cursor-pointer px-3"
            >
              {selectedDate ? selectedDate.toLocaleDateString() : "Select date"}
            </Button>
          }
        />
        <PopoverContent className="w-auto p-4 rounded-2xl shadow-2xl border border-border bg-popover text-popover-foreground z-[9999]" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            defaultMonth={selectedDate}
            captionLayout="dropdown"
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
    </Field>
  )
}

