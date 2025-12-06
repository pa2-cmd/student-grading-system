import * as XLSX from 'xlsx';
import { AssessmentData, SKILL_VALUES } from '@/types/assessment';

export function exportToExcel(data: AssessmentData) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // Prepare header rows
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
    [
      '',
      '',
      'Good=2, Avg=1, NI=0',
      'Good=2, Avg=1, NI=0',
      'Good=2, Avg=1, NI=0',
      'Good=2, Avg=1, NI=0',
      'Good=2, Avg=1, NI=0',
      '',
      ''
    ],
  ];

  // Prepare student data rows
  const studentRows = data.students.map((student) => [
    student.serialNo,
    student.name,
    `${student.speakingListening} (${SKILL_VALUES[student.speakingListening]})`,
    `${student.writing} (${SKILL_VALUES[student.writing]})`,
    `${student.vocabulary} (${SKILL_VALUES[student.vocabulary]})`,
    `${student.grammar} (${SKILL_VALUES[student.grammar]})`,
    `${student.reading} (${SKILL_VALUES[student.reading]})`,
    student.total,
    student.remark,
  ]);

  // Combine all rows
  const allRows = [...headerRows, ...studentRows];

  // Create worksheet
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 25 },  // Student Name
    { wch: 22 },  // Speaking & Listening
    { wch: 18 },  // Writing
    { wch: 18 },  // Vocabulary
    { wch: 18 },  // Grammar
    { wch: 22 },  // Reading
    { wch: 8 },   // Total
    { wch: 50 },  // Remarks
  ];

  // Merge cells for school name header
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // School name across all columns
  ];

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Assessment');

  // Generate filename
  const filename = `${data.schoolName.replace(/\s+/g, '_')}_${data.className.replace(/\s+/g, '_')}_Assessment_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);
}
