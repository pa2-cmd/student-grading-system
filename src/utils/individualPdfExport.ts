import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Student, getGradeFromPercentage, Term, SubjectMarksDetail } from '@/types/assessment';

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
 * Export an individual student's report card as a FIXED 2-PAGE PDF
 * 
 * PAGE 1: Student details + Complete marks table
 * PAGE 2: AI-generated review + Teacher remarks
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

  const addPageFooter = (pageNum: number) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Page ${pageNum} of 2 | Generated on ${new Date().toLocaleString()}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    );
  };

  // ===========================
  // PAGE 1: STUDENT DETAILS + MARKS TABLE
  // ===========================
  
  // School Name Header
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
  // STUDENT INFORMATION SECTION - Match reference sheet headings
  // ===========================
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);

  // Calculate attendance string - format: "96 / 102 (94%)"
  const attendanceStr = student.attendanceTotal > 0 
    ? `${student.attendancePresent} / ${student.attendanceTotal} (${Math.round((student.attendancePresent / student.attendanceTotal) * 100)}%)`
    : '-';

  // Student details in grid layout - matching reference sheet columns
  const detailRows = [
    ['Name:', student.name, 'Enrollment No:', student.enrollmentNumber || '-'],
    ['Sr. No.:', String(student.serialNo), 'Class:', `${className || '-'} - ${section || '-'}`],
    ['Father Name:', student.fatherName || '-', 'Mother Name:', student.motherName || '-'],
    ['DOB:', student.dob || '-', 'Gender:', student.gender || '-'],
    ['Class Position:', `${student.classPosition} / ${totalStudents}`, 'Attendance:', attendanceStr],
    ['Grade:', student.grade || getGradeFromPercentage(student.percentage), 'Term:', term],
  ];

  const leftCol = margin;
  const midLeft = 45;
  const rightCol = pageWidth / 2 + 5;
  const midRight = pageWidth / 2 + 45;

  detailRows.forEach(row => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(row[0], leftCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[1]).substring(0, 30), midLeft, yPos);
    
    doc.setFont('helvetica', 'bold');
    doc.text(row[2], rightCol, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(String(row[3]).substring(0, 30), midRight, yPos);
    
    yPos += 6;
  });

  yPos += 5;
  addLine();

  // ===========================
  // SUBJECT-WISE MARKS TABLE
  // ===========================
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Subject-wise Performance', margin, yPos);
  yPos += 7;

  // Calculate totals - only count subjects with actual marks
  let totalMarks = 0;
  let maxMarks = 0;
  let subjectsWithMarks = 0;

  // Helper to get mark display - preserve blanks
  const getMarkDisplay = (mark: number | null | undefined): string => {
    if (mark === undefined || mark === null) return '-';
    if (mark === 0) return '0'; // Show actual zero
    return mark.toString();
  };

  // Prepare table data - preserve subject order EXACTLY from selectedSubjects
  const tableBody = selectedSubjects.map((subject, index) => {
    const detail = student.subjectMarksDetail?.[subject];
    const simpleMark = student.subjectMarks?.[subject];
    
    let theoryMark: number | null = null;
    let internalMark: number | null = null;
    let totalMark: number | null = null;
    
    if (detail) {
      theoryMark = detail.theory ?? null;
      internalMark = detail.internal ?? null;
      totalMark = detail.total ?? null;
    } else if (simpleMark !== undefined && simpleMark !== null) {
      totalMark = simpleMark;
    }
    
    const hasValidMark = totalMark !== null && totalMark > 0;
    
    if (hasValidMark) {
      totalMarks += totalMark!;
      maxMarks += 100;
      subjectsWithMarks++;
    }
    
    const grade = hasValidMark ? getGradeFromPercentage(totalMark!) : '-';
    
    return [
      (index + 1).toString(),
      subject,
      getMarkDisplay(theoryMark),
      getMarkDisplay(internalMark),
      getMarkDisplay(totalMark), // Blank marks shown as '-'
      '100',
      grade
    ];
  });

  // Add total row
  tableBody.push([
    '',
    'TOTAL',
    '',
    '',
    subjectsWithMarks > 0 ? totalMarks.toString() : '-',
    subjectsWithMarks > 0 ? maxMarks.toString() : '-',
    subjectsWithMarks > 0 ? getGradeFromPercentage(student.percentage) : '-'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['S.No', 'Subject', 'Theory', 'Internal', 'Total', 'Max', 'Grade']],
    body: tableBody,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: 2.5,
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
      0: { cellWidth: 12 },
      1: { halign: 'left', cellWidth: 45 },
      2: { cellWidth: 22 },
      3: { cellWidth: 22 },
      4: { cellWidth: 22 },
      5: { cellWidth: 18 },
      6: { cellWidth: 18 },
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
  // PERFORMANCE SUMMARY BOXES
  // ===========================
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
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

  yPos += boxHeight + 10;

  // Signature lines at bottom of page 1
  const signatureY = pageHeight - 35;
  
  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 10, signatureY, margin + 60, signatureY);
  doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin - 10, signatureY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Class Teacher', margin + 35, signatureY + 5, { align: 'center' });
  doc.text('Principal', pageWidth - margin - 35, signatureY + 5, { align: 'center' });

  // Page 1 footer
  addPageFooter(1);

  // ===========================
  // PAGE 2: AI REVIEW + TEACHER REMARKS
  // ===========================
  
  doc.addPage();
  yPos = margin;

  // Page 2 Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(41, 98, 255);
  centerText(schoolName || 'Student Report Card', yPos);
  yPos += 7;

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  centerText(`${student.name} - ${term} Review`, yPos);
  yPos += 10;

  addLine();

  // ===========================
  // AI-GENERATED PERFORMANCE REVIEW
  // ===========================
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Performance Review', margin, yPos);
  yPos += 8;

  // Review box
  doc.setFillColor(252, 252, 255);
  doc.setDrawColor(200, 210, 230);
  
  // Use student remark or generate fallback
  const reviewText = student.remark || generateFallbackReview(student, selectedSubjects);
  const reviewLines = doc.splitTextToSize(reviewText, pageWidth - margin * 2 - 10);
  const reviewBoxHeight = Math.max(45, reviewLines.length * 5 + 15);
  
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, reviewBoxHeight, 3, 3, 'FD');
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  doc.text(reviewLines, margin + 5, yPos + 8);
  
  yPos += reviewBoxHeight + 15;

  // ===========================
  // STRENGTHS & AREAS FOR IMPROVEMENT
  // ===========================
  
  const colWidth = (pageWidth - margin * 2 - 10) / 2;
  const strengthsY = yPos;
  
  // Strengths section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(34, 139, 34);
  doc.text('Strengths', margin, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  
  const strengths = student.strengths?.length > 0 
    ? student.strengths 
    : ['Shows interest in learning', 'Regular attendance'];
  
  strengths.slice(0, 5).forEach((strength, i) => {
    doc.text(`• ${strength}`, margin + 5, yPos + 7 + (i * 6));
  });
  
  // Areas for Improvement section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(200, 100, 0);
  doc.text('Areas for Improvement', margin + colWidth + 10, strengthsY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  
  const improvements = student.improvements?.length > 0 
    ? student.improvements 
    : ['Continue practicing regularly'];
  
  improvements.slice(0, 5).forEach((imp, i) => {
    doc.text(`• ${imp}`, margin + colWidth + 15, strengthsY + 7 + (i * 6));
  });

  yPos += Math.max(strengths.length, improvements.length) * 6 + 20;

  // ===========================
  // TEACHER'S ADDITIONAL REMARKS
  // ===========================
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text("Teacher's Additional Remarks", margin, yPos);
  yPos += 7;

  // Empty remarks box for teacher to fill
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 3, 3, 'FD');
  doc.setLineDashPattern([], 0);
  
  if (student.teacherNotes) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const notesLines = doc.splitTextToSize(student.teacherNotes, pageWidth - margin * 2 - 10);
    doc.text(notesLines, margin + 5, yPos + 8);
  }
  
  yPos += 45;

  // ===========================
  // NEXT STEPS
  // ===========================
  
  if (student.nextSteps?.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(41, 98, 255);
    doc.text('Recommended Next Steps', margin, yPos);
    yPos += 7;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(60, 60, 60);
    
    student.nextSteps.slice(0, 4).forEach((step, i) => {
      doc.text(`${i + 1}. ${step}`, margin + 5, yPos + (i * 6));
    });
    
    yPos += student.nextSteps.length * 6 + 10;
  }

  // ===========================
  // PAGE 2 SIGNATURES
  // ===========================
  
  const sig2Y = pageHeight - 45;
  
  doc.setDrawColor(150, 150, 150);
  doc.line(margin + 5, sig2Y, margin + 55, sig2Y);
  doc.line(pageWidth / 2 - 25, sig2Y, pageWidth / 2 + 25, sig2Y);
  doc.line(pageWidth - margin - 55, sig2Y, pageWidth - margin - 5, sig2Y);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Class Teacher', margin + 30, sig2Y + 5, { align: 'center' });
  doc.text('Parent/Guardian', pageWidth / 2, sig2Y + 5, { align: 'center' });
  doc.text('Principal', pageWidth - margin - 30, sig2Y + 5, { align: 'center' });

  // Date line
  doc.setFontSize(9);
  doc.text(`Date: _______________`, margin, sig2Y + 15);

  // Page 2 footer
  addPageFooter(2);

  // ===========================
  // SAVE FILE
  // ===========================
  
  // Clean filename - format: {StudentName}_Roll-{Roll}_Enroll-{Enrollment}_Class-{Class}{Section}_Term-{Term}.pdf
  const cleanName = student.name.trim().replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
  const cleanRoll = (student.rollNumber || String(student.serialNo)).replace(/[^a-zA-Z0-9]/g, '');
  const cleanEnroll = (student.enrollmentNumber || 'NA').replace(/[^a-zA-Z0-9-]/g, '');
  const cleanClass = (className || '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanSection = (section || '').replace(/[^a-zA-Z0-9]/g, '');
  const cleanTerm = term.replace(/\s+/g, '');
  
  const fileName = `${cleanName}_Roll-${cleanRoll}_Enroll-${cleanEnroll}_Class-${cleanClass}${cleanSection}_${cleanTerm}.pdf`;
  
  doc.save(fileName);
}

