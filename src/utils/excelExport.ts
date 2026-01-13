import * as XLSX from 'xlsx';
import { AssessmentData } from '@/types/assessment';

// Exact column headers - must match import requirements
const COLUMN_HEADERS = [
  'S.No',
  'Student Name',
  'Speaking & Listening Skills',
  'Writing Skills',
  'Vocabulary',
  'Grammar Usage',
  'Reading Comprehension',
  'Total',
  'Remarks'
];

export function exportToExcel(data: AssessmentData) {
  // Create workbook
  const wb = XLSX.utils.book_new();

  // ROW 1: Exact column headers (no extra rows, no merged cells)
  const rows: any[][] = [COLUMN_HEADERS];

  // Data rows - preserve exact values including S.No
  data.students.forEach((student) => {
    rows.push([
      student.serialNo !== null && student.serialNo !== undefined ? student.serialNo : '', // Preserve S.No exactly
      student.name || '',
      student.speakingListening || '',
      student.writing || '',
      student.vocabulary || '',
      student.grammar || '',
      student.reading || '',
      student.total !== null && student.total !== undefined ? student.total : '',
      student.remark || '',
    ]);
  });

  // Create worksheet from array - clean, no merged cells
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths for readability (does not affect import)
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

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Assessment');

  // Create metadata sheet with school info (separate from data)
  const metaRows = [
    ['School Name', data.schoolName],
    ['Class', data.className],
    ['Total Strength', data.totalStrength],
    ['Export Date', new Date().toISOString().split('T')[0]],
  ];
  const metaWs = XLSX.utils.aoa_to_sheet(metaRows);
  metaWs['!cols'] = [{ wch: 15 }, { wch: 40 }];
  XLSX.utils.book_append_sheet(wb, metaWs, 'Info');

  // Generate filename
  const safeName = (data.schoolName || 'School').replace(/[^a-zA-Z0-9]/g, '_');
  const safeClass = (data.className || 'Class').replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `${safeName}_${safeClass}_Assessment_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Save file
  XLSX.writeFile(wb, filename);
}
