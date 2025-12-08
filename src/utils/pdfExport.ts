import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AssessmentData, SKILL_VALUES } from '@/types/assessment';

/**
 * Exports assessment data to a formatted PDF file
 */
export function exportToPDF(data: AssessmentData): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName || 'Student Assessment Report', pageWidth / 2, 15, { align: 'center' });
  
  // Sub-header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const subHeader = [
    data.className ? `Class: ${data.className}` : '',
    data.totalStrength ? `Total Strength: ${data.totalStrength}` : '',
    `Date: ${new Date().toLocaleDateString()}`,
  ].filter(Boolean).join(' | ');
  doc.text(subHeader, pageWidth / 2, 22, { align: 'center' });
  
  // Prepare table data
  const headers = [
    'S.No',
    'Roll No',
    'Student Name',
    ...data.selectedSubjects.map(s => s.replace(' Skills', '').replace(' Usage', '')),
    'Total',
    'Remarks',
  ];
  
  const maxScore = data.selectedSubjects.length * 2;
  
  const tableData = data.students
    .filter(s => s.name.trim())
    .map(student => [
      student.serialNo,
      student.rollNumber || '-',
      student.name,
      ...data.selectedSubjects.map(subject => {
        const rating = student.subjectRatings[subject] || 'Good';
        return `${rating} (${SKILL_VALUES[rating]})`;
      }),
      `${student.total}/${maxScore}`,
      student.remark || '-',
    ]);
  
  // Generate table
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY: 28,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
      halign: 'left',
    },
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 }, // S.No
      1: { halign: 'center', cellWidth: 18 }, // Roll No
      2: { cellWidth: 35 }, // Name
      [headers.length - 2]: { halign: 'center', cellWidth: 15 }, // Total
      [headers.length - 1]: { cellWidth: 50 }, // Remarks
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawPage: (data) => {
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on ${new Date().toLocaleString()}`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });
  
  // Save the PDF
  const fileName = `${data.schoolName || 'Assessment'}_${data.className || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
