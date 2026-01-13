import * as XLSX from 'xlsx';
import { AssessmentData, getGradeFromPercentage } from '@/types/assessment';

/**
 * =============================================================
 * MARKMASTER EXCEL EXPORT - EXACT SCHEMA MATCH
 * =============================================================
 * 
 * EXACT HEADERS (NON-NEGOTIABLE):
 * Sr. No. | Enrollment No. | Name | Gender |
 * [Subject groups: Mths Th (80), Mths Or (20), Total of Mths 100, ...] |
 * Draw Th (100) | H&PE Th (100) | VDMATVS Th (100) |
 * Max Grand Total | Grand Total Obtained | % Marks | Remarks | Grade | Attendance
 */

// Subject configuration - EXACT match to reference sheet
const SUBJECT_CONFIG = [
  { abbrev: 'Mths', full: 'Mathematics', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Eng', full: 'English', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Hin', full: 'Hindi', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Sc', full: 'Science', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Ssc', full: 'Social Studies', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Sans', full: 'Sanskrit', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Comp', full: 'Computer Science', theoryMax: 60, oralMax: 40 },
  { abbrev: 'Fr', full: 'French', theoryMax: 80, oralMax: 20 },
  { abbrev: 'Draw', full: 'Drawing', theoryMax: 100, oralMax: 0 },
  { abbrev: 'H&PE', full: 'Health & PE', theoryMax: 100, oralMax: 0 },
  { abbrev: 'VDMATVS', full: 'Value Education', theoryMax: 100, oralMax: 0 },
];

function getSubjectConfig(subjectName: string) {
  const normalized = subjectName.toLowerCase().trim();
  return SUBJECT_CONFIG.find(s => 
    s.full.toLowerCase() === normalized || 
    s.abbrev.toLowerCase() === normalized
  );
}

function getGradeForMark(mark: number): string {
  if (mark >= 91) return 'A1';
  if (mark >= 81) return 'A2';
  if (mark >= 71) return 'B1';
  if (mark >= 61) return 'B2';
  if (mark >= 51) return 'C1';
  if (mark >= 41) return 'C2';
  if (mark >= 33) return 'D';
  if (mark >= 21) return 'E1';
  return 'E2';
}

function getRemarkFromPercentage(percentage: number): string {
  if (percentage >= 85) return 'Excellent';
  if (percentage >= 70) return 'Very Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= 50) return 'Satisfactory';
  if (percentage >= 40) return 'Fair';
  return 'Needs to work hard';
}

