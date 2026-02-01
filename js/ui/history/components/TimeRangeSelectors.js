/**
 * TimeRangeSelectors.js
 * Granularitäts-spezifische UI-Komponenten für Zeitraum-Auswahl
 *
 * - Stunden: Scrollrad/Time Picker
 * - Tage: Mini-Kalender
 * - Wochen: Kalender mit Wochen-Hervorhebung
 * - Monate: 12-Monats-Grid
 * - Jahre: Scrollrad mit Jahren
 * - Jahrzehnte: Liste
 * - Jahrhunderte: Liste
 */

(function (global) {
  "use strict";

  /**
   * Render Hour Picker (Scrollrad-Style)
   */
  function renderHourPicker(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    const TRS = window.TimeRangeSystem;
    if (!TRS) return "";

    const now = new Date();
    const hours = [];

    // Verwende availableDataRange falls vorhanden, sonst letzte 48 Stunden
    const startLimit = availableDataRange?.startDate
      ? new Date(availableDataRange.startDate)
      : new Date(now.getTime() - 48 * 3600000);
    const endLimit = availableDataRange?.endDate
      ? new Date(availableDataRange.endDate)
      : now;

    // Generiere Stunden-Liste innerhalb verfügbarer Daten (max 48 Stunden)
    const hoursDiff = Math.min(
      48,
      Math.floor((endLimit - startLimit) / 3600000),
    );
    for (let i = 0; i < hoursDiff; i++) {
      const date = new Date(endLimit);
      date.setHours(date.getHours() - i);
      if (date >= startLimit) {
        hours.push(date);
      }
    }

    return `
      <div class="time-picker time-picker--hour">
        <div class="time-picker__container">
          ${hours
            .map((date, i) => {
              const hourLabel = date.toLocaleTimeString("de-DE", {
                hour: "2-digit",
                minute: "2-digit",
              });
              const dayLabel = date.toLocaleDateString("de-DE", {
                day: "2-digit",
                month: "short",
              });
              const isActive = i === 0;

              return `
              <button class="time-picker__item ${isActive ? "time-picker__item--active" : ""}"
                      data-period-id="hour-${i}"
                      data-period-type="${periodType}"
                      data-start-date="${date.toISOString()}"
                      data-end-date="${new Date(date.getTime() + 3600000).toISOString()}"
                      data-granularity="hour">
                <span class="time-picker__time">${hourLabel}</span>
                <span class="time-picker__date">${dayLabel}</span>
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render Day Calendar (Mini-Kalender)
   */
  function renderDayCalendar(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    // Bestimme aktuellen Monat basierend auf verfügbaren Daten oder jetzt
    // Verwende currentViewDate falls vorhanden (für Navigation)
    const viewDate = availableDataRange?.currentViewDate
      ? new Date(availableDataRange.currentViewDate)
      : availableDataRange?.endDate
        ? new Date(availableDataRange.endDate)
        : new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mo=0, So=6

    const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const monthName = viewDate.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });

    // Aktuell ausgewählten Tag bestimmen
    const selectedPeriodData = availableDataRange?.currentPeriodData;
    const selectedStartDate = selectedPeriodData?.startDate
      ? new Date(selectedPeriodData.startDate)
      : null;

    const calendar = [];

    // Hilfsfunktion für API-Datumsformat (YYYY-MM-DD)
    const formatDateForAPI = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    // Padding für erste Woche
    for (let i = 0; i < startDayOfWeek; i++) {
      calendar.push(null);
    }

    // Tage des Monats
    for (let day = 1; day <= daysInMonth; day++) {
      calendar.push(day);
    }

    return `
      <div class="day-calendar">
        <div class="day-calendar__header">
          <button class="day-calendar__nav" data-action="prev-month">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h4 class="day-calendar__title">${monthName}</h4>
          <button class="day-calendar__nav" data-action="next-month">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div class="day-calendar__weekdays">
          ${weekDays.map((d) => `<div class="day-calendar__weekday">${d}</div>`).join("")}
        </div>

        <div class="day-calendar__grid">
          ${calendar
            .map((day, index) => {
              if (day === null) {
                return `<div class="day-calendar__cell day-calendar__cell--empty"></div>`;
              }

              const date = new Date(year, month, day);
              const today = new Date();
              const isToday =
                day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();

              // Prüfe ob dieser Tag ausgewählt ist
              const isSelected =
                selectedStartDate &&
                day === selectedStartDate.getDate() &&
                month === selectedStartDate.getMonth() &&
                year === selectedStartDate.getFullYear();

              // Prüfe ob Datum verfügbar ist (1940-01-01 bis heute)
              const minDate = new Date(1940, 0, 1);
              const isAvailable = date >= minDate && date <= today;

              const endDate = new Date(date);
              endDate.setHours(23, 59, 59, 999);

              return `
              <button class="day-calendar__cell ${isToday ? "day-calendar__cell--today" : ""} ${isSelected ? "day-calendar__cell--selected" : ""}"
                      data-period-id="day-${year}-${month + 1}-${day}"
                      data-period-type="${periodType}"
                      data-start-date="${formatDateForAPI(date)}"
                      data-end-date="${formatDateForAPI(endDate)}"
                      data-granularity="day"
                      ${!isAvailable ? "disabled" : ""}>
                <span class="day-calendar__number">${day}</span>
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render Week Calendar (Kalender mit Wochen-Hervorhebung)
   */
  function renderWeekCalendar(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    const TRS = window.TimeRangeSystem;
    if (!TRS) return "";

    // Verwende verfügbare Daten-Range oder aktuelles Datum
    // Verwende currentViewDate falls vorhanden (für Navigation)
    const viewDate = availableDataRange?.currentViewDate
      ? new Date(availableDataRange.currentViewDate)
      : availableDataRange?.endDate
        ? new Date(availableDataRange.endDate)
        : new Date();
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const weekDays = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
    const monthName = viewDate.toLocaleDateString("de-DE", {
      month: "long",
      year: "numeric",
    });

    // Aktuell ausgewählte Woche bestimmen
    const selectedPeriodData = availableDataRange?.currentPeriodData;
    const selectedWeekNumber = selectedPeriodData?.startDate
      ? TRS.getWeekNumber(new Date(selectedPeriodData.startDate))
      : null;
    const selectedYear = selectedPeriodData?.startDate
      ? new Date(selectedPeriodData.startDate).getFullYear()
      : null;

    // Gruppiere Tage nach Wochen
    const weeks = [];
    let currentWeek = [];

    // Padding
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      currentWeek.push(day);
      if (currentWeek.length === 7) {
        weeks.push([...currentWeek]);
        currentWeek = [];
      }
    }

    // Rest auffüllen
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null);
      }
      weeks.push(currentWeek);
    }

    return `
      <div class="week-calendar">
        <div class="week-calendar__header">
          <button class="week-calendar__nav" data-action="prev-month">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h4 class="week-calendar__title">${monthName}</h4>
          <button class="week-calendar__nav" data-action="next-month">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div class="week-calendar__weekdays">
          ${weekDays.map((d) => `<div class="week-calendar__weekday">${d}</div>`).join("")}
        </div>

        <div class="week-calendar__weeks">
          ${weeks
            .map((week, weekIndex) => {
              const firstDayOfWeek = week.find((d) => d !== null);
              if (!firstDayOfWeek) return "";

              const weekDate = new Date(year, month, firstDayOfWeek);
              const weekNumber = TRS.getWeekNumber(weekDate);
              const weekStart = new Date(weekDate);
              weekStart.setDate(
                weekStart.getDate() -
                  weekStart.getDay() +
                  (weekStart.getDay() === 0 ? -6 : 1),
              );
              const weekEnd = new Date(weekStart);
              weekEnd.setDate(weekEnd.getDate() + 6);
              weekEnd.setHours(23, 59, 59, 999);

              const today = new Date();

              // Prüfe ob diese Woche ausgewählt ist
              const isSelected =
                selectedWeekNumber === weekNumber && selectedYear === year;

              // Prüfe ob Woche verfügbar ist (1940 bis heute)
              const minDate = new Date(1940, 0, 1);
              const isAvailable = weekStart >= minDate && weekStart <= today;

              // Hilfsfunktion für API-Datumsformat (YYYY-MM-DD)
              const formatDateForAPI = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              };

              return `
              <div class="week-calendar__week ${isSelected ? "week-calendar__week--selected" : ""}"
                   data-period-id="week-${weekNumber}-${year}"
                   data-period-type="${periodType}"
                   data-start-date="${formatDateForAPI(weekStart)}"
                   data-end-date="${formatDateForAPI(weekEnd)}"
                   data-granularity="week"
                   ${!isAvailable ? 'style="opacity: 0.5; pointer-events: none;"' : ""}>
                <div class="week-calendar__week-number">KW ${weekNumber}</div>
                <div class="week-calendar__days">
                  ${week
                    .map((day) => {
                      if (day === null)
                        return `<div class="week-calendar__day week-calendar__day--empty"></div>`;
                      const isToday =
                        day === today.getDate() &&
                        month === today.getMonth() &&
                        year === today.getFullYear();
                      return `<div class="week-calendar__day ${isToday ? "week-calendar__day--today" : ""}">${day}</div>`;
                    })
                    .join("")}
                </div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render Month Grid (12 Monate)
   */
  function renderMonthGrid(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    // Verwende letztes verfügbares Jahr oder aktuelles Jahr
    // Verwende currentViewDate falls vorhanden (für Navigation)
    const viewDate = availableDataRange?.currentViewDate
      ? new Date(availableDataRange.currentViewDate)
      : availableDataRange?.endDate
        ? new Date(availableDataRange.endDate)
        : new Date();
    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    // Aktuell ausgewählten Monat bestimmen
    const selectedPeriodData = availableDataRange?.currentPeriodData;
    const selectedStartDate = selectedPeriodData?.startDate
      ? new Date(selectedPeriodData.startDate)
      : null;

    const months = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ];

    return `
      <div class="month-grid">
        <div class="month-grid__year-selector">
          <button class="month-grid__nav" data-action="prev-year">
            <span class="material-symbols-outlined">chevron_left</span>
          </button>
          <h4 class="month-grid__year" data-year="${currentYear}">${currentYear}</h4>
          <button class="month-grid__nav" data-action="next-year">
            <span class="material-symbols-outlined">chevron_right</span>
          </button>
        </div>

        <div class="month-grid__container">
          ${months
            .map((monthName, index) => {
              const isCurrent =
                index === currentMonth &&
                currentYear === new Date().getFullYear();

              // Prüfe ob dieser Monat aktuell ausgewählt ist
              const isSelected =
                selectedStartDate &&
                index === selectedStartDate.getMonth() &&
                currentYear === selectedStartDate.getFullYear();

              const monthStart = new Date(currentYear, index, 1);
              const monthEnd = new Date(
                currentYear,
                index + 1,
                0,
                23,
                59,
                59,
                999,
              );

              // Prüfe ob Monat verfügbar ist (1940-01-01 bis heute)
              const today = new Date();
              const minDate = new Date(1940, 0, 1);
              const isAvailable = monthStart >= minDate && monthStart <= today;

              // Formatiere Datums für API (nur YYYY-MM-DD, keine Zeitzone)
              const formatDateForAPI = (date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, "0");
                const day = String(date.getDate()).padStart(2, "0");
                return `${year}-${month}-${day}`;
              };

              return `
              <button class="month-grid__item ${isCurrent ? "month-grid__item--current" : ""} ${isSelected ? "month-grid__item--selected" : ""}"
                      data-period-id="month-${currentYear}-${index + 1}"
                      data-period-type="${periodType}"
                      data-start-date="${formatDateForAPI(monthStart)}"
                      data-end-date="${formatDateForAPI(monthEnd)}"
                      data-granularity="month"
                      ${!isAvailable ? "disabled" : ""}>
                <span class="month-grid__name">${monthName}</span>
                <span class="month-grid__number">${index + 1}</span>
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render Year Picker (Scrollrad mit Jahren)
   */
  function renderYearPicker(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    const currentYear = new Date().getFullYear();
    const years = [];

    // Bestimme Jahr-Range basierend auf verfügbaren Daten
    // Open-Meteo Archive API hat Daten ab 1940
    const startYear = availableDataRange?.startDate
      ? new Date(availableDataRange.startDate).getFullYear()
      : 1940;
    const endYear = availableDataRange?.endDate
      ? new Date(availableDataRange.endDate).getFullYear()
      : currentYear;

    // Generiere Jahr-Liste von endYear bis startYear
    for (let y = endYear; y >= startYear; y--) {
      years.push(y);
    }

    // Aktuell ausgewähltes Jahr bestimmen
    const selectedPeriodData = availableDataRange?.currentPeriodData;
    const selectedYear = selectedPeriodData?.startDate
      ? new Date(selectedPeriodData.startDate).getFullYear()
      : null;

    // Hilfsfunktion für API-Datumsformat (YYYY-MM-DD)
    const formatDateForAPI = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return `
      <div class="year-picker">
        <div class="year-picker__container">
          ${years
            .map((year, index) => {
              const isCurrent = year === currentYear;
              const isSelected = year === selectedYear;
              const yearStart = new Date(year, 0, 1);
              const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

              return `
              <button class="year-picker__item ${isCurrent ? "year-picker__item--current" : ""} ${isSelected ? "year-picker__item--selected" : ""}"
                      data-period-id="year-${year}"
                      data-period-type="${periodType}"
                      data-start-date="${formatDateForAPI(yearStart)}"
                      data-end-date="${formatDateForAPI(yearEnd)}"
                      data-granularity="year">
                ${year}
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render Decade List
   */
  function renderDecadeList(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    const currentYear = new Date().getFullYear();
    const currentDecade = Math.floor(currentYear / 10) * 10;
    const decades = [];

    // Verfügbarer Bereich: 1940er bis aktuelles Jahrzehnt
    const startYear = 1940;
    const endYear = currentYear;
    const startDecade = Math.floor(startYear / 10) * 10;
    const endDecade = Math.floor(endYear / 10) * 10;

    // Generiere Jahrzehnte
    for (let decade = endDecade; decade >= startDecade; decade -= 10) {
      decades.push(decade);
    }

    // Aktuell ausgewähltes Jahrzehnt bestimmen
    const selectedPeriodData = availableDataRange?.currentPeriodData;
    const selectedDecade = selectedPeriodData?.startDate
      ? Math.floor(new Date(selectedPeriodData.startDate).getFullYear() / 10) *
        10
      : null;

    // Hilfsfunktion für API-Datumsformat (YYYY-MM-DD)
    const formatDateForAPI = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return `
      <div class="decade-list">
        <h4 class="decade-list__title">Jahrzehnte auswählen</h4>
        <div class="decade-list__container">
          ${decades
            .map((decade) => {
              const isCurrent = decade === currentDecade;
              const isSelected = decade === selectedDecade;
              const decadeStart = new Date(decade, 0, 1);
              const decadeEnd = new Date(decade + 9, 11, 31, 23, 59, 59, 999);

              return `
              <button class="decade-list__item ${isCurrent ? "decade-list__item--current" : ""} ${isSelected ? "decade-list__item--selected" : ""}"
                      data-period-id="decade-${decade}"
                      data-period-type="${periodType}"
                      data-start-date="${formatDateForAPI(decadeStart)}"
                      data-end-date="${formatDateForAPI(decadeEnd)}"
                      data-granularity="decade">
                <span class="decade-list__label">${decade}er</span>
                <span class="decade-list__range">${decade} - ${decade + 9}</span>
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Render Century List
   */
  function renderCenturyList(
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    const currentYear = new Date().getFullYear();
    const currentCentury = Math.floor(currentYear / 100) * 100;
    const centuries = [];

    // Verfügbarer Bereich: 1900 (beinhaltet 1940) bis aktuelles Jahrhundert
    const startCentury = 1900;
    const endCentury = currentCentury;

    // Generiere Jahrhunderte
    for (let century = endCentury; century >= startCentury; century -= 100) {
      centuries.push(century);
    }

    // Aktuell ausgewähltes Jahrhundert bestimmen
    const selectedPeriodData = availableDataRange?.currentPeriodData;
    const selectedCentury = selectedPeriodData?.startDate
      ? Math.floor(new Date(selectedPeriodData.startDate).getFullYear() / 100) *
        100
      : null;

    // Hilfsfunktion für API-Datumsformat (YYYY-MM-DD)
    const formatDateForAPI = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    return `
      <div class="century-list">
        <h4 class="century-list__title">Jahrhunderte auswählen</h4>
        <div class="century-list__container">
          ${centuries
            .map((century) => {
              const isCurrent = century === currentCentury;
              const isSelected = century === selectedCentury;
              const centuryStart = new Date(century, 0, 1);
              const centuryEnd = new Date(
                century + 99,
                11,
                31,
                23,
                59,
                59,
                999,
              );
              const centuryLabel = `${century + 1}. Jahrhundert`;

              return `
              <button class="century-list__item ${isCurrent ? "century-list__item--current" : ""} ${isSelected ? "century-list__item--selected" : ""}"
                      data-period-id="century-${century}"
                      data-period-type="${periodType}"
                      data-start-date="${formatDateForAPI(centuryStart)}"
                      data-end-date="${formatDateForAPI(centuryEnd)}"
                      data-granularity="century">
                <span class="century-list__label">${centuryLabel}</span>
                <span class="century-list__range">${century} - ${century + 99}</span>
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  /**
   * Get selector for granularity
   * @param {string} granularity - hour/day/week/month/year/decade/century
   * @param {string} currentPeriod - Currently selected period ID
   * @param {string} periodType - 'A' or 'B'
   * @param {Object} availableDataRange - {startDate: 'YYYY-MM-DD', endDate: 'YYYY-MM-DD'}
   */
  function getSelectorForGranularity(
    granularity,
    currentPeriod,
    periodType,
    availableDataRange = null,
  ) {
    switch (granularity) {
      case "hour":
        return renderHourPicker(currentPeriod, periodType, availableDataRange);
      case "day":
        return renderDayCalendar(currentPeriod, periodType, availableDataRange);
      case "week":
        return renderWeekCalendar(
          currentPeriod,
          periodType,
          availableDataRange,
        );
      case "month":
        return renderMonthGrid(currentPeriod, periodType, availableDataRange);
      case "year":
        return renderYearPicker(currentPeriod, periodType, availableDataRange);
      case "decade":
        return renderDecadeList(currentPeriod, periodType, availableDataRange);
      case "century":
        return renderCenturyList(currentPeriod, periodType, availableDataRange);
      default:
        return "";
    }
  }

  // Export
  global.TimeRangeSelectors = {
    renderHourPicker,
    renderDayCalendar,
    renderWeekCalendar,
    renderMonthGrid,
    renderYearPicker,
    renderDecadeList,
    renderCenturyList,
    getSelectorForGranularity,
  };
})(typeof window !== "undefined" ? window : this);
