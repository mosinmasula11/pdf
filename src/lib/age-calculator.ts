import { addMonths, addYears, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
export function localDateValue(date: Date) { return format(date, "yyyy-MM-dd"); }
export function calculateAge(birthValue: string, targetValue: string) {
  const birth = parseISO(birthValue), target = parseISO(targetValue);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthValue) || !/^\d{4}-\d{2}-\d{2}$/.test(targetValue) || !isValid(birth) || !isValid(target)) return null;
  if (birth > target) return null;
  let totalMonths = (target.getFullYear() - birth.getFullYear()) * 12 + target.getMonth() - birth.getMonth();
  if (addMonths(birth, totalMonths) > target) totalMonths--;
  const years = Math.floor(totalMonths / 12), months = totalMonths % 12;
  const days = differenceInCalendarDays(target, addMonths(birth, totalMonths));
  const totalDays = differenceInCalendarDays(target, birth);
  // February 29 birthdays use February 28 in non-leap years.
  let nextBday = addYears(birth, target.getFullYear() - birth.getFullYear());
  if (nextBday < target) nextBday = addYears(birth, target.getFullYear() - birth.getFullYear() + 1);
  const daysUntilNextBday = differenceInCalendarDays(nextBday, target);
  const nextBdayAge = nextBday.getFullYear() - birth.getFullYear();
  return { birth, target, years, months, days, totalMonths, totalDays, nextBday, daysUntilNextBday, nextBdayAge };
}
