import { useState, useCallback } from 'react';
import { useAssessment } from '@/hooks/useAssessment';
import { HeaderSection } from '@/components/HeaderSection';
import { ActionButtons } from '@/components/ActionButtons';
import { AssessmentTable } from '@/components/AssessmentTable';
import { exportToExcel } from '@/utils/excelExport';
import { exportToPDF, exportStudentPDF, exportClassPerformancePDF } from '@/utils/pdfExport';
import { importStudentsFromExcel } from '@/utils/excelImport';
import { generateRemark } from '@/utils/remarkGenerator';
import { Student } from '@/types/assessment';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

const Index = () => {
  const {
    data,
    updateSchoolInfo,
    toggleLanguage,
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
      });
      updateStudentRemark(studentId, remark, false);
      toast.success('Remark generated successfully');
    } catch (error) {
      updateStudentRemark(studentId, '', false);
      toast.error('Failed to generate remark');
    }
  }, [data.students, data.language, updateStudentRemark]);

  // Generate remarks for all students
  const handleGenerateAllRemarks = useCallback(async () => {
    const studentsWithNames = data.students.filter(s => s.name.trim());
    if (studentsWithNames.length === 0) {
      toast.error('Please add student names first');
      return;
    }

    setIsGeneratingAll(true);
    toast.info(`Generating English reviews for ${studentsWithNames.length} students...`);

    for (const student of studentsWithNames) {
      updateStudentRemark(student.id, '', true);
      try {
        const remark = await generateRemark({
          student,
          language: data.language,
        });
        updateStudentRemark(student.id, remark, false);
      } catch (error) {
        updateStudentRemark(student.id, '', false);
      }
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    setIsGeneratingAll(false);
    toast.success('All English reviews generated successfully!');
  }, [data.students, data.language, updateStudentRemark]);

  // Export handlers
  const handleExportExcel = useCallback(() => {
    if (data.students.length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToExcel(data);
    toast.success('Excel file exported successfully!');
  }, [data]);

  const handleExportPDF = useCallback(() => {
    if (data.students.length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToPDF(data);
    toast.success('Class report PDF exported!');
  }, [data]);

  const handleExportClassPerformance = useCallback(() => {
    if (data.students.length === 0) {
      toast.error('No students to analyze');
      return;
    }
    exportClassPerformancePDF(data);
    toast.success('Class performance analysis PDF exported!');
  }, [data]);

  const handleExportStudentPDF = useCallback((student: Student) => {
    if (!student.name) {
      toast.error('Student name is required');
      return;
    }
    exportStudentPDF(student, data);
    toast.success(`${student.name}'s report exported!`);
  }, [data]);

  // Import handlers
  const handleImportExcel = useCallback(async (file: File) => {
    try {
      toast.info('Analyzing Excel structure...');
      
      const result = await importStudentsFromExcel(file);
      
      if (!result.success) {
        result.errors.forEach(error => toast.error(error));
        return;
      }
      
      result.warnings.forEach(warning => toast.warning(warning));
      
      // Apply extracted metadata
      if (result.metadata.schoolName) {
        updateSchoolInfo('schoolName', result.metadata.schoolName);
      }
      if (result.metadata.className) {
        updateSchoolInfo('className', result.metadata.className);
      }
      if (result.metadata.section) {
        updateSchoolInfo('section', result.metadata.section);
      }
      
      importStudents(result.students);
      updateSchoolInfo('totalStrength', result.students.length);
      
      toast.success(`Successfully imported ${result.students.length} students for English assessment!`);
    } catch (error) {
      console.error('Excel import error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to import Excel file');
    }
  }, [importStudents, updateSchoolInfo]);

  // Reset handlers
  const handleReset = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetAll();
    setShowResetDialog(false);
    toast.success('All data has been reset');
  }, [resetAll]);

  // JSON import
  const handleImportJSON = useCallback((file: File) => {
    importJSON(file);
    toast.success('Backup data imported successfully!');
  }, [importJSON]);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1800px] mx-auto">
        {/* Header with school info and section */}
        <HeaderSection
          schoolName={data.schoolName}
          className={data.className}
          section={data.section}
          totalStrength={data.totalStrength}
          language={data.language}
          onUpdateSchoolInfo={updateSchoolInfo}
          onToggleLanguage={toggleLanguage}
        />

        {/* Action buttons */}
        <ActionButtons
          onAddStudent={addStudent}
          onExportExcel={handleExportExcel}
          onExportPDF={handleExportPDF}
          onExportClassPerformance={handleExportClassPerformance}
          onExportJSON={exportJSON}
          onImportJSON={handleImportJSON}
          onImportExcel={handleImportExcel}
          onReset={handleReset}
          onGenerateAllRemarks={handleGenerateAllRemarks}
          isGeneratingAll={isGeneratingAll}
          studentCount={data.students.filter(s => s.name.trim()).length}
        />

        {/* Assessment table - English skills only */}
        <AssessmentTable
          students={data.students}
          onUpdateStudent={updateStudent}
          onUpdateSubjectRating={updateSubjectRating}
          onRemoveStudent={removeStudent}
          onGenerateRemark={handleGenerateRemark}
          onExportStudentPDF={handleExportStudentPDF}
        />

        {/* Footer info */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>English Assessment Tool - Data is automatically saved to your browser.</p>
          <p className="mt-1">
            Import students from Excel • Generate AI reviews • Export individual student PDFs • Analyze class performance
          </p>
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
