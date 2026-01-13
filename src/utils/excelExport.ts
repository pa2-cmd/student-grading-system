import * as XLSX from 'xlsx';
import { AssessmentData, SKILL_VALUES, getMaxPossibleScore } from '@/types/assessment';

/**
 * Exports assessment data to Excel
 * 
 * EXPORT RULES:
 * - Include all marks (imported + manually edited)
 * - Preserve blank cells where marks were not entered (undefined → empty cell)
 * - No metadata rows - only the table for clean re-import
 */
export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();

  // Header row - matches expected import headers exactly
  const headerRows = [
    ['S.No', 'Roll No', 'Student Name', ...data.selectedSubjects, 'Total', 'Remarks'],
  ];

  const studentRows = data.students
    .filter(s => s.name.trim())
    .map((student) => {
      // Calculate max score based on rated fields only
      const maxScore = getMaxPossibleScore(student.subjectRatings);
      
      return [
        student.serialNo,
        student.rollNumber || '',
        student.name,
        // Map each subject - preserve blanks as empty strings
        ...data.selectedSubjects.map(subject => {
          const rating = student.subjectRatings[subject];
          // If rating is undefined (unselected), export as empty cell
          if (rating === undefined) return '';
          return `${rating} (${SKILL_VALUES[rating]})`;
        }),
        // Total shows only rated subjects
        `${student.total}/${maxScore}`,
        student.remark,
      ];
    });

  const allRows = [...headerRows, ...studentRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 }, { wch: 10 }, { wch: 25 },
    ...data.selectedSubjects.map(() => ({ wch: 18 })),
    { wch: 10 }, { wch: 80 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Assessment');

  const filename = `${(data.schoolName || 'Assessment').replace(/\s+/g, '_')}_${(data.className || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
