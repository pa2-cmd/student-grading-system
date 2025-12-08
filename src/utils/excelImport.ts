import * as XLSX from 'xlsx';
import { Student, createEmptyStudent, calculatePercentage, getMoodFromPerformance, SKILL_OPTIONS } from '@/types/assessment';

export interface ImportedStudent {
  serialNo: number; // Primary identifier from Excel
  enrollmentNumber: string; // Unique student ID for reports
  name: string;
  rollNumber: string;
  className?: string;
  section?: string;
  subjectMarks?: Record<string, number>;
  attendancePresent?: number;
  attendanceTotal?: number;
  behaviorNotes?: string;
}
/**
 * Smart Column Detection Logic:
 * 
 * 1. Normalize headers: trim whitespace, convert to lowercase
 * 2. Check against known variations (exact or partial matches)
 * 3. For "name" columns: also check if header contains "name" anywhere
 * 4. If multiple matches found, prefer the one with most unique non-empty values
 * 5. Return user-friendly error messages, never crash
 * 
 * IMPORTANT: Serial Number is now the PRIMARY identifier for each student row.
 * Enrollment Number is the UNIQUE ID displayed on reports and PDFs.
 */

// Accepted variations for each field type
const NAME_VARIATIONS = [
  'name', 'student name', 'full name', 'student', 'student_name', 
  'studentname', 'child name', 'learner name', "student's name",
  'pupil name', 'scholar name', 'candidate name'
];

/**
 * Serial Number variations - Primary identifier from Excel (not editable)
 * Used internally to reference and track students
 */
const SERIAL_VARIATIONS = [
  'serial', 'serial no', 'serial number', 's.no', 's no', 'sno', 'sr no', 
  'sr. no', 'sr.no', 'sr', 's.no.', 'sl no', 'sl. no', 'slno', 'sl'
];

/**
 * Enrollment Number variations - Unique student ID shown on reports
 * This is the student's official ID for reports and PDFs
 */
const ENROLLMENT_VARIATIONS = [
  'enrollment', 'enrollment no', 'enrollment number', 'enroll no', 'enroll',
  'enrolment', 'enrolment no', 'enrolment number', 'admission no', 'adm no',
  'adm. no', 'admission number', 'student id', 'id no', 'id number', 'reg no',
  'registration no', 'registration number', 'uid', 'unique id'
];

/**
 * Roll Number variations - Kept separate from Serial/Enrollment
 */
const ROLL_VARIATIONS = [
  'roll', 'roll no', 'roll number', 'rollno', 'roll no.', 'roll_no'
];

const CLASS_VARIATIONS = [
  'class', 'grade', 'standard', 'std', 'form', 'year', 'level'
];

const SECTION_VARIATIONS = [
  'section', 'div', 'division', 'sec', 'stream', 'batch'
];

const ATTENDANCE_PRESENT_VARIATIONS = [
  'present', 'days present', 'attendance present', 'present days',
  'attended', 'days attended'
];

const ATTENDANCE_TOTAL_VARIATIONS = [
  'total days', 'working days', 'total', 'attendance total',
  'school days', 'total working days'
];

const BEHAVIOR_VARIATIONS = [
  'behavior', 'behaviour', 'notes', 'remarks', 'teacher notes',
  'behavior notes', 'behaviour notes', 'comment', 'comments',
  'teacher comment', 'observation', 'observations'
];

/**
 * Parses an Excel file and extracts student data with marks, attendance, behavior
 * Auto-detects columns and maps them intelligently with smart fallbacks
 */
