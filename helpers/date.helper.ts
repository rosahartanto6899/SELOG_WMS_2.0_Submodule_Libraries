import moment from 'moment';

export class DateHelper {
  /**
   * Formats a date to 'YYYY-MM-DD HH:mm:ss'.
   * - If `date` is null → returns current datetime
   * - If `date` is a string or Date → formats it
   * - Throws error if date string is invalid
   */
  static formatDefault(date: Date | string | null = null): string {
    if (date === null) {
      return moment().format('YYYY-MM-DD HH:mm:ss');
    }

    const m = moment(date);

    if (!m.isValid()) {
      throw new Error(`Invalid date value: ${date}`);
    }

    return m.format('YYYY-MM-DD HH:mm:ss');
  }

  /**
   * Calculates the age of a vehicle given its manufacture year as a string.
   * @param manufactureYear The year the vehicle was manufactured (string).
   * @returns The age of the vehicle in years. Returns null if the input is invalid.
   */
  static calculateVehicleAge(manufactureYear: string): number | null {
    const year = parseInt(manufactureYear, 10);
    if (isNaN(year)) return null;

    const currentYear = moment().year();
    return currentYear - year;
  }

  /**
   * Checks the maintenance status of a vehicle.
   * @param planStartDate The planned start date of maintenance (string).
   * @param actualStartDate The actual start date of maintenance (string).
   * @returns "onTime" if actualStartDate <= planStartDate, "late" if actualStartDate > planStartDate,
   *          or "notStarted" if either date is missing or null.
   */
  static checkMaintenanceStatus(
    planStartDate: Date | null,
    actualStartDate: Date | null,
  ): 'onTime' | 'late' | 'planned' {
    if (!planStartDate || !actualStartDate) return 'planned';

    const plan = moment(planStartDate).startOf('minute');
    const actual = moment(actualStartDate).startOf('minute');

    return actual.isSameOrBefore(plan) ? 'onTime' : 'late';
  }

  /**
   * Checks the status of a license/KIR based on expiry date.
   *
   * Status rules:
   * - "expired"    → now > expiryDate
   * - "attention"  → (license only) expiry <= 30 days from today
   * - "active"     → expiry > 30 days from today | null
   *
   * @param {Date | null} expiryDate - The expiry date.
   * @param {string} [type] - Optional type ("license" | "kir").
   *                          Only "license" uses "attention" status.
   *
   * @returns {"active" | "expired" | "attention"}
   */
  static checkLicenseAndKIRStatus(
    expiryDate: Date | null,
  ): 'active' | 'expired' | 'attention' {
    if (!expiryDate) return 'active';

    const expiry = moment(expiryDate).startOf('day'); // ignore time
    const today = moment().startOf('day');

    // expired condition
    if (today.isAfter(expiry)) {
      return 'expired';
    }

    // attention (within 30 days before expiry)
    const daysLeft = expiry.diff(today, 'days');
    if (daysLeft <= 30) {
      return 'attention';
    }

    // default active
    return 'active';
  }

  /**
   * Returns the year and month of a given date.
   * @param date The date to extract year and month from.
   * @returns An object with { year, month } or null if date is invalid.
   */
  static getYearAndMonthStr(
    date: Date | null,
  ): { year: string; month: string } | null {
    if (!date) return null;

    const m = moment(date);
    return {
      year: m.format('YYYY'),
      month: m.format('MM'), // "01" to "12"
    };
  }

  /**
   * Returns the difference between the given date and today in the format
   * "X Tahun Y Bulan Z Hari".
   * @param date The start date as a string in 'YYYY-MM-DD' or Date object.
   * @returns A formatted string showing the difference in years, months, and days.
   */
  static formatDateDifference(date: string | Date): string {
    const start = moment(date);
    if (!start.isValid()) return 'Invalid date';

    const end = moment();

    const years = end.diff(start, 'years');
    const afterYears = start.clone().add(years, 'years');

    const months = end.diff(afterYears, 'months');
    const afterMonths = afterYears.clone().add(months, 'months');

    const days = end.diff(afterMonths, 'days');

    return `${years} Tahun ${months} Bulan ${days} Hari`;
  }

