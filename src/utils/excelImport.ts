import * as XLSX from 'xlsx';
import { Student, createEmptyStudent, calculatePercentage, getMoodFromPerformance, SKILL_OPTIONS } from '@/types/assessment';

export interface ImportedStudent {
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
 * Parses an Excel file and extracts student data with marks, attendance, behavior
 * Auto-detects columns and maps them intelligently
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
        
        // Find column indices (case-insensitive)
        const headerRow = jsonData[0].map((h: any) => String(h || '').toLowerCase().trim());
        
        // Core columns
        const nameColIndex = findColumnIndex(headerRow, ['name', 'student name', 'student', 'full name', 'student\'s name']);
        const rollColIndex = findColumnIndex(headerRow, ['roll', 'roll no', 'roll number', 'rollno', 'roll no.', 'sr no', 'sr. no', 'serial', 'admission no']);
        const classColIndex = findColumnIndex(headerRow, ['class', 'grade', 'standard']);
        const sectionColIndex = findColumnIndex(headerRow, ['section', 'div', 'division']);
        
        // Attendance columns
        const attendancePresentIndex = findColumnIndex(headerRow, ['present', 'days present', 'attendance present']);
        const attendanceTotalIndex = findColumnIndex(headerRow, ['total days', 'working days', 'total', 'attendance total']);
        
        // Behavior notes
        const behaviorIndex = findColumnIndex(headerRow, ['behavior', 'behaviour', 'notes', 'remarks', 'teacher notes', 'behavior notes']);
        
        // Find subject columns (anything with marks, score, or known subject names)
        const subjectColumns = findSubjectColumns(headerRow);
        
        if (nameColIndex === -1) {
          reject(new Error('Could not find a "Name" column. Please ensure your file has a column named "Name" or "Student Name".'));
          return;
        }
        
        // Extract student data
        const students: ImportedStudent[] = [];
        
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          const name = String(row[nameColIndex] || '').trim();
          
          if (!name) continue;
          
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
          
          // Extract attendance
          let attendancePresent = 0;
          let attendanceTotal = 0;
          if (attendancePresentIndex !== -1) {
            attendancePresent = parseInt(String(row[attendancePresentIndex] || 0)) || 0;
          }
          if (attendanceTotalIndex !== -1) {
            attendanceTotal = parseInt(String(row[attendanceTotalIndex] || 0)) || 0;
          }
          
          students.push({
            name,
            rollNumber: rollColIndex !== -1 ? String(row[rollColIndex] || '').trim() : String(i),
            className: classColIndex !== -1 ? String(row[classColIndex] || '').trim() : undefined,
            section: sectionColIndex !== -1 ? String(row[sectionColIndex] || '').trim() : undefined,
            subjectMarks: Object.keys(subjectMarks).length > 0 ? subjectMarks : undefined,
            attendancePresent,
            attendanceTotal,
            behaviorNotes: behaviorIndex !== -1 ? String(row[behaviorIndex] || '').trim() : undefined,
          });
        }
        
        if (students.length === 0) {
          reject(new Error('No valid student data found in the Excel file'));
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

function findColumnIndex(headers: string[], possibleNames: string[]): number {
  for (const name of possibleNames) {
    const index = headers.findIndex(h => h.includes(name));
    if (index !== -1) return index;
  }
  return -1;
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
 */
export function createStudentsFromImport(
  importedStudents: ImportedStudent[],
  selectedSubjects: string[]
): Student[] {
  return importedStudents.map((imported, index) => {
    const student = createEmptyStudent(index + 1, selectedSubjects);
    
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
 */
export function generateSampleTemplate(): void {
  const wb = XLSX.utils.book_new();
  
  const sampleData = [
    ['Student Name', 'Roll No', 'Class', 'Section', 'English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Days Present', 'Total Days', 'Behavior Notes'],
    ['Aarav Sharma', '1', '5', 'A', 85, 78, 92, 88, 75, 45, 50, 'Very attentive and helpful'],
    ['Priya Patel', '2', '5', 'A', 90, 85, 78, 82, 88, 48, 50, 'Excellent participation'],
    ['Rahul Kumar', '3', '5', 'A', 72, 68, 65, 70, 72, 40, 50, 'Needs to be more focused'],
  ];
  
  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  
  ws['!cols'] = [
    { wch: 20 }, { wch: 8 }, { wch: 8 }, { wch: 8 },
    { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 10 }, { wch: 14 },
    { wch: 12 }, { wch: 10 }, { wch: 30 },
  ];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Student Data');
  XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
}
