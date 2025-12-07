import { isWeekend, getDay, format, addDays, isBefore, isAfter, isSameDay } from "date-fns";

// Myanmar official holidays for 2024-2026
// These include major public holidays - can be updated annually
const MYANMAR_HOLIDAYS: string[] = [
  // 2024
  "2024-01-01", // New Year's Day
  "2024-01-04", // Independence Day
  "2024-02-12", // Union Day
  "2024-03-02", // Peasants' Day
  "2024-03-27", // Armed Forces Day
  "2024-04-13", // Thingyan Start
  "2024-04-14", // Thingyan
  "2024-04-15", // Thingyan
  "2024-04-16", // Thingyan
  "2024-04-17", // Myanmar New Year
  "2024-05-01", // May Day
  "2024-05-22", // Kasone Full Moon
  "2024-07-19", // Martyrs' Day
  "2024-07-20", // Waso Full Moon
  "2024-10-17", // Thadingyut Full Moon
  "2024-10-18", // Thadingyut Holiday
  "2024-10-19", // Thadingyut Holiday
  "2024-11-15", // Tazaungdaing Full Moon
  "2024-12-25", // Christmas
  "2024-12-31", // New Year's Eve
  
  // 2025
  "2025-01-01", // New Year's Day
  "2025-01-04", // Independence Day
  "2025-02-12", // Union Day
  "2025-03-02", // Peasants' Day
  "2025-03-27", // Armed Forces Day
  "2025-04-13", // Thingyan Start
  "2025-04-14", // Thingyan
  "2025-04-15", // Thingyan
  "2025-04-16", // Thingyan
  "2025-04-17", // Myanmar New Year
  "2025-05-01", // May Day
  "2025-05-11", // Kasone Full Moon
  "2025-07-19", // Martyrs' Day
  "2025-07-10", // Waso Full Moon
  "2025-10-06", // Thadingyut Full Moon
  "2025-10-07", // Thadingyut Holiday
  "2025-10-08", // Thadingyut Holiday
  "2025-11-05", // Tazaungdaing Full Moon
  "2025-12-25", // Christmas
  "2025-12-31", // New Year's Eve
  
  // 2026
  "2026-01-01", // New Year's Day
  "2026-01-04", // Independence Day
  "2026-02-12", // Union Day
  "2026-03-02", // Peasants' Day
  "2026-03-27", // Armed Forces Day
  "2026-04-13", // Thingyan Start
  "2026-04-14", // Thingyan
  "2026-04-15", // Thingyan
  "2026-04-16", // Thingyan
  "2026-04-17", // Myanmar New Year
  "2026-05-01", // May Day
  "2026-05-30", // Kasone Full Moon
  "2026-07-19", // Martyrs' Day
  "2026-07-29", // Waso Full Moon
  "2026-10-25", // Thadingyut Full Moon
  "2026-10-26", // Thadingyut Holiday
  "2026-10-27", // Thadingyut Holiday
  "2026-11-23", // Tazaungdaing Full Moon
  "2026-12-25", // Christmas
  "2026-12-31", // New Year's Eve
];

export const isMyanmarHoliday = (date: Date): boolean => {
  const dateStr = format(date, "yyyy-MM-dd");
  return MYANMAR_HOLIDAYS.includes(dateStr);
};

export const isOfficialOffDay = (date: Date): boolean => {
  // Saturday = 6, Sunday = 0
  const day = getDay(date);
  return day === 0 || day === 6 || isMyanmarHoliday(date);
};

export const getNextWorkingDay = (date: Date, direction: "forward" | "backward" = "forward"): Date => {
  let currentDate = date;
  while (isOfficialOffDay(currentDate)) {
    currentDate = direction === "forward" ? addDays(currentDate, 1) : addDays(currentDate, -1);
  }
  return currentDate;
};

export const getOffDayReason = (date: Date): string | null => {
  const day = getDay(date);
  if (day === 0) return "Sunday";
  if (day === 6) return "Saturday";
  if (isMyanmarHoliday(date)) return "Myanmar public holiday";
  return null;
};

// Time slots from 9 AM to 4 PM
export const TIME_SLOTS = [
  { value: "09:00", label: "9:00 AM" },
  { value: "10:00", label: "10:00 AM" },
  { value: "11:00", label: "11:00 AM" },
  { value: "12:00", label: "12:00 PM" },
  { value: "13:00", label: "1:00 PM" },
  { value: "14:00", label: "2:00 PM" },
  { value: "15:00", label: "3:00 PM" },
  { value: "16:00", label: "4:00 PM" },
];
