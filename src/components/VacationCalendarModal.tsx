import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Sun,
  Palmtree,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  PlusCircle,
  MapPin,
  Sparkles,
  Info,
  Layers,
  CalendarRange,
} from "lucide-react";
import {
  VacationZone,
  ACADEMIES_BY_ZONE,
  getVacationPeriodsForYear,
  getDaysCount,
  formatFrenchDate,
  PUBLIC_HOLIDAYS_BY_YEAR,
} from "../data/vacations";

interface VacationCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentYear: number;
  onAddVacationToLeaves: (
    startDate: string,
    endDate: string,
    title: string
  ) => void;
  highlightZone: VacationZone;
  onSelectHighlightZone: (zone: VacationZone) => void;
  showSchoolHolidaysOnGrid: boolean;
  onToggleSchoolHolidaysOnGrid: (enabled: boolean) => void;
}

export const VacationCalendarModal: React.FC<VacationCalendarModalProps> = ({
  isOpen,
  onClose,
  currentYear,
  onAddVacationToLeaves,
  highlightZone,
  onSelectHighlightZone,
  showSchoolHolidaysOnGrid,
  onToggleSchoolHolidaysOnGrid,
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(currentYear || 2026);
  const [activeZone, setActiveZone] = useState<VacationZone>(highlightZone || "zoneA");
  const [activeTab, setActiveTab] = useState<"scolaire" | "feries">("scolaire");
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  if (!isOpen) return null;

  const vacationPeriods = getVacationPeriodsForYear(selectedYear, activeZone);
  const publicHolidays = PUBLIC_HOLIDAYS_BY_YEAR[selectedYear] || [];
  const academyInfo = ACADEMIES_BY_ZONE[activeZone];

  const handleAddPeriod = (
    id: string,
    startDate: string,
    endDate: string,
    title: string
  ) => {
    onAddVacationToLeaves(startDate, endDate, title);
    setAddedIds((prev) => ({ ...prev, [id]: true }));
  };

  const getStatusBadge = (startDate: string, endDate: string) => {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (todayStr >= startDate && todayStr <= endDate) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
          En cours
        </span>
      );
    } else if (todayStr < startDate) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
          À venir
        </span>
      );
    } else {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
          Passé
        </span>
      );
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="glass-modal w-full max-w-3xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between border-b border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 text-white shrink-0">
                <Sun className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Calendrier des Vacances
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">
                    {selectedYear}
                  </span>
                </h2>
                <p className="text-xs text-amber-100">
                  Vacances scolaires officielles & Jours fériés en France
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-amber-100 hover:text-white"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Bar: Year Nav, Tab & Zone Switcher */}
          <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Year Navigation */}
            <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm shrink-0 self-start sm:self-auto">
              <button
                onClick={() => setSelectedYear((y) => Math.max(2024, y - 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Année précédente"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-extrabold text-slate-800 px-3 text-sm font-mono">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((y) => Math.min(2028, y + 1))}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                title="Année suivante"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Type Switcher: Vacances vs Fériés */}
            <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setActiveTab("scolaire")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "scolaire"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <CalendarRange className="w-3.5 h-3.5 text-amber-600" />
                Vacances Scolaires
              </button>
              <button
                onClick={() => setActiveTab("feries")}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === "feries"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                Jours Fériés ({publicHolidays.length})
              </button>
            </div>
          </div>

          {/* Zone Selector for School Holidays */}
          {activeTab === "scolaire" && (
            <div className="px-4 py-3 bg-white border-b border-slate-100 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  Sélectionner votre Zone :
                </span>

                <div className="flex items-center gap-1.5">
                  {(["zoneA", "zoneB", "zoneC"] as VacationZone[]).map((z) => {
                    const isSel = activeZone === z;
                    return (
                      <button
                        key={z}
                        onClick={() => {
                          setActiveZone(z);
                          onSelectHighlightZone(z);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition-all active:scale-95 ${
                          isSel
                            ? "bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200"
                        }`}
                      >
                        {ACADEMIES_BY_ZONE[z].name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Academies info banner */}
              <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong className="font-bold">{academyInfo.name} :</strong>{" "}
                  {academyInfo.label}
                </p>
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-3">
            {activeTab === "scolaire" ? (
              vacationPeriods.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {vacationPeriods.map((period) => {
                    const durationDays = getDaysCount(
                      period.startDate,
                      period.endDate
                    );
                    const isAdded = addedIds[period.id];

                    return (
                      <div
                        key={period.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-300 hover:shadow-md transition-all flex flex-col justify-between gap-3 group relative overflow-hidden"
                      >
                        {/* Top info */}
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-2xl p-2 bg-slate-50 rounded-xl border border-slate-100 group-hover:scale-110 transition-transform">
                                {period.icon}
                              </span>
                              <div>
                                <h3 className="font-bold text-slate-800 text-sm sm:text-base leading-snug">
                                  {period.name}
                                </h3>
                                <p className="text-xs text-slate-500 font-medium">
                                  {durationDays} jours consécutifs
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(period.startDate, period.endDate)}
                          </div>

                          {/* Date details */}
                          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs font-semibold text-slate-700 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-amber-600" />
                              {formatFrenchDate(period.startDate)} —{" "}
                              {formatFrenchDate(period.endDate)}
                            </span>
                          </div>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() =>
                            handleAddPeriod(
                              period.id,
                              period.startDate,
                              period.endDate,
                              period.name
                            )
                          }
                          disabled={isAdded}
                          className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 border active:scale-95 ${
                            isAdded
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-[#A10684] hover:bg-[#83046b] text-white border-transparent shadow-sm"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              Congés enregistrés !
                            </>
                          ) : (
                            <>
                              <Palmtree className="w-4 h-4" />
                              Inscrire dans Mes Congés
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-2">
                  <Sun className="w-12 h-12 text-slate-300 mx-auto" />
                  <p className="text-slate-500 font-medium text-sm">
                    Aucune période enregistrée pour cette année ({selectedYear}).
                  </p>
                </div>
              )
            ) : (
              /* Public Holidays Tab */
              <div className="space-y-3">
                <div className="p-3 bg-violet-50 border border-violet-200 rounded-xl text-xs text-violet-900 flex items-center justify-between gap-2">
                  <span className="font-semibold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-violet-600" />
                    Jours Fériés de l'année {selectedYear} en France
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-violet-200/80 text-violet-900">
                    11 jours légaux
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {publicHolidays.map((holiday) => {
                    const holidayId = `holiday-${holiday.date}`;
                    const isAdded = addedIds[holidayId];

                    return (
                      <div
                        key={holiday.date}
                        className="p-3 bg-white rounded-xl border border-slate-200 hover:border-violet-300 transition-all flex flex-col justify-between gap-2"
                      >
                        <div>
                          <div className="font-bold text-slate-800 text-sm">
                            {holiday.name}
                          </div>
                          <div className="text-xs text-slate-500 font-mono mt-0.5">
                            {formatFrenchDate(holiday.date)}
                          </div>
                        </div>

                        <button
                          onClick={() =>
                            handleAddPeriod(
                              holidayId,
                              holiday.date,
                              holiday.date,
                              `Férié - ${holiday.name}`
                            )
                          }
                          disabled={isAdded}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border active:scale-95 ${
                            isAdded
                              ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                              : "bg-slate-100 hover:bg-violet-50 hover:text-violet-900 text-slate-700 border-slate-200"
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              Ajouté !
                            </>
                          ) : (
                            <>
                              <PlusCircle className="w-3.5 h-3.5 text-violet-600" />
                              Inscrire en congé
                            </>
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Footer Grid Highlight Toggle */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-700">
            <label className="flex items-center gap-2.5 cursor-pointer font-medium select-none">
              <input
                type="checkbox"
                checked={showSchoolHolidaysOnGrid}
                onChange={(e) => onToggleSchoolHolidaysOnGrid(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
              />
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                Afficher le témoin vacances ({ACADEMIES_BY_ZONE[activeZone].name}) sur le calendrier principal
              </span>
            </label>

            <button
              onClick={onClose}
              className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shrink-0 shadow-sm text-xs"
            >
              Fermer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
