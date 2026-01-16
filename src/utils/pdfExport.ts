import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { 
  AssessmentData, 
  Student,
  SKILL_VALUES, 
  getMaxPossibleScore, 
  ENGLISH_SKILLS,
  calculateClassPerformance 
} from '@/types/assessment';
import { generateClassInsights } from './remarkGenerator';

/**
 * Exports class assessment data to a formatted PDF file
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
  doc.text(data.schoolName || 'English Assessment Report', pageWidth / 2, 15, { align: 'center' });
  
  // Sub-header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const classSection = [data.className, data.section].filter(Boolean).join(' - ');
  const subHeader = [
    classSection ? `Class: ${classSection}` : '',
    data.totalStrength ? `Total Strength: ${data.totalStrength}` : '',
    `Date: ${new Date().toLocaleDateString()}`,
  ].filter(Boolean).join(' | ');
  doc.text(subHeader, pageWidth / 2, 22, { align: 'center' });
  
  // Prepare table data with English skills only
  const headers = [
    'S.No',
    'Roll No',
    'Student Name',
    ...ENGLISH_SKILLS.map(s => s.replace(' Skills', '').replace(' Usage', '')),
    'Total',
    'Remarks',
  ];
  
  const tableData = data.students
    .filter(s => s.name.trim())
    .map(student => {
      const maxScore = getMaxPossibleScore(student.subjectRatings);
      
      return [
        student.serialNo,
        student.rollNumber || '-',
        student.name,
        ...ENGLISH_SKILLS.map(skill => {
          const rating = student.subjectRatings[skill];
          if (rating === undefined) return '-';
          return `${rating} (${SKILL_VALUES[rating]})`;
        }),
        `${student.total}/${maxScore}`,
        student.remark || '-',
      ];
    });
  
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
      0: { halign: 'center', cellWidth: 12 },  // S.No
      1: { halign: 'center', cellWidth: 18 },  // Roll No
      2: { cellWidth: 32 },                     // Name
      [headers.length - 2]: { halign: 'center', cellWidth: 15 }, // Total
      [headers.length - 1]: { cellWidth: 65 }, // Remarks
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    didDrawPage: () => {
      // Footer
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text(
        `Generated on ${new Date().toLocaleString()} | English Assessment Tool`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    },
  });
  
  // Save the PDF
  const classInfo = [data.className, data.section].filter(Boolean).join('_');
  const fileName = `${data.schoolName || 'English_Assessment'}_${classInfo || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Exports individual student report as PDF with chart
 */