export async function importStudentsFromExcel(file: File): Promise<ImportedStudent[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        if (jsonData.length < 2) {
          reject(new Error('Excel file must have at least a header row and one data row'));
          return;
        }
        
        // Normalize headers: trim extra spaces and convert to lowercase
        const rawHeaders = jsonData[0].map((h: any) => String(h || ''));
        const headerRow = rawHeaders.map(h => h.toLowerCase().trim().replace(/\s+/g, ' '));
        
        // Smart column detection for Serial Number (PRIMARY IDENTIFIER)
        // Serial Number is required and must be unique
        const serialColIndex = findSmartColumnIndex(headerRow, SERIAL_VARIATIONS, jsonData);
        
        // Detect Enrollment Number column (unique student ID for reports)
        const enrollmentColIndex = findSmartColumnIndex(headerRow, ENROLLMENT_VARIATIONS, jsonData);
        
        // Smart column detection for name field
        // First try exact/partial matches, then fallback to "contains name" logic
        let nameColIndex = findSmartColumnIndex(headerRow, NAME_VARIATIONS, jsonData);
        
        // If no match found, try finding any column containing "name"
        if (nameColIndex === -1) {
          nameColIndex = findColumnContaining(headerRow, 'name', jsonData);
        }
        
        // If still no match, return user-friendly error
        if (nameColIndex === -1) {
          reject(new Error(
            "No name column found. Please include a column such as 'Name', 'Student Name', 'Full Name', or any header containing the word 'name'."
          ));
          return;
        }
        
        // Detect other columns with smart matching
        const rollColIndex = findSmartColumnIndex(headerRow, ROLL_VARIATIONS, jsonData);
        const classColIndex = findSmartColumnIndex(headerRow, CLASS_VARIATIONS, jsonData);
        const sectionColIndex = findSmartColumnIndex(headerRow, SECTION_VARIATIONS, jsonData);
        const attendancePresentIndex = findSmartColumnIndex(headerRow, ATTENDANCE_PRESENT_VARIATIONS, jsonData);
        const attendanceTotalIndex = findSmartColumnIndex(headerRow, ATTENDANCE_TOTAL_VARIATIONS, jsonData);
        const behaviorIndex = findSmartColumnIndex(headerRow, BEHAVIOR_VARIATIONS, jsonData);
        
        // Find subject columns (anything with marks, score, or known subject names)
        const subjectColumns = findSubjectColumns(headerRow);
        
        // Extract student data
        const students: ImportedStudent[] = [];
        const serialNumbers = new Set<number>(); // Track for duplicate detection
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const name = String(row[nameColIndex] || '').trim();
          
          // Skip empty rows
          if (!name) continue;
          
          // Extract Serial Number (primary identifier)
          // If serial column exists, use it; otherwise auto-generate from row index
          let serialNo: number;
          if (serialColIndex !== -1) {
            const rawSerial = row[serialColIndex];
            serialNo = parseInt(String(rawSerial || '')) || i;
          } else {
            serialNo = i; // Auto-generate if not found
          }
          
          // Check for duplicate serial numbers
          if (serialNumbers.has(serialNo)) {
            reject(new Error(
              `Duplicate Serial Number found: ${serialNo}. Each student must have a unique Serial Number.`
            ));
            return;
          }
          serialNumbers.add(serialNo);
          
          // Extract Enrollment Number (unique ID for reports)
          // If enrollment column exists, use it; otherwise auto-generate
          let enrollmentNumber: string;
          if (enrollmentColIndex !== -1) {
            enrollmentNumber = String(row[enrollmentColIndex] || '').trim();
          } else {
            // Auto-generate enrollment number if missing (format: ENR-001)
            enrollmentNumber = `ENR-${String(serialNo).padStart(3, '0')}`;
          }
          
          // Extract subject marks
          const subjectMarks: Record<string, number> = {};
          subjectColumns.forEach(({ index, name: subjectName }) => {
            const value = row[index];
            if (value !== undefined && value !== null && value !== '') {
              const numValue = parseFloat(String(value));
              if (!isNaN(numValue)) {
                subjectMarks[subjectName] = Math.min(100, Math.max(0, numValue));
              }
            }
          });
          
          // Extract attendance with safe parsing
          let attendancePresent = 0;
          let attendanceTotal = 0;
          if (attendancePresentIndex !== -1) {
            attendancePresent = parseInt(String(row[attendancePresentIndex] || 0)) || 0;
          }
          if (attendanceTotalIndex !== -1) {
            attendanceTotal = parseInt(String(row[attendanceTotalIndex] || 0)) || 0;
          }
          
          students.push({
            serialNo,
            enrollmentNumber,
            name,
            rollNumber: rollColIndex !== -1 ? String(row[rollColIndex] || '').trim() : '',
            className: classColIndex !== -1 ? String(row[classColIndex] || '').trim() : undefined,
            section: sectionColIndex !== -1 ? String(row[sectionColIndex] || '').trim() : undefined,
            subjectMarks: Object.keys(subjectMarks).length > 0 ? subjectMarks : undefined,
            attendancePresent,
            attendanceTotal,
            behaviorNotes: behaviorIndex !== -1 ? String(row[behaviorIndex] || '').trim() : undefined,
          });
        }
        
        if (students.length === 0) {
          reject(new Error('No valid student data found in the Excel file. Please ensure there is data below the header row.'));
          return;
        }
        
        resolve(students);
      } catch (error) {
        console.error('Excel parse error:', error);
        reject(new Error('Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read the file'));
    };
    
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Smart Column Index Finder
 * 
 * Detection logic:
 * 1. Trim and normalize all headers to lowercase
 * 2. Check if any header exactly matches a known variation
 * 3. Check if any header contains a known variation as substring
 * 4. If multiple matches found, pick the column with most unique non-empty values
 * 
 * @param headers - Normalized (lowercase, trimmed) header array
 * @param variations - Array of known acceptable column name variations
 * @param jsonData - Full data for counting unique values if needed
 * @returns Column index or -1 if not found
 */
