import * as XLSX from 'xlsx';
import { AssessmentData, getGradeFromPercentage, SubjectMarksDetail } from '@/types/assessment';

/**
 * Export to Excel in EXACT Cambridge Court Marksheet format
 * Matches the reference sheet structure exactly:
 * - Same headings (character-by-character)
 * - Same column order
 * - Same grouping
 * - Blank cells preserved as blank
 */
export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();

  // =============================================================
  // BUILD HEADER ROWS - Match Cambridge Court format exactly
  // =============================================================
  
  const headerRows: any[][] = [];
  
  // Row 1: School name + Consolidated MarkSheet title (merged)
  const examTitle = data.examName || 'Half Yearly';
  const academicYear = data.academicYear || `${new Date().getFullYear()}-${(new Date().getFullYear() + 1).toString().slice(-2)}`;
  headerRows.push([
    `${data.schoolName || 'Cambridge Court High School'}\nConsolidated MarkSheet of Class : ${data.className || 'VI'} Section ${data.section || 'C'} Exam : ${examTitle} (${academicYear})`
  ]);
  
  // Row 2: Column headers - EXACT match to reference sheet
  const columnHeaders: string[] = [
    'Sr. No.',
    'Enrollment No.',
    'Name',
    'Father Name',
    'Mother Name',
    'DOB',
    'Gender',
  ];
  
  // Add subject groups in exact order
  // Format: Subject Th (80), Subject Or (20), Total of Subject 100
  data.selectedSubjects.forEach(subject => {
    const abbrev = getSubjectAbbreviation(subject);
    
    // Check if subject has grouped marks or single marks
    const firstStudent = data.students.find(s => s.subjectMarksDetail?.[subject]);
    const hasDetailedMarks = firstStudent?.subjectMarksDetail?.[subject]?.internal !== undefined 
      && firstStudent?.subjectMarksDetail?.[subject]?.internal !== 0;
    
    if (hasDetailedMarks) {
      // Grouped subject: Theory (80), Oral (20), Total (100)
      columnHeaders.push(`${abbrev}\nTh (80)`);
      columnHeaders.push(`${abbrev}\nOr (20)`);
      columnHeaders.push(`Total of\n${abbrev} 100`);
    } else {
      // Single subject like Draw, H&PE, VDMATVS: Subject Th (100)
      columnHeaders.push(`${abbrev}\nTh (100)`);
    }
  });
  
  // Add final columns
  columnHeaders.push('Max Grand Total');
  columnHeaders.push('Grand Total Obtained');
  columnHeaders.push('% Marks');
  columnHeaders.push('Remarks');
  columnHeaders.push('Grade');
  columnHeaders.push('Attendance');
  
  headerRows.push(columnHeaders);

  // =============================================================
  // BUILD STUDENT DATA ROWS
  // =============================================================
  
  const studentRows = data.students
    .filter(s => s.name.trim())
    .sort((a, b) => a.serialNo - b.serialNo)
    .map((student) => {
      const row: any[] = [
        student.serialNo,
        student.enrollmentNumber || '',
        student.name,
        '', // Father Name - not stored currently
        '', // Mother Name - not stored currently
        '', // DOB - not stored currently
        '', // Gender - not stored currently
      ];
      
      // Add subject marks - preserve blanks exactly
      let grandTotal = 0;
      let maxTotal = 0;
      
      data.selectedSubjects.forEach(subject => {
        const detail = student.subjectMarksDetail?.[subject];
        const simpleMark = student.subjectMarks?.[subject];
        
        // Check if this subject has detailed marks
        const hasDetailedMarks = detail?.internal !== undefined && detail?.internal !== 0;
        
        if (hasDetailedMarks && detail) {
          // Theory mark - preserve blank
          row.push(detail.theory ?? '');
          // Oral/Internal mark - preserve blank
          row.push(detail.internal ?? '');
          // Total with grade format: "B2 (69)"
          if (detail.total !== null && detail.total !== undefined) {
            const grade = getGradeFromPercentage(detail.total);
            row.push(`${grade} (${detail.total} )`);
            grandTotal += detail.total;
            maxTotal += 100;
          } else {
            row.push('');
          }
        } else {
          // Single column subject
          const mark = detail?.total ?? detail?.theory ?? simpleMark;
          if (mark !== null && mark !== undefined && mark !== 0) {
            const grade = getGradeFromPercentage(mark);
            row.push(`${grade} (${mark} )`);
            grandTotal += mark;
            maxTotal += 100;
          } else if (mark === 0) {
            row.push('E2 (0 )');
          } else {
            row.push(''); // Preserve blank
          }
        }
      });
      
      // Max Grand Total
      row.push(maxTotal > 0 ? maxTotal : '');
      
      // Grand Total Obtained
      row.push(grandTotal);
      
      // Percentage
      const percentage = maxTotal > 0 ? Math.round((grandTotal / maxTotal) * 100 * 100) / 100 : 0;
      row.push(percentage > 0 ? `${percentage.toFixed(2)}%` : '');
      
      // Remarks
      row.push(student.remark || getRemarkFromPercentage(percentage));
      
      // Grade
      row.push(getGradeFromPercentage(percentage));
      
      // Attendance - format: "96 / 102"
      if (student.attendancePresent && student.attendanceTotal) {
        row.push(`${student.attendancePresent} / ${student.attendanceTotal}`);
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
  data.selectedSubjects.forEach(subject => {
    const firstStudent = data.students.find(s => s.subjectMarksDetail?.[subject]);
    const hasDetailedMarks = firstStudent?.subjectMarksDetail?.[subject]?.internal !== undefined 
      && firstStudent?.subjectMarksDetail?.[subject]?.internal !== 0;
    
    if (hasDetailedMarks) {
      colWidths.push({ wch: 10 }); // Theory
      colWidths.push({ wch: 10 }); // Oral
      colWidths.push({ wch: 14 }); // Total
    } else {
      colWidths.push({ wch: 14 }); // Single subject
    }
  });
  
  // Final columns
  colWidths.push({ wch: 14 }); // Max Grand Total
  colWidths.push({ wch: 14 }); // Grand Total Obtained
  colWidths.push({ wch: 10 }); // % Marks
  colWidths.push({ wch: 20 }); // Remarks
  colWidths.push({ wch: 8 });  // Grade
  colWidths.push({ wch: 12 }); // Attendance
  
  ws['!cols'] = colWidths;

  // Merge title row across all columns
  const totalCols = columnHeaders.length;
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Consolidated MarkSheet');

  // Generate filename matching reference
  const classInfo = data.className || 'VI';
  const sectionInfo = data.section || 'C';
  const filename = `${classInfo}-${sectionInfo}_NAMEWISE.xlsx`;
  
  // Download file
  XLSX.writeFile(wb, filename);
}

/**
 * Get subject abbreviation matching Cambridge Court format
 */
function getSubjectAbbreviation(subject: string): string {
  const abbrevMap: Record<string, string> = {
    'Mathematics': 'Mths',
    'Maths': 'Mths',
    'English': 'Eng',
    'Hindi': 'Hin',
    'Science': 'Sc',
    'Social Studies': 'Ssc',
    'Social Science': 'Ssc',
    'Sanskrit': 'Sans',
    'Computer Science': 'Comp',
    'Computer': 'Comp',
    'French': 'Fr',
    'Drawing': 'Draw',
    'Art': 'Draw',
    'Health & PE': 'H&PE',
    'Health & Physical Education': 'H&PE',
    'Physical Education': 'H&PE',
    'Value Education': 'VDMATVS',
    'Moral Science': 'VDMATVS',
    'General Knowledge': 'GK',
    'Environmental Studies': 'EVS',
    'Music': 'Music',
  };
  
  // Check for direct match first
  if (abbrevMap[subject]) return abbrevMap[subject];
  
  // Try case-insensitive match
  const lowerSubject = subject.toLowerCase();
  for (const [key, value] of Object.entries(abbrevMap)) {
    if (key.toLowerCase() === lowerSubject) return value;
  }
  
  // Return first 4 characters as abbreviation
  return subject.substring(0, 4);
}

/**
 * Get remark based on percentage - matching Cambridge Court format
 */
function getRemarkFromPercentage(percentage: number): string {
  if (percentage >= 85) return 'Excellent';
  if (percentage >= 70) return 'Very Good';
  if (percentage >= 60) return 'Good';
  if (percentage >= 50) return 'Satisfactory';
  if (percentage >= 40) return 'Fair';
  return 'Needs to work hard';
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
    ['Class Average', `${Math.round(validStudents.reduce((a, s) => a + s.percentage, 0) / validStudents.length)}%`],
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