export function exportStudentPDF(student: Student, data: AssessmentData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;
  
  // School Header
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName || 'School Name', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Class/Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const classSection = [data.className, data.section].filter(Boolean).join(' - ');
  if (classSection) {
    doc.text(`Class: ${classSection}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
  }
  
  // Title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('English Assessment Report', pageWidth / 2, yPos + 4, { align: 'center' });
  yPos += 15;
  
  // Student Info Box
  doc.setDrawColor(200);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 20, 3, 3, 'FD');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Student: ${student.name}`, margin + 5, yPos + 8);
  doc.text(`Roll No: ${student.rollNumber || '-'}`, margin + 5, yPos + 15);
  doc.text(`S.No: ${student.serialNo}`, pageWidth - margin - 30, yPos + 8);
  yPos += 28;
  
  // Skills Assessment Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('English Skills Assessment', margin, yPos);
  yPos += 5;
  
  const maxScore = getMaxPossibleScore(student.subjectRatings);
  
  const skillsTableData = ENGLISH_SKILLS.map(skill => {
    const rating = student.subjectRatings[skill];
    const value = rating ? SKILL_VALUES[rating] : '-';
    return [
      skill.replace(' Skills', '').replace(' Usage', ''),
      rating || 'Not Assessed',
      typeof value === 'number' ? `${value}/2` : value,
    ];
  });
  
  // Add total row
  skillsTableData.push(['TOTAL', '', `${student.total}/${maxScore}`]);
  
  autoTable(doc, {
    head: [['Skill Area', 'Rating', 'Score']],
    body: skillsTableData,
    startY: yPos,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: 255,
      fontStyle: 'bold',
    },
    columnStyles: {
      0: { cellWidth: 70 },
      1: { cellWidth: 50, halign: 'center' },
      2: { cellWidth: 30, halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 10;
  
  // Performance Bar Chart (simple visual representation)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Visualization', margin, yPos);
  yPos += 8;
  
  const barHeight = 8;
  const maxBarWidth = pageWidth - 2 * margin - 60;
  
  ENGLISH_SKILLS.forEach((skill, index) => {
    const rating = student.subjectRatings[skill];
    const value = rating ? SKILL_VALUES[rating] : 0;
    const percentage = (value / 2) * 100;
    const barWidth = (percentage / 100) * maxBarWidth;
    
    // Skill label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const shortSkill = skill.replace(' Skills', '').replace(' Usage', '').substring(0, 15);
    doc.text(shortSkill, margin, yPos + index * 12 + 5);
    
    // Background bar
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(margin + 55, yPos + index * 12, maxBarWidth, barHeight, 2, 2, 'F');
    
    // Filled bar
    if (barWidth > 0) {
      const color = percentage >= 75 ? [76, 175, 80] : percentage >= 50 ? [255, 193, 7] : [244, 67, 54];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(margin + 55, yPos + index * 12, barWidth, barHeight, 2, 2, 'F');
    }
    
    // Percentage label
    doc.text(`${Math.round(percentage)}%`, margin + 60 + maxBarWidth, yPos + index * 12 + 5);
  });
  
  yPos += ENGLISH_SKILLS.length * 12 + 10;
  
  // AI Review Section
  if (student.remark) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Teacher\'s Review', margin, yPos);
    yPos += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Word wrap for remarks
    const remarkLines = doc.splitTextToSize(student.remark, pageWidth - 2 * margin);
    doc.text(remarkLines, margin, yPos);
    yPos += remarkLines.length * 5 + 10;
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  
  // Save
  const fileName = `${student.name.replace(/\s+/g, '_')}_English_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

/**
 * Exports class performance analysis PDF with charts and insights
 */
export function exportClassPerformancePDF(data: AssessmentData): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  let yPos = 20;
  
  const stats = calculateClassPerformance(data.students);
  
  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.schoolName || 'School Name', pageWidth / 2, yPos, { align: 'center' });
  yPos += 10;
  
  doc.setFontSize(14);
  doc.text('Class Performance Analysis - English', pageWidth / 2, yPos, { align: 'center' });
  yPos += 8;
  
  // Class info
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  const classSection = [data.className, data.section].filter(Boolean).join(' - ');
  const infoText = [
    classSection ? `Class: ${classSection}` : '',
    `Total Students: ${stats.totalStudents}`,
    `Date: ${new Date().toLocaleDateString()}`,
  ].filter(Boolean).join(' | ');
  doc.text(infoText, pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;
  
  // Skills Average Table
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Skill-wise Class Average', margin, yPos);
  yPos += 5;
  
  const skillTableData = ENGLISH_SKILLS.map(skill => [
    skill.replace(' Skills', '').replace(' Usage', ''),
    `${Math.round(stats.skillAverages[skill] || 0)}%`,
  ]);
  
  skillTableData.push(['Overall Class Average', `${Math.round(stats.overallAverage)}%`]);
  
  autoTable(doc, {
    head: [['English Skill', 'Class Average']],
    body: skillTableData,
    startY: yPos,
    margin: { left: margin, right: pageWidth / 2 + 10 },
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [41, 98, 255], textColor: 255, fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 30, halign: 'center' },
    },
  });
  
  // Bar chart on right side
  const chartX = pageWidth / 2 + 15;
  const chartY = yPos + 5;
  const barHeight = 10;
  const maxBarWidth = 60;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Chart', chartX, chartY - 2);
  
  ENGLISH_SKILLS.forEach((skill, index) => {
    const avg = stats.skillAverages[skill] || 0;
    const barWidth = (avg / 100) * maxBarWidth;
    const y = chartY + 5 + index * 14;
    
    // Background
    doc.setFillColor(230, 230, 230);
    doc.roundedRect(chartX, y, maxBarWidth, barHeight, 2, 2, 'F');
    
    // Filled
    if (barWidth > 0) {
      const color = avg >= 75 ? [76, 175, 80] : avg >= 50 ? [255, 193, 7] : [244, 67, 54];
      doc.setFillColor(color[0], color[1], color[2]);
      doc.roundedRect(chartX, y, barWidth, barHeight, 2, 2, 'F');
    }
    
    // Label
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`${Math.round(avg)}%`, chartX + maxBarWidth + 3, y + 7);
  });
  
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Distribution Section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Distribution', margin, yPos);
  yPos += 8;
  
  // Distribution boxes
  const boxWidth = (pageWidth - 2 * margin - 20) / 3;
  
  // High performers
  doc.setFillColor(76, 175, 80);
  doc.roundedRect(margin, yPos, boxWidth, 25, 3, 3, 'F');
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(String(stats.distribution.high), margin + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Excellent (80%+)', margin + boxWidth / 2, yPos + 20, { align: 'center' });
  
  // Average performers
  doc.setFillColor(255, 193, 7);
  doc.roundedRect(margin + boxWidth + 10, yPos, boxWidth, 25, 3, 3, 'F');
  doc.setTextColor(0);
  doc.setFontSize(18);
  doc.text(String(stats.distribution.average), margin + boxWidth + 10 + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Average (55-79%)', margin + boxWidth + 10 + boxWidth / 2, yPos + 20, { align: 'center' });
  
  // Low performers
  doc.setFillColor(244, 67, 54);
  doc.roundedRect(margin + 2 * boxWidth + 20, yPos, boxWidth, 25, 3, 3, 'F');
  doc.setTextColor(255);
  doc.setFontSize(18);
  doc.text(String(stats.distribution.low), margin + 2 * boxWidth + 20 + boxWidth / 2, yPos + 12, { align: 'center' });
  doc.setFontSize(9);
  doc.text('Needs Improvement', margin + 2 * boxWidth + 20 + boxWidth / 2, yPos + 20, { align: 'center' });
  
  doc.setTextColor(0);
  yPos += 35;
  
  // AI Insights
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Class Insights', margin, yPos);
  yPos += 6;
  
  const insights = generateClassInsights(
    stats.skillAverages, 
    stats.distribution, 
    stats.totalStudents, 
    data.language
  );
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const insightLines = doc.splitTextToSize(insights, pageWidth - 2 * margin);
  doc.text(insightLines, margin, yPos);
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated on ${new Date().toLocaleString()} | English Assessment Tool`,
    pageWidth / 2,
    doc.internal.pageSize.getHeight() - 10,
    { align: 'center' }
  );
  
  // Save
  const classInfo = [data.className, data.section].filter(Boolean).join('_');
  const fileName = `Class_Performance_${classInfo || 'Report'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
