import * as moment from "moment-timezone"
import { DayDate } from "../models/DayDate"
import { Month } from "../models/Month"
import { TimeUnit } from "../models/TimeUnit"
import TimeInterval from "../models/TimeInterval"
import { Weekday } from "../models/Weekday"

export namespace DateUtils {
  const dayDateFormat = "DD-MM-YYYY"
  const timezone = "UTC" // Use always UTC to prevent timezone convertion.

  export function getWeekday(date: DayDate): Weekday {
    return toWeekday(toMomentFromDayDate(date).isoWeekday())
  }

  export function today(): DayDate {
    return toDayDateFromMoment(moment())
  }

  export function getEnd(start: DayDate, interval: TimeInterval): DayDate {
    const endDate = toMomentFromDayDate(start).add(interval.value, toMomentUnitString(interval.unit))
    return { day: endDate.date(), month: toMonth(endDate.month()), year: endDate.year() }
  }

  export function isInInterval(date: DayDate, start: DayDate, timeInterval: TimeInterval): boolean {
    const end = getEnd(start, timeInterval)
    return isInStartEnd(date, start, end)
  }

  export function isInStartEnd(date: DayDate, start: DayDate, end: DayDate): boolean {
    return toMomentFromDayDate(date).isBetween(toMomentFromDayDate(start), toMomentFromDayDate(end))
  }

  /**
   * @param dayDate date to convert
   * @returns typle with string representation and format string.
   */
  export function toDayDateString(dayDate: DayDate): { formatted: string; format: string } {
    return {
      formatted: toMomentFromDayDate(dayDate).format(dayDateFormat),
      format: dayDateFormat
    }
  }

  export function parseDayDate(str: string): DayDate {
    const mom = toMomentFromString(str, dayDateFormat)

    if (JSON.stringify(mom) == "null") {
      // Validation hack - if str is invalid, mom will be NaN, but the compiler doesn't let us check for NaN!
      throw new Error(`Couldn't parse day date string: ${str}`)
    }

    return {
      day: mom.date(),
      month: parseMonth(mom.month()),
      year: mom.year()
    }
  }

  /**
   * Converts moment lib month index to Month
   */
  function parseMonth(index: number): Month {
    return Month.parseNumber(index)
  }

  function toWeekday(momentIsoWeekday: number): Weekday {
    switch (momentIsoWeekday) {
      case 1:
        return Weekday.Monday
      case 2:
        return Weekday.Tuesday
      case 3:
        return Weekday.Wednesday
      case 4:
        return Weekday.Thursday
      case 5:
        return Weekday.Friday
      case 6:
        return Weekday.Saturday
      case 7:
        return Weekday.Sunday
      default:
        throw new Error(`Invalid iso weekday: ${momentIsoWeekday}`)
    }
  }

  function toMomentUnitString(unit: TimeUnit): moment.DurationInputArg2 {
    switch (unit) {
      case TimeUnit.Day:
        return "days"
      case TimeUnit.Week:
        return "weeks"
      case TimeUnit.Month:
        return "months"
      case TimeUnit.Year:
        return "years"
    }
  }

  function toMonth(momentMonth: number) {
    switch (momentMonth) {
      case 0:
        return Month.January
      case 1:
        return Month.February
      case 2:
        return Month.March
      case 3:
        return Month.April
      case 4:
        return Month.May
      case 5:
        return Month.June
      case 6:
        return Month.July
      case 7:
        return Month.August
      case 8:
        return Month.September
      case 9:
        return Month.October
      case 10:
        return Month.November
      case 11:
        return Month.December
      default:
        throw new Error(`Invalid moment month: ${momentMonth}`)
    }
  }

  function toMomentMonth(month: Month) {
    switch (month) {
      case Month.January:
        return 0
      case Month.February:
        return 1
      case Month.March:
        return 2
      case Month.April:
        return 3
      case Month.May:
        return 4
      case Month.June:
        return 5
      case Month.July:
        return 6
      case Month.August:
        return 7
      case Month.September:
        return 8
      case Month.October:
        return 9
      case Month.November:
        return 10
      case Month.December:
        return 11
    }
  }

  function toMomentFromDayDate(dayDate: DayDate): moment.Moment {
    // Note: Setters have to be called in decresing order (year-month-date) for leap years to work properly.
    // See https://github.com/moment/moment/issues/3041
    return moment
      .tz(timezone)
      .year(dayDate.year)
      .month(toMomentMonth(dayDate.month))
      .date(dayDate.day)
  }

  function toDayDateFromMoment(moment: moment.Moment): DayDate {
    return { day: moment.date(), month: toMonth(moment.month()), year: moment.year()}
  }

  function toMomentFromString(formatted: string, format: string): moment.Moment {
    return moment.tz(formatted, format, true, timezone)
  }
}