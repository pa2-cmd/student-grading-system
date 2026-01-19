import * as XLSX from 'xlsx';
import { 
  AssessmentData, 
  SKILL_VALUES, 
  getMaxPossibleScore, 
  getSkillsForSubject,
  getSkillDisplayName 
} from '@/types/assessment';

/**
 * Exports assessment data to Excel - subject-aware
 * 
 * EXPORT RULES:
 * - Include metadata rows at top (school, class, section, subject)
 * - Include all marks (imported + manually edited)
 * - Preserve blank cells where marks were not entered (undefined → empty cell)
 * - Preserve 0 values (do not convert to empty)
 * - Must be re-importable without errors
 */
export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();
  const skills = getSkillsForSubject(data.subject);

  // Metadata rows at top
  const metadataRows: any[][] = [];
  
  if (data.schoolName) {
    metadataRows.push(['School:', data.schoolName]);
  }
  
  const classSection = [data.className, data.section].filter(Boolean).join(' - ');
  if (classSection) {
    metadataRows.push(['Class:', classSection]);
  }
  
  metadataRows.push(['Subject:', data.subject]);
  metadataRows.push(['Assessment:', `${data.subject} Skills Assessment`]);
  metadataRows.push(['Date:', new Date().toLocaleDateString()]);
  metadataRows.push([]); // Empty row before table
  
  // Header row - dynamic based on subject skills (NO Roll Number)
  const headerRow = [
    'S.No', 
    'Student Name', 
    ...skills, 
    'Total', 
    'Remarks'
  ];

  const studentRows = data.students
    .filter(s => s.name.trim())
    .map((student) => {
      const maxScore = getMaxPossibleScore(student.subjectRatings);
      
      return [
        student.serialNo,
        student.name,
        // Map each skill - preserve blanks as empty, preserve 0 values
        ...skills.map(skill => {
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

  // Set column widths dynamically (NO Roll Number column)
  const colWidths = [
    { wch: 6 },   // S.No
    { wch: 25 },  // Student Name
    ...skills.map(() => ({ wch: 18 })),  // Skill columns
    { wch: 10 },  // Total
    { wch: 80 },  // Remarks
  ];
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, `${data.subject} Assessment`);

  const filename = `${(data.schoolName || data.subject + '_Assessment').replace(/\s+/g, '_')}_${(data.className || 'Report').replace(/\s+/g, '_')}${data.section ? '_' + data.section : ''}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
