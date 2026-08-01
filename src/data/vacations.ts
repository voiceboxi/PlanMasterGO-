export type VacationZone = "zoneA" | "zoneB" | "zoneC";

export interface VacationPeriod {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  zones: VacationZone[];
  year: number;
  icon: string;
  color: string; // Tailwind color theme
}

export interface PublicHoliday {
  date: string; // YYYY-MM-DD
  name: string;
}

export const ACADEMIES_BY_ZONE = {
  zoneA: {
    name: "Zone A",
    label: "Besançon, Bordeaux, Clermont-Ferrand, Dijon, Grenoble, Limoges, Lyon, Poitiers",
    badgeColor: "bg-amber-100 text-amber-900 border-amber-300",
  },
  zoneB: {
    name: "Zone B",
    label: "Aix-Marseille, Amiens, Caen, Lille, Nancy-Metz, Nantes, Nice, Orléans-Tours, Reims, Rennes, Rouen, Strasbourg",
    badgeColor: "bg-sky-100 text-sky-900 border-sky-300",
  },
  zoneC: {
    name: "Zone C",
    label: "Créteil, Montpellier, Paris, Toulouse, Versailles",
    badgeColor: "bg-emerald-100 text-emerald-900 border-emerald-300",
  },
};

export const SCHOOL_HOLIDAYS: VacationPeriod[] = [
  // --- 2025 ---
  {
    id: "toussaint-2024-2025",
    name: "Vacances de la Toussaint",
    startDate: "2024-10-19",
    endDate: "2024-11-03",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2025,
    icon: "🍂",
    color: "amber",
  },
  {
    id: "noel-2024-2025",
    name: "Vacances de Noël",
    startDate: "2024-12-21",
    endDate: "2025-01-05",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2025,
    icon: "🎄",
    color: "rose",
  },
  // Hiver 2025
  {
    id: "hiver-2025-a",
    name: "Vacances d'Hiver - Zone A",
    startDate: "2025-02-22",
    endDate: "2025-03-09",
    zones: ["zoneA"],
    year: 2025,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "hiver-2025-b",
    name: "Vacances d'Hiver - Zone B",
    startDate: "2025-02-08",
    endDate: "2025-02-23",
    zones: ["zoneB"],
    year: 2025,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "hiver-2025-c",
    name: "Vacances d'Hiver - Zone C",
    startDate: "2025-02-15",
    endDate: "2025-03-02",
    zones: ["zoneC"],
    year: 2025,
    icon: "⛷️",
    color: "cyan",
  },
  // Printemps 2025
  {
    id: "printemps-2025-a",
    name: "Vacances de Printemps - Zone A",
    startDate: "2025-04-19",
    endDate: "2025-05-04",
    zones: ["zoneA"],
    year: 2025,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "printemps-2025-b",
    name: "Vacances de Printemps - Zone B",
    startDate: "2025-04-05",
    endDate: "2025-04-21",
    zones: ["zoneB"],
    year: 2025,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "printemps-2025-c",
    name: "Vacances de Printemps - Zone C",
    startDate: "2025-04-12",
    endDate: "2025-04-27",
    zones: ["zoneC"],
    year: 2025,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "ascension-2025",
    name: "Pont de l'Ascension",
    startDate: "2025-05-28",
    endDate: "2025-06-01",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2025,
    icon: "🕊️",
    color: "violet",
  },
  {
    id: "ete-2025",
    name: "Vacances d'Été (Grandes Vacances)",
    startDate: "2025-07-05",
    endDate: "2025-09-01",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2025,
    icon: "☀️",
    color: "orange",
  },
  {
    id: "toussaint-2025",
    name: "Vacances de la Toussaint",
    startDate: "2025-10-18",
    endDate: "2025-11-02",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2025,
    icon: "🍂",
    color: "amber",
  },
  {
    id: "noel-2025",
    name: "Vacances de Noël",
    startDate: "2025-12-20",
    endDate: "2026-01-04",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2025,
    icon: "🎄",
    color: "rose",
  },

  // --- 2026 ---
  {
    id: "hiver-2026-a",
    name: "Vacances d'Hiver - Zone A",
    startDate: "2026-02-07",
    endDate: "2026-02-22",
    zones: ["zoneA"],
    year: 2026,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "hiver-2026-b",
    name: "Vacances d'Hiver - Zone B",
    startDate: "2026-02-14",
    endDate: "2026-03-01",
    zones: ["zoneB"],
    year: 2026,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "hiver-2026-c",
    name: "Vacances d'Hiver - Zone C",
    startDate: "2026-02-21",
    endDate: "2026-03-08",
    zones: ["zoneC"],
    year: 2026,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "printemps-2026-a",
    name: "Vacances de Printemps - Zone A",
    startDate: "2026-04-04",
    endDate: "2026-04-19",
    zones: ["zoneA"],
    year: 2026,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "printemps-2026-b",
    name: "Vacances de Printemps - Zone B",
    startDate: "2026-04-11",
    endDate: "2026-04-26",
    zones: ["zoneB"],
    year: 2026,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "printemps-2026-c",
    name: "Vacances de Printemps - Zone C",
    startDate: "2026-04-18",
    endDate: "2026-05-03",
    zones: ["zoneC"],
    year: 2026,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "ascension-2026",
    name: "Pont de l'Ascension",
    startDate: "2026-05-13",
    endDate: "2026-05-17",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2026,
    icon: "🕊️",
    color: "violet",
  },
  {
    id: "ete-2026",
    name: "Vacances d'Été (Grandes Vacances)",
    startDate: "2026-07-04",
    endDate: "2026-08-31",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2026,
    icon: "☀️",
    color: "orange",
  },
  {
    id: "toussaint-2026",
    name: "Vacances de la Toussaint",
    startDate: "2026-10-17",
    endDate: "2026-11-01",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2026,
    icon: "🍂",
    color: "amber",
  },
  {
    id: "noel-2026",
    name: "Vacances de Noël",
    startDate: "2026-12-19",
    endDate: "2027-01-03",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2026,
    icon: "🎄",
    color: "rose",
  },

  // --- 2027 ---
  {
    id: "hiver-2027-a",
    name: "Vacances d'Hiver - Zone A",
    startDate: "2027-02-20",
    endDate: "2027-03-07",
    zones: ["zoneA"],
    year: 2027,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "hiver-2027-b",
    name: "Vacances d'Hiver - Zone B",
    startDate: "2027-02-06",
    endDate: "2027-02-21",
    zones: ["zoneB"],
    year: 2027,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "hiver-2027-c",
    name: "Vacances d'Hiver - Zone C",
    startDate: "2027-02-13",
    endDate: "2027-02-28",
    zones: ["zoneC"],
    year: 2027,
    icon: "⛷️",
    color: "cyan",
  },
  {
    id: "printemps-2027-a",
    name: "Vacances de Printemps - Zone A",
    startDate: "2027-04-17",
    endDate: "2027-05-02",
    zones: ["zoneA"],
    year: 2027,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "printemps-2027-b",
    name: "Vacances de Printemps - Zone B",
    startDate: "2027-04-03",
    endDate: "2027-04-18",
    zones: ["zoneB"],
    year: 2027,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "printemps-2027-c",
    name: "Vacances de Printemps - Zone C",
    startDate: "2027-04-10",
    endDate: "2027-04-25",
    zones: ["zoneC"],
    year: 2027,
    icon: "🌸",
    color: "emerald",
  },
  {
    id: "ete-2027",
    name: "Vacances d'Été (Grandes Vacances)",
    startDate: "2027-07-03",
    endDate: "2027-08-31",
    zones: ["zoneA", "zoneB", "zoneC"],
    year: 2027,
    icon: "☀️",
    color: "orange",
  },
];