function findSmartColumnIndex(
  headers: string[], 
  variations: string[],
  jsonData?: any[][]
): number {
  const matchedIndices: number[] = [];
  
  // First pass: exact matches (header equals variation)
  for (let i = 0; i < headers.length; i++) {
    const header = headers[i];
    if (variations.includes(header)) {
      matchedIndices.push(i);
    }
  }
  
  // Second pass: partial matches (header contains variation)
  if (matchedIndices.length === 0) {
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i];
      for (const variation of variations) {
        if (header.includes(variation)) {
          matchedIndices.push(i);
          break; // Avoid adding same index multiple times
        }
      }
    }
  }
  
  // No matches found
  if (matchedIndices.length === 0) {
    return -1;
  }
  
  // Single match - return it
  if (matchedIndices.length === 1) {
    return matchedIndices[0];
  }
  
  // Multiple matches - pick column with most unique non-empty values
  if (jsonData && jsonData.length > 1) {
    let bestIndex = matchedIndices[0];
    let maxUniqueCount = 0;
    
    for (const colIndex of matchedIndices) {
      const uniqueValues = new Set<string>();
      for (let row = 1; row < jsonData.length; row++) {
        const value = String(jsonData[row][colIndex] || '').trim();
        if (value) {
          uniqueValues.add(value);
        }
      }
      
      if (uniqueValues.size > maxUniqueCount) {
        maxUniqueCount = uniqueValues.size;
        bestIndex = colIndex;
      }
    }
    
    return bestIndex;
  }
  
  // Fallback to first match
  return matchedIndices[0];
}

/**
 * Fallback finder: looks for any column header containing a keyword
 * Used when specific variations don't match
 * 
 * @param headers - Normalized header array
 * @param keyword - Keyword to search for (e.g., "name")
 * @param jsonData - Full data for tie-breaking
 * @returns Column index or -1 if not found
 */
function findColumnContaining(
  headers: string[], 
  keyword: string,
  jsonData?: any[][]
): number {
  const matchedIndices: number[] = [];
  
  // Find all columns containing the keyword
  for (let i = 0; i < headers.length; i++) {
    if (headers[i].includes(keyword.toLowerCase())) {
      matchedIndices.push(i);
    }
  }
  
  if (matchedIndices.length === 0) {
    return -1;
  }
  
  if (matchedIndices.length === 1) {
    return matchedIndices[0];
  }
  
  // Multiple matches: pick column with most unique non-empty values
  if (jsonData && jsonData.length > 1) {
    let bestIndex = matchedIndices[0];
    let maxUniqueCount = 0;
    
    for (const colIndex of matchedIndices) {
      const uniqueValues = new Set<string>();
      for (let row = 1; row < jsonData.length; row++) {
        const value = String(jsonData[row][colIndex] || '').trim();
        if (value) {
          uniqueValues.add(value);
        }
      }
      
      if (uniqueValues.size > maxUniqueCount) {
        maxUniqueCount = uniqueValues.size;
        bestIndex = colIndex;
      }
    }
    
    return bestIndex;
  }
  
  return matchedIndices[0];
}

// Known subject names for auto-detection
const KNOWN_SUBJECTS = [
  'english', 'hindi', 'mathematics', 'maths', 'math', 'science', 'social', 'sst',
  'computer', 'computers', 'art', 'craft', 'physical', 'pe', 'music', 'sanskrit',
  'evs', 'environmental', 'gk', 'general knowledge', 'drawing', 'moral',
  'reading', 'writing', 'vocabulary', 'grammar', 'listening', 'speaking'
];

