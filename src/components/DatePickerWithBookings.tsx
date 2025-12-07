import * as React from "react";
import { format, parseISO, isWithinInterval, isBefore, startOfDay } from "date-fns";
import { CalendarIcon, Clock, Info } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { isOfficialOffDay, getOffDayReason, TIME_SLOTS } from "@/lib/myanmar-holidays";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
  excludeHolidays = false
}: DatePickerWithBookingsProps) {
  const [open, setOpen] = React.useState(false);
  const [selectedInfo, setSelectedInfo] = React.useState<string | null>(null);
  const selectedDate = value ? parseISO(value) : undefined;
  const getBookingForDate = (date: Date): BookedPeriod | null => {
    if (!machineUnit) return null;
    const checkDate = startOfDay(date);
    for (const booking of bookedPeriods) {
      if (booking.machine_unit !== machineUnit) continue;
      const bookedStart = startOfDay(parseISO(booking.pickup_datetime));
      const bookedEnd = startOfDay(parseISO(booking.return_datetime));
      if (isWithinInterval(checkDate, {
        start: bookedStart,
        end: bookedEnd
      }) || checkDate.getTime() === bookedStart.getTime() || checkDate.getTime() === bookedEnd.getTime()) {
        return booking;
      }
    }
    return null;
  };
  const isDateBooked = (date: Date): boolean => {
    return getBookingForDate(date) !== null;
  };
  const isDateDisabled = (date: Date): boolean => {
    const checkDate = startOfDay(date);
    if (minDate && isBefore(checkDate, startOfDay(minDate))) return true;
    if (maxDate && isBefore(startOfDay(maxDate), checkDate)) return true;
    if ((excludeWeekends || excludeHolidays) && isOfficialOffDay(date)) {
      return true;
    }
    return isDateBooked(date);
  };
  const getInfoForDate = (date: Date): string | null => {
    const booking = getBookingForDate(date);
    if (booking) {
      const pickupDate = format(parseISO(booking.pickup_datetime), "MMM d");
      const returnDate = format(parseISO(booking.return_datetime), "MMM d");
      return `Booked: ${pickupDate} - ${returnDate}`;
    }
    if ((excludeWeekends || excludeHolidays) && isOfficialOffDay(date)) {
      return getOffDayReason(date);
    }
    return null;
  };
  const handleDayClick = (date: Date, modifiers: {
    disabled?: boolean;
  }) => {
    if (modifiers.disabled) {
      const info = getInfoForDate(date);
      setSelectedInfo(info);
      return;
    }
    setSelectedInfo(null);
    onChange(format(date, "yyyy-MM-dd"));
    if (!showTime) {
      setOpen(false);
    }
  };
  const modifiers = {
    booked: (date: Date) => isDateBooked(date),
    offDay: (date: Date) => (excludeWeekends || excludeHolidays) && isOfficialOffDay(date)
  };
  const modifiersStyles = {
    booked: {
      backgroundColor: "hsl(var(--destructive) / 0.15)",
      color: "hsl(var(--destructive))",
      textDecoration: "line-through"
    },
    offDay: {
      backgroundColor: "hsl(var(--muted) / 0.5)",
      color: "hsl(var(--muted-foreground))"
    }
  };
  return <div className={cn("flex gap-2", showTime ? "flex-col sm:flex-row" : "")}>
      <Popover open={open} onOpenChange={isOpen => {
      setOpen(isOpen);
      if (!isOpen) setSelectedInfo(null);
    }}>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !value && "text-muted-foreground", disabled && "opacity-50 cursor-not-allowed")} disabled={disabled}>
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(parseISO(value), "PPP") : <span className="my-[166px]">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <DayPicker mode="single" selected={selectedDate} onDayClick={handleDayClick} disabled={isDateDisabled} modifiers={modifiers} modifiersStyles={modifiersStyles} showOutsideDays={true} className="p-3 pointer-events-auto" classNames={{
          months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: cn(buttonVariants({
            variant: "outline"
          }), "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full border-collapse space-y-1",
          head_row: "flex",
          head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
          row: "flex w-full mt-2",
          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
          day: cn(buttonVariants({
            variant: "ghost"
          }), "h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
          day_range_end: "day-range-end",
          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
          day_today: "bg-accent text-accent-foreground",
          day_outside: "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
          day_disabled: "text-muted-foreground opacity-50",
          day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
          day_hidden: "invisible"
        }} components={{
          IconLeft: () => <ChevronLeft className="h-4 w-4" />,
          IconRight: () => <ChevronRight className="h-4 w-4" />
        }} />
          
          {selectedInfo && <div className="px-3 pb-2">
              <div className="flex items-center gap-2 text-xs bg-muted/50 text-muted-foreground p-2 rounded">
                <Info className="h-3 w-3 flex-shrink-0" />
                <span>{selectedInfo}</span>
              </div>
            </div>}
          
          <div className="p-3 border-t text-xs text-muted-foreground space-y-1">
            <p className="text-[10px] italic mb-2">Tap disabled dates to see why</p>
            {machineUnit && <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-destructive/15"></span>
                <span>Already booked for {machineUnit}</span>
              </div>}
            {(excludeWeekends || excludeHolidays) && <div className="flex items-center gap-2">
                <span className="inline-block w-3 h-3 rounded bg-muted/50"></span>
                <span>Weekends & Myanmar holidays unavailable</span>
              </div>}
          </div>
        </PopoverContent>
      </Popover>
      
      {showTime && <Select value={timeValue} onValueChange={onTimeChange} disabled={disabled || !value}>
          <SelectTrigger className={cn("w-full sm:w-[140px]", !value && "opacity-50")}>
            <Clock className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Time" />
          </SelectTrigger>
          <SelectContent>
            {TIME_SLOTS.map(slot => <SelectItem key={slot.value} value={slot.value}>
                {slot.label}
              </SelectItem>)}
          </SelectContent>
        </Select>}
    </div>;
}