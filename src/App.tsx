import React, { useState, useEffect, useRef } from "react";
import {
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
  Cloud,
  Copy,
  Database,
  RefreshCw,
  Lock,
  Unlock,
  Shield,
  Smartphone,
  Clock,
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

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // PDF State
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfViewType, setPdfViewType] = useState<"condensed" | "detailed">(
    "condensed",
  );
  const [pdfSelectedMonth, setPdfSelectedMonth] = useState<number>(
    new Date().getMonth(),
  );

  const [isLegendExpanded, setIsLegendExpanded] = useState(false);
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);

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
  const [activeSettingsTab, setActiveSettingsTab] = useState<"notifications" | "sync" | "security">("notifications");
  const [importCode, setImportCode] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [lastBackupTime, setLastBackupTime] = useState<string | null>(null);
  
  const [appPin, setAppPin] = useState<string>("");
  const [isLocked, setIsLocked] = useState(false);
  const [unlockPinInput, setUnlockPinInput] = useState("");
  const [pinError, setPinError] = useState(false);
  const [isSettingsLoaded, setIsSettingsLoaded] = useState(false);

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
      
      setNotificationEmail(localEmail);
      setNotificationPhone(localPhone);
      setAppPin(localPin);
      
      if (localPin) {
        setIsLocked(true);
      }

      try {
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
          }

          if (data.updatedAt) {
            try {
              setLastBackupTime(new Date(data.updatedAt).toLocaleString("fr-FR"));
            } catch (e) {
              setLastBackupTime(null);
            }
          }
        }
      } catch (e) {
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
    localStorage.setItem("planmastergo_email", notificationEmail);
    localStorage.setItem("planmastergo_phone", notificationPhone);
    localStorage.setItem("planmastergo_pin", appPin);
    localStorage.setItem("planmastergo_local_update_time", Date.now().toString());

    try {
      const backupTime = new Date().toISOString();
      await setDoc(doc(db, "user_settings", deviceId), {
        deviceId: deviceId,
        email: notificationEmail,
        phone: notificationPhone,
        pin: appPin,
        overrides: overrides,
        restChoices: restChoices,
        updatedAt: backupTime,
      });
      setLastBackupTime(new Date(backupTime).toLocaleString("fr-FR"));
    } catch (e) {
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
    setIsBackingUp(true);
    try {
      const backupTime = new Date().toISOString();
      await setDoc(doc(db, "user_settings", deviceId), {
        deviceId: deviceId,
        email: notificationEmail,
        phone: notificationPhone,
        pin: appPin,
        overrides: overrides,
        restChoices: restChoices,
        updatedAt: backupTime,
      });
      setLastBackupTime(new Date(backupTime).toLocaleString("fr-FR"));
      
      setActiveToast({
        id: "backup-success",
        title: "Sauvegarde réussie",
        subtitle: "Vos données de planning sont désormais sauvegardées dans le Cloud Firebase.",
        type: "in-app",
      });
      setTimeout(() => {
        setActiveToast((current) => current?.id === "backup-success" ? null : current);
      }, 3000);
    } catch (e) {
      console.error("Error backing up settings:", e);
      handleFirestoreError(e, OperationType.WRITE, `user_settings/${deviceId}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  const handleImportSync = async (codeToImport: string) => {
    const trimmedCode = codeToImport.trim();
    if (!trimmedCode) {
      alert("Veuillez saisir un code de synchronisation valide.");
      return;
    }
    
    if (!confirm("Attention : l'importation de ce profil va écraser vos données locales actuelles (planning, notes, préférences). Souhaitez-vous continuer ?")) {
      return;
    }
    
    setIsImporting(true);
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
        
        localStorage.setItem("planmastergo_device_id", trimmedCode);
        if (data.email) localStorage.setItem("planmastergo_email", data.email);
        if (data.phone) localStorage.setItem("planmastergo_phone", data.phone);
        if (data.overrides) localStorage.setItem("planmastergo_overrides", JSON.stringify(data.overrides));
        if (data.restChoices) localStorage.setItem("planmastergo_rest_choices", JSON.stringify(data.restChoices));
        
        setDeviceId(trimmedCode);
        
        if (data.updatedAt) {
          try {
            setLastBackupTime(new Date(data.updatedAt).toLocaleString("fr-FR"));
          } catch (e) {
            setLastBackupTime(null);
          }
        }
        
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
        alert("Aucune donnée trouvée pour ce code de synchronisation. Veuillez vérifier le code saisi.");
      }
    } catch (e) {
      console.error("Error importing settings:", e);
      alert("Erreur lors de la synchronisation avec le serveur. Veuillez réessayer.");
    } finally {
      setIsImporting(false);
    }
  };

  // Sauvegarde automatique immédiate
  useEffect(() => {
    if (!deviceId || !isSettingsLoaded) return;
    
    const saveToCloud = async () => {
      try {
        await setDoc(doc(db, "user_settings", deviceId), {
          deviceId: deviceId,
          email: notificationEmail,
          phone: notificationPhone,
          pin: appPin,
          overrides: overrides,
          restChoices: restChoices,
          updatedAt: new Date().toISOString(),
        });
        setLastBackupTime(new Date().toLocaleString("fr-FR"));
      } catch (e) {
        console.error("Auto backup error:", e);
      }
    };
    
    saveToCloud();
  }, [overrides, restChoices, notificationEmail, notificationPhone, appPin, deviceId, isSettingsLoaded]);

  useEffect(() => {
    const key = getDateKey(currentTime);
    const dayData = overrides[key];

    if (dayData?.reminder?.enabled) {
      const currentHour = String(currentTime.getHours()).padStart(2, "0");
      const currentMin = String(currentTime.getMinutes()).padStart(2, "0");
      const timeStr = `${currentHour}:${currentMin}`;

      if (dayData.reminder.time === timeStr) {
        const reminderId = `${key}-${timeStr}`;
        if (!triggeredReminders.has(reminderId)) {
          setActiveToast({
            id: reminderId,
            title: `Rappel pour aujourd'hui`,
            subtitle: dayData.note || "Il y a un événement prévu aujourd'hui.",
            type: dayData.reminder.type,
          });
          setTriggeredReminders((prev) => new Set(prev).add(reminderId));
          
          playRingtone();
          
          if (dayData.reminder.type === "email" && notificationEmail) {
            fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "email", to: notificationEmail, message: dayData.note || "Nouvel événement" })
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
                  to: notificationEmail,
                  message: dayData.note || "Nouvel événement",
                  info: data.info || ""
                });
              }
            }).catch(console.error);
          }
          if (dayData.reminder.type === "sms" && notificationPhone) {
            fetch("/api/notify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ type: "sms", to: notificationPhone, message: dayData.note || "Nouvel événement" })
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
                  to: notificationPhone,
                  message: dayData.note || "Nouvel événement",
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
    }
  }, [currentTime, overrides, triggeredReminders]);

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
    const emptyCellClass = isLarge
      ? "mx-auto w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
      : "mx-auto w-7 h-7 md:w-8 md:h-8";

    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className={emptyCellClass}></div>);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const currentDate = new Date(year, monthIndex, d);
      const state = getDayState(currentDate);
      const today = isToday(currentDate);
      const key = getDateKey(currentDate);
      const hasNote = !!overrides[key]?.note;
      const hasReminder = overrides[key]?.reminder?.enabled;

      let baseClasses = `mx-auto flex items-center justify-center rounded-full font-semibold transition-colors relative cursor-pointer group-hover:opacity-80 ${isLarge ? "w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 md:w-12 md:h-12 text-xs xs:text-sm sm:text-base md:text-lg" : "w-6 h-6 xs:w-7 xs:h-7 sm:w-8 sm:h-8 text-[9px] xs:text-[11px] sm:text-sm"}`;
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

      days.push(
        <div
          key={d}
          className="flex justify-center items-center relative group"
        >
          <button
            onClick={() => handleDayClick(currentDate)}
            className={`${baseClasses} ${stateClasses}`}
          >
            {d}
            {hasNote && (
              <span
                className={`absolute bg-blue-500 rounded-full border-2 border-white ${isLarge ? "-top-1 -right-1 w-3 h-3" : "-top-1 -right-1 w-2.5 h-2.5"}`}
              ></span>
            )}
            {hasReminder && (
              <span
                className={`absolute bg-rose-500 rounded-full border-2 border-white ${isLarge ? "-bottom-0 -right-1 w-3 h-3" : "-bottom-0.5 -right-0.5 w-2.5 h-2.5"}`}
              ></span>
            )}
          </button>
          {(hasNote || hasReminder || overrides[key]?.appointmentTime) && !pdfMode && (
            <div className="absolute opacity-0 group-hover:opacity-100 transition-opacity top-10 z-[60] w-max max-w-[200px] bg-slate-800 text-white text-xs rounded-lg p-3 shadow-lg pointer-events-none flex flex-col gap-1">
              {overrides[key]?.appointmentTime && (
                <div className="text-amber-300 font-bold flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-amber-400" />
                  RDV à {overrides[key].appointmentTime.replace(":", "h")}
                </div>
              )}
              {hasReminder && (
                <div className="text-rose-300 font-bold flex items-center gap-1.5">
                  <Bell className="w-3 h-3" />
                  Rappel: {overrides[key]?.reminder?.time}
                </div>
              )}
              {hasNote && <div>{overrides[key]?.note}</div>}
            </div>
          )}
        </div>,
      );
    }

    const id = pdfMode ? `pdf-month-${monthIndex}` : `month-${monthIndex}`;
    return (
      <div
        id={id}
        key={monthIndex}
        className={`glass-panel rounded-2xl ${isLarge ? "p-3 sm:p-6 md:p-8" : "p-2.5 sm:p-5"} flex flex-col w-full`}
      >
        <h3
          className={`text-center font-bold text-slate-800 ${isLarge ? "text-lg sm:text-2xl mb-3 sm:mb-6" : "text-sm mb-2 sm:mb-4"}`}
        >
          {MONTHS[monthIndex]}
        </h3>
        <div
          className={`grid grid-cols-7 ${isLarge ? "gap-y-1.5 sm:gap-y-4 gap-x-0.5 sm:gap-x-2" : "gap-y-1 gap-x-0.5"}`}
        >
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className={`text-center font-semibold text-slate-400 mb-1 sm:mb-2 ${isLarge ? "text-[11px] sm:text-sm" : "text-[10px]"}`}
            >
              {day}
            </div>
          ))}
          {days}
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
      {/* Top Header */}
      <header className="w-full glass-header sticky top-0 z-30">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-9 h-9 sm:w-12 sm:h-12 flex items-center justify-center shrink-0 drop-shadow-sm hover:scale-105 transition-transform cursor-pointer">
              <FloppyLogo className="w-7 sm:w-10 h-7 sm:h-10" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3.5xl font-black font-bella text-slate-900 leading-none tracking-tight">
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
          <div className="flex items-center bg-slate-50/80 border border-slate-200 shadow-sm rounded-lg sm:rounded-xl px-2.5 py-1 sm:px-4 sm:py-2 text-slate-700 font-bold text-sm sm:text-lg tracking-tight">
            {currentTime.toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
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

            <div className="flex bg-[#f8fafc] p-0.5 sm:p-1 rounded-xl border border-slate-200 hide-scrollbar overflow-x-auto">
              {(
                [
                  ["month", "Mois"],
                  ["annual", "Année"],
                ] as [ViewMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap ${viewMode === mode ? "bg-white text-slate-800 shadow-sm border border-slate-200/50" : "text-slate-500 hover:text-slate-700"}`}
                >
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
            <button
              onClick={handleExportExcel}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 font-semibold rounded-lg sm:rounded-xl transition-colors flex-1 sm:flex-none justify-center whitespace-nowrap text-xs sm:text-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Excel
            </button>
            <button
              onClick={() => setIsPdfModalOpen(true)}
              disabled={isGeneratingPDF}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-[#e2e8f0] hover:bg-[#cbd5e1] text-slate-700 font-semibold rounded-lg sm:rounded-xl transition-colors disabled:opacity-70 flex-1 sm:flex-none justify-center whitespace-nowrap text-xs sm:text-sm min-w-[75px] sm:min-w-[100px]"
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#10a37f]" />
                  Création
                </>
              ) : (
                <>
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  PDF
                </>
              )}
            </button>
            <button
              onClick={() => setIsShareModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-4 py-2 bg-[#10a37f] hover:bg-[#0c8c6c] text-white font-medium rounded-lg sm:rounded-xl transition-all shadow-sm shadow-[#10a37f]/20 active:scale-95 flex-[2] sm:flex-none justify-center whitespace-nowrap text-xs sm:text-sm"
            >
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              Partager
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
          </div>
        </div>

        {/* Legend */}
        <div className="glass-panel flex flex-col gap-2.5 px-3 sm:px-6 py-3 rounded-xl sm:rounded-2xl">
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
        <div className="absolute top-[-9999px] left-[-9999px] overflow-hidden -z-50 pointer-events-none">
          {/* Condensed View : 1 A4 Page */}
          <div
            id="pdf-condensed-page"
            className="bg-white w-[794px] h-[1123px] p-8 flex flex-col font-sans"
          >
            <div className="flex justify-between items-end mb-6 pb-4 border-b-2 border-slate-100">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 leading-tight">
                  <span className="font-bella font-black">PlanMasterGO</span> {year}
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
                      <span className="font-bella font-black">PlanMasterGO</span> {year}
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
                  © {year} PlanMasterGO - Tous droits réservés
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View Grid */}
        <div className="w-full glass-calendar-wrapper p-3 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm">
          <AnimatePresence mode="wait">
            {viewMode === "annual" ? (
              <motion.div
                key="annual"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
              >
                {MONTHS.map((_, index) => renderMonth(index))}
              </motion.div>
            ) : (
              <motion.div
                key={`month-${viewDate.getMonth()}-${viewDate.getFullYear()}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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
      <div className="mt-16 mb-8 px-4 flex justify-center w-full z-10">
        <footer className="text-center text-sm px-6 py-2.5 font-medium text-slate-600 flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
          <div className="flex items-center gap-2">
            <FloppyLogo className="w-5 h-5 opacity-80 hidden sm:block" />
            <span>
              © {year} <span className="font-bella font-black text-slate-900 text-sm sm:text-base px-1 inline-block tracking-tight">PlanMasterGO</span> | Tous droits réservés | Création par <span className="font-signature font-normal text-[#10a37f] text-2xl sm:text-3xl px-1.5 inline-block">Jimmy</span> |
            </span>
          </div>
          <a
            href="https://freemastergoo.byethost7.com/?i=2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#10a37f] hover:text-[#0b7a5e] transition-colors underline whitespace-nowrap font-semibold"
          >
           WebmasterGO
          </a>
          <FloppyLogo className="w-5 h-5 opacity-80 sm:hidden mt-1" />
        </footer>
      </div>

      {/* Modals & Overlays */}

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
                    Pour de vrais envois, veuillez ajouter vos identifiants dans les <strong>Secrets</strong> de l'application (le bouton d'engrenage en haut à droite de Google AI Studio).
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
            </div>

            <div className="p-6">
              {activeSettingsTab === "notifications" ? (
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Adresse Email</label>
                      <button 
                        onClick={() => handleTestNotification('email')}
                        disabled={!notificationEmail || isTestingNotification}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 px-2 py-1 rounded font-medium transition-colors"
                      >
                        {isTestingNotification ? "Test..." : "Tester"}
                      </button>
                    </div>
                    <input
                      type="email"
                      value={notificationEmail}
                      onChange={(e) => setNotificationEmail(e.target.value)}
                      placeholder="votre@email.com"
                      className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Numéro de téléphone (SMS)</label>
                      <button 
                        onClick={() => handleTestNotification('sms')}
                        disabled={!notificationPhone || isTestingNotification}
                        className="text-[10px] bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 px-2 py-1 rounded font-medium transition-colors"
                      >
                        {isTestingNotification ? "Test..." : "Tester"}
                      </button>
                    </div>
                    <input
                      type="tel"
                      value={notificationPhone}
                      onChange={(e) => setNotificationPhone(e.target.value)}
                      placeholder="+33612345678"
                      className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white"
                    />
                  </div>
                  <p className="text-xs text-slate-500">Ces informations reçoivent vos rappels de planning configurés (in-app, email ou SMS).</p>
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
                    <button
                      onClick={handleForceBackup}
                      disabled={isBackingUp}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-semibold rounded-xl transition-all text-xs border border-slate-200 active:scale-95 shrink-0 shadow-sm"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isBackingUp ? "animate-spin" : ""}`} />
                      {isBackingUp ? "Synchro..." : "Sauvegarder"}
                    </button>
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
                  <div className="flex gap-4 items-end bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex-1">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                        Méthode
                      </label>
                      <select
                        value={editReminderType}
                        onChange={(e) =>
                          setEditReminderType(
                            e.target.value as "email" | "in-app",
                          )
                        }
                        className="w-full border-slate-200 rounded-lg shadow-sm focus:border-[#10a37f] focus:ring focus:ring-[#10a37f]/20 py-2 px-3 border text-sm outline-none transition-all bg-white"
                      >
                        <option value="in-app">Alerte in-app</option>
                        <option value="email">Email</option>
                        <option value="sms">SMS</option>
                      </select>
                    </div>
                    <div className="flex-1">
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
                onClick={() => {
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
                            }
                          : undefined,
                      };
                    });
                    return next;
                  });
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
    </div>
  );
}
