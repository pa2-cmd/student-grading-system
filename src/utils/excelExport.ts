import * as XLSX from 'xlsx';
import { AssessmentData, getGradeFromPercentage } from '@/types/assessment';

/**
 * Export to Excel in VI Award List format
 * Matches the original VI AWARD LIST 25-26 structure
 */
export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();

  // Build header rows matching VI Award List format
  const headerRows: any[][] = [];
  
  // Row 1: School name (merged across all columns)
  headerRows.push([data.schoolName || 'School Name']);
  
  // Row 2: Award list title with academic year
  headerRows.push([`VI AWARD LIST ${data.academicYear}`]);
  
  // Row 3: Class and section info
  headerRows.push([
    `Class: ${data.className || ''}${data.section ? ' - ' + data.section : ''}`,
    '',
    '',
    `Total Students: ${data.totalStrength || data.students.filter(s => s.name.trim()).length}`,
    '',
    `Date: ${new Date().toLocaleDateString('en-IN')}`
  ]);
  
  // Row 4: Empty row for spacing
  headerRows.push([]);
  
  // Row 5: Column headers
  const columnHeaders = [
    'S.No',
    'Student Name',
    'Enrollment No',
    ...data.selectedSubjects,
    'Total',
    'Percentage',
    'Grade',
    'Remarks'
  ];
  headerRows.push(columnHeaders);

  // Build student data rows
  const studentRows = data.students
    .filter(s => s.name.trim())
    .sort((a, b) => a.serialNo - b.serialNo)
    .map((student) => {
      // Calculate total marks
      const subjectMarks = data.selectedSubjects.map(subject => 
        student.subjectMarks?.[subject] ?? 0
      );
      const totalMarks = subjectMarks.reduce((a, b) => a + b, 0);
      const maxTotal = data.selectedSubjects.length * 100;
      const percentage = maxTotal > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0;
      
      return [
        student.serialNo,
        student.name,
        student.enrollmentNumber || '',
        ...subjectMarks,
        totalMarks,
        `${percentage}%`,
        getGradeFromPercentage(percentage),
        student.remark || '',
      ];
    });

  // Combine all rows
  const allRows = [...headerRows, ...studentRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  const totalCols = columnHeaders.length;
  ws['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 25 },  // Student Name
    { wch: 15 },  // Enrollment No
    ...data.selectedSubjects.map(() => ({ wch: 12 })),  // Subject columns
    { wch: 8 },   // Total
    { wch: 10 },  // Percentage
    { wch: 8 },   // Grade
    { wch: 50 },  // Remarks
  ];

  // Merge cells for title rows
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } },  // School name
    { s: { r: 1, c: 0 }, e: { r: 1, c: totalCols - 1 } },  // Award list title
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'VI Award List');

  // Generate filename
  const className = data.className || 'Class';
  const year = data.academicYear || new Date().getFullYear();
  const filename = `VI_AWARD_LIST_${className}_${year}.xlsx`;
  
  // Download file
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
    ['Class Average', `${Math.round(validStudents.reduce((a, s) => a + s.percentage, 0) / validStudents.length)}%`],
    [],
    ['SUBJECT-WISE PERFORMANCE'],
    ['Subject', 'Class Average', 'Highest', 'Lowest'],
  ];
  
  // Subject-wise stats
  data.selectedSubjects.forEach(subject => {
    const marks = validStudents.map(s => s.subjectMarks?.[subject] || 0);
    const avg = Math.round(marks.reduce((a, b) => a + b, 0) / marks.length);
    const highest = Math.max(...marks);
    const lowest = Math.min(...marks);
    summaryRows.push([subject, `${avg}%`, `${highest}%`, `${lowest}%`]);
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