export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();

  // =============================================================
  // BUILD HEADER ROW - EXACT MATCH TO REFERENCE SHEET
  // =============================================================
  
  const headerRows: any[][] = [];
  
  // Row 1: School name + title (merged)
  const examTitle = data.examName || 'Half Yearly';
  const academicYear = data.academicYear || `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`;
  headerRows.push([
    `${data.schoolName || 'School'}\nConsolidated MarkSheet of Class : ${data.className || 'VI'} Section ${data.section || 'C'} Exam : ${examTitle} (${academicYear})`
  ]);
  
  // Row 2: Column headers - EXACT ORDER FROM SCHEMA
  const columnHeaders: string[] = [
    'Sr. No.',
    'Enrollment No.',
    'Name',
    'Gender',
  ];
  
  // Track subject columns for data rows
  interface SubjectColInfo {
    subject: string;
    abbrev: string;
    theoryMax: number;
    oralMax: number;
    isGrouped: boolean;
  }
  const subjectColumns: SubjectColInfo[] = [];
  
  // Add subject columns in exact order matching reference sheet
  data.selectedSubjects.forEach(subject => {
    const config = getSubjectConfig(subject);
    const abbrev = config?.abbrev || subject.substring(0, 4);
    const theoryMax = config?.theoryMax || 80;
    const oralMax = config?.oralMax || 20;
    const isGrouped = oralMax > 0;
    
    subjectColumns.push({ subject, abbrev, theoryMax, oralMax, isGrouped });
    
    if (isGrouped) {
      // Grouped: Theory (80), Oral (20), Total (100)
      columnHeaders.push(`${abbrev} Th (${theoryMax})`);
      columnHeaders.push(`${abbrev} Or (${oralMax})`);
      columnHeaders.push(`Total of ${abbrev} 100`);
    } else {
      // Single: Theory only (100)
      columnHeaders.push(`${abbrev} Th (${theoryMax})`);
    }
  });
  
  // Final columns - EXACT ORDER
  columnHeaders.push('Max Grand Total');
  columnHeaders.push('Grand Total Obtained');
  columnHeaders.push('% Marks');
  columnHeaders.push('Remarks');
  columnHeaders.push('Grade');
  columnHeaders.push('Attendance');
  
  headerRows.push(columnHeaders);

  // =============================================================
  // BUILD STUDENT DATA ROWS - PRESERVE BLANKS, HANDLE NA SUBJECTS
  // =============================================================
  
  const studentRows = data.students
    .filter(s => s.name.trim())
    .sort((a, b) => a.serialNo - b.serialNo)
    .map((student) => {
      const row: any[] = [
        student.serialNo,
        student.enrollmentNumber || '',
        student.name,
        student.gender || '',
      ];
      
      // Track NA subjects (French, Sanskrit)
      const naSubjects = new Set(student.naSubjects || []);
      
      // Helper to check if subject is NA (case-insensitive, also checks detail flag)
      // Handles both French and Sanskrit as optional subjects
      const isSubjectNA = (subject: string): boolean => {
        const normalizedSubject = subject.toLowerCase();
        // Direct match
        if (naSubjects.has(subject)) return true;
        // Case-insensitive match
        if (Array.from(naSubjects).some(na => na.toLowerCase() === normalizedSubject)) return true;
        // Check if subjectMarksDetail has isNA flag
        const detail = student.subjectMarksDetail?.[subject];
        if (detail && 'isNA' in detail && (detail as any).isNA) return true;
        // Check by known NA subject names (French, Sanskrit)
        const isOptionalSubject = normalizedSubject.includes('french') || normalizedSubject.includes('sanskrit') ||
                                  normalizedSubject === 'fr' || normalizedSubject === 'sans';
        if (isOptionalSubject) {
          // Check if marks are NA/blank for optional subjects
          const simpleMark = student.subjectMarks?.[subject];
          if (detail && (detail.total === null || detail.total === undefined)) return true;
          if (!detail && (simpleMark === null || simpleMark === undefined)) return true;
        }
        return false;
      };
      
      let grandTotal = 0;
      let maxTotal = 0;
      
      // Add subject marks - preserve blanks, handle NA subjects
      subjectColumns.forEach(({ subject, isGrouped }) => {
        const detail = student.subjectMarksDetail?.[subject];
        const subjectIsNA = isSubjectNA(subject);
        
        if (subjectIsNA) {
          // Subject is NA - show as NA, exclude from totals
          if (isGrouped) {
            row.push('NA'); // Theory
            row.push('NA'); // Oral
            row.push('NA'); // Total
          } else {
            row.push('NA'); // Single subject
          }
          return; // Don't add to totals
        }
        
        if (isGrouped) {
          // Theory mark
          const theory = detail?.theory;
          if (theory !== undefined && theory !== null && theory > 0) {
            row.push(theory);
          } else if (theory === 0) {
            row.push(0);
          } else {
            row.push(''); // Blank preserved
          }
          
          // Oral mark
          const oral = detail?.internal;
          if (oral !== undefined && oral !== null && oral > 0) {
            row.push(oral);
          } else if (oral === 0) {
            row.push(0);
          } else {
            row.push(''); // Blank preserved
          }
          
          // Total with grade format: "B2 (69 )"
          const total = detail?.total;
          if (total !== null && total !== undefined && total > 0) {
            const grade = getGradeForMark(total);
            row.push(`${grade} (${total} )`);
            grandTotal += total;
            maxTotal += 100;
          } else if (total === 0) {
            row.push('E2 (0 )');
          } else {
            row.push(''); // Blank preserved
          }
        } else {
          // Single column subject
          const total = detail?.total ?? detail?.theory ?? student.subjectMarks?.[subject];
          
          if (total !== null && total !== undefined && total > 0) {
            const grade = getGradeForMark(total);
            row.push(`${grade} (${total} )`);
            grandTotal += total;
            maxTotal += 100;
          } else if (total === 0) {
            row.push('E2 (0 )');
          } else {
            row.push(''); // Blank preserved
          }
        }
      });
      
      // Max Grand Total - use EXACT value from import, or calculated (excluding NA subjects)
      const maxGrandTotal = student.maxGrandTotal ?? maxTotal;
      row.push(maxGrandTotal > 0 ? maxGrandTotal : '');
      
      // Grand Total Obtained - use EXACT value from import
      const grandTotalObtained = student.grandTotal ?? grandTotal;
      row.push(grandTotalObtained > 0 ? grandTotalObtained : '');
      
      // % Marks - USE EXACT VALUE FROM SHEET, DO NOT RECALCULATE
      // Preserve the exact format/value from import
      if (student.percentage !== undefined && student.percentage !== null) {
        if (student.percentage === 0) {
          row.push('0%');
        } else {
          // Preserve original precision
          const percStr = Number.isInteger(student.percentage) 
            ? `${student.percentage}%` 
            : `${student.percentage}%`;
          row.push(percStr);
        }
      } else {
        row.push(''); // Blank if not present
      }
      
      // Remarks - use EXACT from sheet, fallback to empty (not auto-generated)
      row.push(student.remark || '');
      
      // Grade - USE EXACT VALUE FROM SHEET, DO NOT DERIVE
      row.push(student.grade || '');
      
      // Attendance - format: "96 / 102"
      if (student.attendancePresent && student.attendanceTotal) {
        row.push(`${student.attendancePresent} / ${student.attendanceTotal}`);
      } else if (student.attendancePercentage) {
        row.push(`${student.attendancePercentage}%`);
      } else {
        row.push('');
      }
      
      return row;
    });

  // Combine all rows
  const allRows = [...headerRows, ...studentRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // =============================================================
  // SET COLUMN WIDTHS
  // =============================================================
  
  const colWidths: { wch: number }[] = [
    { wch: 8 },   // Sr. No.
    { wch: 18 },  // Enrollment No.
    { wch: 22 },  // Name
    { wch: 20 },  // Father Name
    { wch: 20 },  // Mother Name
    { wch: 12 },  // DOB
    { wch: 8 },   // Gender
  ];
  
  // Subject columns
  subjectColumns.forEach(({ isGrouped }) => {
    if (isGrouped) {
      colWidths.push({ wch: 12 }); // Theory
      colWidths.push({ wch: 12 }); // Oral
      colWidths.push({ wch: 16 }); // Total
    } else {
      colWidths.push({ wch: 14 }); // Single subject
    }
  });
  
  // Final columns
  colWidths.push({ wch: 14 }); // Max Grand Total
  colWidths.push({ wch: 18 }); // Grand Total Obtained
  colWidths.push({ wch: 10 }); // % Marks
  colWidths.push({ wch: 18 }); // Remarks
  colWidths.push({ wch: 8 });  // Grade
  colWidths.push({ wch: 12 }); // Attendance
  
  ws['!cols'] = colWidths;

  // Merge title row
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: columnHeaders.length - 1 } },
  ];

  // FREEZE TOP ROW (header row) - Row 1 is title, Row 2 is headers
  // Freeze at row 2 (0-indexed) so header row stays visible when scrolling
  ws['!freeze'] = { xSplit: 0, ySplit: 2, topLeftCell: 'A3', state: 'frozen' };

  XLSX.utils.book_append_sheet(wb, ws, 'Consolidated MarkSheet');

  // Filename format: VI-C_NAMEWISE.xlsx
  const classInfo = data.className || 'VI';
  const sectionInfo = data.section || 'C';
  const filename = `${classInfo}-${sectionInfo}_NAMEWISE.xlsx`;
  
  XLSX.writeFile(wb, filename);
}

