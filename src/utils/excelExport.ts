import * as XLSX from 'xlsx';
import { AssessmentData, SKILL_VALUES, getMaxPossibleScore, ENGLISH_SKILLS } from '@/types/assessment';

/**
 * Exports English assessment data to Excel
 * 
 * EXPORT RULES:
 * - Include metadata rows at top (school, class, section)
 * - Include all marks (imported + manually edited)
 * - Preserve blank cells where marks were not entered (undefined → empty cell)
 * - Preserve 0 values (do not convert to empty)
 * - Must be re-importable without errors
 */
export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();

  // Metadata rows at top
  const metadataRows: any[][] = [];
  
  if (data.schoolName) {
    metadataRows.push(['School:', data.schoolName]);
  }
  
  const classSection = [data.className, data.section].filter(Boolean).join(' - ');
  if (classSection) {
    metadataRows.push(['Class:', classSection]);
  }
  
  metadataRows.push(['Assessment:', 'English Language Skills']);
  metadataRows.push(['Date:', new Date().toLocaleDateString()]);
  metadataRows.push([]); // Empty row before table
  
  // Header row - English skills only
  const headerRow = [
    'S.No', 
    'Roll No', 
    'Student Name', 
    ...ENGLISH_SKILLS, 
    'Total', 
    'Remarks'
  ];

  const studentRows = data.students
    .filter(s => s.name.trim())
    .map((student) => {
      const maxScore = getMaxPossibleScore(student.subjectRatings);
      
      return [
        student.serialNo,
        student.rollNumber || '',
        student.name,
        // Map each English skill - preserve blanks as empty, preserve 0 values
        ...ENGLISH_SKILLS.map(skill => {
          const rating = student.subjectRatings[skill];
          // If rating is undefined (unselected), export as empty cell
          if (rating === undefined) return '';
          return `${rating} (${SKILL_VALUES[rating]})`;
        }),
        // Total shows actual/max format
        `${student.total}/${maxScore}`,
        student.remark,
      ];
    });

  const allRows = [...metadataRows, headerRow, ...studentRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },   // S.No
    { wch: 10 },  // Roll No
    { wch: 25 },  // Student Name
    { wch: 22 },  // Speaking & Listening
    { wch: 18 },  // Writing Skills
    { wch: 15 },  // Vocabulary
    { wch: 18 },  // Grammar Usage
    { wch: 22 },  // Reading Comprehension
    { wch: 10 },  // Total
    { wch: 80 },  // Remarks
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'English Assessment');

  const filename = `${(data.schoolName || 'English_Assessment').replace(/\s+/g, '_')}_${(data.className || 'Report').replace(/\s+/g, '_')}${data.section ? '_' + data.section : ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
