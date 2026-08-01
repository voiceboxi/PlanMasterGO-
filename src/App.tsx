import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Share2,
  FileText,
  Calendar as CalendarIcon,
  Download,
  CalendarDays,
  FileSpreadsheet,
  Printer,
  Mail,
  Link as LinkIcon,
  X,
  Check,
  Loader2,
  LayoutGrid,
  List,
  Bell,
  Coffee,
  ChevronDown,
  Settings,
  Settings2,
  Cloud,
  CloudOff,
  AlertCircle,
  CheckCircle2,
  Copy,
  Database,
  RefreshCw,
  Lock,
  Unlock,
  Shield,
  Smartphone,
  Phone,
  Clock,
  Calendar,
  Eye,
  Palmtree,
  Plus,
  Trash2,
  Filter,
  Plane,
  Globe,
  Server,
  Terminal,
  ExternalLink,
  Code2,
  User,
  ShieldCheck,
  EyeOff,
  LogOut,
  Zap,
  BellRing,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { toPng } from "html-to-image";
import { playRingtone } from "./lib/ringtone";
import { db, handleFirestoreError, OperationType } from "./lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";

// Custom Floppy Disk Logo SVG based on user image
const FloppyLogo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 18 C12 12 17 7 23 7 L65 7 L88 30 L88 82 C88 88 83 93 77 93 L23 93 C17 93 12 88 12 82 Z"
      fill="#050505"
      stroke="#f8fafc"
      strokeWidth="6"
      strokeLinejoin="round"
    />
    <path
      d="M26 7 L60 7 L60 33 C60 35 58 37 56 37 L30 37 C28 37 26 35 26 33 Z"
      fill="#4a7df2"
    />
    <rect x="50" y="14" width="6" height="14" rx="2" fill="#050505" />
    <rect x="25" y="52" width="50" height="34" rx="4" fill="#6dbdf6" />
    <rect x="30" y="58" width="40" height="4" rx="2" fill="#050505" />
    <rect x="30" y="67" width="40" height="4" rx="2" fill="#050505" />
    <rect x="30" y="76" width="22" height="4" rx="2" fill="#050505" />
  </svg>
);

// Define the 8-day cycle pattern to match the visual complexity
// We'll use a derived pattern setup that gives a realistic staggered look.
// Cycle: 5 work days, 3 rest days.
const CYCLE_PATTERN = [
  "work",
  "work",
  "work",
  "work",
  "work",
  "rest",
  "rest",
  "rest",
];

type DayState = "work" | "rest" | "rest1" | "training" | "holiday" | "sick" | "none" | "6thday" | "children";

interface CustomDayRecord {
  state: DayState;
  note: string;
  appointmentTime?: string;
  reminder?: {
    enabled: boolean;
    type: "in-app" | "email" | "sms";
    time: string;
    timing?: "7d" | "48h" | "24h" | "same-day";
    emailTo?: string;
    phoneTo?: string;
  };
}
type CustomOverrides = Record<string, CustomDayRecord>;

interface LegendItem {
  id: DayState;
  label: string;
  dotClass: string;
}

const LEGEND: LegendItem[] = [
  { id: "rest", label: "Repos", dotClass: "bg-[#10a37f]" },
  { id: "rest1", label: "Journée additionnelle", dotClass: "bg-[#C7CF00]" },
  { id: "work", label: "Travail", dotClass: "bg-[#fbbf24]" },
  { id: "training", label: "Formation", dotClass: "bg-[#E1712B]" },
  { id: "holiday", label: "Congés", dotClass: "bg-[#A10684]" },
  {
    id: "sick",
    label: "Maladie",
    dotClass: "bg-white border-2 border-gray-300",
  },
  {
    id: "none",
    label: "Aujourd'hui",
    dotClass: "bg-white border-2 border-red-500",
  },
];

const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

const REST_OPTIONS = [
  "Repos court",
  "Repos long",
  "Pause déjeuner",
  "Sieste",
  "Méditation",
  "Détente",
  "Respiration",
  "Micro-repos",
];

