import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, getGradeFromPercentage, Term } from '@/types/assessment';

interface ExportOptions {
  student: Student & { classPosition: number };
  selectedSubjects: string[];
  schoolName: string;
  examName?: string;
  className: string;
  section: string;
  term?: Term;
  totalStudents: number;
}

/**
 * Export an individual student's report card as PDF
 */
export async function exportStudentPDF({
  student,
  selectedSubjects,
  schoolName,
  examName = '',
  className,
  section,
  term = 'Term 1',
  totalStudents
}: ExportOptions): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPos = margin;

  // Helper functions
  const centerText = (text: string, y: number, fontSize: number = 12) => {
    doc.setFontSize(fontSize);
    doc.text(text, pageWidth / 2, y, { align: 'center' });
  };

  const addLine = () => {
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 5;
  };

  // ===========================
  // HEADER
  // ===========================
  
  // School Name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(41, 98, 255);
  centerText(schoolName || 'Student Report Card', yPos);
  yPos += 8;

  // Exam Name / Term
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  centerText(examName || `${term} - Progress Report`, yPos);
  yPos += 6;

  // Report Title
  doc.setFontSize(10);
  centerText('STUDENT PROGRESS REPORT', yPos);
  yPos += 10;

  addLine();

  // ===========================
  // STUDENT INFO
  // ===========================
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);

  const attendanceStr = student.attendanceTotal > 0 
    ? `${student.attendancePresent}/${student.attendanceTotal} (${Math.round((student.attendancePresent / student.attendanceTotal) * 100)}%)`
    : '-';

  const infoRows = [
    ['Student Name:', student.name, 'Class:', `${className || '-'} - ${section || '-'}`],
    ['Roll Number:', student.rollNumber || '-', 'Enrollment No:', student.enrollmentNumber || '-'],
    ['Class Position:', `${student.classPosition} / ${totalStudents}`, 'Attendance:', attendanceStr],
    ['Grade:', getGradeFromPercentage(student.percentage), 'Term:', term],
  ];

  const leftCol = margin;
  const midLeft = 50;
  const rightCol = pageWidth / 2 + 5;
  const midRight = pageWidth / 2 + 50;

  infoRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.text(row[0], leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[1]), midLeft, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], rightCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[3]), midRight, yPos);
    
    yPos += 7;
  });

  yPos += 5;
  addLine();

  // ===========================
  // MARKS TABLE
  // ===========================
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Subject-wise Performance', margin, yPos);
  yPos += 7;

  // Calculate totals
  const totalMarks = selectedSubjects.reduce((sum, subj) => sum + (student.subjectMarks?.[subj] || 0), 0);
  const maxMarks = selectedSubjects.length * 100;

  // Prepare table data
  const tableBody = selectedSubjects.map((subject, index) => {
    const marks = student.subjectMarks?.[subject] || 0;
    const grade = getGradeFromPercentage(marks);
    return [
      (index + 1).toString(),
      subject,
      marks.toString(),
      '100',
      grade
    ];
  });

  // Add total row
  tableBody.push([
    '',
    'TOTAL',
    totalMarks.toString(),
    maxMarks.toString(),
    getGradeFromPercentage(student.percentage)
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['S.No', 'Subject', 'Marks Obtained', 'Max Marks', 'Grade']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [41, 98, 255],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
    },
    bodyStyles: {
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { halign: 'left', cellWidth: 60 },
      2: { cellWidth: 35 },
      3: { cellWidth: 30 },
      4: { cellWidth: 25 },
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
    footStyles: {
      fillColor: [230, 235, 245],
      fontStyle: 'bold',
    },
  });

  // Get the final Y position after the table
  yPos = (doc as any).lastAutoTable.finalY + 10;

  // ===========================
  // PERFORMANCE SUMMARY
  // ===========================
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Performance Summary', margin, yPos);
  yPos += 7;

  // Summary boxes
  const boxWidth = (pageWidth - margin * 2 - 15) / 4;
  const boxHeight = 25;
  const boxes = [
    { label: 'Percentage', value: `${student.percentage}%` },
    { label: 'Grade', value: getGradeFromPercentage(student.percentage) },
    { label: 'Class Rank', value: `#${student.classPosition}` },
    { label: 'Subjects', value: selectedSubjects.length.toString() },
  ];

  boxes.forEach((box, index) => {
    const x = margin + index * (boxWidth + 5);
    
    // Box background
    doc.setFillColor(245, 247, 255);
    doc.setDrawColor(200, 210, 230);
    doc.roundedRect(x, yPos, boxWidth, boxHeight, 3, 3, 'FD');
    
    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(box.label, x + boxWidth / 2, yPos + 8, { align: 'center' });
    
    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(41, 98, 255);
    doc.text(box.value, x + boxWidth / 2, yPos + 18, { align: 'center' });
  });

  yPos += boxHeight + 15;

  // ===========================
  // REMARKS
  // ===========================
  
  if (student.remark) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("Teacher's Remarks", margin, yPos);
    yPos += 7;

    // Remarks box
    doc.setFillColor(252, 252, 255);
    doc.setDrawColor(200, 210, 230);
    
    // Calculate text height
    const remarkLines = doc.splitTextToSize(student.remark, pageWidth - margin * 2 - 10);
    const remarkBoxHeight = Math.max(25, remarkLines.length * 5 + 10);
    
    doc.roundedRect(margin, yPos, pageWidth - margin * 2, remarkBoxHeight, 3, 3, 'FD');
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    doc.text(remarkLines, margin + 5, yPos + 7);
    
    yPos += remarkBoxHeight + 10;
  }

  // ===========================
  // STRENGTHS & IMPROVEMENTS
  // ===========================
  
  if ((student.strengths && student.strengths.length > 0) || 
      (student.improvements && student.improvements.length > 0)) {
    
    const colWidth = (pageWidth - margin * 2 - 10) / 2;
    
    // Strengths
    if (student.strengths && student.strengths.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(34, 139, 34);
      doc.text('Strengths', margin, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      student.strengths.forEach((strength, i) => {
        doc.text(`• ${strength}`, margin + 5, yPos + 6 + (i * 5));
      });
    }
    
    // Improvements
    if (student.improvements && student.improvements.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(200, 100, 0);
      doc.text('Areas for Improvement', margin + colWidth + 10, yPos);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      student.improvements.forEach((imp, i) => {
        doc.text(`• ${imp}`, margin + colWidth + 15, yPos + 6 + (i * 5));
      });
    }
    
    yPos += Math.max(
      (student.strengths?.length || 0) * 5 + 15,
      (student.improvements?.length || 0) * 5 + 15
    );
  }

  // ===========================
  // FOOTER
  // ===========================
  
  // Signature lines at bottom
  const signatureY = pageHeight - 35;
  
  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 10, signatureY, margin + 60, signatureY);
  doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin - 10, signatureY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Class Teacher', margin + 35, signatureY + 5, { align: 'center' });
  doc.text('Principal', pageWidth - margin - 35, signatureY + 5, { align: 'center' });

  // Generation date
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.text(
    `Generated on ${new Date().toLocaleString()}`,
    pageWidth / 2,
    pageHeight - 10,
    { align: 'center' }
  );

  // ===========================
  // SAVE FILE
  // ===========================
  
  // Clean filename - format: {StudentName}_Roll-{Roll}_Enroll-{Enrollment}_Class-{Class}{Section}_Term-{Term}.pdf
  const cleanName = student.name.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const cleanRoll = (student.rollNumber || 'NA').replace(/[^a-zA-Z0-9]/g, '');
  const cleanEnroll = (student.enrollmentNumber || 'NA').replace(/[^a-zA-Z0-9]/g, '');
  const cleanClass = (className || '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanSection = (section || '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanTerm = term.replace(/\s+/g, '');
  
  const fileName = `${cleanName}_Roll-${cleanRoll}_Enroll-${cleanEnroll}_Class-${cleanClass}${cleanSection}_${cleanTerm}.pdf`;
  
  doc.save(fileName);
}
