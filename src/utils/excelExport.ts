import * as XLSX from 'xlsx';
import { AssessmentData, SKILL_VALUES } from '@/types/assessment';

export function exportToExcel(data: AssessmentData) {
  const wb = XLSX.utils.book_new();
  const maxScore = data.selectedSubjects.length * 2;

  const headerRows = [
    [data.schoolName],
    [`Class: ${data.className}`, '', '', `Total Strength: ${data.totalStrength}`, '', `Date: ${new Date().toLocaleDateString()}`],
    [],
    ['S.No', 'Roll No', 'Student Name', ...data.selectedSubjects, 'Total', 'Remarks'],
  ];

  const studentRows = data.students
    .filter(s => s.name.trim())
    .map((student) => [
      student.serialNo,
      student.rollNumber || '-',
      student.name,
      ...data.selectedSubjects.map(subject => {
        const rating = student.subjectRatings[subject] || 'Good';
        return `${rating} (${SKILL_VALUES[rating]})`;
      }),
      `${student.total}/${maxScore}`,
      student.remark,
    ]);

  const allRows = [...headerRows, ...studentRows];
  const ws = XLSX.utils.aoa_to_sheet(allRows);

  ws['!cols'] = [
    { wch: 6 }, { wch: 10 }, { wch: 25 },
    ...data.selectedSubjects.map(() => ({ wch: 18 })),
    { wch: 10 }, { wch: 50 },
  ];

  const totalCols = 3 + data.selectedSubjects.length + 2;
  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } }];

  XLSX.utils.book_append_sheet(wb, ws, 'Assessment');

  const filename = `${(data.schoolName || 'Assessment').replace(/\s+/g, '_')}_${(data.className || 'Report').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
}