  /**
   * Compares a given time with the current time and returns the difference in minutes.
   *
   * - A positive value means the given time has already passed (X minutes ago).
   * - A negative value means the given time is in the future (X minutes remaining).
   * - A value of 0 means the given time is equal to the current time (to the nearest minute).
   *
   * If the input is invalid or null, the function returns `null`.
   *
   * @param time The time to compare, as a Date object or a string parsable by moment.js.
   * @returns The difference in minutes as a number, or `null` if the input is invalid.
   */
  static compareWithNow(time: Date | string): number | null {
    if (!time) return null; // handle undefined or empty string

    const target = moment(time);
    if (!target.isValid()) {
      return null;
    }

    const now = moment();
    // positive = time A already passed
    // negative = time A is in the future
    const diffMinutes = now.diff(target, 'minutes');

    return diffMinutes;
  }

  /**
   * Combines separate date and time strings into a formatted datetime string.
   *
   * @param date The date string in 'YYYYMMDD' format (e.g., "20251104").
   * @param time Optional time string in 'HHmmss' format (e.g., "104020"). If not provided, defaults to "000000".
   * @returns A formatted datetime string in 'YYYY-MM-DD HH:mm:ss' format (e.g., "2025-11-04 10:40:20").
   * @throws Error if date or time is invalid.
   */
  static formatFromDateTimeSAP(date: string, time?: string): Date {
    if (!date) {
      throw new Error('Date is required');
    }

    // Parse date: YYYYMMDD -> YYYY-MM-DD
    const year = date.substring(0, 4);
    const month = date.substring(4, 6);
    const day = date.substring(6, 8);

    // Parse time: HHmmss -> HH:mm:ss (default to 00:00:00 if not provided)
    const timeValue = time || '000000';
    const hours = timeValue.substring(0, 2);
    const minutes = timeValue.substring(2, 4);
    const seconds = timeValue.substring(4, 6);

    const dateTimeString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    const m = moment(dateTimeString, 'YYYY-MM-DD HH:mm:ss', true);

    if (!m.isValid()) {
      throw new Error(
        `Invalid date or time format: date="${date}", time="${time}"`,
      );
    }

    return m.toDate();
  }

  /**
   * Normalizes a date to midnight (00:00:00).
   * Useful when you want to store only the date part without time,
   * and the time (hour) is stored separately.
   *
   * @param date The date to normalize (Date, string, or moment input)
   * @returns A Date object with time set to 00:00:00
   * @throws Error if date is invalid
   */
  static toMidnight(date: Date | string): Date {
    const m = moment(date).startOf('day');

    if (!m.isValid()) {
      throw new Error(`Invalid date value: ${date}`);
    }

    return m.toDate();
  }

  /**
   * Combines a date and time into a single Date object.
   * @param date The date (Date, string, or moment input)
   * @param time The time in 'HH:mm' format (e.g., '14:30') or a Date object
   * @returns A Date object with the combined date and time
   * @throws Error if date or time is invalid
   */
  static combineDateTime(date: Date | string, time: Date | string): Date {
    const dateMoment = moment(date).startOf('day');

    if (!dateMoment.isValid()) {
      throw new Error(`Invalid date value: ${date}`);
    }

    // If time is a Date object, extract hours and minutes
    if (time instanceof Date) {
      const hours = time.getUTCHours();
      const minutes = time.getUTCMinutes();
      dateMoment.set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
    } else {
      // If time is a string in 'HH:mm' format
      const [hours, minutes] = time.split(':').map(Number);
      if (isNaN(hours) || isNaN(minutes)) {
        throw new Error(`Invalid time format: ${time}. Expected 'HH:mm'`);
      }
      dateMoment.set({
        hour: hours,
        minute: minutes,
        second: 0,
        millisecond: 0,
      });
    }

    return dateMoment.toDate();
  }

  static startOfDay(d: Date): Date {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  }

  static toISODate(d: Date): string {
    const x = this.startOfDay(d);
    const y = x.getFullYear();
    const m = String(x.getMonth() + 1).padStart(2, '0');
    const day = String(x.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}
