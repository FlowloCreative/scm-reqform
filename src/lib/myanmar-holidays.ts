import { getDay, format, addDays } from "date-fns";

// Myanmar official holidays - month/day format for yearly recurrence
// Saturdays, Sundays + Jan 1,4 | Feb 12,13 | Mar 27 | Apr 13-17 | May 1 | Jul 19 | Oct 14 | Nov 3,8,27 | Dec 25,30
const MYANMAR_HOLIDAYS_BY_MONTH_DAY: string[] = [
  "01-01", // New Year's Day
  "01-04", // Independence Day
  "02-12", // Union Day
  "02-13", // Union Day Holiday
  "03-27", // Armed Forces Day
  "04-13", // Thingyan Start
  "04-14", // Thingyan
  "04-15", // Thingyan
  "04-16", // Thingyan
  "04-17", // Myanmar New Year
  "05-01", // May Day
  "07-19", // Martyrs' Day
  "10-14", // Thadingyut
  "11-03", // Tazaungdaing
  "11-08", // National Day
  "11-27", // Tazaungmon Full Moon
  "12-25", // Christmas
  "12-30", // Year End Holiday
];

export const isMyanmarHoliday = (date: Date): boolean => {
  const monthDay = format(date, "MM-dd");
  return MYANMAR_HOLIDAYS_BY_MONTH_DAY.includes(monthDay);
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
