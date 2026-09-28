export type ProjectType = 'HUSGRUND' | 'ALTAN_TRADACK' | 'PLATTSATTNING' | 'ENSKILT_AVLOPP';

export type MomentStatus = 'RED' | 'YELLOW' | 'GREEN';

export type WeatherType = 'SOL' | 'MOLN' | 'REGN' | 'FROST_SNO';

export interface MomentDefinition {
  id: string; // e.g. '1.1'
  projectType: ProjectType;
  order: number;
  phaseNumber: number;
  phaseName: string;
  title: string;
  amaCode: string;
  instruction: string;
  studentTip: string;
  proTip: string;
  criticalValidationHint?: string;
  defaultCategory?: string;
  inspectionItem?: string; // t.ex. "Höjd / Fall"
  method?: string;         // t.ex. "Laserinstrument"
}

export interface MomentPhoto {
  id: string;
  dataUrl: string; // base64 JPEG med inbränd vattenstämpel
  capturedAt: string; // YYYY-MM-DD HH:MM
  category: string; // 'Schakt' | 'VA' | 'Grund' | 'Kontrollbevis' | 'Avvikelser' | 'Försyn'
  caption?: string; // Bildtext
  weather?: string;
}

export interface MomentRecord {
  momentId: string;
  status: MomentStatus;
  comment: string;
  signature: string;
  structuredChecks?: string[];
  photoBase64?: string;
  photos?: MomentPhoto[];
  completedAt?: string;
  completedTimestamp?: number;
  weather?: WeatherType;
}

export interface PreInspectionStep {
  id: string;
  title: string;
  description: string;
  photoCategory: string;
  photoId?: string;
}

export interface QuickNote {
  id: string;
  text: string;
  category: 'ALLMÄNT' | 'MÅTT_HÖJD' | 'TELEFON' | 'LEVERANS';
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  projectType: ProjectType;
  propertyDesignation: string; // t.ex. Granen 4:12
  clientName: string;          // Byggherre / Beställare
  contractorName: string;      // Totalentreprenör
  projectNumber?: string;      // Projektnummer (t.ex. 3313200-5001)
  applicableDocs?: string;     // Gällande handlingar (t.ex. Bygghandling M30, AMA Anläggning)
  createdAt: string;
  updatedAt: string;
  notes?: string;
  quickNotes?: QuickNote[];
  moments: Record<string, MomentRecord>;
  preInspectionCompleted?: boolean;
  preInspectionExempted?: boolean;
  preInspectionExemptReason?: string;
  preInspectionPhotos?: MomentPhoto[];
  // Fältmått & Beräknat Kryssmått (automatisk ifyllnad i moment)
  fieldMeasurements?: {
    sideA?: number; // Längd i meter (t.ex. 10.00)
    sideB?: number; // Bredd i meter (t.ex. 8.00)
    diagonal?: number; // Beräknad diagonal i meter (t.ex. 12.81)
    fallCmPerM?: number; // Fall i cm/meter
    customValues?: Record<string, string>;
  };
  // Versionshistorik & Revisionshantering
  revisions?: ProjectRevision[];
  // Papperskorg (Recycle bin)
  isDeleted?: boolean;
  deletedAt?: string;
  // Grupp- & Molnsynkning
  isGroupProject?: boolean;
  syncEnabled?: boolean;
  groupCode?: string;
  lastSyncedAt?: string;
  assignedTo?: string;
  // Lärarövning & Anpassade moment
  exerciseCode?: string;
  isTeacherExercise?: boolean;
  exerciseInstructions?: string;
  customMoments?: MomentDefinition[];
  externalLinks?: ExerciseLink[];
}

export interface ProjectRevision {
  id: string;
  timestamp: number;
  createdAtFormatted: string;
  authorName: string;
  authorRole?: string;
  summary: string;
  momentsSnapshot: Record<string, MomentRecord>;
  notesSnapshot?: string;
  fieldMeasurementsSnapshot?: any;
}

export interface AppLicense {
  status: 'LICENSED' | 'TRIAL' | 'EXPIRED';
  licenseKey: string;
  schoolName: string;
  validUntil: string;
  maxSeats: number;
  allowTeacherAccountCreation: boolean;
  allowTeacherCreateTeacherAccounts?: boolean;
  requireLoginOnStartup?: boolean;
}

export interface ExerciseLink {
  id: string;
  title: string;
  url: string;
  category?: 'RITNING' | 'VIDEO' | 'AMA_REGEL' | 'ÖVRIGT';
}

export interface TeacherExercise {
  id: string;
  code: string; // t.ex. "FK-4019" eller "SCHAKT-1"
  title: string;
  description: string;
  projectType: ProjectType;
  createdAt: string;
  updatedAt?: string;
  createdByTeacherName: string;
  createdByTeacherId: string;
  links: ExerciseLink[];
  customMoments: MomentDefinition[]; // Alla anpassade moment för denna specifika övning
  instructions?: string;
  fieldMeasurements?: {
    sideA?: number;
    sideB?: number;
    diagonal?: number;
    fallCmPerM?: number;
  };
}

export type PhotoSaveMode = 'APP_ONLY' | 'APP_AND_DOWNLOAD';
export type ReportLayoutStyle = 'AMA_STANDARD' | 'PHOTO_SUMMARY';
export type AppExperienceLevel = 'STUDENT_MAX' | 'STANDARD' | 'PRO_MINIMAL';
export type AppLayoutMode = 'FIELD_CLEAR' | 'COMPACT' | 'GUIDED_STEP';
export type AppColorPalette = 'ORANGE_WORK' | 'SAFETY_YELLOW' | 'DAYLIGHT_HIGH_CONTRAST' | 'NORDIC_BLUE';
export type PreInspectionPreference = 'ALWAYS_ASK' | 'ALWAYS_DO' | 'SKIP_DEFAULT';
export type UserUsageProfile = 'PRIVATE' | 'CONTRACTOR' | 'SCHOOL';

export interface UserSettings {
  userName: string;
  companyName: string;
  preferredProjectType?: ProjectType | 'ALL';
  easyFieldMode?: boolean;
  hasSeenWizard?: boolean;
  photoSaveMode?: PhotoSaveMode;
  enableTutorialGuide?: boolean;
  reportLayout?: ReportLayoutStyle;
  hasSeenTutorialPrompt?: boolean;
  // Nya utökade inställningar & funktionsväljare
  appExperienceLevel?: AppExperienceLevel;
  appLayoutMode?: AppLayoutMode;
  colorPalette?: AppColorPalette;
  preInspectionPreference?: PreInspectionPreference;
  userUsageProfile?: UserUsageProfile;
  featureCrossMeasure?: boolean;
  featureFieldNotes?: boolean;
  featureAiHelper?: boolean;
  featurePreInspection?: boolean;
  featurePhotoWatermark?: boolean;
  saveToDeviceGallery?: boolean;       // "fråga om man vill spara en kopia i mobilens galleri"
  requirePhotoToComplete?: boolean;    // "gå vidare ifrån varje moment utan att behöva lägga in en bild"
  featureCloudSync?: boolean;
  featureTeacherAlerts?: boolean;
  customDeployUrl?: string;
}

export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface UserAccount {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  password?: string;
  schoolOrCompany?: string;
  createdAt: string;
  lastLogin?: string;
}

export interface TeacherNotification {
  id: string;
  authorName: string;
  authorRole: 'TEACHER' | 'ADMIN';
  title: string;
  message: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
  readBy?: string[];
}

export type ViewState = 'DASHBOARD' | 'CREATE_PROJECT' | 'CHECKLIST' | 'ACCOUNTS' | 'APK_EXPORT';
