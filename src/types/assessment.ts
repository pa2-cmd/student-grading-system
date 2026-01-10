// ============================================
// TYPES FOR CAMBRIDGE COURT MARKSHEET SYSTEM
// ============================================

export type SkillRating = 'Excellent' | 'Good' | 'Average' | 'Needs Improvement';
export type SkillValue = 4 | 3 | 2 | 1;
export type MoodRating = 'excellent' | 'good' | 'neutral' | 'needs-support';
export type Language = 'english' | 'hindi' | 'marathi' | 'tamil' | 'telugu' | 'bengali' | 'gujarati';
export type Term = 'Term 1' | 'Term 2' | 'Annual';

// Subject available for selection
export const DEFAULT_SUBJECTS = [
  'English',
  'Hindi',
  'Sanskrit',
  'Mathematics',
  'Science',
  'Social Studies',
  'Computer Science',
  'Art & Craft',
  'Physical Education',
  'Music',
  'Moral Science',
  'General Knowledge',
  'Environmental Studies',
] as const;

// Learning skills that can be assessed
export const LEARNING_SKILLS = [
  'Creativity',
  'Teamwork',
  'Discipline',
  'Focus',
  'Problem Solving',
  'Communication',
  'Leadership',
  'Time Management',
] as const;

export const SKILL_VALUES: Record<SkillRating, SkillValue> = {
  'Excellent': 4,
  'Good': 3,
  'Average': 2,
  'Needs Improvement': 1,
};

export const SKILL_OPTIONS: SkillRating[] = ['Excellent', 'Good', 'Average', 'Needs Improvement'];

export const MOOD_EMOJIS: Record<MoodRating, string> = {
  'excellent': '😊',
  'good': '🙂',
  'neutral': '😐',
  'needs-support': '🙁',
};

export const LANGUAGES: { value: Language; label: string; nativeLabel: string }[] = [
  { value: 'english', label: 'English', nativeLabel: 'English' },
  { value: 'hindi', label: 'Hindi', nativeLabel: 'हिंदी' },
  { value: 'marathi', label: 'Marathi', nativeLabel: 'मराठी' },
  { value: 'tamil', label: 'Tamil', nativeLabel: 'தமிழ்' },
  { value: 'telugu', label: 'Telugu', nativeLabel: 'తెలుగు' },
  { value: 'bengali', label: 'Bengali', nativeLabel: 'বাংলা' },
  { value: 'gujarati', label: 'Gujarati', nativeLabel: 'ગુજરાતી' },
];

export const CLASS_OPTIONS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
export const SECTION_OPTIONS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

// ============================================
// SUBJECT MARKS STRUCTURE (Cambridge Court Format)
// ============================================

// Each subject has Theory (80) + Internal (20) = Total (100)
export interface SubjectMarksDetail {
  theory: number;      // Max 80
  internal: number;    // Max 20
  total: number;       // Auto-calculated: theory + internal
}

// Student data structure - EXACT match to Cambridge Court reference sheet
export interface Student {
  id: string;
  serialNo: number;           // Sr. No. column
  enrollmentNumber: string;   // Enrollment No. column
  name: string;               // Name column
  rollNumber: string;         // Derived from Sr. No.
  fatherName: string;         // Father Name column
  motherName: string;         // Mother Name column
  dob: string;                // DOB column
  gender: string;             // Gender column (M/F)
  photo?: string;
  
  // Subject marks - Cambridge Court format (Theory + Internal/Oral + Total)
  subjectMarks: Record<string, number>; // Simple marks for backward compatibility
  subjectMarksDetail: Record<string, SubjectMarksDetail>; // Detailed marks (Theory/Oral/Total)
  subjectRatings: Record<string, SkillRating>;
  
  // NA subjects (e.g., French) - excluded from calculations
  naSubjects?: string[];
  
  // Term-wise data storage
  termData: Record<Term, {
    subjectMarksDetail: Record<string, SubjectMarksDetail>;
    total: number;
    percentage: number;
  }>;
  
  // Attendance - format: "96 / 102"
  attendancePresent: number;
  attendanceTotal: number;
  attendancePercentage: number;
  
  // Totals from reference sheet
  maxGrandTotal: number;      // Max Grand Total column
  grandTotal: number;         // Grand Total Obtained column
  grade: string;              // Grade column
  
  // Behavior & Learning Skills
  behaviorNotes: string;
  learningSkills: Record<string, SkillRating>;
  moodRating: MoodRating;
  
  // Generated content
  strengths: string[];
  improvements: string[];
  nextSteps: string[];
  remark: string;             // Remarks column / AI-generated review
  teacherNotes: string;
  
  // State & Rankings
  isGeneratingRemark: boolean;
  total: number;
  percentage: number;         // % Marks column
  classPosition: number;
}

// Comment library item
export interface SavedComment {
  id: string;
  text: string;
  category: 'strength' | 'improvement' | 'general' | 'encouragement';
  usageCount: number;
  createdAt: string;
}

