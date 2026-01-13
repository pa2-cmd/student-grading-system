import * as XLSX from 'xlsx';
import { AssessmentData, SKILL_VALUES } from '@/types/assessment';

export function exportToExcel(data: AssessmentData) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare header rows - exact structure as specified
  const headerRows = [
    [data.schoolName],
    [`Class: ${data.className}`, '', '', '', '', '', `Total Strength: ${data.totalStrength}`],
    [], // Empty row
    [
      'S.No',
      'Student Name',
      'Speaking & Listening Skills',
      'Writing Skills',
      'Vocabulary',
      'Grammar Usage',
      'Reading Comprehension',
      'Total',
      'Remarks'
    ],
  ];

  // Prepare student data rows - preserve exact structure
  const studentRows = data.students.map((student) => [
    student.serialNo,
    student.name,
    student.speakingListening || '', // Preserve blank if empty
    student.writing || '',
    student.vocabulary || '',
    student.grammar || '',
    student.reading || '',
    student.total, // Use stored total (imported or calculated)
    student.remark || '', // Preserve blank if empty
  ]);

  // Combine all rows
  const allRows = [...headerRows, ...studentRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 25 },  // Student Name
    { wch: 26 },  // Speaking & Listening Skills
    { wch: 15 },  // Writing Skills
    { wch: 15 },  // Vocabulary
    { wch: 15 },  // Grammar Usage
    { wch: 22 },  // Reading Comprehension
    { wch: 8 },   // Total
    { wch: 50 },  // Remarks
  ];

  // Merge cells for school name header
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // School name across all columns
  ];

  // Freeze the top row (header row at row 4, which is index 3)
  ws['!freeze'] = { xSplit: 0, ySplit: 4 };
  
  // Alternative freeze pane syntax for better compatibility
  if (!ws['!views']) ws['!views'] = [];
  ws['!views'].push({ state: 'frozen', ySplit: 4 });

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Assessment');

  // Generate filename
  const filename = `${data.schoolName.replace(/\s+/g, '_')}_${data.className.replace(/\s+/g, '_')}_Assessment_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);
}