/**
 * Export summary report
 */
export function exportSummaryReport(data: AssessmentData) {
  const wb = XLSX.utils.book_new();
  
  const validStudents = data.students.filter(s => s.name.trim());
  
  // Summary statistics
  const summaryRows: any[][] = [
    ['CLASS SUMMARY REPORT'],
    [`${data.schoolName}`],
    [`Class: ${data.className} ${data.section ? '- ' + data.section : ''}`],
    [`Academic Year: ${data.academicYear}`],
    [],
    ['STATISTICS'],
    ['Total Students', validStudents.length],
    ['Class Average', `${validStudents.length > 0 ? Math.round(validStudents.reduce((a, s) => a + s.percentage, 0) / validStudents.length) : 0}%`],
    [],
    ['SUBJECT-WISE PERFORMANCE'],
    ['Subject', 'Class Average', 'Highest', 'Lowest'],
  ];
  
  // Subject-wise stats
  data.selectedSubjects.forEach(subject => {
    const marks = validStudents.map(s => {
      const detail = s.subjectMarksDetail?.[subject];
      return detail?.total ?? s.subjectMarks?.[subject] ?? 0;
    }).filter(m => m > 0);
    
    if (marks.length > 0) {
      const avg = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
      const highest = Math.max(...marks);
      const lowest = Math.min(...marks);
      summaryRows.push([subject, `${avg}%`, `${highest}%`, `${lowest}%`]);
    } else {
      summaryRows.push([subject, 'N/A', 'N/A', 'N/A']);
    }
  });
  
  summaryRows.push([]);
  summaryRows.push(['GRADE DISTRIBUTION']);
  summaryRows.push(['Grade', 'Count', 'Percentage']);
  
  // Grade distribution
  const grades: Record<string, number> = { 'A+': 0, 'A': 0, 'B+': 0, 'B': 0, 'C': 0, 'D': 0, 'F': 0 };
  validStudents.forEach(s => {
    const grade = getGradeFromPercentage(s.percentage);
    grades[grade]++;
  });
  
  Object.entries(grades).forEach(([grade, count]) => {
    const pct = validStudents.length > 0 ? Math.round((count / validStudents.length) * 100) : 0;
    summaryRows.push([grade, count, `${pct}%`]);
  });
  
  const ws = XLSX.utils.aoa_to_sheet(summaryRows);
  ws['!cols'] = [{ wch: 25 }, { wch: 15 }, { wch: 12 }, { wch: 12 }];
  
  XLSX.utils.book_append_sheet(wb, ws, 'Summary');
  
  const filename = `Summary_${data.className || 'Class'}_${data.academicYear}.xlsx`;
  XLSX.writeFile(wb, filename);
}