const RestButton: React.FC<{
  index: number;
  currentChoice: string;
  onSelect: (choice: string) => void;
}> = ({ index, currentChoice, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm w-full min-w-[140px] justify-between hover:scale-[1.02] active:scale-[0.98] ${
          currentChoice
            ? "bg-[#10a37f]/5 border-[#10a37f] text-[#10a37f] hover:bg-[#10a37f]/10"
            : "bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50"
        }`}
      >
        <div className="flex items-center gap-2">
          <Coffee className={`w-4 h-4 ${currentChoice ? "text-[#10a37f]" : "text-slate-400"}`} />
          <span>{currentChoice || `Repos ${index + 1}`}</span>
        </div>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          ></div>
          <div className="absolute top-full mt-2 left-0 w-full bg-white border border-slate-100 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {REST_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${
                  currentChoice === option
                    ? "text-[#10a37f] font-bold bg-[#10a37f]/5"
                    : "text-slate-600 font-medium"
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const CYCLE_BASE_DATE = new Date(2026, 4, 6); // Base date for cycle to start exactly with 5 working days from May 6

const getDateKey = (date: Date) => {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export default function App() {
  const [viewDate, setViewDate] = useState<Date>(new Date());
  type ViewMode = "annual" | "month";
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [annualSearchQuery, setAnnualSearchQuery] = useState<string>("");
  const year = viewDate.getFullYear();

  const [overrides, setOverrides] = useState<CustomOverrides>(() => {
    const saved = localStorage.getItem("planmastergo_overrides") || localStorage.getItem("webmastergo_overrides") || localStorage.getItem("planmaster_overrides");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return {};
  });

  const matchingSearchDaysCount = React.useMemo(() => {
    const query = annualSearchQuery.toLowerCase().trim();
    if (!query) return 0;
    let count = 0;
    (Object.entries(overrides) as [string, CustomDayRecord][]).forEach(([key, record]) => {
      if (record?.note && record.note.toLowerCase().includes(query)) {
        const parts = key.split("-");
        if (parts.length === 3 && Number(parts[0]) === year) {
          count++;
        }
      }
    });
    return count;
  }, [annualSearchQuery, overrides, year]);

  const isFirstMountOverrides = useRef(true);
  useEffect(() => {
    localStorage.setItem("planmastergo_overrides", JSON.stringify(overrides));
    if (isFirstMountOverrides.current) {
      isFirstMountOverrides.current = false;
    } else {
      localStorage.setItem("planmastergo_local_update_time", Date.now().toString());
    }
  }, [overrides]);

  // Day Modal State
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editState, setEditState] = useState<DayState>("work");
  const [editNote, setEditNote] = useState<string>("");
  const [editAppointmentTime, setEditAppointmentTime] = useState<string>("");
  const [editReminderEnabled, setEditReminderEnabled] = useState(false);
  const [editReminderType, setEditReminderType] = useState<"in-app" | "email" | "sms">(
    "email",
  );
  const [editReminderTime, setEditReminderTime] = useState("09:00");
  const [editReminderTiming, setEditReminderTiming] = useState<"7d" | "48h" | "24h" | "same-day">("48h");
  const [editReminderEmailInput, setEditReminderEmailInput] = useState<string>("");
  const [editReminderPhoneInput, setEditReminderPhoneInput] = useState<string>("");

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // PDF State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewType, setPdfViewType] = useState<"condensed" | "detailed" | "custom">(
    "condensed",
  );
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );
  const [pdfCustomStartDate, setPdfCustomStartDate] = useState<string>(
    `${new Date().getFullYear()}-01-01`
  );
  const [pdfCustomEndDate, setPdfCustomEndDate] = useState<string>(
    `${new Date().getFullYear()}-12-31`
  );

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);

  // Leave / Congés Modal State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveModalYear, setLeaveModalYear] = useState<number>(year);
  const [leaveModalFilter, setLeaveModalFilter] = useState<"all" | "holiday" | "sick">("all");
  const [isAddingLeave, setIsAddingLeave] = useState(false);
  const [addLeaveStartDate, setAddLeaveStartDate] = useState("");
  const [addLeaveEndDate, setAddLeaveEndDate] = useState("");
  const [addLeaveState, setAddLeaveState] = useState<"holiday" | "sick">("holiday");
  const [addLeaveNote, setAddLeaveNote] = useState("");

  const [restChoices, setRestChoices] = useState<string[]>(() => {
    const saved = localStorage.getItem("planmastergo_rest_choices") || localStorage.getItem("webmastergo_rest_choices") || localStorage.getItem("planmaster_rest_choices");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // ignore
      }
    }
    return new Array(8).fill("");
  });

  const isFirstMountRest = useRef(true);
  useEffect(() => {
    localStorage.setItem("planmastergo_rest_choices", JSON.stringify(restChoices));
    if (isFirstMountRest.current) {
      isFirstMountRest.current = false;
    } else {
      localStorage.setItem("planmastergo_local_update_time", Date.now().toString());
    }
  }, [restChoices]);

  const [currentTime, setCurrentTime] = useState(new Date());
  const [triggeredReminders, setTriggeredReminders] = useState<Set<string>>(
    new Set(),
  );
  const [activeToast, setActiveToast] = useState<{
    id: string;
    title: string;
    subtitle: string;
    type: string;
  } | null>(null);

  const [simulatedNotification, setSimulatedNotification] = useState<{
    type: "email" | "sms";
    to: string;
    message: string;
    info: string;
  } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [notificationEmail, setNotificationEmail] = useState("voicebox155@gmail.com");
  const [notificationPhone, setNotificationPhone] = useState("");
  const [activeSettingsTab, setActiveSettingsTab] = useState<"notifications" | "sync" | "security" | "display">("notifications");
  const [showFrenchHolidays, setShowFrenchHolidays] = useState(false);
  const [frenchHolidays, setFrenchHolidays] = useState<Record<string, string>>({});

  useEffect(() => {
    if (showFrenchHolidays) {
      fetch("https://calendrier.api.gouv.fr/jours-feries/metropole.json")
        .then(r => r.json())
        .then(data => setFrenchHolidays(data))
        .catch(e => console.error("Error fetching holidays:", e));
    } else {
      setFrenchHolidays({});
    }
  }, [showFrenchHolidays]);
  const [importCode, setImportCode] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);

  type SyncStatus = "pending" | "saved" | "error";
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("saved");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [isSyncPopoverOpen, setIsSyncPopoverOpen] = useState(false);

  const [isExportGuideOpen, setIsExportGuideOpen] = useState(false);
  const [activeExportTab, setActiveExportTab] = useState<"export" | "ios" | "android" | "hosting" | "pwa">("export");
  
  const [isGestionMenuOpen, setIsGestionMenuOpen] = useState(false);
  const gestionMenuRef = useRef<HTMLDivElement>(null);
  const [isAboutModalOpen, setIsAboutModalOpen] = useState(false);
  const icsFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (gestionMenuRef.current && !gestionMenuRef.current.contains(event.target as Node)) {
        setIsGestionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const [appPin, setAppPin] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPinInput, setUnlockPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

  // Admin Authentication State
  const ADMIN_USER = "AdminRoot#0";
  const ADMIN_PASS = "007#ACP3yruN.";

  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    return localStorage.getItem("planmastergo_is_admin") === "true";
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [adminUsernameInput, setAdminUsernameInput] = useState("");
  const [adminPasswordInput, setAdminPasswordInput] = useState("");
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminModalNotice, setAdminModalNotice] = useState<string | null>(null);

  const requireAdmin = (notice?: string): boolean => {
    if (isAdmin) return true;
    setAdminModalNotice(
      notice || "Connexion Administrateur (AdminRoot#0) requise pour effectuer cette action."
    );
    setAdminLoginError(null);
    setIsAdminLoginModalOpen(true);
    return false;
  };

  const handleAdminLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminUsernameInput.trim() === ADMIN_USER && adminPasswordInput === ADMIN_PASS) {
      setIsAdmin(true);
      localStorage.setItem("planmastergo_is_admin", "true");
      setAdminLoginError(null);
      setIsAdminLoginModalOpen(false);
      setAdminUsernameInput("");
      setAdminPasswordInput("");
      setAdminModalNotice(null);
      setActiveToast({
        id: "admin-auth-success",
        title: "Mode Administrateur Activé",
        subtitle: "Authentification réussie (AdminRoot#0). Vous disposez des droits de modification, d'exportation et de sauvegarde.",
        type: "in-app",
      });
      setTimeout(() => {
        setActiveToast((current) => (current?.id === "admin-auth-success" ? null : current));
      }, 4000);
    } else {
      setAdminLoginError("Identifiant ou mot de passe administrateur incorrect.");
    }
  };

  const handleAdminLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem("planmastergo_is_admin");
    setActiveToast({
      id: "admin-auth-logout",
      title: "Déconnexion Administrateur",
      subtitle: "Vous êtes désormais en mode consultation.",
      type: "in-app",
    });
    setTimeout(() => {
      setActiveToast((current) => (current?.id === "admin-auth-logout" ? null : current));
    }, 3000);
  };

  const handleICSImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour importer des événements ICS.")) {
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const icsData = event.target?.result as string;
      const newOverrides = { ...overrides };
      let updatedCount = 0;

      const lines = icsData.split(/\r?\n/);
      let currentEvent: any = null;

      for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        while (i + 1 < lines.length && (lines[i + 1].startsWith(' ') || lines[i + 1].startsWith('\t'))) {
          i++;
          line += lines[i].substring(1);
        }

        if (line.startsWith('BEGIN:VEVENT')) {
          currentEvent = {};
        } else if (line.startsWith('END:VEVENT')) {
          if (currentEvent && currentEvent.startDate) {
            newOverrides[currentEvent.startDate] = {
              state: "work",
              note: currentEvent.summary || "Événement importé (ICS)",
            };
            updatedCount++;
          }
          currentEvent = null;
        } else if (currentEvent) {
          if (line.startsWith('DTSTART')) {
            const match = line.match(/(\d{4})(\d{2})(\d{2})/);
            if (match) {
              currentEvent.startDate = `${match[1]}-${match[2]}-${match[3]}`;
            }
          } else if (line.startsWith('SUMMARY:')) {
            currentEvent.summary = line.substring(8).trim();
          }
        }
      }

      setOverrides(newOverrides);
      alert(`${updatedCount} événement(s) importé(s) avec succès !`);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const [deviceId, setDeviceId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    let id = params.get("id");
    
    if (!id) {
      id = localStorage.getItem("planmastergo_device_id") || localStorage.getItem("webmastergo_device_id") || localStorage.getItem("planmaster_device_id");
    }
    
    if (!id) {
      id = Array.from(crypto.getRandomValues(new Uint8Array(16)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
    
    localStorage.setItem("planmastergo_device_id", id);
    
    // Mettre à jour l'URL avec l'ID pour persister après actualisation dans l'iframe
    if (!params.has("id")) {
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.set("id", id);
      window.history.replaceState({}, "", newUrl.toString());
    }
    
    return id;
  });

  useEffect(() => {
    const loadSettings = async () => {
      const localEmail = localStorage.getItem("planmastergo_email") || localStorage.getItem("webmastergo_email") || localStorage.getItem("planmaster_email") || "voicebox155@gmail.com";
      const localPhone = localStorage.getItem("planmastergo_phone") || localStorage.getItem("webmastergo_phone") || localStorage.getItem("planmaster_phone") || "";
      const localPin = localStorage.getItem("planmastergo_pin") || "";
      const localShowHolidays = localStorage.getItem("planmastergo_show_holidays") === "true";
      
      setNotificationEmail(localEmail);
      setNotificationPhone(localPhone);
      setAppPin(localPin);
      setShowFrenchHolidays(localShowHolidays);
      
      if (localPin) {
        setIsLocked(true);
      }

      try {
        setSyncStatus("pending");
        setSyncError(null);
        const docRef = doc(db, "user_settings", deviceId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          let shouldApplyFirebaseData = true;

          if (data.updatedAt) {
            const firebaseTime = new Date(data.updatedAt).getTime();
            const localTimeStr = localStorage.getItem("planmastergo_local_update_time");
            if (localTimeStr) {
              const localTime = parseInt(localTimeStr, 10);
              if (localTime > firebaseTime) {
                shouldApplyFirebaseData = false;
              }
            }
          }

          if (shouldApplyFirebaseData) {
            if (data.pin) {
              setAppPin(data.pin);
              localStorage.setItem("planmastergo_pin", data.pin);
              setIsLocked(true);
            }
            if (data.email) {
              setNotificationEmail(data.email);
              localStorage.setItem("planmastergo_email", data.email);
            }
            if (data.phone) {
              setNotificationPhone(data.phone);
              localStorage.setItem("planmastergo_phone", data.phone);
            }
            if (data.overrides) {
              setOverrides(data.overrides);
              localStorage.setItem("planmastergo_overrides", JSON.stringify(data.overrides));
            }
            if (data.restChoices) {
              setRestChoices(data.restChoices);
              localStorage.setItem("planmastergo_rest_choices", JSON.stringify(data.restChoices));
            }
            if (data.showFrenchHolidays !== undefined) {
              setShowFrenchHolidays(data.showFrenchHolidays);
              localStorage.setItem("planmastergo_show_holidays", JSON.stringify(data.showFrenchHolidays));
            }
          }

          if (data.updatedAt) {
            try {
              setLastBackupTime(new Date(data.updatedAt).toLocaleString("fr-FR"));
            } catch (e) {
              setLastBackupTime(null);
            }
          }
        }
        setSyncStatus("saved");
      } catch (e: any) {
        setSyncStatus("error");
        setSyncError(e?.message || "Erreur de connexion Cloud");
        handleFirestoreError(e, OperationType.GET, `user_settings/${deviceId}`);
      } finally {
        setIsSettingsLoaded(true);
      }
    };
    loadSettings();
  }, [deviceId]);

  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const handleTestNotification = async (type: "email" | "sms") => {
    setIsTestingNotification(true);
    try {
      const to = type === "email" ? notificationEmail : notificationPhone;
      if (!to) {
        throw new Error(`Veuillez renseigner un ${type === 'email' ? 'email' : 'numéro de téléphone'}`);
      }
      
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, to, message: "Ceci est un test de PlanMasterGO." })
      });
      
      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error("L'API backend est introuvable. Avez-vous déployé les variables d'environnement sur Vercel ?");
      }
      
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'envoi");
      }
      
      if (data.simulated) {
        setSimulatedNotification({
          type: type,
          to: to,
          message: data.message || "Ceci est un test de PlanMasterGO.",
          info: data.info || ""
        });
        setActiveToast({
          id: "test-simulated",
          title: "Simulation active",
          subtitle: `Le test ${type.toUpperCase()} a été simulé à l'écran.`,
          type: type,
        });
        setTimeout(() => {
          setActiveToast((current) => current?.id === "test-simulated" ? null : current);
        }, 4000);
      } else {
        setActiveToast({
          id: "test-success",
          title: "Test réussi",
          subtitle: `Le test ${type.toUpperCase()} a été envoyé avec succès.`,
          type: "in-app",
        });
        setTimeout(() => {
          setActiveToast((current) => current?.id === "test-success" ? null : current);
        }, 4000);
      }
    } catch (e: any) {
      setActiveToast({
        id: "test-error",
        title: "Erreur de configuration",
        subtitle: e.message || "Impossible d'envoyer le test.",
        type: "in-app",
      });
      setTimeout(() => {
        setActiveToast((current) => current?.id === "test-error" ? null : current);
      }, 6000);
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleSaveSettings = async () => {
    if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour enregistrer les paramètres.")) {
      return;
    }
    localStorage.setItem("planmastergo_email", notificationEmail);
    localStorage.setItem("planmastergo_phone", notificationPhone);
    localStorage.setItem("planmastergo_pin", appPin);
    localStorage.setItem("planmastergo_local_update_time", Date.now().toString());

    setSyncStatus("pending");
    setSyncError(null);

    try {
      const backupTime = new Date().toISOString();
      await setDoc(doc(db, "user_settings", deviceId), {
        deviceId: deviceId,
        email: notificationEmail,
        phone: notificationPhone,
        pin: appPin,
        overrides: overrides,
        restChoices: restChoices,
        showFrenchHolidays: showFrenchHolidays,
        updatedAt: backupTime,
      });
      setLastBackupTime(new Date(backupTime).toLocaleString("fr-FR"));
      setSyncStatus("saved");
    } catch (e: any) {
      setSyncStatus("error");
      setSyncError(e?.message || "Erreur de sauvegarde Cloud");
      handleFirestoreError(e, OperationType.WRITE, `user_settings/${deviceId}`);
    }

    setIsSettingsModalOpen(false);
    setActiveToast({
      id: "settings-saved",
      title: "Paramètres sauvegardés",
      subtitle: "Vos contacts et votre planning ont été synchronisés avec succès.",
      type: "in-app",
    });
    setTimeout(() => {
      setActiveToast((current) =>
        current?.id === "settings-saved" ? null : current
      );
    }, 3000);
  };

  const handleForceBackup = async () => {
    if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour forcer la sauvegarde Cloud.")) {
      return;
    }
    setIsBackingUp(true);
    setSyncStatus("pending");
    setSyncError(null);

    try {
      const backupTime = new Date().toISOString();
      await setDoc(doc(db, "user_settings", deviceId), {
        deviceId: deviceId,
        email: notificationEmail,
        phone: notificationPhone,
        pin: appPin,
        overrides: overrides,
        restChoices: restChoices,
        showFrenchHolidays: showFrenchHolidays,
        updatedAt: backupTime,
      });
      setLastBackupTime(new Date(backupTime).toLocaleString("fr-FR"));
      setSyncStatus("saved");
      
      setActiveToast({
        id: "backup-success",
        title: "Sauvegarde réussie",
        subtitle: "Vos données de planning sont désormais sauvegardées dans le Cloud Firebase.",
        type: "in-app",
      });
      setTimeout(() => {
        setActiveToast((current) => current?.id === "backup-success" ? null : current);
      }, 3000);
    } catch (e: any) {
      console.error("Error backing up settings:", e);
      setSyncStatus("error");
      setSyncError(e?.message || "Erreur de sauvegarde forcée");
      handleFirestoreError(e, OperationType.WRITE, `user_settings/${deviceId}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportSync = async (codeToImport: string) => {
    if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour importer un profil/planning.")) {
      return;
    }
    const trimmedCode = codeToImport.trim();
    if (!trimmedCode) {
      alert("Veuillez saisir un code de synchronisation valide.");
      return;
    }
    
    if (!confirm("Attention : l'importation de ce profil va écraser vos données locales actuelles (planning, notes, préférences). Souhaitez-vous continuer ?")) {
      return;
    }
    
    setIsImporting(true);
    setSyncStatus("pending");
    setSyncError(null);

    try {
      const docRef = doc(db, "user_settings", trimmedCode);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.pin) {
          const enteredPin = prompt("Ce profil est protégé par un code PIN. Veuillez entrer le code à 4 chiffres :");
          if (enteredPin !== data.pin) {
            alert("Code PIN incorrect. L'importation a été annulée.");
            setIsImporting(false);
            setSyncStatus("saved");
            return;
          }
        }
        
        if (data.pin) {
          setAppPin(data.pin);
          localStorage.setItem("planmastergo_pin", data.pin);
        } else {
          setAppPin("");
          localStorage.removeItem("planmastergo_pin");
        }
        
        if (data.email) setNotificationEmail(data.email);
        if (data.phone) setNotificationPhone(data.phone);
        if (data.overrides) setOverrides(data.overrides);
        if (data.restChoices) setRestChoices(data.restChoices);
        if (data.showFrenchHolidays !== undefined) setShowFrenchHolidays(data.showFrenchHolidays);
        
        localStorage.setItem("planmastergo_device_id", trimmedCode);
        if (data.email) localStorage.setItem("planmastergo_email", data.email);
        if (data.phone) localStorage.setItem("planmastergo_phone", data.phone);
        if (data.overrides) localStorage.setItem("planmastergo_overrides", JSON.stringify(data.overrides));
        if (data.restChoices) localStorage.setItem("planmastergo_rest_choices", JSON.stringify(data.restChoices));
        if (data.showFrenchHolidays !== undefined) localStorage.setItem("planmastergo_show_holidays", JSON.stringify(data.showFrenchHolidays));
        
        setDeviceId(trimmedCode);
        
        if (data.updatedAt) {
          try {
            setLastBackupTime(new Date(data.updatedAt).toLocaleString("fr-FR"));
          } catch (e) {
            setLastBackupTime(null);
          }
        }
        
        setSyncStatus("saved");

        setActiveToast({
          id: "import-success",
          title: "Importation réussie",
          subtitle: "Vos données ont été synchronisées avec succès depuis le Cloud.",
          type: "in-app",
        });
        setTimeout(() => {
          setActiveToast((current) => current?.id === "import-success" ? null : current);
        }, 4000);
        
        setImportCode("");
      } else {
        setSyncStatus("error");
        setSyncError("Profil introuvable pour ce code");
        alert("Aucune donnée trouvée pour ce code de synchronisation. Veuillez vérifier le code saisi.");
      }
    } catch (e: any) {
      console.error("Error importing settings:", e);
      setSyncStatus("error");
      setSyncError(e?.message || "Erreur lors de l'importation");
      alert("Erreur lors de la synchronisation avec le serveur. Veuillez réessayer.");
    } finally {
      setIsImporting(false);
    }
  };

  // Sauvegarde automatique immédiate
  useEffect(() => {
    if (!deviceId || !isSettingsLoaded) return;
    
    const saveToCloud = async () => {
      setIsAutoSaving(true);
      setSyncStatus("pending");
      setSyncError(null);

      try {
        const backupTime = new Date().toISOString();
        await setDoc(doc(db, "user_settings", deviceId), {
          deviceId: deviceId,
          email: notificationEmail,
          phone: notificationPhone,
          pin: appPin,
          overrides: overrides,
          restChoices: restChoices,
          showFrenchHolidays: showFrenchHolidays,
          updatedAt: backupTime,
        });
        setLastBackupTime(new Date(backupTime).toLocaleString("fr-FR"));
        setSyncStatus("saved");
      } catch (e: any) {
        console.error("Auto backup error:", e);
        setSyncStatus("error");
        setSyncError(e?.message || "Erreur de connexion au serveur Cloud");
      } finally {
        setTimeout(() => setIsAutoSaving(false), 800);
      }
    };
    
    saveToCloud();
  }, [overrides, restChoices, notificationEmail, notificationPhone, appPin, showFrenchHolidays, deviceId, isSettingsLoaded]);

  useEffect(() => {
    const todayKey = getDateKey(currentTime);
    const currentHour = String(currentTime.getHours()).padStart(2, "0");
    const currentMin = String(currentTime.getMinutes()).padStart(2, "0");
    const timeStr = `${currentHour}:${currentMin}`;

    (Object.entries(overrides) as [string, CustomDayRecord][]).forEach(([eventDateKey, dayData]) => {
      if (!dayData?.reminder?.enabled) return;

      const timing = dayData.reminder.timing || "same-day";
      const parts = eventDateKey.split("-").map(Number);
      if (parts.length !== 3) return;
      const eventDateObj = new Date(parts[0], parts[1] - 1, parts[2]);

      const triggerDateObj = new Date(eventDateObj);
      if (timing === "7d") {
        triggerDateObj.setDate(triggerDateObj.getDate() - 7);
      } else if (timing === "48h") {
        triggerDateObj.setDate(triggerDateObj.getDate() - 2);
      } else if (timing === "24h") {
        triggerDateObj.setDate(triggerDateObj.getDate() - 1);
      }

      const triggerDateKey = getDateKey(triggerDateObj);

      if (todayKey === triggerDateKey && dayData.reminder.time === timeStr) {
        const reminderId = `${eventDateKey}-${timing}-${timeStr}`;
        if (!triggeredReminders.has(reminderId)) {
          const timingTitle = timing === "7d" ? "Rappel 7 jours avant" : timing === "48h" ? "Rappel 48h avant" : timing === "24h" ? "Rappel 24h avant" : "Rappel aujourd'hui";
          const eventDateFormatted = eventDateObj.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

          setActiveToast({
            id: reminderId,
            title: timingTitle,
            subtitle: `Événement le ${eventDateFormatted} : ${dayData.note || "Note enregistrée"}`,
            type: dayData.reminder.type,
          });
          setTriggeredReminders((prev) => new Set(prev).add(reminderId));

          playRingtone();

          const targetEmail = dayData.reminder.emailTo || notificationEmail;

          if (dayData.reminder.type === "email" && targetEmail) {
            const emailMessage = `Bonjour,\n\nCeci est votre ${timingTitle.toLowerCase()} pour l'événement PlanMasterGO du ${eventDateFormatted}.\n\n📝 Note / Détails : ${dayData.note || "Aucune note"}\n⏰ Heure : ${dayData.appointmentTime || dayData.reminder.time}\n\nCordialement,\nL'équipe PlanMasterGO`;

            fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "email", to: targetEmail, message: emailMessage })
            }).then(async res => {
              const text = await res.text();
              let data: any = {};
              try { data = JSON.parse(text); } catch(e) {}

              if (!res.ok) {
                setActiveToast({
                  id: reminderId + "-error",
                  title: "Erreur Email",
                  subtitle: data.error || "L'API backend est introuvable.",
                  type: "in-app"
                });
              } else if (data.simulated) {
                setSimulatedNotification({
                  type: "email",
                  to: targetEmail,
                  message: emailMessage,
                  info: data.info || ""
                });
              }
            }).catch(console.error);
          }

          const targetPhone = dayData.reminder.phoneTo || notificationPhone;

          if (dayData.reminder.type === "sms" && targetPhone) {
            const smsMessage = `PlanMasterGO - ${timingTitle} (${eventDateFormatted}): ${dayData.note || "Rappel"}`;
            fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "sms", to: targetPhone, message: smsMessage })
            }).then(async res => {
              const text = await res.text();
              let data: any = {};
              try { data = JSON.parse(text); } catch(e) {}

              if (!res.ok) {
                setActiveToast({
                  id: reminderId + "-error",
                  title: "Erreur SMS",
                  subtitle: data.error || "L'API backend est introuvable.",
                  type: "in-app"
                });
              } else if (data.simulated) {
                setSimulatedNotification({
                  type: "sms",
                  to: targetPhone,
                  message: smsMessage,
                  info: data.info || ""
                });
              }
            }).catch(console.error);
          }

          // Auto clear toast after 8 seconds
          setTimeout(() => {
            setActiveToast((current) =>
              current?.id === reminderId ? null : current,
            );
          }, 8000);
        }
      }
    });
  }, [currentTime, overrides, triggeredReminders, notificationEmail, notificationPhone]);

  useEffect(() => {
    // Decoding State from URL if present
    const hash = window.location.hash.slice(1);
    if (hash) {
      try {
        const decoded = decodeURIComponent(atob(hash));
        const data = JSON.parse(decoded);
        if (data.year) {
          const m = data.month !== undefined ? data.month : 0;
          setViewDate(new Date(data.year, m, 1));
        }
        if (data.viewMode) {
          setViewMode(data.viewMode);
        }
        if (data.overrides) setOverrides(data.overrides);
      } catch (e) {
        console.error("Invalid share link", e);
      }
    }
  }, []);

  const handlePrev = () => {
    const newDate = new Date(viewDate);
    if (viewMode === "annual") newDate.setFullYear(newDate.getFullYear() - 1);
    else if (viewMode === "month") newDate.setMonth(newDate.getMonth() - 1);
    setViewDate(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(viewDate);
    if (viewMode === "annual") newDate.setFullYear(newDate.getFullYear() + 1);
    else if (viewMode === "month") newDate.setMonth(newDate.getMonth() + 1);
    setViewDate(newDate);
  };

  const handleToday = () => {
    setViewDate(new Date());
    setViewMode("month");
  };

  const getHeaderText = () => {
    if (viewMode === "annual") return year.toString();
    if (viewMode === "month") {
      const text = new Intl.DateTimeFormat("fr-FR", {
        month: "long",
        year: "numeric",
      }).format(viewDate);
      return text.charAt(0).toUpperCase() + text.slice(1);
    }
    return "";
  };

  const getDayState = (date: Date): DayState => {
    const key = getDateKey(date);
    if (overrides[key]) {
      return overrides[key].state;
    }

    const msPerDay = 1000 * 60 * 60 * 24;
    // Calculate difference using UTC to avoid daylight saving issues
    const utcDate = Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
    );
    const utcBase = Date.UTC(
      CYCLE_BASE_DATE.getFullYear(),
      CYCLE_BASE_DATE.getMonth(),
      CYCLE_BASE_DATE.getDate(),
    );
    const diffDays = Math.floor((utcDate - utcBase) / msPerDay);

    const offset = 0;
    const index =
      (((diffDays + offset) % CYCLE_PATTERN.length) + CYCLE_PATTERN.length) %
      CYCLE_PATTERN.length;

    return CYCLE_PATTERN[index] as DayState;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const getLeaveDaysAndPeriods = (yearNum: number) => {
    const daysList: {
      date: Date;
      key: string;
      state: "holiday" | "sick";
      note?: string;
      isOverride: boolean;
    }[] = [];

    const startYear = new Date(yearNum, 0, 1);
    const endYear = new Date(yearNum, 11, 31);

    for (let d = new Date(startYear); d <= endYear; d.setDate(d.getDate() + 1)) {
      const state = getDayState(d);
      if (state === "holiday" || state === "sick") {
        const key = getDateKey(d);
        daysList.push({
          date: new Date(d),
          key,
          state,
          note: overrides[key]?.note,
          isOverride: !!overrides[key],
        });
      }
    }

    interface LeavePeriod {
      id: string;
      state: "holiday" | "sick";
      startDate: Date;
      endDate: Date;
      daysCount: number;
      days: typeof daysList;
      notes: string[];
    }

    const periods: LeavePeriod[] = [];
    let currentPeriod: LeavePeriod | null = null;

    daysList.forEach((item) => {
      if (!currentPeriod) {
        currentPeriod = {
          id: `${item.state}-${item.key}`,
          state: item.state,
          startDate: item.date,
          endDate: item.date,
          daysCount: 1,
          days: [item],
          notes: item.note ? [item.note] : [],
        };
      } else {
        const diffMs = item.date.getTime() - currentPeriod.endDate.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 1 && item.state === currentPeriod.state) {
          currentPeriod.endDate = item.date;
          currentPeriod.daysCount += 1;
          currentPeriod.days.push(item);
          if (item.note && !currentPeriod.notes.includes(item.note)) {
            currentPeriod.notes.push(item.note);
          }
        } else {
          periods.push(currentPeriod);
          currentPeriod = {
            id: `${item.state}-${item.key}`,
            state: item.state,
            startDate: item.date,
            endDate: item.date,
            daysCount: 1,
            days: [item],
            notes: item.note ? [item.note] : [],
          };
        }
      }
    });

    if (currentPeriod) {
      periods.push(currentPeriod);
    }

    return { daysList, periods };
  };

  const handleExportExcel = () => {
    const data = [];
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31);

    for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
      const stateId = getDayState(d);
      const stateLabel = LEGEND.find((l) => l.id === stateId)?.label || "";
      const key = getDateKey(d);
      const dayRec = overrides[key];
      const note = dayRec?.note || "";
      const appt = dayRec?.appointmentTime;
      const fullNote = appt ? `[RDV ${appt.replace(":", "h")}] ${note}`.trim() : note;

      data.push({
        Date: new Intl.DateTimeFormat("fr-FR").format(d),
        Jour: WEEKDAYS[d.getDay() === 0 ? 6 : d.getDay() - 1],
        Statut: stateLabel,
        Note: fullNote,
      });
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Planning");
    XLSX.writeFile(wb, `Planning-${year}.xlsx`);
  };

  const generatePDF = async (action: "download" | "print" = "download") => {
    setIsPdfModalOpen(false);
    setIsShareModalOpen(false);
    setIsGeneratingPDF(true);
    // Small delay to let the UI render the loading spinner before the main thread is blocked
    await new Promise((resolve) => setTimeout(resolve, 50));

    try {
      const typeToRender = action === "print" ? "condensed" : pdfViewType;

      let pdf: jsPDF;
      if (typeToRender === "condensed") {
        pdf = new jsPDF("p", "mm", "a4");
        const docWidth = pdf.internal.pageSize.getWidth();

        const element = document.getElementById("pdf-condensed-page");
        if (element) {
          const imgData = await toPng(element, {
            pixelRatio: 2,
            backgroundColor: "#ffffff",
          });
          const imgProps = pdf.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * docWidth) / imgProps.width;
          pdf.addImage(imgData, "PNG", 0, 0, docWidth, pdfHeight);
        }
      } else if (typeToRender === "custom") {
        pdf = new jsPDF("p", "mm", "a4");
        const docWidth = pdf.internal.pageSize.getWidth();
        const start = new Date(pdfCustomStartDate);
        const end = new Date(pdfCustomEndDate);
        const startMonth = start.getMonth();
        const endMonth = end.getMonth();
        const startYear = start.getFullYear();
        const endYear = end.getFullYear();
        
        let hasAddedPage = false;

        // Note: For simplicity and assuming current year mostly, we will render months 
        // that fall in the range for the current calendar year.
        const effectiveStartMonth = startYear < year ? 0 : (startYear > year ? 12 : startMonth);
        const effectiveEndMonth = endYear > year ? 11 : (endYear < year ? -1 : endMonth);

        for (let m = effectiveStartMonth; m <= effectiveEndMonth; m++) {
          const element = document.getElementById(`pdf-detailed-page-${m}`);
          if (element) {
            if (hasAddedPage) {
              pdf.addPage();
            }
            const imgData = await toPng(element, {
              pixelRatio: 2,
              backgroundColor: "#ffffff",
            });
            const imgProps = pdf.getImageProperties(imgData);
            const pdfHeight = (imgProps.height * docWidth) / imgProps.width;
            pdf.addImage(imgData, "PNG", 0, 0, docWidth, pdfHeight);
            hasAddedPage = true;
          }
        }
      } else {
        pdf = new jsPDF("p", "mm", "a4");
        const docWidth = pdf.internal.pageSize.getWidth();

        const element = document.getElementById(
          `pdf-detailed-page-${pdfSelectedMonth}`,
        );
        if (element) {
          const imgData = await toPng(element, {
            pixelRatio: 2,
            backgroundColor: "#ffffff",
          });
          const imgProps = pdf.getImageProperties(imgData);
          const pdfHeight = (imgProps.height * docWidth) / imgProps.width;
          pdf.addImage(imgData, "PNG", 0, 0, docWidth, pdfHeight);
        }
      }

      if (action === "print") {
        pdf.autoPrint();
        const blob = pdf.output("bloburl");
        window.open(blob, "_blank");
      } else {
        const filename =
          typeToRender === "condensed"
            ? `PlanMasterGO-${year}-Condense.pdf`
            : typeToRender === "custom"
            ? `PlanMasterGO-${year}-Personnalise.pdf`
            : `PlanMasterGO-${year}-${MONTHS[pdfSelectedMonth]}.pdf`;
        pdf.save(filename);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la génération du PDF");
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getShareLink = () => {
    const data = JSON.stringify({ 
      year, 
      month: viewDate.getMonth(),
      viewMode,
      overrides 
    });
    const encoded = btoa(encodeURIComponent(data));
    return `${window.location.origin}${window.location.pathname}#${encoded}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent(`PlanMasterGO ${year}`);
    const body = encodeURIComponent(
      `Découvrez mon planning ici: ${getShareLink()}`,
    );
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  const handleDayClick = (date: Date) => {
    setSelectedDates((prev) => {
      const key = getDateKey(date);
      const exists = prev.find((d) => getDateKey(d) === key);
      
      const newSelection = exists 
        ? prev.filter((d) => getDateKey(d) !== key)
        : [...prev, date];

      if (prev.length === 0 && newSelection.length === 1) {
        const existing = overrides[key];
        setEditState(existing?.state || getDayState(date));
        setEditNote(existing?.note || "");
        setEditAppointmentTime(existing?.appointmentTime || "");
        setEditReminderEnabled(existing?.reminder?.enabled || false);
        setEditReminderType(existing?.reminder?.type || "email");
        setEditReminderTime(existing?.reminder?.time || existing?.appointmentTime || "09:00");
        setEditReminderTiming(existing?.reminder?.timing || "48h");
        setEditReminderEmailInput(existing?.reminder?.emailTo || notificationEmail || "");
        setEditReminderPhoneInput(existing?.reminder?.phoneTo || notificationPhone || "");
      }
      
      return newSelection;
    });
  };

  const renderMonth = (
    monthIndex: number,
    isLarge: boolean = false,
    pdfMode: boolean = false,
  ) => {
    const firstDay = new Date(year, monthIndex, 1);
    const lastDay = new Date(year, monthIndex + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Adjust so week starts on Monday (1)
    let startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days = [];
    let workCount = 0;
    let restCount = 0;
    let monthMatchCount = 0;

    const searchTrim = annualSearchQuery.toLowerCase().trim();
    const isSearchActive = viewMode === "annual" && searchTrim.length > 0;

    const emptyCellClass = isLarge
      ? "mx-auto w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12"
      : "mx-auto w-7 h-7 sm:w-8 sm:h-8";

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(
        <motion.div
          key={`empty-${monthIndex}-${i}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className={emptyCellClass}
        ></motion.div>
      );
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, monthIndex, d);
      const state = getDayState(currentDate);

      if (state === "work" || state === "training" || state === "rest1" || state === "6thday") {
        workCount++;
      } else if (state === "rest" || state === "holiday" || state === "sick" || state === "children") {
        restCount++;
      }

      const today = isToday(currentDate);
      const key = getDateKey(currentDate);
      const noteText = overrides[key]?.note || "";
      const hasNote = !!noteText;
      const hasReminder = overrides[key]?.reminder?.enabled;
      const holidayName = showFrenchHolidays ? frenchHolidays[key] : null;

      const isSearchMatch = isSearchActive && noteText.toLowerCase().includes(searchTrim);
      if (isSearchMatch) {
        monthMatchCount++;
      }

      let baseClasses = `mx-auto flex items-center justify-center rounded-full font-semibold transition-all relative cursor-pointer group-hover:opacity-80 ${isLarge ? "w-8 h-8 min-[360px]:w-9 min-[360px]:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-sm sm:text-base md:text-lg" : "w-7 h-7 sm:w-8 sm:h-8 text-xs sm:text-sm"}`;
      let stateClasses = "";

      if (state === "work") {
        stateClasses = "bg-[#fde047] text-slate-800"; // Amber-like yellow
      } else if (state === "rest") {
        stateClasses = "bg-[#10a37f] text-white"; // Green
      } else if (state === "rest1") {
        stateClasses = "bg-[#C7CF00] text-slate-800"; // Journée additionnelle
      } else if (state === "training") {
        stateClasses = "bg-[#E1712B] text-white"; // Orange
      } else if (state === "holiday") {
        stateClasses = "bg-[#A10684] text-white"; // Purple
      } else if (state === "sick") {
        stateClasses = "bg-white border-2 border-gray-300 text-slate-800"; // Outline white
      } else if (state === "6thday") {
        stateClasses = "bg-[#34C924] text-white";
      } else if (state === "children") {
        stateClasses = "bg-[#400732] text-white";
      }

      if (today && !pdfMode) {
        stateClasses += " ring-2 ring-red-500 ring-offset-1 ring-offset-white";
        if (
          state !== "work" &&
          state !== "rest" &&
          state !== "rest1" &&
          state !== "training" &&
          state !== "holiday" &&
          state !== "6thday" &&
          state !== "children"
        ) {
          stateClasses += " border-2 border-red-500";
        }
      }

      const isSelectedMulti = selectedDates.some(sd => getDateKey(sd) === key);
      if (isSelectedMulti && !pdfMode) {
        stateClasses += " ring-4 ring-[#10a37f] ring-offset-2 ring-offset-white";
      }

      if (isSearchActive && isSearchMatch) {
        stateClasses += " ring-4 ring-blue-500 ring-offset-2 ring-offset-white animate-pulse shadow-lg shadow-blue-500/40 z-20 font-black";
      }

      let stateLabel = "";
      let dotColor = "transparent";
      if (state === "work") { stateLabel = "Travail"; dotColor = "#fde047"; }
      else if (state === "rest") { stateLabel = "Repos"; dotColor = "#10a37f"; }
      else if (state === "rest1") { stateLabel = "Journée Add."; dotColor = "#C7CF00"; }
      else if (state === "training") { stateLabel = "Formation"; dotColor = "#E1712B"; }
      else if (state === "holiday") { stateLabel = "Congés"; dotColor = "#A10684"; }
      else if (state === "sick") { stateLabel = "Maladie"; dotColor = "white"; }
      else if (state === "6thday") { stateLabel = "6ème Jour"; dotColor = "#34C924"; }
      else if (state === "children") { stateLabel = "Enfant malade"; dotColor = "#400732"; }

      let wrapperClasses = "flex justify-center items-center relative group transition-all duration-300";
      if (isSearchActive) {
        if (isSearchMatch) {
          wrapperClasses += " z-20 opacity-100 scale-110";
        } else {
          wrapperClasses += " opacity-25 grayscale-[30%]";
        }
      }

      days.push(
        <motion.div
          key={key}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: Math.min(d * 0.01, 0.3), ease: "easeOut" }}
          className={wrapperClasses}
        >
          <motion.button
            onClick={() => handleDayClick(currentDate)}
            className={`${baseClasses} ${stateClasses}`}
            animate={{ scale: isSelectedMulti && !pdfMode ? 1.15 : isSearchMatch ? 1.2 : 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            whileHover={{ scale: 1.12, y: -2 }}
            whileTap={{ scale: 0.95 }}
          >
            {d}
            {isSearchMatch && (
              <span className="absolute -top-1 -left-1 bg-blue-600 text-white p-0.5 rounded-full shadow border border-white z-30 flex items-center justify-center">
                <Search className="w-2.5 h-2.5" />
              </span>
            )}
            {hasNote && !isSearchMatch && (
              <span
                className={`absolute bg-blue-500 rounded-full border-2 border-white ${isLarge ? "-top-1 -right-1 w-3 h-3" : "-top-1 -right-1 w-2.5 h-2.5"}`}
              ></span>
            )}
            {hasReminder && (
              <span
                className={`absolute bg-rose-500 rounded-full border-2 border-white ${isLarge ? "-bottom-0 -right-1 w-3 h-3" : "-bottom-0.5 -right-0.5 w-2.5 h-2.5"}`}
              ></span>
            )}
          </motion.button>
          {holidayName && !pdfMode && isLarge && (
            <div className="absolute -bottom-3 sm:-bottom-4 left-1/2 -translate-x-1/2 text-[9px] sm:text-[10px] md:text-[11px] text-pink-600 font-bold whitespace-nowrap truncate max-w-[40px] sm:max-w-[48px] md:max-w-[56px] pointer-events-none drop-shadow-[0_1px_1px_rgba(255,255,255,1)]">
              {holidayName}
            </div>
          )}
          {!pdfMode && (
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity top-12 z-[60] w-max max-w-[220px] bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none flex flex-col gap-1.5 border border-slate-700">
              <div className="font-bold text-slate-200 border-b border-slate-700 pb-1.5 mb-0.5">
                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </div>
              
              {stateLabel && (
                <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full border border-slate-600 shadow-sm" style={{ backgroundColor: dotColor }}></span>
                  {stateLabel}
                </div>
              )}

              {holidayName && (
                <div className="text-pink-300 font-bold flex items-center gap-1.5">
                  🎉 {holidayName}
                </div>
              )}

              {overrides[key]?.appointmentTime && (
                <div className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  RDV à {overrides[key].appointmentTime.replace(":", "h")}
                </div>
              )}
              {hasReminder && (
                <div className="text-rose-300 font-bold flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5" />
                  Rappel: {overrides[key]?.reminder?.time}
                </div>
              )}
              {hasNote && (
                <div className={`mt-0.5 text-slate-300 bg-slate-900/50 p-2 rounded border ${isSearchMatch ? "border-blue-400 font-semibold text-blue-200" : "border-slate-700/50"}`}>
                  {overrides[key]?.note}
                </div>
              )}
            </div>
          )}
        </motion.div>,
      );
    }

    const workPct = daysInMonth > 0 ? Math.round((workCount / daysInMonth) * 100) : 0;
    const restPct = daysInMonth > 0 ? Math.round((restCount / daysInMonth) * 100) : 0;

    const id = pdfMode ? `pdf-month-${monthIndex}` : `month-${monthIndex}`;
    return (
      <div
        id={id}
        key={monthIndex}
        onClick={() => {
          if (!isLarge) {
            setViewDate(new Date(year, monthIndex, 1));
            setViewMode("month");
          }
        }}
        className={`glass-panel rounded-2xl ${
          isLarge
            ? "p-2 min-[360px]:p-3 sm:p-6 md:p-8"
            : "p-2 min-[360px]:p-2.5 sm:p-5 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group hover:scale-[1.01]"
        } flex flex-col justify-between w-full`}
        title={!isLarge ? `Cliquer pour basculer sur la vue détaillée du mois de ${MONTHS[monthIndex]}` : undefined}
      >
        <div>
          <h3
            className={`text-center font-bold text-slate-800 flex items-center justify-center gap-2 ${
              isLarge
                ? "text-lg sm:text-2xl mb-3 sm:mb-6"
                : "text-sm mb-2 sm:mb-4 group-hover:text-[#10a37f] transition-colors"
            }`}
          >
            <span>{MONTHS[monthIndex]}</span>
            {isSearchActive && monthMatchCount > 0 && (
              <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white shadow-sm animate-in zoom-in-95">
                {monthMatchCount} {monthMatchCount === 1 ? "résultat" : "résultats"}
              </span>
            )}
          </h3>
          <div
            className={`grid grid-cols-7 ${isLarge ? "gap-y-1.5 sm:gap-y-4 gap-x-0.5 sm:gap-x-2" : "gap-y-1 gap-x-0.5"}`}
          >
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className={`text-center font-semibold text-slate-400 mb-1 sm:mb-2 ${isLarge ? "text-xs sm:text-sm" : "text-[11px] sm:text-[12px]"}`}
              >
                {day}
              </div>
            ))}
            {days}
          </div>
        </div>

        {/* Gauge de densité du rythme de travail */}
        <div className="mt-3 sm:mt-4 pt-2 border-t border-slate-100/80 flex flex-col gap-1">
          <div className="flex items-center justify-between text-[10px] sm:text-xs font-semibold text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#fde047] border border-amber-300 shrink-0"></span>
              <span className="truncate">{workCount}j Travail</span>
              <span className="text-[9px] text-slate-400 font-normal">({workPct}%)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#10a37f] shrink-0"></span>
              <span className="truncate">{restCount}j Repos</span>
              <span className="text-[9px] text-slate-400 font-normal">({restPct}%)</span>
            </span>
          </div>

          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden flex p-0.5 gap-0.5 border border-slate-200/60 shadow-inner">
            <div
              className="h-full bg-amber-400 rounded-l-full transition-all duration-300"
              style={{ width: `${workPct}%` }}
              title={`Travail / Formation : ${workCount} jours (${workPct}%)`}
            />
            <div
              className="h-full bg-[#10a37f] rounded-r-full transition-all duration-300"
              style={{ width: `${Math.max(0, 100 - workPct)}%` }}
              title={`Repos / Congés / Absences : ${restCount} jours (${restPct}%)`}
            />
          </div>
        </div>
      </div>
    );
  };

  if (isLocked) {
    return (
      <div className="min-h-screen bg-modern-white font-sans flex items-center justify-center p-4">
        <div className="max-w-md w-full glass-panel rounded-2xl shadow-xl p-8 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-[#10a37f]/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="w-8 h-8 text-[#10a37f]" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Application Protégée</h2>
          <p className="text-sm text-slate-500 mb-8">
            Veuillez entrer votre Code PIN à 4 chiffres pour accéder à votre planning.
          </p>
          
          <form onSubmit={(e) => {
            e.preventDefault();
            if (unlockPinInput === appPin) {
              setIsLocked(false);
              setPinError(false);
              setUnlockPinInput("");
            } else {
              setPinError(true);
              setUnlockPinInput("");
            }
          }}>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              autoFocus
              value={unlockPinInput}
              onChange={(e) => {
                setUnlockPinInput(e.target.value.replace(/[^0-9]/g, ''));
                setPinError(false);
              }}
              className={`w-full max-w-[200px] mx-auto text-center text-3xl font-mono tracking-[0.5em] py-4 rounded-xl border-2 transition-all outline-none ${
                pinError 
                  ? "border-red-300 bg-red-50 text-red-600 focus:border-red-400 focus:ring-red-100" 
                  : "border-slate-200 bg-slate-50 focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20"
              }`}
            />
            {pinError && (
              <p className="text-red-500 text-sm font-medium mt-3 animate-in slide-in-from-top-1">
                Code PIN incorrect
              </p>
            )}
            
            <button
              type="submit"
              disabled={unlockPinInput.length !== 4}
              className="mt-8 w-full py-3.5 bg-[#10a37f] hover:bg-[#0c8c6c] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <Unlock className="w-5 h-5" />
              Déverrouiller
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-modern-white font-sans pb-4 sm:pb-12 flex flex-col items-center overflow-x-hidden">
      {/* Auto Save Progress Bar */}
      <div className={`fixed top-0 left-0 right-0 z-[100] h-1 bg-emerald-50 transition-opacity duration-300 ${isAutoSaving ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="h-full bg-[#10a37f] shadow-[0_0_8px_#10a37f] animate-[pulse_1s_ease-in-out_infinite] w-full"></div>
      </div>
      
      {/* Top Header */}
      <header className="w-full glass-header sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 drop-shadow-sm hover:scale-105 transition-transform cursor-pointer">
              <FloppyLogo className="w-7 sm:w-10 h-7 sm:h-10" />
            </div>
            <div>
              <h1 className="text-[15px] font-bold font-handwritten text-slate-900 leading-none tracking-wide">
                PlanMasterGO
              </h1>
              <p className="text-[11px] sm:text-sm font-medium text-slate-500 mt-1">
                {currentTime
                  .toLocaleDateString("fr-FR", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })
                  .replace(/\//g, ".")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cloud Sync Header Badge */}
            <button
              onClick={() => setIsSyncPopoverOpen((prev) => !prev)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95 ${
                syncStatus === "pending"
                  ? "bg-amber-50 text-amber-800 border-amber-200/90"
                  : syncStatus === "error"
                  ? "bg-rose-50 text-rose-800 border-rose-200/90"
                  : "bg-emerald-50 text-emerald-800 border-emerald-200/90"
              }`}
              title="Statut de la synchronisation cloud en temps réel"
            >
              <span className={`w-2 h-2 rounded-full shrink-0 ${
                syncStatus === "pending" ? "bg-amber-500 animate-ping" : syncStatus === "error" ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
              }`} />
              <span className="text-[11px]">
                {syncStatus === "pending" ? "Synchro..." : syncStatus === "error" ? "Erreur synchro" : "Cloud ok"}
              </span>
            </button>

            <div className="flex items-center bg-slate-50/80 border border-slate-200 shadow-sm rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-4 sm:py-2 text-slate-700 font-bold text-sm sm:text-lg tracking-tight">
              {currentTime.toLocaleTimeString("fr-FR", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[1400px] px-2 sm:px-6 mt-2.5 sm:mt-6 flex flex-col gap-2.5 sm:gap-6">
        {/* Toolbar */}
        <div className="glass-panel p-2.5 sm:p-4 rounded-xl sm:rounded-2xl flex flex-col lg:flex-row justify-between items-center gap-2.5 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 flex-wrap w-full lg:w-auto justify-center lg:justify-start">
            <div className="flex items-center bg-[#f8fafc] rounded-xl border border-slate-200 p-0.5 sm:p-1 flex-1 sm:flex-none justify-between sm:justify-start">
              <button
                onClick={handlePrev}
                className="p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div className="flex items-center gap-1 px-1.5 sm:px-6 font-bold text-sm sm:text-lg text-slate-800 tracking-tight min-w-[80px] sm:min-w-[120px] justify-center">
                {viewMode === "month" && (
                  <select
                    value={viewDate.getMonth()}
                    onChange={(e) => {
                      const newDate = new Date(viewDate);
                      newDate.setMonth(Number(e.target.value));
                      setViewDate(newDate);
                    }}
                    className="bg-transparent appearance-none outline-none cursor-pointer hover:bg-slate-200/50 rounded-md px-0.5 capitalize text-center"
                  >
                    {MONTHS.map((m, i) => (
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                )}
                <select
                  value={year}
                  onChange={(e) => {
                    const newDate = new Date(viewDate);
                    newDate.setFullYear(Number(e.target.value));
                    setViewDate(newDate);
                  }}
                  className="bg-transparent appearance-none outline-none cursor-pointer hover:bg-slate-200/50 rounded-md px-0.5 text-center"
                >
                  {Array.from({ length: 21 }).map((_, i) => {
                    const y = new Date().getFullYear() - 10 + i;
                    return <option key={y} value={y}>{y}</option>;
                  })}
                </select>
              </div>
              <button
                onClick={handleNext}
                className="p-1.5 sm:p-2 hover:bg-white rounded-lg transition-colors text-slate-600"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex bg-[#f8fafc] p-0.5 sm:p-1 rounded-xl border border-slate-200 hide-scrollbar overflow-x-auto relative">
              {(
                [
                  ["month", "Mois"],
                  ["annual", "Année"],
                ] as [ViewMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`relative px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap z-10 ${
                    viewMode === mode ? "text-slate-900" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {viewMode === mode && (
                    <motion.div
                      layoutId="activeViewTab"
                      className="absolute inset-0 bg-white rounded-lg shadow-sm border border-slate-200/80 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 32 }}
                    />
                  )}
                  {label}
                </button>
              ))}
            </div>

            <button
              onClick={handleToday}
              className="hidden lg:flex items-center gap-2 px-5 py-2.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 font-semibold rounded-xl transition-colors shrink-0"
            >
              <CalendarIcon className="w-5 h-5" />
              Aujourd'hui
            </button>
          </div>

          <div className="flex gap-1.5 sm:gap-3 w-full lg:w-auto flex-wrap justify-center">
            <button
              onClick={handleToday}
              className="flex lg:hidden items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 font-semibold rounded-lg sm:rounded-xl transition-colors flex-1 sm:flex-none justify-center whitespace-nowrap text-xs sm:text-sm"
            >
              <CalendarIcon className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
              Aujourd'hui
            </button>
            {appPin && (
              <button
                onClick={() => setIsLocked(true)}
                className="flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl transition-colors shadow-sm active:scale-95"
                title="Verrouiller l'application"
              >
                <Lock className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="flex items-center justify-center p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg sm:rounded-xl transition-colors shadow-sm active:scale-95"
              title="Paramètres de notification"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>

            {/* Real-time Cloud Sync Indicator */}
            <div className="relative">
              <button
                onClick={() => setIsSyncPopoverOpen((prev) => !prev)}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold border transition-all shadow-sm active:scale-95 ${
                  syncStatus === "pending"
                    ? "bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100"
                    : syncStatus === "error"
                    ? "bg-rose-50/90 text-rose-800 border-rose-200 hover:bg-rose-100"
                    : "bg-emerald-50/90 text-emerald-800 border-emerald-200 hover:bg-emerald-100"
                }`}
                title="Statut de la synchronisation cloud en temps réel"
              >
                <span className="relative flex h-2 w-2 shrink-0">
                  {syncStatus === "pending" && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  )}
                  {syncStatus === "error" && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      syncStatus === "pending"
                        ? "bg-amber-500"
                        : syncStatus === "error"
                        ? "bg-rose-500"
                        : "bg-emerald-500"
                    }`}
                  ></span>
                </span>

                {syncStatus === "pending" && (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600 shrink-0" />
                    <span className="hidden sm:inline">En attente</span>
                  </>
                )}

                {syncStatus === "saved" && (
                  <>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="hidden sm:inline">Sauvegardé</span>
                  </>
                )}

                {syncStatus === "error" && (
                  <>
                    <CloudOff className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                    <span className="hidden sm:inline">Erreur</span>
                  </>
                )}
              </button>

              {/* Sync Details Popover */}
              {isSyncPopoverOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSyncPopoverOpen(false)}
                  />
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-slate-800">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-3">
                      <div className="flex items-center gap-2">
                        {syncStatus === "saved" && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />}
                        {syncStatus === "pending" && <RefreshCw className="w-4.5 h-4.5 text-amber-600 animate-spin" />}
                        {syncStatus === "error" && <AlertCircle className="w-4.5 h-4.5 text-rose-600" />}
                        <span className="font-bold text-sm text-slate-900">Synchronisation Cloud</span>
                      </div>
                      <button
                        onClick={() => setIsSyncPopoverOpen(false)}
                        className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                        <span className="text-slate-500 font-medium">Statut :</span>
                        <span
                          className={`font-semibold px-2.5 py-0.5 rounded-full text-[11px] ${
                            syncStatus === "pending"
                              ? "bg-amber-100 text-amber-800"
                              : syncStatus === "error"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {syncStatus === "pending" && "En attente / Sauvegarde"}
                          {syncStatus === "saved" && "Sauvegardé en temps réel"}
                          {syncStatus === "error" && "Erreur de connexion"}
                        </span>
                      </div>

                      {lastBackupTime && (
                        <div className="flex items-center justify-between px-1 text-slate-600">
                          <span className="text-slate-400">Dernière synchro :</span>
                          <span className="font-semibold text-slate-700">{lastBackupTime}</span>
                        </div>
                      )}

                      {syncError && (
                        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px] leading-relaxed">
                          <strong>Détail :</strong> {syncError}
                        </div>
                      )}

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 truncate max-w-[140px]" title={deviceId}>
                          ID: {deviceId.substring(0, 10)}...
                        </span>
                        {isAdmin ? (
                          <button
                            onClick={() => {
                              handleForceBackup();
                            }}
                            disabled={isBackingUp || syncStatus === "pending"}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition-all shadow-sm shrink-0"
                          >
                            <RefreshCw className={`w-3 h-3 ${isBackingUp || syncStatus === "pending" ? "animate-spin" : ""}`} />
                            Forcer la synchro
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setIsSyncPopoverOpen(false);
                              requireAdmin("Connectez-vous en tant qu'administrateur (AdminRoot#0) pour forcer la synchronisation Cloud.");
                            }}
                            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold rounded-lg text-[11px] transition-all shrink-0"
                          >
                            <Lock className="w-3 h-3 text-amber-600" />
                            <span>Accès Admin</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="glass-panel relative z-50 flex flex-col gap-2.5 px-3 sm:px-6 py-3 rounded-xl sm:rounded-2xl">
          <div className="flex items-center justify-center gap-3 sm:gap-6 flex-wrap">
            <button
              onClick={() => setIsLegendExpanded(!isLegendExpanded)}
              className="flex items-center gap-1.5 font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl transition-colors border border-slate-200 shrink-0 shadow-sm text-xs sm:text-sm"
            >
              Légende
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform duration-300 ${isLegendExpanded ? "rotate-90 md:rotate-180" : ""}`}
              />
            </button>

            <button
              onClick={() => setIsRestModalOpen(true)}
              className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-[#10a37f] hover:bg-[#0c8c6c] text-white font-medium rounded-lg sm:rounded-xl transition-all shadow-sm shadow-[#10a37f]/20 active:scale-95 shrink-0 justify-center whitespace-nowrap text-xs sm:text-sm"
            >
              <Coffee className="w-3.5 h-3.5" />
              Choix repos
            </button>
            
            <div className="relative" ref={gestionMenuRef}>
              <button
                onClick={() => setIsGestionMenuOpen(!isGestionMenuOpen)}
                className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2.5 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 font-semibold rounded-lg sm:rounded-xl transition-colors border border-slate-200 shrink-0 shadow-sm text-xs sm:text-sm active:scale-95"
              >
                <Settings2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Gestion
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-300 ${isGestionMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {isGestionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-[60] flex flex-col py-1.5"
                  >
                    <button
                      onClick={() => {
                        setIsGestionMenuOpen(false);
                        setLeaveModalYear(year);
                        setIsLeaveModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left"
                    >
                      <Palmtree className="w-4 h-4 text-[#A10684]" />
                      Mes Conges
                    </button>
                    <button
                      onClick={() => {
                        setIsGestionMenuOpen(false);
                        if (icsFileInputRef.current) icsFileInputRef.current.click();
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left"
                    >
                      <CalendarIcon className="w-4 h-4 text-violet-500" />
                      Importer .ics
                      <input 
                        type="file" 
                        accept=".ics" 
                        ref={icsFileInputRef} 
                        onChange={handleICSImport} 
                        className="hidden" 
                      />
                    </button>
                    <button
                      onClick={() => {
                        setIsGestionMenuOpen(false);
                        handleExportExcel();
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => {
                        setIsGestionMenuOpen(false);
                        setIsPdfModalOpen(true);
                      }}
                      disabled={isGeneratingPDF}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left disabled:opacity-50"
                    >
                      {isGeneratingPDF ? (
                        <Loader2 className="w-4 h-4 animate-spin text-[#10a37f]" />
                      ) : (
                        <FileText className="w-4 h-4 text-rose-600" />
                      )}
                      Export PDF
                    </button>
                    <button
                      onClick={() => {
                        setIsGestionMenuOpen(false);
                        setIsShareModalOpen(true);
                      }}
                      className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left"
                    >
                      <Share2 className="w-4 h-4 text-blue-600" />
                      Partager
                    </button>
                      
                    <div className="h-px bg-slate-100 my-1 mx-3" />
                      
                    {isAdmin ? (
                      <>
                        <button
                          onClick={() => {
                            setIsGestionMenuOpen(false);
                            setIsExportGuideOpen(true);
                          }}
                          className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left"
                        >
                          <Smartphone className="w-4 h-4 text-sky-500" />
                          Export Mobile / Web
                        </button>
                        <div className="px-3 pt-1 pb-2 flex flex-col gap-1 mt-1">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-900 border border-emerald-300 rounded-lg text-xs font-bold w-full justify-center">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Mode Admin</span>
                          </div>
                          <button
                            onClick={() => {
                              setIsGestionMenuOpen(false);
                              handleAdminLogout();
                            }}
                            className="flex items-center justify-center gap-1.5 w-full p-1.5 hover:bg-rose-50 rounded-lg transition-colors text-rose-600 text-xs font-medium"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                            Se déconnecter
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setIsGestionMenuOpen(false);
                          setAdminModalNotice(null);
                          setAdminLoginError(null);
                          setIsAdminLoginModalOpen(true);
                        }}
                        className="flex items-center gap-2.5 px-4 py-2 hover:bg-slate-50 text-slate-700 text-sm font-medium transition-colors text-left"
                      >
                        <Shield className="w-4 h-4 text-amber-500" />
                        Admin
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div
            className={`flex flex-wrap items-center justify-center gap-2 sm:gap-4 overflow-hidden transition-all duration-500 ease-in-out ${isLegendExpanded ? "max-h-[500px] md:max-h-20 opacity-100 mt-1" : "max-h-0 opacity-0 m-0"}`}
          >
            {LEGEND.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-1.5 whitespace-nowrap"
              >
                <div
                  className={`w-2.5 h-2.5 sm:w-3.5 sm:h-3.5 rounded-full ${item.dotClass}`}
                ></div>
                <span className="text-[11px] sm:text-xs font-medium text-slate-500">
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] sm:text-xs text-slate-400 w-full mb-0.5">
            Astuce : Cliquez sur un jour pour modifier son statut
          </div>
        </div>

        {/* Hidden Container for PDF export of Full Year */}
        <div className="fixed top-0 left-0 opacity-0 -z-50 pointer-events-none w-0 h-0 overflow-hidden">
          {/* Condensed View : 1 A4 Page */}
          <div
            id="pdf-condensed-page"
            className="bg-white w-[794px] h-[1123px] p-8 flex flex-col font-sans"
          >
            <div className="flex justify-between items-end mb-6 pb-4 border-b-2 border-slate-100">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                  <span className="font-handwritten font-bold text-3xl sm:text-4xl">PlanMasterGO</span> {year}
                </h1>
                <p className="text-slate-500 font-medium mt-1">Vue Annuelle</p>
              </div>
              <div className="text-sm font-medium text-slate-400">
                Généré le {new Date().toLocaleDateString("fr-FR")}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-6 flex-1">
              {MONTHS.map((monthName, index) => (
                <div key={index} className="flex flex-col">
                  <h3 className="text-center font-bold text-slate-700 py-1.5 mb-2 bg-slate-50 rounded-lg text-sm">
                    {monthName}
                  </h3>
                  <div className="grid grid-cols-7 gap-y-1 gap-x-1">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="text-center font-semibold text-[10px] text-slate-400 mb-1"
                      >
                        {day.charAt(0)}
                      </div>
                    ))}

                    {(() => {
                      const firstDay = new Date(year, index, 1);
                      const lastDay = new Date(year, index + 1, 0);
                      const daysInMonth = lastDay.getDate();
                      let startDayOfWeek =
                        firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

                      const days = [];
                      for (let i = 0; i < startDayOfWeek; i++) {
                        days.push(
                          <div key={`empty-${i}`} className="w-6 h-6"></div>,
                        );
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const currentDate = new Date(year, index, d);
                        const state = getDayState(currentDate);
                        const key = getDateKey(currentDate);
                        const hasNote = !!overrides[key]?.note;

                        let bgClass = "bg-transparent text-slate-700";
                        if (state === "work")
                          bgClass = "bg-[#fde047] text-slate-800";
                        else if (state === "rest")
                          bgClass = "bg-[#10a37f] text-white";
                        else if (state === "rest1")
                          bgClass = "bg-[#C7CF00] text-slate-800";
                        else if (state === "training")
                          bgClass = "bg-[#E1712B] text-white";
                        else if (state === "holiday")
                          bgClass = "bg-[#A10684] text-white";
                        else if (state === "sick")
                          bgClass =
                            "bg-white border border-slate-300 text-slate-800";
                        else if (state === "6thday")
                          bgClass = "bg-[#34C924] text-white";
                        else if (state === "children")
                          bgClass = "bg-[#400732] text-white";

                        days.push(
                          <div
                            key={d}
                            className={`w-6 h-6 mx-auto flex items-center justify-center rounded-full text-[10px] font-bold ${bgClass} relative`}
                          >
                            {d}
                            {hasNote && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-blue-500 rounded-full border border-white"></span>
                            )}
                          </div>,
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-center gap-6 flex-wrap">
              {LEGEND.filter((l) => l.id !== "none" && l.id !== "sick").map(
                (l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${l.dotClass}`}></div>
                    <span className="text-xs font-semibold text-slate-600">
                      {l.label}
                    </span>
                  </div>
                ),
              )}
              <div className="flex items-center gap-2 ml-4">
                <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>
                <span className="text-xs font-semibold text-slate-600">
                  Note
                </span>
              </div>
            </div>
          </div>

          {/* Detailed View : 12 A4 Pages */}
          <div id="pdf-detailed-pages" className="flex flex-col gap-10">
            {MONTHS.map((monthName, index) => (
              <div
                key={index}
                id={`pdf-detailed-page-${index}`}
                className="bg-white w-[794px] h-[1123px] p-12 flex flex-col font-sans"
              >
                <div className="flex justify-between items-end mb-8 pb-6 border-b-2 border-slate-100">
                  <div>
                    <h1 className="text-4xl font-bold text-slate-900 leading-tight">
                      <span className="font-handwritten font-bold text-4xl sm:text-5xl">PlanMasterGO</span> {year}
                    </h1>
                    <p className="text-2xl text-[#10a37f] font-bold mt-2">
                      {monthName}
                    </p>
                  </div>
                  {/* Legend */}
                  <div className="flex flex-col gap-2 bg-slate-50 p-4 rounded-xl shadow-sm border border-slate-100">
                    {LEGEND.filter((l) => l.id !== "none" && l.id !== "sick")
                      .reduce((result: any[], value, i, array) => {
                        if (i % 2 === 0) result.push(array.slice(i, i + 2));
                        return result;
                      }, [])
                      .map((pair, pIdx) => (
                        <div key={pIdx} className="flex gap-4">
                          {pair.map((l: any) => (
                            <div
                              key={l.id}
                              className="flex items-center gap-2 w-24"
                            >
                              <div
                                className={`w-4 h-4 rounded-full ${l.dotClass}`}
                              ></div>
                              <span className="text-xs font-bold text-slate-600">
                                {l.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      ))}
                  </div>
                </div>

                {/* Big Month Grid */}
                <div className="flex-none mb-10">
                  <div className="grid grid-cols-7 gap-y-4 gap-x-2">
                    {WEEKDAYS.map((day) => (
                      <div
                        key={day}
                        className="text-center font-bold text-sm text-slate-400 mb-2 uppercase tracking-wide"
                      >
                        {day}
                      </div>
                    ))}
                    {(() => {
                      const firstDay = new Date(year, index, 1);
                      const lastDay = new Date(year, index + 1, 0);
                      const daysInMonth = lastDay.getDate();
                      let startDayOfWeek =
                        firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

                      const days = [];
                      for (let i = 0; i < startDayOfWeek; i++) {
                        days.push(
                          <div key={`empty-${i}`} className="w-16 h-16"></div>,
                        );
                      }

                      for (let d = 1; d <= daysInMonth; d++) {
                        const currentDate = new Date(year, index, d);
                        const state = getDayState(currentDate);
                        const key = getDateKey(currentDate);
                        const hasNote = !!overrides[key]?.note;
                        const hasReminder = !!overrides[key]?.reminder?.enabled;

                        let bgClass = "bg-[#f8fafc] text-slate-700";
                        if (state === "work")
                          bgClass = "bg-[#fde047] text-slate-800 shadow-sm";
                        else if (state === "rest")
                          bgClass = "bg-[#10a37f] text-white shadow-sm";
                        else if (state === "rest1")
                          bgClass = "bg-[#C7CF00] text-slate-800 shadow-sm";
                        else if (state === "training")
                          bgClass = "bg-[#E1712B] text-white shadow-sm";
                        else if (state === "holiday")
                          bgClass = "bg-[#A10684] text-white shadow-sm";
                        else if (state === "sick")
                          bgClass =
                            "bg-white border-2 border-slate-300 text-slate-800";
                        else if (state === "6thday")
                          bgClass = "bg-[#34C924] text-white shadow-sm";
                        else if (state === "children")
                          bgClass = "bg-[#400732] text-white shadow-sm";

                        days.push(
                          <div key={d} className="flex justify-center">
                            <div
                              className={`w-16 h-16 flex items-center justify-center rounded-2xl text-xl font-bold ${bgClass} relative`}
                            >
                              {d}
                              {hasNote && (
                                <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-sm"></span>
                              )}
                              {hasReminder && (
                                <span className="absolute -bottom-1 -right-1.5 w-4 h-4 bg-rose-500 rounded-full border-2 border-white shadow-sm"></span>
                              )}
                            </div>
                          </div>,
                        );
                      }
                      return days;
                    })()}
                  </div>
                </div>

                {/* Notes section */}
                <div className="flex-1 bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-500" />
                    Événements & Notes
                  </h3>
                  <div className="flex-1 flex flex-col flex-wrap gap-x-8 gap-y-3 max-h-[400px]">
                    {(() => {
                      const lastDay = new Date(year, index + 1, 0);
                      const notesList = [];
                      for (let d = 1; d <= lastDay.getDate(); d++) {
                        const date = new Date(year, index, d);
                        const key = getDateKey(date);
                        const stateId = getDayState(date);
                        const stateLabel =
                          LEGEND.find((l) => l.id === stateId)?.label || "";
                        const note = overrides[key]?.note || "";
                        const apptTime = overrides[key]?.appointmentTime;

                        if (
                          note ||
                          apptTime ||
                          overrides[key]?.reminder?.enabled ||
                          (stateId !== "work" &&
                            stateId !== "rest" &&
                            stateId !== "rest1" &&
                            stateId !== "none" &&
                            stateId !== "sick")
                        ) {
                          const dateStr = new Intl.DateTimeFormat("fr-FR", {
                            weekday: "short",
                            day: "2-digit",
                            month: "short",
                          }).format(date);

                          let color = "#94a3b8";
                          if (stateId === "work") color = "#fde047";
                          if (stateId === "rest") color = "#10a37f";
                          if (stateId === "rest1") color = "#C7CF00";
                          if (stateId === "training") color = "#E1712B";
                          if (stateId === "holiday") color = "#A10684";

                          notesList.push(
                            <div
                              key={d}
                              className="flex gap-3 items-start bg-white p-3 rounded-xl shadow-sm border border-slate-100 break-inside-avoid max-w-[320px] w-full"
                              style={{ breakInside: "avoid" }}
                            >
                              <div className="text-sm font-bold text-slate-700 min-w-[70px] pt-0.5">
                                {dateStr}
                              </div>
                              <div>
                                {stateId !== "work" &&
                                  stateId !== "rest" &&
                                  stateId !== "rest1" &&
                                  stateId !== "none" &&
                                  stateId !== "sick" && (
                                    <span
                                      className="inline-block px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide text-white mb-1"
                                      style={{ backgroundColor: color }}
                                    >
                                      {stateLabel}
                                    </span>
                                  )}
                                {apptTime && (
                                  <div className="text-xs font-bold text-amber-900 bg-amber-300 border border-amber-400 px-2 py-0.5 rounded-md w-fit my-1 flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-amber-950" />
                                    RDV à {apptTime.replace(":", "h")}
                                  </div>
                                )}
                                {note && (
                                  <div className="text-sm font-medium text-slate-600 line-clamp-2">
                                    {note}
                                  </div>
                                )}
                                {overrides[key]?.reminder?.enabled && (
                                  <div className="text-xs font-bold text-rose-500 mt-1.5 flex items-center gap-1">
                                    <Bell className="w-3 h-3" />
                                    {overrides[key].reminder?.time}
                                  </div>
                                )}
                              </div>
                            </div>,
                          );
                        }
                      }
                      if (notesList.length === 0) {
                        return (
                          <div className="text-sm text-slate-400 italic">
                            Aucune note ou événement particulier ce mois-ci.
                          </div>
                        );
                      }
                      return notesList;
                    })()}
                  </div>
                </div>

                <div className="mt-6 text-center text-xs font-semibold text-slate-400">
                  © {year} PlanMasterGO
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Grid */}
        <div className="w-full glass-calendar-wrapper p-2 min-[360px]:p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === "annual" ? (
              <motion.div
                key="annual"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.26, ease: [0.4, 0, 0.2, 1] }}
                className="space-y-6"
              >
                {/* Barre de recherche dynamique pour la vue annuelle */}
                <div className="bg-white/90 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center gap-3 justify-between">
                  <div className="flex-1 relative flex items-center">
                    <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 pointer-events-none" />
                    <input
                      type="text"
                      value={annualSearchQuery}
                      onChange={(e) => setAnnualSearchQuery(e.target.value)}
                      placeholder="Filtrer les jours par mot-clé dans leurs notes (ex: médecin, formation, urgent, RDV)..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 rounded-xl py-2 sm:py-2.5 pl-10 pr-9 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 font-medium outline-none transition-all shadow-inner"
                    />
                    {annualSearchQuery && (
                      <button
                        onClick={() => setAnnualSearchQuery("")}
                        className="absolute right-3 p-1 hover:bg-slate-200 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
                        title="Effacer la recherche"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {annualSearchQuery.trim() !== "" && (
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-blue-50 text-blue-900 border border-blue-200/90 rounded-xl text-xs sm:text-sm font-semibold shrink-0 animate-in fade-in zoom-in-95">
                      <span className="relative flex h-2.5 w-2.5">
                        {matchingSearchDaysCount > 0 && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                        )}
                        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${matchingSearchDaysCount > 0 ? "bg-blue-600" : "bg-slate-400"}`}></span>
                      </span>
                      <span>
                        {matchingSearchDaysCount === 0
                          ? "Aucun jour trouvé"
                          : `${matchingSearchDaysCount} jour${matchingSearchDaysCount > 1 ? "s" : ""} trouvé${matchingSearchDaysCount > 1 ? "s" : ""}`}
                      </span>
                    </div>
                  )}
                </div>

                {/* Grille des 12 mois */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {MONTHS.map((_, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.012, ease: "easeOut" }}
                    >
                      {renderMonth(index)}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={`month-${viewDate.getMonth()}-${viewDate.getFullYear()}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="max-w-[500px] mx-auto w-full"
              >
                {renderMonth(viewDate.getMonth(), true)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer */}
      <div className="mt-20 mb-12 px-4 flex justify-center w-full z-10">
        <footer className="text-center w-full max-w-4xl mx-auto flex flex-col items-center gap-4">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-sm font-medium text-slate-500">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200">
                <FloppyLogo className="w-4 h-4 text-slate-600" />
              </div>
              <span className="text-slate-600">
                © {year} <span className="font-handwritten font-bold text-slate-900 text-[15px] px-1">PlanMasterGO</span>
              </span>
            </div>
            
            <span className="hidden sm:inline text-slate-300">•</span>
            
            <a
              href="https://freemastergoo.byethost7.com/?i=2"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-1.5 text-slate-500 hover:text-[#10a37f] transition-colors"
            >
              <span>Distribué par</span>
              <span className="font-semibold text-slate-700 group-hover:text-[#10a37f] transition-colors underline decoration-slate-300 group-hover:decoration-[#10a37f]/50 underline-offset-4">WebmasterGO</span>
            </a>

            {isAdmin && (
              <>
                <span className="hidden sm:inline text-slate-300">•</span>
                <button
                  onClick={() => setIsExportGuideOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors font-semibold border border-slate-200/60"
                >
                  <Smartphone className="w-3.5 h-3.5 text-sky-600" />
                  <span>Exporter App</span>
                </button>
              </>
            )}
          </div>
          
          <button 
            onClick={() => setIsAboutModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200/60 transition-colors text-[11px] font-mono font-semibold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Version 2.2.0
          </button>
        </footer>
      </div>

      {/* Modals & Overlays */}

      {/* About Modal */}
      <AnimatePresence>
        {isAboutModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="glass-modal w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden bg-white"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-slate-800 text-lg">
                  À propos de l'application
                </h3>
                <button
                  onClick={() => setIsAboutModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 text-sm text-slate-600">
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Auteur</h4>
                  <p>L'application PlanMasterGO a été créée par <span className="font-bold text-slate-800">Jimmy</span>.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Conditions Générales de Vente (CGV)</h4>
                  <p>En utilisant cette application, vous acceptez les conditions générales d'utilisation et de vente. L'application est fournie en l'état.</p>
                </div>
                <div>
                  <h4 className="font-bold text-slate-800 mb-2">Gestion des Cookies</h4>
                  <p>L'application n'utilise que des cookies techniques et le stockage local (localStorage) strictement nécessaires à son bon fonctionnement (sauvegarde locale des préférences, authentification, données de session).</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100">
                <button
                  onClick={() => setIsAboutModalOpen(false)}
                  className="px-4 py-2.5 text-white bg-slate-800 font-medium hover:bg-slate-700 rounded-xl transition-colors text-sm"
                >
                  Fermer
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest Modal */}
      {isRestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="glass-modal w-full max-w-3xl rounded-2xl overflow-visible flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[#10a37f]/10 rounded-lg">
                  <Coffee className="w-5 h-5 text-[#10a37f]" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                    Choix repos
                  </h2>
                  <p className="text-sm font-medium text-slate-500">
                    Séquence de 8 créneaux de repos personnalisables
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRestModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-visible">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {restChoices.map((choice, idx) => (
                  <RestButton
                    key={idx}
                    index={idx}
                    currentChoice={choice}
                    onSelect={(newChoice) => {
                      const newChoices = [...restChoices];
                      newChoices[idx] = newChoice;
                      setRestChoices(newChoices);
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsRestModalOpen(false)}
                className="px-6 py-2.5 bg-[#10a37f] hover:bg-[#0e906f] text-white font-medium rounded-xl transition-colors shadow-sm"
              >
                Terminer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Export Modal */}
      {isPdfModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                Format d'export PDF
              </h3>
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div
                onClick={() => setPdfViewType("condensed")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex items-start gap-4 ${pdfViewType === "condensed" ? "border-[#10a37f] bg-[#10a37f]/5" : "border-slate-100 hover:border-slate-200"}`}
              >
                <div
                  className={`p-2 rounded-lg ${pdfViewType === "condensed" ? "bg-[#10a37f] text-white" : "bg-slate-100 text-slate-500"}`}
                >
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">
                    Vue condensée
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    3 mois par page. Idéal pour une vue globale de l'année.
                  </p>
                </div>
              </div>

              <div
                onClick={() => setPdfViewType("detailed")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${pdfViewType === "detailed" ? "border-[#10a37f] bg-[#10a37f]/5" : "border-slate-100 hover:border-slate-200"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${pdfViewType === "detailed" ? "bg-[#10a37f] text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <List className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">
                      Vue détaillée (1 mois)
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Télécharger un mois spécifique, formaté pour feuille A4.
                    </p>
                  </div>
                </div>
                {pdfViewType === "detailed" && (
                  <div className="pl-[52px]">
                    <select
                      value={pdfSelectedMonth}
                      onChange={(e) =>
                        setPdfSelectedMonth(Number(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white"
                    >
                      {MONTHS.map((month, index) => (
                        <option key={index} value={index}>
                          {month}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
              
              <div
                onClick={() => setPdfViewType("custom")}
                className={`cursor-pointer p-4 rounded-xl border-2 transition-all flex flex-col gap-3 ${pdfViewType === "custom" ? "border-[#10a37f] bg-[#10a37f]/5" : "border-slate-100 hover:border-slate-200"}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${pdfViewType === "custom" ? "bg-[#10a37f] text-white" : "bg-slate-100 text-slate-500"}`}
                  >
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 text-sm">
                      Plage personnalisée
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Choisir une date de début et de fin (par mois).
                    </p>
                  </div>
                </div>
                {pdfViewType === "custom" && (
                  <div className="pl-[52px] flex flex-col gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Date de début</label>
                      <input
                        type="date"
                        value={pdfCustomStartDate}
                        onChange={(e) => setPdfCustomStartDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-1.5 px-3 border text-sm outline-none transition-all bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-slate-500 mb-1 block">Date de fin</label>
                      <input
                        type="date"
                        value={pdfCustomEndDate}
                        onChange={(e) => setPdfCustomEndDate(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-1.5 px-3 border text-sm outline-none transition-all bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100">
              <button
                onClick={() => setIsPdfModalOpen(false)}
                className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => generatePDF()}
                className="px-5 py-2.5 bg-[#10a37f] hover:bg-[#0c8c6c] text-white font-medium rounded-xl transition-all shadow-sm shadow-[#10a37f]/20 active:scale-95 text-sm flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exporter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {activeToast && (
        <div className="fixed top-6 right-6 z-[100] bg-white rounded-xl shadow-xl shadow-slate-900/10 border border-slate-100 p-4 max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 flex items-start gap-4">
          <div
            className={`p-3 rounded-full shrink-0 ${activeToast.type === "email" ? "bg-blue-100 text-blue-600" : activeToast.type === "sms" ? "bg-green-100 text-green-600" : "bg-[#10a37f]/10 text-[#10a37f]"}`}
          >
            <Bell className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <h4 className="font-bold text-slate-800 text-sm mb-1">
              {activeToast.title}
            </h4>
            <p className="text-slate-600 text-sm">{activeToast.subtitle}</p>
            {activeToast.type === "email" && (
              <p className="text-xs font-semibold text-blue-500 mt-2 uppercase tracking-wider">
                Email envoyé
              </p>
            )}
            {activeToast.type === "sms" && (
              <p className="text-xs font-semibold text-green-500 mt-2 uppercase tracking-wider">
                SMS envoyé
              </p>
            )}
          </div>
          <button
            onClick={() => setActiveToast(null)}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Simulation Modal */}
      {simulatedNotification && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#10a37f]/10 rounded-xl text-[#10a37f]">
                  <Bell className="w-5 h-5 animate-bounce" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">
                    Simulation de Notification
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">Mode de test visuel interactif</p>
                </div>
              </div>
              <button
                onClick={() => setSimulatedNotification(null)}
                className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Informative Banner */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex gap-3 text-amber-300 text-xs leading-relaxed">
                <span className="text-base select-none">🔔</span>
                <div>
                  <p className="font-semibold mb-0.5 text-amber-200">Aucun secret SMTP / Twilio détecté</p>
                  <p>
                    Pour de vrais envois, veuillez ajouter vos identifiants dans les <strong>Secrets</strong> des paramètres de l'application.
                  </p>
                  <p className="mt-1 font-medium text-amber-400">
                    PlanMasterGO simule le message ci-dessous en temps réel pour tester votre configuration !
                  </p>
                </div>
              </div>

              {/* Smartphone Preview */}
              {simulatedNotification.type === "sms" ? (
                <div className="mx-auto max-w-[280px] bg-slate-950 border-[6px] border-slate-800 rounded-[36px] overflow-hidden shadow-inner relative aspect-[9/16] flex flex-col">
                  {/* Speaker & Camera notches */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-20 h-4 bg-slate-800 rounded-full flex justify-center items-center gap-2 z-20">
                    <div className="w-8 h-1 bg-slate-900 rounded-full"></div>
                    <div className="w-2 h-2 bg-slate-900 rounded-full"></div>
                  </div>
                  
                  {/* Top Mobile Bar */}
                  <div className="pt-7 px-4 pb-2 flex justify-between items-center text-[10px] text-slate-400 font-medium font-mono select-none">
                    <span>12:15</span>
                    <div className="flex items-center gap-1">
                      <span>5G</span>
                      <div className="w-4 h-2 border border-slate-400 rounded-sm p-[1px] flex items-center">
                        <div className="h-full w-3 bg-slate-400 rounded-xs"></div>
                      </div>
                    </div>
                  </div>

                  {/* Messenger Header */}
                  <div className="bg-slate-900/90 py-2.5 px-4 border-b border-slate-800 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold font-sans">
                      P
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white leading-tight">PlanMasterGO</p>
                      <p className="text-[9px] text-slate-400 leading-none">A l'instant</p>
                    </div>
                  </div>

                  {/* Message Screen Area */}
                  <div className="flex-1 p-4 bg-slate-950 overflow-y-auto flex flex-col justify-end space-y-4">
                    <div className="text-[10px] text-slate-500 text-center font-medium my-1">
                      Aujourd'hui
                    </div>
                    
                    {/* Receiver Address */}
                    <div className="text-[9px] text-slate-500 text-center font-mono tracking-wide">
                      Destinataire : {simulatedNotification.to}
                    </div>

                    {/* Chat Bubble */}
                    <div className="bg-slate-800 text-white rounded-2xl rounded-bl-none p-3 text-xs leading-relaxed max-w-[85%] self-start border border-slate-700/50">
                      {simulatedNotification.message}
                      <span className="block text-[9px] text-slate-400 text-right mt-1 font-mono">
                        12:15
                      </span>
                    </div>
                  </div>

                  {/* Message Compose Bar Mockup */}
                  <div className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                    <div className="flex-1 bg-slate-950 rounded-full px-3 py-1 text-[10px] text-slate-500 font-medium select-none">
                      iMessage
                    </div>
                    <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                      <span className="text-xs font-bold font-sans">↑</span>
                    </div>
                  </div>

                  {/* Home Indicator */}
                  <div className="pb-1.5 flex justify-center bg-slate-900">
                    <div className="w-20 h-1 bg-slate-700 rounded-full"></div>
                  </div>
                </div>
              ) : (
                /* Email Preview */
                <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col font-sans">
                  {/* Browser top tabs */}
                  <div className="bg-slate-900/90 py-2.5 px-4 border-b border-slate-800 flex items-center justify-between">
                    <div className="flex gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono tracking-wider truncate max-w-[200px]">
                      Aperçu Email Client
                    </span>
                    <div className="w-4"></div>
                  </div>

                  {/* Email Headers */}
                  <div className="p-4 border-b border-slate-800 space-y-1.5 text-xs text-slate-300">
                    <div>
                      <span className="text-slate-500 font-medium inline-block w-14">De :</span>
                      <span className="font-semibold text-[#10a37f]">PlanMasterGO</span> 
                      <span className="text-slate-500"> &lt;simulation@planmaster.go&gt;</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium inline-block w-14">À :</span>
                      <span className="text-slate-200 font-mono">{simulatedNotification.to}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-medium inline-block w-14">Sujet :</span>
                      <span className="font-bold text-white">Rappel PlanMasterGO 📅</span>
                    </div>
                  </div>

                  {/* Email Body */}
                  <div className="p-6 bg-slate-900 text-slate-200 text-sm leading-relaxed min-h-[140px] flex flex-col justify-between">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 text-[#10a37f] font-bold text-xs uppercase tracking-wider mb-2.5">
                        <Mail className="w-4 h-4" />
                        Nouveau Message de Rappel
                      </div>
                      <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{simulatedNotification.message}</p>
                    </div>

                    <div className="pt-6 border-t border-slate-800/80 flex justify-between items-center text-[10px] text-slate-500">
                      <span>Généré automatiquement par PlanMasterGO</span>
                      <span className="font-mono">Réf: RAP-{Math.floor(Math.random() * 9000) + 1000}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-950 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSimulatedNotification(null)}
                className="px-5 py-2 bg-[#10a37f] hover:bg-[#0c8c6c] text-white font-semibold text-xs rounded-xl transition-all shadow-sm shadow-[#10a37f]/10 active:scale-95"
              >
                Fermer l'aperçu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                Paramètres & Synchronisation
              </h3>
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab selection */}
            <div className="flex border-b border-slate-100 bg-slate-50/20 px-2 sm:px-4">
              <button
                onClick={() => setActiveSettingsTab("notifications")}
                className={`flex-1 py-3 text-center text-[11px] sm:text-sm font-semibold transition-all border-b-2 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 ${
                  activeSettingsTab === "notifications"
                    ? "border-[#10a37f] text-[#10a37f]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notifications</span>
              </button>
              <button
                onClick={() => setActiveSettingsTab("sync")}
                className={`flex-1 py-3 text-center text-[11px] sm:text-sm font-semibold transition-all border-b-2 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 ${
                  activeSettingsTab === "sync"
                    ? "border-[#10a37f] text-[#10a37f]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Cloud className="w-4 h-4" />
                <span className="hidden sm:inline">Cloud</span>
              </button>
              <button
                onClick={() => setActiveSettingsTab("security")}
                className={`flex-1 py-3 text-center text-[11px] sm:text-sm font-semibold transition-all border-b-2 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 ${
                  activeSettingsTab === "security"
                    ? "border-[#10a37f] text-[#10a37f]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">Sécurité</span>
              </button>
              <button
                onClick={() => setActiveSettingsTab("display")}
                className={`flex-1 py-3 text-center text-[11px] sm:text-sm font-semibold transition-all border-b-2 flex flex-col sm:flex-row justify-center items-center gap-1 sm:gap-2 ${
                  activeSettingsTab === "display"
                    ? "border-[#10a37f] text-[#10a37f]"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                <Eye className="w-4 h-4" />
                <span className="hidden sm:inline">Affichage</span>
              </button>
            </div>

            <div className="p-6">
              {activeSettingsTab === "notifications" ? (
                <div className="space-y-5">
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Mail className="w-4 h-4 text-[#10a37f]" />
                        Adresse Email pour rappels
                      </label>
                      <button 
                        onClick={() => handleTestNotification('email')}
                        disabled={!notificationEmail || isTestingNotification}
                        className="text-[11px] bg-[#10a37f]/10 hover:bg-[#10a37f]/20 disabled:opacity-50 text-[#10a37f] px-2.5 py-1 rounded-lg font-bold transition-colors"
                      >
                        {isTestingNotification ? "Envoi..." : "Tester Email"}
                      </button>
                    </div>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => {
                        setNotificationEmail(e.target.value);
                        localStorage.setItem("planmastergo_email", e.target.value);
                      }}
                      placeholder="votre@email.com"
                      className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white font-mono text-slate-800"
                    />
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-sky-600" />
                        Numéro SMS (Twilio Integration)
                      </label>
                      <button 
                        onClick={() => handleTestNotification('sms')}
                        disabled={!notificationPhone || isTestingNotification}
                        className="text-[11px] bg-sky-100 hover:bg-sky-200 disabled:opacity-50 text-sky-800 px-2.5 py-1 rounded-lg font-bold transition-colors"
                      >
                        {isTestingNotification ? "Envoi..." : "Tester SMS Twilio"}
                      </button>
                    </div>
                    <input
                      type="tel"
                      value={notificationPhone}
                      onChange={(e) => {
                        setNotificationPhone(e.target.value);
                        localStorage.setItem("planmastergo_phone", e.target.value);
                      }}
                      placeholder="+33612345678"
                      className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white font-mono text-slate-800"
                    />
                  </div>

                  <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-2 text-xs text-sky-900">
                    <div className="flex items-center gap-2 font-bold text-sky-800">
                      <Smartphone className="w-4 h-4 text-sky-600" />
                      <span>Intégration SMS Twilio & Email Automatique</span>
                    </div>
                    <p className="leading-relaxed">
                      L'application supporte les notifications en direct via <strong>Twilio</strong> pour les SMS et <strong>SMTP</strong> pour les e-mails.
                    </p>
                    <p className="leading-relaxed text-[11px] text-sky-800/90">
                      • Pour activer l'envoi réel de SMS Twilio, configurez les variables <code>TWILIO_ACCOUNT_SID</code>, <code>TWILIO_AUTH_TOKEN</code> et <code>TWILIO_PHONE_NUMBER</code> dans les paramètres d'environnement de l'application.
                      <br />
                      • En l'absence de clés d'API, le mode <strong>Simulation Twilio</strong> affiche automatiquement un pop-up d'alerte SMS à l'écran avec le texte exact du message.
                    </p>
                  </div>
                </div>
              ) : activeSettingsTab === "sync" ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Votre Code de Synchronisation
                    </span>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono font-bold text-slate-700 overflow-x-auto whitespace-nowrap select-all">
                        {deviceId}
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(deviceId);
                          setActiveToast({
                            id: "copy-code",
                            title: "Code copié !",
                            subtitle: "Le code a été copié dans votre presse-papiers.",
                            type: "in-app",
                          });
                          setTimeout(() => setActiveToast(current => current?.id === "copy-code" ? null : current), 3000);
                        }}
                        className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 transition-colors shrink-0"
                        title="Copier le code"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Partagez ce code ou saisissez-le sur un autre hébergeur (comme Vercel) pour restaurer instantanément vos données.
                    </p>
                  </div>

                  <div className="flex items-center justify-between bg-slate-50/50 p-3 rounded-xl border border-dashed border-slate-200">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-500 block uppercase tracking-wider text-[9px] mb-0.5">Dernière sauvegarde :</span>
                      <span className="text-slate-700 font-bold font-mono">
                        {lastBackupTime || "Aucune sauvegarde"}
                      </span>
                    </div>
                    {isAdmin ? (
                      <button
                        onClick={handleForceBackup}
                        disabled={isBackingUp}
                        className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold rounded-xl transition-all text-xs border border-slate-200 active:scale-95 shrink-0 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? "animate-spin" : ""}`} />
                        {isBackingUp ? "Synchro..." : "Sauvegarder l'ensemble"}
                      </button>
                    ) : (
                      <button
                        onClick={() => requireAdmin("Connectez-vous en tant qu'administrateur (AdminRoot#0) pour sauvegarder l'ensemble des données.")}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-semibold rounded-xl transition-all text-xs active:scale-95 shrink-0 shadow-sm"
                      >
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        <span>Sauvegarder (Admin)</span>
                      </button>
                    )}
                  </div>

                  <div className="border-t border-slate-100 pt-4">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                      Importer un planning existant
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={importCode}
                        onChange={(e) => setImportCode(e.target.value)}
                        placeholder="Saisir un code de synchro"
                        className="flex-1 border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-xs outline-none transition-all bg-white font-mono"
                      />
                      <button
                        onClick={() => handleImportSync(importCode)}
                        disabled={isImporting || !importCode.trim()}
                        className="px-4 py-2 bg-[#10a37f] hover:bg-[#0c8c6c] disabled:opacity-50 text-white font-semibold rounded-xl text-xs transition-colors shadow-sm whitespace-nowrap active:scale-95"
                      >
                        {isImporting ? "Import..." : "Importer"}
                      </button>
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === "security" ? (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex justify-between items-center mb-3">
                      <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Protection par Code PIN
                      </span>
                      <Shield className={`w-4 h-4 ${appPin ? "text-[#10a37f]" : "text-slate-400"}`} />
                    </div>
                    <p className="text-[11px] text-slate-500 mb-4 leading-relaxed">
                      Sécurisez l'accès à votre application et protégez vos données lors de l'importation de votre profil sur un autre appareil.
                    </p>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                          {appPin ? "Modifier le Code PIN" : "Créer un Code PIN"}
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          value={appPin}
                          onChange={(e) => setAppPin(e.target.value.replace(/[^0-9]/g, ''))}
                          placeholder="Code à 4 chiffres"
                          className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white font-mono tracking-widest text-center"
                        />
                      </div>
                      
                      {appPin && (
                        <button
                          onClick={() => setAppPin("")}
                          className="w-full py-2 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                        >
                          Désactiver la protection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : activeSettingsTab === "display" ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-3">
                    <h4 className="font-semibold text-slate-700 text-sm flex items-center gap-1.5 mb-2">
                      <Calendar className="w-4 h-4 text-[#10a37f]" />
                      Calendrier
                    </h4>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <div className="relative inline-block w-10 h-5 transition duration-200 ease-in-out rounded-full cursor-pointer">
                        <input
                          type="checkbox"
                          className="absolute w-0 h-0 opacity-0"
                          checked={showFrenchHolidays}
                          onChange={(e) => setShowFrenchHolidays(e.target.checked)}
                        />
                        <span className={`absolute inset-0 transition-colors duration-200 ease-in-out rounded-full ${showFrenchHolidays ? 'bg-[#10a37f]' : 'bg-slate-300'}`}></span>
                        <span className={`absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full transition-transform duration-200 ease-in-out ${showFrenchHolidays ? 'translate-x-5' : 'translate-x-0'} shadow-sm`}></span>
                      </div>
                      <span className="text-sm font-medium text-slate-700">Afficher automatiquement les jours fériés français</span>
                    </label>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50/50">
              <button
                onClick={() => setIsSettingsModalOpen(false)}
                className="px-4 py-2 font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveSettings}
                className="px-4 py-2 font-medium text-white bg-[#10a37f] hover:bg-[#0c8c6c] rounded-xl transition-colors shadow-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg">
                Partager le planning
              </h3>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-2">
              <button
                onClick={handleEmailShare}
                className="flex items-center gap-4 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-slate-700 font-medium"
              >
                <div className="bg-blue-100 text-blue-600 p-2.5 rounded-lg">
                  <Mail className="w-5 h-5" />
                </div>
                Envoyer par email
              </button>
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-4 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-slate-700 font-medium"
              >
                <div className="bg-green-100 text-green-600 p-2.5 rounded-lg">
                  {copiedLink ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <LinkIcon className="w-5 h-5" />
                  )}
                </div>
                {copiedLink ? "Lien copié !" : "Copier le lien"}
              </button>
              <button
                onClick={() => generatePDF("print")}
                className="flex items-center gap-4 w-full p-3 hover:bg-slate-50 rounded-xl transition-colors text-left text-slate-700 font-medium"
              >
                <div className="bg-purple-100 text-purple-600 p-2.5 rounded-lg">
                  <Printer className="w-5 h-5" />
                </div>
                Imprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Multi-Select Action Bar */}
      {selectedDates.length > 0 && !isModalOpen && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 bg-slate-800 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 animate-in slide-in-from-bottom-8">
          <span className="font-semibold">{selectedDates.length} jour(s) sélectionné(s)</span>
          <div className="flex gap-2">
            <button 
              onClick={() => {
                // Initialize modal state based on the first selected date or default
                if (selectedDates.length > 0) {
                  const key = getDateKey(selectedDates[0]);
                  const existing = overrides[key];
                  setEditState(existing?.state || getDayState(selectedDates[0]));
                  setEditNote(existing?.note || "");
                  setEditAppointmentTime(existing?.appointmentTime || "");
                  setEditReminderEnabled(existing?.reminder?.enabled || false);
                  setEditReminderType(existing?.reminder?.type || "email");
                  setEditReminderTime(existing?.reminder?.time || existing?.appointmentTime || "09:00");
                }
                setIsModalOpen(true);
              }} 
              className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-slate-100 transition-colors"
            >
              Modifier
            </button>
            <button 
              onClick={() => { 
                setSelectedDates([]); 
              }} 
              className="bg-white/20 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-white/30 transition-colors"
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Edit Day Modal */}
      {isModalOpen && selectedDates.length > 0 && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal rounded-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-bold text-slate-800 text-lg capitalize">
                {selectedDates.length === 1
                  ? new Intl.DateTimeFormat("fr-FR", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    }).format(selectedDates[0])
                  : `${selectedDates.length} jours sélectionnés`}
              </h3>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDates([]);
                }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full p-1.5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Statut du jour
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {LEGEND.filter((l) => l.id !== "none").map((l) => {
                    const isSelected = editState === l.id;
                    return (
                      <button
                        key={l.id}
                        onClick={() => setEditState(l.id)}
                        className={`flex items-center gap-2 p-2 border rounded-lg transition-all ${
                          isSelected
                            ? "border-[#10a37f] bg-[#10a37f]/5 ring-1 ring-[#10a37f]"
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`w-3 h-3 rounded-full shrink-0 ${l.dotClass}`}
                        ></div>
                        <span className="text-sm font-medium text-slate-700">
                          {l.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                  <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    Note (optionnelle)
                    {editAppointmentTime && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-bold bg-amber-300 text-amber-950 border border-amber-400/80 shadow-xs animate-in fade-in duration-200">
                        <Clock className="w-3.5 h-3.5 text-amber-950" />
                        {editAppointmentTime.replace(":", "h")}
                      </span>
                    )}
                  </label>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#10a37f]" />
                    <span className="text-xs font-semibold text-slate-600 hidden sm:inline">Choix horaire RDV :</span>
                    <input
                      type="time"
                      value={editAppointmentTime}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditAppointmentTime(val);
                        if (val) {
                          setEditReminderTime(val);
                        }
                      }}
                      className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-amber-50/80 focus:bg-white focus:border-[#10a37f] focus:ring-2 focus:ring-[#10a37f]/20 outline-none shadow-xs transition-all cursor-pointer font-mono"
                    />
                    {editAppointmentTime && (
                      <button
                        type="button"
                        onClick={() => setEditAppointmentTime("")}
                        className="text-slate-400 hover:text-slate-600 text-xs px-1 font-bold"
                        title="Effacer l'horaire"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick time pills */}
                <div className="flex items-center gap-1.5 mb-2.5 overflow-x-auto pb-1 hide-scrollbar">
                  <span className="text-[11px] font-medium text-slate-400 shrink-0">Accès rapide :</span>
                  {["08:00", "10:00", "12:00", "14:00", "18:00", "20:00", "22:00"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setEditAppointmentTime(t);
                        setEditReminderTime(t);
                      }}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-semibold transition-all shrink-0 ${
                        editAppointmentTime === t
                          ? "bg-amber-300 text-amber-950 font-bold shadow-xs border border-amber-400"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60"
                      }`}
                    >
                      {t.replace(":", "h")}
                    </button>
                  ))}
                </div>

                <textarea
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Ajouter une particularité ou détails du rdv (ex: RDV médical, réunion...)"
                  className="w-full border-slate-200 rounded-xl shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-3 px-4 border min-h-[85px] text-sm resize-none outline-none transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between mb-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editReminderEnabled}
                      onChange={(e) => setEditReminderEnabled(e.target.checked)}
                      className="rounded border-slate-300 text-[#10a37f] focus:ring-[#10a37f]"
                    />
                    <span className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-slate-500" />
                      Activer un rappel
                    </span>
                  </label>
                </div>

                {editReminderEnabled && (
                  <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Méthode de rappel
                        </label>
                        <select
                          value={editReminderType}
                          onChange={(e) =>
                            setEditReminderType(
                              e.target.value as "email" | "in-app" | "sms",
                            )
                          }
                          className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white"
                        >
                          <option value="email">Email automatique</option>
                          <option value="in-app">Alerte In-App</option>
                          <option value="sms">SMS</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Heure du rappel
                        </label>
                        <input
                          type="time"
                          value={editReminderTime}
                          onChange={(e) => setEditReminderTime(e.target.value)}
                          className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 text-slate-700">
                          <Clock className="w-4 h-4 text-[#10a37f]" />
                          Délai de rappel
                        </span>
                        {editReminderTiming === "48h" && (
                          <span className="text-[11px] bg-[#10a37f]/10 text-[#10a37f] font-bold px-2 py-0.5 rounded-full">
                            Recommandé (48h)
                          </span>
                        )}
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {[
                          {
                            id: "7d",
                            label: "7 jours avant",
                            desc: "1 semaine en avance",
                            icon: CalendarDays,
                            badge: "7j",
                          },
                          {
                            id: "48h",
                            label: "48 heures avant",
                            desc: "2 jours en avance",
                            icon: Zap,
                            badge: "48h",
                          },
                          {
                            id: "24h",
                            label: "24 heures avant",
                            desc: "La veille de la date",
                            icon: BellRing,
                            badge: "24h",
                          },
                          {
                            id: "same-day",
                            label: "Le jour même",
                            desc: "À l'heure exacte fixée",
                            icon: Clock,
                            badge: "Jour J",
                          },
                        ].map((item) => {
                          const isSelected = editReminderTiming === item.id;
                          const IconComp = item.icon;
                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => setEditReminderTiming(item.id as "7d" | "48h" | "24h" | "same-day")}
                              className={`p-2.5 rounded-xl border text-left transition-all flex items-center gap-3 relative cursor-pointer ${
                                isSelected
                                  ? "border-[#10a37f] bg-[#10a37f]/10 shadow-xs ring-1 ring-[#10a37f]"
                                  : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                              }`}
                            >
                              <div
                                className={`p-2 rounded-lg shrink-0 transition-colors ${
                                  isSelected
                                    ? "bg-[#10a37f] text-white"
                                    : "bg-slate-100 text-slate-500"
                                }`}
                              >
                                <IconComp className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-bold leading-tight ${isSelected ? "text-[#10a37f]" : "text-slate-800"}`}>
                                    {item.label}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-3.5 h-3.5 text-[#10a37f] shrink-0" />
                                  )}
                                </div>
                                <span className="text-[11px] text-slate-500 block leading-tight mt-0.5">
                                  {item.desc}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {editReminderType === "email" && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                          Adresse Email destinataire
                        </label>
                        <div className="relative">
                          <input
                            type="email"
                            value={editReminderEmailInput}
                            onChange={(e) => setEditReminderEmailInput(e.target.value)}
                            placeholder="votre.email@exemple.com"
                            className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 pl-9 pr-3 border text-sm outline-none transition-all bg-white font-mono text-slate-800"
                          />
                          <Mail className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Un e-mail de confirmation sera automatiquement envoyé immédiatement à cette adresse lors de la sauvegarde de la note, et le rappel automatique ({editReminderTiming === "7d" ? "7 jours avant" : editReminderTiming === "48h" ? "48h avant" : editReminderTiming === "24h" ? "24h avant" : "le jour même"}) sera programmé.
                        </p>
                      </div>
                    )}

                    {editReminderType === "sms" && (
                      <div className="pt-2 border-t border-slate-200/60">
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                          <span>Numéro SMS (Twilio)</span>
                          <span className="text-[10px] bg-sky-100 text-sky-800 font-bold px-2 py-0.5 rounded-full">Twilio SMS</span>
                        </label>
                        <div className="relative">
                          <input
                            type="tel"
                            value={editReminderPhoneInput}
                            onChange={(e) => setEditReminderPhoneInput(e.target.value)}
                            placeholder="+33612345678"
                            className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 pl-9 pr-3 border text-sm outline-none transition-all bg-white font-mono text-slate-800"
                          />
                          <Phone className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                          Un SMS de confirmation Twilio sera envoyé immédiatement à ce numéro lors de la sauvegarde, et le rappel automatique ({editReminderTiming === "7d" ? "7 jours avant" : editReminderTiming === "48h" ? "48h avant" : editReminderTiming === "24h" ? "24h avant" : "le jour même"}) sera programmé.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 flex justify-end gap-3 rounded-b-2xl border-t border-slate-100">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDates([]);
                }}
                className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-200 rounded-xl transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour enregistrer des modifications sur le planning.")) {
                    return;
                  }

                  const targetEmail = editReminderEmailInput.trim() || notificationEmail.trim();
                  const targetPhone = editReminderPhoneInput.trim() || notificationPhone.trim();

                  if (targetEmail && targetEmail !== notificationEmail) {
                    setNotificationEmail(targetEmail);
                    localStorage.setItem("planmastergo_email", targetEmail);
                  }
                  if (targetPhone && targetPhone !== notificationPhone) {
                    setNotificationPhone(targetPhone);
                    localStorage.setItem("planmastergo_phone", targetPhone);
                  }

                  setOverrides((prev) => {
                    const next = { ...prev };
                    selectedDates.forEach((date) => {
                      next[getDateKey(date)] = {
                        state: editState,
                        note: editNote,
                        appointmentTime: editAppointmentTime || undefined,
                        reminder: editReminderEnabled
                          ? {
                              enabled: true,
                              type: editReminderType,
                              time: editReminderTime || editAppointmentTime || "09:00",
                              timing: editReminderTiming,
                              emailTo: targetEmail,
                              phoneTo: targetPhone,
                            }
                          : undefined,
                      };
                    });
                    return next;
                  });

                  if (editReminderEnabled && editReminderType === "email") {
                    if (!targetEmail) {
                      alert("Veuillez saisir une adresse email pour l'envoi de la notification automatique.");
                    } else {
                      const datesFormatted = selectedDates.map(d => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })).join(", ");
                      const timingLabel = editReminderTiming === "7d" ? "7 jours avant la date" : editReminderTiming === "48h" ? "48 heures avant la date (2 jours avant)" : editReminderTiming === "24h" ? "24 heures avant la date" : "Le jour même";

                      const emailBody = `Bonjour,\n\nVotre note et rappel PlanMasterGO ont été enregistrés avec succès !\n\n📅 Date(s) concernée(s) : ${datesFormatted}\n📝 Note / Détails : ${editNote || "Aucune note saisie"}\n⏰ Heure : ${editAppointmentTime || "Non précisée"}\n⚡ Rappel automatique : ${timingLabel} à ${editReminderTime || "09:00"}\n\nL'email de rappel vous sera délivré à l'échéance programmée à l'adresse : ${targetEmail}.\n\nCordialement,\nL'équipe PlanMasterGO`;

                      try {
                        const res = await fetch("/api/notify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type: "email",
                            to: targetEmail,
                            message: emailBody,
                          }),
                        });

                        const text = await res.text();
                        let data: any = {};
                        try { data = JSON.parse(text); } catch (e) {}

                        if (res.ok) {
                          setActiveToast({
                            id: "auto-mail-" + Date.now(),
                            title: `Notification Email (${editReminderTiming === "7d" ? "Rappel 7 jours" : editReminderTiming === "48h" ? "Rappel 48h" : "Rappel"}) Activée`,
                            subtitle: `Un mail de confirmation a été envoyé à ${targetEmail} pour la note du ${datesFormatted}.`,
                            type: "email",
                          });

                          if (data.simulated) {
                            setSimulatedNotification({
                              type: "email",
                              to: targetEmail,
                              message: emailBody,
                              info: data.info || "Notification automatique simulée avec succès.",
                            });
                          }
                        } else {
                          setActiveToast({
                            id: "auto-mail-err-" + Date.now(),
                            title: "Erreur Notification Email",
                            subtitle: data.error || "Impossible d'envoyer le mail automatique.",
                            type: "in-app",
                          });
                        }
                      } catch (err: any) {
                        console.error("Erreur envoi email automatique:", err);
                      }
                    }
                  } else if (editReminderEnabled && editReminderType === "sms") {
                    if (!targetPhone) {
                      alert("Veuillez saisir un numéro de téléphone pour l'envoi du SMS Twilio.");
                    } else {
                      const datesFormatted = selectedDates.map(d => d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })).join(", ");
                      const timingLabel = editReminderTiming === "7d" ? "7j avant" : editReminderTiming === "48h" ? "48h avant" : editReminderTiming === "24h" ? "24h avant" : "le jour même";
                      const smsBody = `PlanMasterGO: Rappel programmé pour le ${datesFormatted} (${timingLabel} à ${editReminderTime || "09:00"}). Note: ${editNote || "Rendez-vous"}`;

                      try {
                        const res = await fetch("/api/notify", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            type: "sms",
                            to: targetPhone,
                            message: smsBody,
                          }),
                        });

                        const text = await res.text();
                        let data: any = {};
                        try { data = JSON.parse(text); } catch (e) {}

                        if (res.ok) {
                          setActiveToast({
                            id: "auto-sms-" + Date.now(),
                            title: `Notification SMS Twilio (${editReminderTiming === "7d" ? "Rappel 7 jours" : editReminderTiming === "48h" ? "Rappel 48h" : "Rappel"}) Activée`,
                            subtitle: `Un SMS de confirmation a été envoyé à ${targetPhone}.`,
                            type: "sms",
                          });

                          if (data.simulated) {
                            setSimulatedNotification({
                              type: "sms",
                              to: targetPhone,
                              message: smsBody,
                              info: data.info || "Notification SMS Twilio simulée. Pour de vrais SMS, configurez TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN et TWILIO_PHONE_NUMBER dans les Secrets.",
                            });
                          }
                        } else {
                          setActiveToast({
                            id: "auto-sms-err-" + Date.now(),
                            title: "Erreur SMS Twilio",
                            subtitle: data.error || "Impossible d'envoyer le SMS.",
                            type: "in-app",
                          });
                        }
                      } catch (err: any) {
                        console.error("Erreur envoi SMS Twilio:", err);
                      }
                    }
                  } else if (editReminderEnabled) {
                    const datesFormatted = selectedDates.map(d => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long" })).join(", ");
                    setActiveToast({
                      id: "auto-reminder-" + Date.now(),
                      title: `Rappel ${editReminderTiming === "7d" ? "7 jours" : editReminderTiming === "48h" ? "48h" : editReminderTiming} enregistré`,
                      subtitle: `Rappel activé pour le ${datesFormatted} à ${editReminderTime}.`,
                      type: editReminderType,
                    });
                  }

                  setIsModalOpen(false);
                  setSelectedDates([]);
                }}
                className="px-5 py-2.5 bg-[#10a37f] hover:bg-[#0c8c6c] text-white font-medium rounded-xl transition-all shadow-sm shadow-[#10a37f]/20 active:scale-95 text-sm"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leave Management Modal */}
      {isLeaveModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="glass-modal rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200 shadow-2xl border border-slate-200">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-[#A10684]/10 rounded-xl text-[#A10684]">
                  <Palmtree className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base sm:text-lg leading-tight">
                    Gestion des Congés & Absences
                  </h3>
                  <p className="text-xs text-slate-500">
                    Récapitulatif chronologique et ajout de jours
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="p-2 hover:bg-slate-200/80 rounded-full transition-colors text-slate-500 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Year Selector & Stats Header */}
            <div className="px-4 sm:px-6 py-3 bg-slate-100/50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
              {/* Year Nav */}
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-sm">
                <button
                  onClick={() => setLeaveModalYear((y) => y - 1)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Année précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-bold text-slate-800 text-sm sm:text-base px-1">
                  {leaveModalYear}
                </span>
                <button
                  onClick={() => setLeaveModalYear((y) => y + 1)}
                  className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                  title="Année suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Summary Stats */}
              {(() => {
                const { daysList } = getLeaveDaysAndPeriods(leaveModalYear);
                const totalHoliday = daysList.filter((d) => d.state === "holiday").length;
                const totalSick = daysList.filter((d) => d.state === "sick").length;

                return (
                  <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
                    <span className="px-2.5 py-1 bg-[#A10684]/10 text-[#A10684] rounded-lg border border-[#A10684]/20 font-semibold">
                      Congés : {totalHoliday} j
                    </span>
                    <span className="px-2.5 py-1 bg-slate-200 text-slate-700 rounded-lg border border-slate-300 font-semibold">
                      Maladie : {totalSick} j
                    </span>
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 font-semibold">
                      Total : {daysList.length} j
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Filter Tabs & Add Button */}
            <div className="px-4 sm:px-6 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-white">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setLeaveModalFilter("all")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    leaveModalFilter === "all"
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Tous
                </button>
                <button
                  onClick={() => setLeaveModalFilter("holiday")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    leaveModalFilter === "holiday"
                      ? "bg-[#A10684] text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Congés
                </button>
                <button
                  onClick={() => setLeaveModalFilter("sick")}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    leaveModalFilter === "sick"
                      ? "bg-slate-700 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Maladie
                </button>
              </div>

              <button
                onClick={() => {
                  if (!isAdmin && !isAddingLeave) {
                    requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour ajouter un congé.");
                    return;
                  }
                  setIsAddingLeave((prev) => !prev);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#10a37f] hover:bg-[#0c8c6c] text-white text-xs sm:text-sm font-semibold rounded-xl transition-all shadow-sm active:scale-95"
              >
                <Plus className="w-4 h-4" />
                {isAddingLeave ? "Fermer la saisie" : "Poser congé / maladie"}
              </button>
            </div>

            {/* Add Leave Form (Collapsible) */}
            {isAddingLeave && (
              <div className="px-4 sm:px-6 py-4 bg-emerald-50/50 border-b border-emerald-100 space-y-3 animate-in slide-in-from-top-2 duration-150">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                  Nouveau congé / absence sur une période
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Date de début
                    </label>
                    <input
                      type="date"
                      value={addLeaveStartDate}
                      onChange={(e) => setAddLeaveStartDate(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Date de fin
                    </label>
                    <input
                      type="date"
                      value={addLeaveEndDate}
                      onChange={(e) => setAddLeaveEndDate(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Type d'absence
                    </label>
                    <select
                      value={addLeaveState}
                      onChange={(e) => setAddLeaveState(e.target.value as "holiday" | "sick")}
                      className="w-full text-xs sm:text-sm p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                    >
                      <option value="holiday">Congés</option>
                      <option value="sick">Maladie</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">
                      Note / Motif (optionnel)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Congés été"
                      value={addLeaveNote}
                      onChange={(e) => setAddLeaveNote(e.target.value)}
                      className="w-full text-xs sm:text-sm p-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#10a37f]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => {
                      setIsAddingLeave(false);
                      setAddLeaveStartDate("");
                      setAddLeaveEndDate("");
                      setAddLeaveNote("");
                    }}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-200 rounded-lg transition-colors font-medium"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => {
                      if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour enregistrer un congé.")) {
                        return;
                      }
                      if (!addLeaveStartDate || !addLeaveEndDate) return;
                      const start = new Date(addLeaveStartDate + "T00:00:00");
                      const end = new Date(addLeaveEndDate + "T00:00:00");
                      if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) return;

                      setOverrides((prev) => {
                        const next = { ...prev };
                        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                          const key = getDateKey(d);
                          const existingNote = next[key]?.note || "";
                          const combinedNote = addLeaveNote
                            ? existingNote
                              ? `${existingNote} - ${addLeaveNote}`
                              : addLeaveNote
                            : existingNote;

                          next[key] = {
                            ...next[key],
                            state: addLeaveState,
                            note: combinedNote,
                          };
                        }
                        return next;
                      });

                      setIsAddingLeave(false);
                      setAddLeaveStartDate("");
                      setAddLeaveEndDate("");
                      setAddLeaveNote("");
                    }}
                    className="px-4 py-1.5 bg-[#10a37f] hover:bg-[#0c8c6c] text-white text-xs font-bold rounded-lg transition-all shadow-sm active:scale-95"
                  >
                    Valider et enregistrer
                  </button>
                </div>
              </div>
            )}

            {/* Scrollable Chronological Content */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-3">
              {(() => {
                const { periods } = getLeaveDaysAndPeriods(leaveModalYear);
                const filteredPeriods = periods.filter((p) => {
                  if (leaveModalFilter === "all") return true;
                  return p.state === leaveModalFilter;
                });

                if (filteredPeriods.length === 0) {
                  return (
                    <div className="py-12 text-center text-slate-400 space-y-3">
                      <Palmtree className="w-12 h-12 mx-auto text-slate-300 stroke-[1.5]" />
                      <p className="text-sm font-medium text-slate-600">
                        Aucun congé ni journée de maladie répertorié en {leaveModalYear}.
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Utilisez le bouton "+ Poser congé / maladie" ci-dessus ou cliquez sur un jour du calendrier pour ajouter une absence.
                      </p>
                    </div>
                  );
                }

                return filteredPeriods.map((period) => {
                  const isHoliday = period.state === "holiday";
                  const startStr = period.startDate.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });
                  const endStr = period.endDate.toLocaleDateString("fr-FR", {
                    weekday: "short",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={period.id}
                      className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                              isHoliday
                                ? "bg-[#A10684] text-white"
                                : "bg-slate-700 text-white"
                            }`}
                          >
                            {isHoliday ? "Congés" : "Maladie"}
                          </span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            {period.daysCount} {period.daysCount > 1 ? "jours" : "jour"}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-800">
                          {period.daysCount === 1 ? (
                            <span className="capitalize">{startStr}</span>
                          ) : (
                            <span>
                              Du <span className="capitalize">{startStr}</span> au{" "}
                              <span className="capitalize">{endStr}</span>
                            </span>
                          )}
                        </div>

                        {period.notes.length > 0 && (
                          <div className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg border border-slate-100">
                            Note : {period.notes.join(" | ")}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                        <button
                          onClick={() => {
                            if (!requireAdmin("Connexion Administrateur (AdminRoot#0) requise pour supprimer un congé.")) {
                              return;
                            }
                            setOverrides((prev) => {
                              const next = { ...prev };
                              period.days.forEach((d) => {
                                delete next[d.key];
                              });
                              return next;
                            });
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors font-medium"
                          title="Supprimer ce congé de votre planning"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center rounded-b-2xl">
              <span className="text-xs text-slate-500 font-medium">
                PlanMasterGO • Année {leaveModalYear}
              </span>
              <button
                onClick={() => setIsLeaveModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-medium rounded-xl transition-all text-xs sm:text-sm shadow-sm"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Export & Cross-Platform Deployment Modal */}
      {isExportGuideOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-md">
          <div className="glass-modal w-full max-w-4xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] bg-white animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-sky-500/20 rounded-2xl border border-sky-400/30 text-sky-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    Guide d'Exportation & App Mobile (iOS / Android / Web)
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-300">
                    Comment exporter votre projet PlanMasterGO et l'implémenter partout
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsExportGuideOpen(false)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-1 sm:gap-2 p-2 bg-slate-100 border-b border-slate-200 overflow-x-auto text-xs sm:text-sm font-semibold scrollbar-none">
              <button
                onClick={() => setActiveExportTab("export")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeExportTab === "export"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Download className="w-4 h-4 text-emerald-600" />
                <span>1. Exporter Code</span>
              </button>
              <button
                onClick={() => setActiveExportTab("ios")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeExportTab === "ios"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <span className="text-base leading-none">🍎</span>
                <span>2. App iOS</span>
              </button>
              <button
                onClick={() => setActiveExportTab("android")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeExportTab === "android"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <span className="text-base leading-none">🤖</span>
                <span>3. App Android</span>
              </button>
              <button
                onClick={() => setActiveExportTab("hosting")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeExportTab === "hosting"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Globe className="w-4 h-4 text-sky-600" />
                <span>4. Hébergeurs Web</span>
              </button>
              <button
                onClick={() => setActiveExportTab("pwa")}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                  activeExportTab === "pwa"
                    ? "bg-white text-slate-900 shadow-sm border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/60"
                }`}
              >
                <Smartphone className="w-4 h-4 text-purple-600" />
                <span>5. PWA Directe</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-slate-700 text-sm leading-relaxed">
              {/* Tab 1: Export Code */}
              {activeExportTab === "export" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-900">
                    <Download className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-base">Étape 1 : Exporter le projet</h3>
                      <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                        Vous pouvez exporter la totalité du code source sous forme de fichier ZIP ou le synchroniser directement sur votre compte GitHub.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Code2 className="w-4 h-4 text-indigo-600" />
                        <span>Option A : Télécharger le ZIP</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        1. Cliquez sur le menu de paramètres en haut à droite.<br />
                        2. Sélectionnez <strong>"Download ZIP"</strong> ou <strong>"Export ZIP"</strong>.<br />
                        3. Extrayez l'archive `.zip` sur votre ordinateur.
                      </p>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 text-slate-900 font-bold">
                        <Share2 className="w-4 h-4 text-purple-600" />
                        <span>Option B : Synchroniser avec GitHub</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        1. Dans le menu de l'application, choisissez <strong>"Export to GitHub"</strong>.<br />
                        2. Connectez votre compte GitHub pour créer un nouveau dépôt privé ou public.<br />
                        3. Récupérez le repo avec `git clone &lt;votre-url-github&gt;`.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-2">
                    <div className="flex items-center justify-between text-slate-400 font-sans text-xs mb-1">
                      <span className="flex items-center gap-1.5 font-bold text-slate-200">
                        <Terminal className="w-4 h-4 text-sky-400" />
                        Lancer le projet en local sur votre ordinateur :
                      </span>
                    </div>
                    <p className="text-slate-400"># 1. Allez dans le dossier du projet</p>
                    <p className="text-emerald-400">cd planmastergo</p>
                    <p className="text-slate-400"># 2. Installez les dépendances</p>
                    <p className="text-emerald-400">npm install</p>
                    <p className="text-slate-400"># 3. Lancez le serveur de développement local</p>
                    <p className="text-emerald-400">npm run dev</p>
                    <p className="text-slate-400"># Votre application s'ouvre sur http://localhost:3000 !</p>
                  </div>
                </div>
              )}

              {/* Tab 2: iOS */}
              {activeExportTab === "ios" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-sky-950">
                    <span className="text-2xl shrink-0">🍎</span>
                    <div>
                      <h3 className="font-bold text-base">Créer une application Native iOS (iPhone & iPad)</h3>
                      <p className="text-xs sm:text-sm text-sky-900 mt-1">
                        Utilisez <strong>Capacitor</strong> pour transformer ce projet React en application native Xcode installable sur iPhone.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                    <strong>Prérequis :</strong> Un ordinateur Mac avec <strong>Xcode</strong> (gratuit sur l'App Store Mac).
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-2">
                    <div className="text-slate-400 font-sans font-bold text-xs mb-2 text-slate-200">
                      Commandes terminal dans votre dossier exporté :
                    </div>
                    <p className="text-slate-400"># 1. Installez Capacitor CLI et le noyau</p>
                    <p className="text-sky-300">npm install @capacitor/core @capacitor/cli</p>
                    <p className="text-sky-300">npx cap init PlanMasterGO com.planmastergo.app</p>

                    <p className="text-slate-400 mt-2"># 2. Ajoutez le support iOS</p>
                    <p className="text-sky-300">npm install @capacitor/ios</p>
                    <p className="text-sky-300">npx cap add ios</p>

                    <p className="text-slate-400 mt-2"># 3. Compilez votre application web</p>
                    <p className="text-sky-300">npm run build</p>

                    <p className="text-slate-400 mt-2"># 4. Synchronisez le code avec Xcode</p>
                    <p className="text-sky-300">npx cap sync</p>

                    <p className="text-slate-400 mt-2"># 5. Ouvrez le projet dans Xcode</p>
                    <p className="text-emerald-400 font-bold">npx cap open ios</p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm">Dans Xcode :</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Sélectionnez votre iPhone connecté ou un simulateur iOS (ex: iPhone 16 Pro).</li>
                      <li>Cliquez sur le bouton <strong>Run ▶️</strong> en haut à gauche.</li>
                      <li>L'application s'installe et s'exécute immédiatement sur votre iPhone !</li>
                      <li>Pour l'App Store : allez dans <strong>Product -&gt; Archive</strong> pour envoyer sur TestFlight / App Store.</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 3: Android */}
              {activeExportTab === "android" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-950">
                    <span className="text-2xl shrink-0">🤖</span>
                    <div>
                      <h3 className="font-bold text-base">Créer une application Native Android (APK & Play Store)</h3>
                      <p className="text-xs sm:text-sm text-emerald-900 mt-1">
                        Générez un fichier `.apk` installable ou un `.aab` pour le Google Play Store en quelques commandes.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-800">
                    <strong>Prérequis :</strong> Téléchargez et installez <strong>Android Studio</strong> (gratuit sur Windows, Mac et Linux).
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-2">
                    <div className="text-slate-400 font-sans font-bold text-xs mb-2 text-slate-200">
                      Commandes terminal dans votre dossier exporté :
                    </div>
                    <p className="text-slate-400"># 1. Installez Capacitor CLI et le noyau</p>
                    <p className="text-emerald-300">npm install @capacitor/core @capacitor/cli</p>
                    <p className="text-emerald-300">npx cap init PlanMasterGO com.planmastergo.app</p>

                    <p className="text-slate-400 mt-2"># 2. Ajoutez le support Android</p>
                    <p className="text-emerald-300">npm install @capacitor/android</p>
                    <p className="text-emerald-300">npx cap add android</p>

                    <p className="text-slate-400 mt-2"># 3. Compilez votre application web</p>
                    <p className="text-emerald-300">npm run build</p>

                    <p className="text-slate-400 mt-2"># 4. Synchronisez le code avec Android Studio</p>
                    <p className="text-emerald-300">npx cap sync</p>

                    <p className="text-slate-400 mt-2"># 5. Ouvrez Android Studio</p>
                    <p className="text-emerald-400 font-bold">npx cap open android</p>
                  </div>

                  <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 text-sm">Générer le fichier APK dans Android Studio :</h4>
                    <ol className="list-decimal list-inside space-y-1 text-slate-600">
                      <li>Une fois Android Studio ouvert, attendez l'indexation de Gradle.</li>
                      <li>Allez dans le menu du haut : <strong>Build -&gt; Build Bundle(s) / APK(s) -&gt; Build APK(s)</strong>.</li>
                      <li>Cliquez sur <strong>locate</strong> pour récupérer votre fichier `.apk` prêt à être envoyé par email ou WhatsApp sur n'importe quel téléphone Android !</li>
                    </ol>
                  </div>
                </div>
              )}

              {/* Tab 4: Hosting */}
              {activeExportTab === "hosting" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-start gap-3 text-purple-950">
                    <Globe className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-base">Déployer sur différents hébergeurs Web</h3>
                      <p className="text-xs sm:text-sm text-purple-900 mt-1">
                        Ce projet est prêt pour une mise en ligne instantanée sur Vercel, Netlify, Render, Cloud Run, Firebase ou n'importe quel serveur VPS / Docker.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Server className="w-4 h-4 text-emerald-600" />
                        <span>Vercel / Netlify (Gratuit)</span>
                      </div>
                      <p className="text-slate-600">
                        1. Poussez votre code sur GitHub.<br />
                        2. Créez un projet sur Vercel ou Netlify en connectant GitHub.<br />
                        3. Commande de build : <code className="bg-slate-200 px-1 py-0.5 rounded">npm run build</code><br />
                        4. Dossier de sortie : <code className="bg-slate-200 px-1 py-0.5 rounded">dist</code><br />
                        5. Déploiement automatique à chaque commit !
                      </p>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <Database className="w-4 h-4 text-amber-600" />
                        <span>Firebase Hosting</span>
                      </div>
                      <p className="text-slate-600">
                        1. Installez Firebase CLI : <code className="bg-slate-200 px-1 py-0.5 rounded">npx firebase-tools init</code><br />
                        2. Choisissez Hosting et définissez le dossier public sur <code className="bg-slate-200 px-1 py-0.5 rounded">dist</code>.<br />
                        3. Compilez : <code className="bg-slate-200 px-1 py-0.5 rounded">npm run build</code><br />
                        4. Déployez : <code className="bg-slate-200 px-1 py-0.5 rounded">npx firebase-tools deploy</code>
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl font-mono text-xs space-y-2">
                    <div className="text-slate-400 font-sans font-bold text-xs mb-1 text-slate-200">
                      Serveur Node.js Fullstack (Docker / Cloud Run / VPS / Render) :
                    </div>
                    <p className="text-slate-400"># Compile le frontend Vite et le serveur Express backend en un fichier unique bundle dist/server.cjs</p>
                    <p className="text-emerald-400">npm run build</p>
                    <p className="text-slate-400"># Lance le serveur Express autonome sur le port 3000</p>
                    <p className="text-emerald-400">npm start</p>
                  </div>
                </div>
              )}

              {/* Tab 5: PWA */}
              {activeExportTab === "pwa" && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-start gap-3 text-indigo-950">
                    <Smartphone className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-bold text-base">Installation PWA Instantanée (Sans Store)</h3>
                      <p className="text-xs sm:text-sm text-indigo-900 mt-1">
                        Le fichier <code className="bg-indigo-100 px-1 rounded">manifest.json</code> est déjà configuré. Tout utilisateur peut installer l'application directement depuis son navigateur web !
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <span>📱 iPhone & iPad (Safari)</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        1. Ouvrez le lien de votre site dans Safari.<br />
                        2. Appuyez sur le bouton <strong>Partager</strong> (carré avec flèche vers le haut).<br />
                        3. Faites défiler et appuyez sur <strong>"Sur l'écran d'accueil"</strong>.<br />
                        4. L'icône PlanMasterGO apparaît sur votre écran d'accueil comme une vraie app !
                      </p>
                    </div>

                    <div className="p-4 border border-slate-200 rounded-2xl bg-slate-50 space-y-2">
                      <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <span>🤖 Smartphones Android (Chrome)</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">
                        1. Ouvrez le lien de votre site dans Google Chrome.<br />
                        2. Appuyez sur le menu (les 3 petits points en haut à droite).<br />
                        3. Sélectionnez <strong>"Installer l'application"</strong> ou <strong>"Ajouter à l'écran d'accueil"</strong>.<br />
                        4. Profitez de l'application en plein écran avec accès hors-ligne !
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
              <span className="text-slate-500 font-medium text-center sm:text-left">
                💡 Conseil : Les données sauvegardées dans le Cloud Firebase sont automatiquement synchronisées sur tous vos appareils !
              </span>
              <button
                onClick={() => setIsExportGuideOpen(false)}
                className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all shadow-sm"
              >
                Compris, Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Authentication Modal */}
      <AnimatePresence>
        {isAdminLoginModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="glass-modal w-full max-w-md rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden bg-white"
            >
              {/* Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 border border-amber-400/30 rounded-xl text-amber-400 shrink-0">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight text-white">Espace Administration</h2>
                  <p className="text-xs text-slate-300">Authentification administrateur PlanMasterGO</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsAdminLoginModalOpen(false);
                  setAdminLoginError(null);
                  setAdminModalNotice(null);
                }}
                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <form onSubmit={handleAdminLogin} className="p-6 space-y-4 text-slate-800">
              {adminModalNotice && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{adminModalNotice}</span>
                </div>
              )}

              {adminLoginError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{adminLoginError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Identifiant Administrateur
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={adminUsernameInput}
                    onChange={(e) => setAdminUsernameInput(e.target.value)}
                    placeholder="ex: AdminRoot#0"
                    className="w-full border-slate-200 rounded-xl shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-500/20 py-2.5 pl-9 pr-3 border text-sm outline-none transition-all font-mono text-slate-800"
                    required
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showAdminPassword ? "text" : "password"}
                    value={adminPasswordInput}
                    onChange={(e) => setAdminPasswordInput(e.target.value)}
                    placeholder="••••••••"
                    className="w-full border-slate-200 rounded-xl shadow-sm focus:border-amber-500 focus:ring focus:ring-amber-500/20 py-2.5 pl-9 pr-10 border text-sm outline-none transition-all font-mono text-slate-800"
                    required
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <button
                    type="button"
                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminLoginModalOpen(false);
                    setAdminLoginError(null);
                    setAdminModalNotice(null);
                  }}
                  className="px-4 py-2.5 text-slate-600 font-medium hover:bg-slate-100 rounded-xl transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-semibold rounded-xl transition-all shadow-md active:scale-95 text-sm flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" />
                  Se connecter
                </button>
              </div>
            </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