// School branding settings
export interface SchoolBranding {
  logoUrl: string;
  primaryColor: string;
  secondaryColor: string;
  principalName: string;
  principalSignature: string;
  teacherSignature: string;
  address: string;
  contactNumber: string;
  email: string;
  website: string;
}

// Report settings
export interface ReportSettings {
  showEmoji: boolean;
  showAttendance: boolean;
  showBehavior: boolean;
  showLearningSkills: boolean;
  showPhoto: boolean;
  showSignatures: boolean;
  showStrengthsWeaknesses: boolean;
  showNextSteps: boolean;
  showSubjectCharts: boolean;
}

// Main assessment data
export interface AssessmentData {
  schoolName: string;
  examName: string;
  className: string;
  section: string;
  academicYear: string;
  term: Term;
  totalStrength: number;
  students: Student[];
  language: Language;
  selectedSubjects: string[];
  
  // Enhanced features
  commentLibrary: SavedComment[];
  branding: SchoolBranding;
  reportSettings: ReportSettings;
}

// Analytics data
export interface ClassAnalytics {
  classAverage: number;
  subjectAverages: Record<string, number>;
  topPerformers: { name: string; percentage: number }[];
  needsHelp: { name: string; percentage: number }[];
  attendanceAverage: number;
  gradeDistribution: { grade: string; count: number }[];
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

export function calculateTotal(subjectRatings: Record<string, SkillRating>): number {
  if (!subjectRatings || Object.keys(subjectRatings).length === 0) return 0;
  return Object.values(subjectRatings).reduce((sum, rating) => {
    return sum + (SKILL_VALUES[rating] || 0);
  }, 0);
}

export function calculatePercentage(subjectMarks: Record<string, number>): number {
  const marks = Object.values(subjectMarks).filter(m => m !== undefined && m !== null);
  if (marks.length === 0) return 0;
  return Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length);
}

// Calculate percentage from detailed marks (theory + internal)
export function calculatePercentageFromDetail(subjectMarksDetail: Record<string, SubjectMarksDetail>): number {
  const totals = Object.values(subjectMarksDetail).map(d => d.total).filter(t => t !== undefined);
  if (totals.length === 0) return 0;
  return Math.round(totals.reduce((sum, t) => sum + t, 0) / totals.length);
}

// Calculate grand total from detailed marks
export function calculateGrandTotal(subjectMarksDetail: Record<string, SubjectMarksDetail>): number {
  return Object.values(subjectMarksDetail).reduce((sum, d) => sum + (d.total || 0), 0);
}

export function getGradeFromPercentage(percentage: number): string {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B+';
  if (percentage >= 60) return 'B';
  if (percentage >= 50) return 'C';
  if (percentage >= 40) return 'D';
  return 'F';
}

export function getMoodFromPerformance(percentage: number): MoodRating {
  if (percentage >= 80) return 'excellent';
  if (percentage >= 60) return 'good';
  if (percentage >= 40) return 'neutral';
  return 'needs-support';
}

export function createEmptySubjectMarksDetail(): SubjectMarksDetail {
  return { theory: 0, internal: 0, total: 0 };
}

export function createEmptyStudent(serialNo: number, selectedSubjects: string[]): Student {
  const subjectRatings: Record<string, SkillRating> = {};
  const subjectMarks: Record<string, number> = {};
  const subjectMarksDetail: Record<string, SubjectMarksDetail> = {};
  const learningSkills: Record<string, SkillRating> = {};
  
  selectedSubjects.forEach(subject => {
    subjectRatings[subject] = 'Good';
    subjectMarks[subject] = 0;
    subjectMarksDetail[subject] = createEmptySubjectMarksDetail();
  });
  
  LEARNING_SKILLS.forEach(skill => {
    learningSkills[skill] = 'Good';
  });
  
  const emptyTermData: Record<Term, { subjectMarksDetail: Record<string, SubjectMarksDetail>; total: number; percentage: number }> = {
    'Term 1': { subjectMarksDetail: { ...subjectMarksDetail }, total: 0, percentage: 0 },
    'Term 2': { subjectMarksDetail: { ...subjectMarksDetail }, total: 0, percentage: 0 },
    'Annual': { subjectMarksDetail: { ...subjectMarksDetail }, total: 0, percentage: 0 },
  };
  
  return {
    id: crypto.randomUUID(),
    serialNo,
    enrollmentNumber: '',
    name: '',
    rollNumber: String(serialNo),
    fatherName: '',
    motherName: '',
    dob: '',
    gender: '',
    photo: '',
    subjectMarks,
    subjectMarksDetail,
    subjectRatings,
    termData: emptyTermData,
    attendancePresent: 0,
    attendanceTotal: 0,
    attendancePercentage: 0,
    maxGrandTotal: 0,
    grandTotal: 0,
    grade: '',
    behaviorNotes: '',
    learningSkills,
    moodRating: 'good',
    strengths: [],
    improvements: [],
    nextSteps: [],
    remark: '',
    teacherNotes: '',
    isGeneratingRemark: false,
    total: 0,
    percentage: 0,
    classPosition: serialNo,
  };
}

