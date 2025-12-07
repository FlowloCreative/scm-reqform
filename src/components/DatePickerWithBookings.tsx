import * as React from "react";
import { format, parseISO, isWithinInterval, isBefore, startOfDay, addDays } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isOfficialOffDay, getOffDayReason, TIME_SLOTS } from "@/lib/myanmar-holidays";

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
  showTime?: boolean;
  timeValue?: string;
  onTimeChange?: (time: string) => void;
  excludeWeekends?: boolean;
  excludeHolidays?: boolean;
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
  showTime = false,
  timeValue,
  onTimeChange,
  excludeWeekends = false,
  excludeHolidays = false,
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
    
    // Check weekends and holidays if required
    if ((excludeWeekends || excludeHolidays) && isOfficialOffDay(date)) {
      return true;
    }
    
    // Check if booked
    return isDateBooked(date);
  };

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      onChange(format(date, "yyyy-MM-dd"));
    }
    if (!showTime) {
      setOpen(false);
    }
  };

  // Custom modifiers for styling
  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    offDay: (date: Date) => (excludeWeekends || excludeHolidays) && isOfficialOffDay(date),
  };

  const modifiersStyles = {
    booked: {
      backgroundColor: "hsl(var(--destructive) / 0.15)",
      color: "hsl(var(--destructive))",
      textDecoration: "line-through",
    },
    offDay: {
      backgroundColor: "hsl(var(--muted) / 0.5)",
      color: "hsl(var(--muted-foreground))",
    },
  };

  return (
    <div className={cn("flex gap-2", showTime ? "flex-col sm:flex-row" : "")}>
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
          <div className="p-3 border-t text-xs text-muted-foreground space-y-1">
            {machineUnit && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-destructive/15"></span>
                <span>Already booked for {machineUnit}</span>
              </div>
            )}
            {(excludeWeekends || excludeHolidays) && (
              <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-muted/50"></span>
                <span>Weekends & Myanmar holidays unavailable</span>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
      
      {showTime && (
        <Select
          value={timeValue}
          onValueChange={onTimeChange}
          disabled={disabled || !value}
        >
          <SelectTrigger className={cn("w-full sm:w-[140px]", !value && "opacity-50")}>
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOTS.map((slot) => (
              <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
