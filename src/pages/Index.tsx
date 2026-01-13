import { useState, useCallback } from 'react';
import { useAssessment } from '@/hooks/useAssessment';
import { HeaderSection } from '@/components/HeaderSection';
import { ActionButtons } from '@/components/ActionButtons';
import { AssessmentTable } from '@/components/AssessmentTable';
import { SubjectSelector } from '@/components/SubjectSelector';
import { exportToExcel } from '@/utils/excelExport';
import { exportToPDF } from '@/utils/pdfExport';
import { importStudentsFromExcel, createStudentsFromImport } from '@/utils/excelImport';
import { generateRemark } from '@/utils/remarkGenerator';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Index = () => {
  const {
    data,
    updateSchoolInfo,
    toggleLanguage,
    updateSelectedSubjects,
    addStudent,
    removeStudent,
    updateStudent,
    updateSubjectRating,
    updateStudentRemark,
    importStudents,
    resetAll,
    exportJSON,
    importJSON,
  } = useAssessment();

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Generate humanized AI remark for a single student
  const handleGenerateRemark = useCallback(async (studentId: string) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student || !student.name) {
      toast.error('Please enter student name first');
      return;
    }

    updateStudentRemark(studentId, '', true);

    try {
      const remark = await generateRemark({
        student,
        language: data.language,
        selectedSubjects: data.selectedSubjects,
      });
      updateStudentRemark(studentId, remark, false);
      toast.success('Remark generated successfully');
    } catch (error) {
      updateStudentRemark(studentId, '', false);
      toast.error('Failed to generate remark');
    }
  }, [data.students, data.language, data.selectedSubjects, updateStudentRemark]);

  // Generate remarks for all students
  const handleGenerateAllRemarks = useCallback(async () => {
    const studentsWithNames = data.students.filter(s => s.name.trim());
    if (studentsWithNames.length === 0) {
      toast.error('Please add student names first');
      return;
    }

    setIsGeneratingAll(true);
    toast.info(`Generating humanized remarks for ${studentsWithNames.length} students...`);

    for (const student of studentsWithNames) {
      updateStudentRemark(student.id, '', true);
      try {
        const remark = await generateRemark({
          student,
          language: data.language,
          selectedSubjects: data.selectedSubjects,
        });
        updateStudentRemark(student.id, remark, false);
      } catch (error) {
        updateStudentRemark(student.id, '', false);
      }
      // Small delay for natural feel
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setIsGeneratingAll(false);
    toast.success('All remarks generated successfully!');
  }, [data.students, data.language, data.selectedSubjects, updateStudentRemark]);

  // Export to Excel
  const handleExportExcel = useCallback(() => {
    if (data.students.length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToExcel(data);
    toast.success('Excel file exported successfully!');
  }, [data]);

  // Export to PDF
  const handleExportPDF = useCallback(() => {
    if (data.students.length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToPDF(data);
    toast.success('PDF file exported successfully!');
  }, [data]);

  // Import students from Excel file
  const handleImportExcel = useCallback(async (file: File) => {
    try {
      toast.info('Reading Excel file...');
      const importedStudents = await importStudentsFromExcel(file);
      const students = createStudentsFromImport(importedStudents, data.selectedSubjects);
      
      // If className was detected, update it
      const firstClassName = importedStudents.find(s => s.className)?.className;
      if (firstClassName) {
        updateSchoolInfo('className', firstClassName);
      }
      
      importStudents(students);
      updateSchoolInfo('totalStrength', students.length);
      toast.success(`Successfully imported ${students.length} students from Excel!`);
    } catch (error) {
      console.error('Excel import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import Excel file');
    }
  }, [data.selectedSubjects, importStudents, updateSchoolInfo]);

  // Reset confirmation
  const handleReset = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetAll();
    setShowResetDialog(false);
    toast.success('All data has been reset');
  }, [resetAll]);

  // Import JSON backup
  const handleImportJSON = useCallback((file: File) => {
    importJSON(file);
    toast.success('Data imported successfully!');
  }, [importJSON]);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header with school info */}
        <HeaderSection
          schoolName={data.schoolName}
          className={data.className}
          totalStrength={data.totalStrength}
          language={data.language}
          onUpdateSchoolInfo={updateSchoolInfo}
          onToggleLanguage={toggleLanguage}
        />

        {/* Subject selector with dynamic dropdowns */}
        <SubjectSelector
          selectedSubjects={data.selectedSubjects}
          onUpdateSubjects={updateSelectedSubjects}
        />

        {/* Action buttons */}
        <ActionButtons
          onAddStudent={addStudent}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onExportJSON={exportJSON}
          onImportJSON={handleImportJSON}
          onImportExcel={handleImportExcel}
          onReset={handleReset}
          onGenerateAllRemarks={handleGenerateAllRemarks}
          isGeneratingAll={isGeneratingAll}
          studentCount={data.students.filter(s => s.name.trim()).length}
        />

        {/* Assessment table */}
        <AssessmentTable
          students={data.students}
          selectedSubjects={data.selectedSubjects}
          onUpdateStudent={updateStudent}
          onUpdateSubjectRating={updateSubjectRating}
          onRemoveStudent={removeStudent}
          onGenerateRemark={handleGenerateRemark}
        />

        {/* Footer info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Data is automatically saved to your browser. Use "Backup JSON" to create a portable backup.</p>
          <p className="mt-1">Import students from Excel to auto-populate the table. Export to PDF for a formatted printable report.</p>
        </div>
      </div>

      {/* Reset confirmation dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all students, remarks, and settings. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Reset Everything
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