export function getDefaultBranding(): SchoolBranding {
  return {
    logoUrl: '',
    primaryColor: '#2962ff',
    secondaryColor: '#1e3a5f',
    principalName: '',
    principalSignature: '',
    teacherSignature: '',
    address: '',
    contactNumber: '',
    email: '',
    website: '',
  };
}

export function getDefaultReportSettings(): ReportSettings {
  return {
    showEmoji: true,
    showAttendance: true,
    showBehavior: true,
    showLearningSkills: true,
    showPhoto: false,
    showSignatures: true,
    showStrengthsWeaknesses: true,
    showNextSteps: true,
    showSubjectCharts: true,
  };
}

export type CommentTone = 'encouraging' | 'formal' | 'warm' | 'strict' | 'balanced';

export const COMMENT_TONES: { value: CommentTone; label: string; description: string }[] = [
  { value: 'encouraging', label: 'Encouraging', description: 'Positive and motivating feedback' },
  { value: 'formal', label: 'Formal', description: 'Professional and structured remarks' },
  { value: 'warm', label: 'Warm', description: 'Friendly and caring tone' },
  { value: 'strict', label: 'Strict', description: 'Direct and improvement-focused' },
  { value: 'balanced', label: 'Balanced', description: 'Mix of praise and constructive feedback' },
];

export function getDefaultAssessmentData(): AssessmentData {
  // Default subjects matching Cambridge Court format
  const defaultSubjects: string[] = [];
  
  return {
    schoolName: '',
    examName: '',
    className: '',
    section: '',
    academicYear: `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`,
    term: 'Term 1',
    totalStrength: 0,
    students: [], // EMPTY on initial load - data comes from Excel import only
    language: 'english',
    selectedSubjects: defaultSubjects,
    commentLibrary: [],
    branding: getDefaultBranding(),
    reportSettings: getDefaultReportSettings(),
  };
}

// Calculate class analytics
export function calculateClassAnalytics(students: Student[], selectedSubjects: string[]): ClassAnalytics {
  const validStudents = students.filter(s => s.name.trim());
  
  if (validStudents.length === 0) {
    return {
      classAverage: 0,
      subjectAverages: {},
      topPerformers: [],
      needsHelp: [],
      attendanceAverage: 0,
      gradeDistribution: [],
    };
  }
  
  const classAverage = Math.round(
    validStudents.reduce((sum, s) => sum + s.percentage, 0) / validStudents.length
  );
  
  const subjectAverages: Record<string, number> = {};
  selectedSubjects.forEach(subject => {
    const marks = validStudents.map(s => {
      // Use detailed marks if available, otherwise fall back to simple marks
      if (s.subjectMarksDetail?.[subject]) {
        return s.subjectMarksDetail[subject].total || 0;
      }
      return s.subjectMarks[subject] || 0;
    });
    subjectAverages[subject] = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
  });
  
  const sorted = [...validStudents].sort((a, b) => b.percentage - a.percentage);
  
  const topPerformers = sorted.slice(0, 5).map(s => ({
    name: s.name,
    percentage: s.percentage,
  }));
  
  const needsHelp = sorted.slice(-5).reverse().map(s => ({
    name: s.name,
    percentage: s.percentage,
  }));
  
  const attendanceAverage = Math.round(
    validStudents.reduce((sum, s) => sum + s.attendancePercentage, 0) / validStudents.length
  );
  
  const grades: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
  validStudents.forEach(s => {
    const grade = getGradeFromPercentage(s.percentage);
    grades[grade]++;
  });
  const gradeDistribution = Object.entries(grades).map(([grade, count]) => ({ grade, count }));
  
  return {
    classAverage,
    subjectAverages,
    topPerformers,
    needsHelp,
    attendanceAverage,
    gradeDistribution,
  };
}

// Recalculate student totals and percentage from detailed marks
export function recalculateStudentTotals(student: Student, selectedSubjects: string[]): Partial<Student> {
  const subjectMarksDetail = student.subjectMarksDetail || {};
  let grandTotal = 0;
  let subjectCount = 0;
  
  // Calculate totals from detail
  selectedSubjects.forEach(subject => {
    if (subjectMarksDetail[subject]) {
      const detail = subjectMarksDetail[subject];
      const total = (detail.theory || 0) + (detail.internal || 0);
      subjectMarksDetail[subject] = { ...detail, total };
      grandTotal += total;
      subjectCount++;
    }
  });
  
  const percentage = subjectCount > 0 ? Math.round(grandTotal / subjectCount) : 0;
  const moodRating = getMoodFromPerformance(percentage);
  
  return {
    subjectMarksDetail,
    total: grandTotal,
    percentage,
    moodRating,
  };
}