function findSubjectColumns(headers: string[]): { index: number; name: string }[] {
  const subjectCols: { index: number; name: string }[] = [];
  
  headers.forEach((header, index) => {
    const lower = header.toLowerCase();
    
    // Check if it's a known subject
    const isKnownSubject = KNOWN_SUBJECTS.some(subject => lower.includes(subject));
    
    // Check if it contains marks/score keywords
    const isMarksColumn = lower.includes('marks') || lower.includes('score') || lower.includes('grade');
    
    if (isKnownSubject || isMarksColumn) {
      // Clean up the subject name
      let subjectName = header
        .replace(/marks?/gi, '')
        .replace(/score/gi, '')
        .replace(/grade/gi, '')
        .replace(/\(\d+\)/g, '') // Remove (100), (50) etc
        .trim();
      
      // Capitalize first letter
      subjectName = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);
      
      // Map common abbreviations
      const abbrevMap: Record<string, string> = {
        'Maths': 'Mathematics',
        'Math': 'Mathematics',
        'Sst': 'Social Studies',
        'Social': 'Social Studies',
        'Pe': 'Physical Education',
        'Physical': 'Physical Education',
        'Evs': 'Environmental Studies',
        'Gk': 'General Knowledge',
        'Comp': 'Computer Science',
        'Computers': 'Computer Science',
      };
      
      subjectName = abbrevMap[subjectName] || subjectName;
      
      if (subjectName) {
        subjectCols.push({ index, name: subjectName });
      }
    }
  });
  
  return subjectCols;
}

/**
 * Converts imported student data to full Student objects
 * Uses Serial Number as the primary identifier (from Excel)
 * Enrollment Number is the unique student ID for reports
 */
export function createStudentsFromImport(
  importedStudents: ImportedStudent[],
  selectedSubjects: string[]
): Student[] {
  return importedStudents.map((imported) => {
    // Create student with imported serial number (not index)
    const student = createEmptyStudent(imported.serialNo, selectedSubjects);
    
    // Set primary identifiers
    student.serialNo = imported.serialNo; // From Excel (not editable)
    student.enrollmentNumber = imported.enrollmentNumber; // Unique ID for reports
    
    // Set basic info
    student.name = imported.name;
    student.rollNumber = imported.rollNumber;
    
    // Set subject marks if provided
    if (imported.subjectMarks) {
      Object.entries(imported.subjectMarks).forEach(([subject, marks]) => {
        student.subjectMarks[subject] = marks;
        // Auto-generate rating from marks
        if (marks >= 85) student.subjectRatings[subject] = 'Excellent';
        else if (marks >= 70) student.subjectRatings[subject] = 'Good';
        else if (marks >= 50) student.subjectRatings[subject] = 'Average';
        else student.subjectRatings[subject] = 'Needs Improvement';
      });
    }
    
    // Set attendance
    if (imported.attendancePresent !== undefined) {
      student.attendancePresent = imported.attendancePresent;
    }
    if (imported.attendanceTotal !== undefined) {
      student.attendanceTotal = imported.attendanceTotal;
      student.attendancePercentage = imported.attendanceTotal > 0 
        ? Math.round((imported.attendancePresent || 0) / imported.attendanceTotal * 100)
        : 0;
    }
    
    // Set behavior notes
    if (imported.behaviorNotes) {
      student.behaviorNotes = imported.behaviorNotes;
      student.teacherNotes = imported.behaviorNotes;
    }
    
    // Calculate percentage from marks
    student.percentage = calculatePercentage(student.subjectMarks);
    student.moodRating = getMoodFromPerformance(student.percentage);
    
    return student;
  });
}

/**
 * Generates a sample Excel template for teachers
 * Includes Serial Number (primary identifier) and Enrollment Number (unique ID for reports)
 */
export function generateSampleTemplate(): void {
  const wb = XLSX.utils.book_new();
  
  // Updated template with Serial Number and Enrollment Number columns
  const sampleData = [
    ['S.No', 'Enrollment No', 'Student Name', 'Roll No', 'Class', 'Section', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Days Present', 'Total Days', 'Behavior Notes'],
    [1, 'ENR-001', 'Aarav Sharma', '1', '5', 'A', 85, 78, 92, 88, 75, 45, 50, 'Very attentive and helpful'],
    [2, 'ENR-002', 'Priya Patel', '2', '5', 'A', 90, 85, 78, 82, 88, 48, 50, 'Excellent participation'],
    [3, 'ENR-003', 'Rahul Kumar', '3', '5', 'A', 72, 68, 65, 70, 72, 40, 50, 'Needs to be more focused'],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  
  ws['!cols'] = [
    { wch: 8 },  // S.No
    { wch: 14 }, // Enrollment No
    { wch: 20 }, // Student Name
    { wch: 8 },  // Roll No
    { wch: 8 },  // Class
    { wch: 8 },  // Section
    { wch: 10 }, // English
    { wch: 10 }, // Hindi
    { wch: 12 }, // Mathematics
    { wch: 10 }, // Science
    { wch: 14 }, // Social Studies
    { wch: 12 }, // Days Present
    { wch: 10 }, // Total Days
    { wch: 30 }, // Behavior Notes
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Student Data');
  XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
}