/**
 * Generate a safe fallback review if AI generation fails
 */
function generateFallbackReview(student: Student, selectedSubjects: string[]): string {
  const name = student.name.split(' ')[0];
  const percentage = student.percentage || 0;
  
  let performance = 'satisfactory';
  if (percentage >= 85) performance = 'excellent';
  else if (percentage >= 70) performance = 'very good';
  else if (percentage >= 60) performance = 'good';
  else if (percentage >= 45) performance = 'satisfactory';
  else performance = 'needs improvement';
  
  return `${name} has shown ${performance} performance this term with an overall score of ${percentage}%. ` +
    `The student demonstrates commitment to learning and participates actively in class activities. ` +
    `With continued effort and regular practice, there is potential for further improvement. ` +
    `Parents are encouraged to support the student's learning journey at home. ` +
    `Keep up the good work and stay focused on your goals!`;
}

/**
 * Bulk export all students as individual PDFs
 */
export async function exportAllStudentsPDF(options: {
  students: Student[];
  selectedSubjects: string[];
  schoolName: string;
  examName?: string;
  className: string;
  section: string;
  term?: Term;
}): Promise<void> {
  const { students, selectedSubjects, schoolName, examName, className, section, term } = options;
  
  const validStudents = students.filter(s => s.name.trim());
  const sortedStudents = [...validStudents].sort((a, b) => b.percentage - a.percentage);
  
  for (let i = 0; i < sortedStudents.length; i++) {
    const student = sortedStudents[i];
    const position = i + 1;
    
    await exportStudentPDF({
      student: { ...student, classPosition: position },
      selectedSubjects,
      schoolName,
      examName,
      className,
      section,
      term,
      totalStudents: validStudents.length,
    });
    
    // Small delay between downloads
    await new Promise(resolve => setTimeout(resolve, 300));
  }
}