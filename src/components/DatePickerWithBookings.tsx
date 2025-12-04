import * as React from "react";
import { format, parseISO, isWithinInterval, isBefore, startOfDay, addDays } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface BookedPeriod {
  pickup_datetime: string;
  return_datetime: string;
  machine_unit: string;
}

interface DatePickerWithBookingsProps {
  value: string;
  onChange: (date: string) => void;
  bookedPeriods: BookedPeriod[];
  machineUnit: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  placeholder?: string;
}

export function DatePickerWithBookings({
  value,
  onChange,
  bookedPeriods,
  machineUnit,
  minDate,
  maxDate,
  disabled,
  placeholder = "Select date",
}: DatePickerWithBookingsProps) {
  const [open, setOpen] = React.useState(false);

  const selectedDate = value ? parseISO(value) : undefined;

  const isDateBooked = (date: Date): boolean => {
    if (!machineUnit) return false;
    
    const checkDate = startOfDay(date);
    
    for (const booking of bookedPeriods) {
      if (booking.machine_unit !== machineUnit) continue;
      
      const bookedStart = startOfDay(parseISO(booking.pickup_datetime));
      const bookedEnd = startOfDay(parseISO(booking.return_datetime));
      
      if (
        isWithinInterval(checkDate, { start: bookedStart, end: bookedEnd }) ||
        checkDate.getTime() === bookedStart.getTime() ||
        checkDate.getTime() === bookedEnd.getTime()
      ) {
        return true;
      }
    }
    return false;
  };

  const isDateDisabled = (date: Date): boolean => {
    const checkDate = startOfDay(date);
    
    // Check min/max bounds
    if (minDate && isBefore(checkDate, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), checkDate)) return true;
    
    // Check if booked
    return isDateBooked(date);
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    }
    setOpen(false);
  };

  // Custom day render to show booked dates with different styling
  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: "hsl(var(--destructive) / 0.15)",
      color: "hsl(var(--destructive))",
      textDecoration: "line-through",
    },
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground",
            disabled && "opacity-50 cursor-not-allowed"
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(parseISO(value), "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleSelect}
          disabled={isDateDisabled}
          modifiers={modifiers}
          modifiersStyles={modifiersStyles}
          initialFocus
          className="pointer-events-auto"
        />
        {machineUnit && (
          <div className="p-3 border-t text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <span className="inline-block w-3 h-3 rounded bg-destructive/15"></span>
              <span>Already booked for {machineUnit}</span>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
