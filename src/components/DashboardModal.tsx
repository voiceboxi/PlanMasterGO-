import React, { useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, BarChart3, PieChart, Info, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from "recharts";

type DayState = "work" | "rest" | "rest1" | "training" | "holiday" | "sick" | "none" | "6thday" | "children";

interface DashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  year: number;
  getDayState: (date: Date) => DayState;
}

export const DashboardModal: React.FC<DashboardModalProps> = ({
  isOpen,
  onClose,
  year,
  getDayState,
}) => {
  const stats = useMemo(() => {
    let work = 0;
    let rest = 0;
    let sick = 0;
    let holiday = 0;
    let training = 0;
    let other = 0;

    const startYear = new Date(year, 0, 1);
    const endYear = new Date(year, 11, 31);

    for (let d = new Date(startYear); d <= endYear; d.setDate(d.getDate() + 1)) {
      const state = getDayState(d);
      if (state === "work" || state === "6thday") work++;
      else if (state === "rest" || state === "rest1") rest++;
      else if (state === "sick" || state === "children") sick++;
      else if (state === "holiday") holiday++;
      else if (state === "training") training++;
      else other++;
    }

    return { work, rest, sick, holiday, training, other };
  }, [year, getDayState]);

  const totalDays = Object.values(stats).reduce((a: number, b: number) => a + b, 0);

  const pieData = [
    { name: "Travail", value: stats.work, color: "#fde047" },
    { name: "Repos", value: stats.rest, color: "#10a37f" },
    { name: "Maladie", value: stats.sick, color: "#94a3b8" },
    { name: "Congés", value: stats.holiday, color: "#A10684" },
    { name: "Formation", value: stats.training, color: "#E1712B" },
  ].filter(d => d.value > 0);

  const barData = [
    {
      name: "Répartition",
      Travail: stats.work,
      Repos: stats.rest,
      Maladie: stats.sick,
      Congés: stats.holiday,
      Formation: stats.training,
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="glass-modal w-full max-w-4xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Tableau de Bord
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-white/20 border border-white/30 text-white">
                    {year}
                  </span>
                </h2>
                <p className="text-xs text-slate-300">
                  Statistiques annuelles de présence et d'absences
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors text-slate-300 hover:text-white"
              title="Fermer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-50">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Travail</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.work}</div>
                </div>
              </div>
              
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Repos</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.rest}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-fuchsia-100 text-fuchsia-700 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Congés</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.holiday}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-slate-200 text-slate-600 rounded-xl">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase">Maladie</div>
                  <div className="text-xl sm:text-2xl font-bold text-slate-800">{stats.sick}</div>
                </div>
              </div>
            </div>

            {/* Charts Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Pie Chart */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <PieChart className="w-4 h-4 text-indigo-500" />
                  Répartition {year}
                </h3>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={90}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number) => [`${value} jours`, 'Total']}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend verticalAlign="bottom" height={36} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stacked Bar Chart */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <BarChart3 className="w-4 h-4 text-emerald-500" />
                  Total Jours {year}
                </h3>
                <div className="h-64 sm:h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b'}} />
                      <Tooltip 
                        cursor={{fill: 'transparent'}}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Legend />
                      <Bar dataKey="Travail" stackId="a" fill="#fde047" radius={[0,0,4,4]} />
                      <Bar dataKey="Repos" stackId="a" fill="#10a37f" />
                      <Bar dataKey="Formation" stackId="a" fill="#E1712B" />
                      <Bar dataKey="Congés" stackId="a" fill="#A10684" />
                      <Bar dataKey="Maladie" stackId="a" fill="#94a3b8" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            <div className="mt-6 p-4 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-start gap-2 border border-slate-200">
              <Info className="w-4 h-4 text-slate-400 shrink-0" />
              <p>
                Ce tableau de bord se base sur l'année sélectionnée ({year}). Il comptabilise l'ensemble des jours, incluant les modifications manuelles et les cycles automatiques, pour un total de {totalDays} jours.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