export const PUBLIC_HOLIDAYS_BY_YEAR: Record<number, PublicHoliday[]> = {
  2025: [
    { date: "2025-01-01", name: "Jour de l'An" },
    { date: "2025-04-21", name: "Lundi de Pâques" },
    { date: "2025-05-01", name: "Fête du Travail" },
    { date: "2025-05-08", name: "Victoire 1945" },
    { date: "2025-05-29", name: "Jeudi de l'Ascension" },
    { date: "2025-06-09", name: "Lundi de Pentecôte" },
    { date: "2025-07-14", name: "Fête Nationale" },
    { date: "2025-08-15", name: "Assomption" },
    { date: "2025-11-01", name: "Toussaint" },
    { date: "2025-11-11", name: "Armistice 1918" },
    { date: "2025-12-25", name: "Noël" },
  ],
  2026: [
    { date: "2026-01-01", name: "Jour de l'An" },
    { date: "2026-04-06", name: "Lundi de Pâques" },
    { date: "2026-05-01", name: "Fête du Travail" },
    { date: "2026-05-08", name: "Victoire 1945" },
    { date: "2026-05-14", name: "Jeudi de l'Ascension" },
    { date: "2026-05-25", name: "Lundi de Pentecôte" },
    { date: "2026-07-14", name: "Fête Nationale" },
    { date: "2026-08-15", name: "Assomption" },
    { date: "2026-11-01", name: "Toussaint" },
    { date: "2026-11-11", name: "Armistice 1918" },
    { date: "2026-12-25", name: "Noël" },
  ],
  2027: [
    { date: "2027-01-01", name: "Jour de l'An" },
    { date: "2027-03-29", name: "Lundi de Pâques" },
    { date: "2027-05-01", name: "Fête du Travail" },
    { date: "2027-05-06", name: "Jeudi de l'Ascension" },
    { date: "2027-05-08", name: "Victoire 1945" },
    { date: "2027-05-17", name: "Lundi de Pentecôte" },
    { date: "2027-07-14", name: "Fête Nationale" },
    { date: "2027-08-15", name: "Assomption" },
    { date: "2027-11-01", name: "Toussaint" },
    { date: "2027-11-11", name: "Armistice 1918" },
    { date: "2027-12-25", name: "Noël" },
  ],
};

/**
 * Returns the school holiday period matching a given YYYY-MM-DD date and zone, if any.
 */
export function getSchoolHolidayForDate(
  dateStr: string,
  zone: VacationZone
): VacationPeriod | null {
  for (const period of SCHOOL_HOLIDAYS) {
    if (period.zones.includes(zone)) {
      if (dateStr >= period.startDate && dateStr <= period.endDate) {
        return period;
      }
    }
  }
  return null;
}

/**
 * Get all holiday periods for a specific year and zone.
 */
export function getVacationPeriodsForYear(
  year: number,
  zone: VacationZone
): VacationPeriod[] {
  return SCHOOL_HOLIDAYS.filter(
    (p) =>
      p.zones.includes(zone) &&
      (p.year === year ||
        p.startDate.startsWith(String(year)) ||
        p.endDate.startsWith(String(year)))
  );
}

/**
 * Calculates number of calendar days between two YYYY-MM-DD dates (inclusive).
 */
export function getDaysCount(startDateStr: string, endDateStr: string): number {
  const start = new Date(startDateStr + "T00:00:00");
  const end = new Date(endDateStr + "T00:00:00");
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

/**
 * Formats YYYY-MM-DD to French readable date e.g. "19 oct. 2025"
 */
export function formatFrenchDate(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
