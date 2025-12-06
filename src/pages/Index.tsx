import { useState, useCallback } from 'react';
import { useAssessment } from '@/hooks/useAssessment';
import { HeaderSection } from '@/components/HeaderSection';
import { ActionButtons } from '@/components/ActionButtons';
import { AssessmentTable } from '@/components/AssessmentTable';
import { exportToExcel } from '@/utils/excelExport';
import { generateRemark } from '@/utils/remarkGenerator';
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
    updateStudentRemark,
    resetAll,
    exportJSON,
    importJSON,
  } = useAssessment();

  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

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

  const handleGenerateAllRemarks = useCallback(async () => {
    const studentsWithNames = data.students.filter(s => s.name.trim());
    if (studentsWithNames.length === 0) {
      toast.error('Please add student names first');
      return;
    }

    setIsGeneratingAll(true);
    toast.info(`Generating remarks for ${studentsWithNames.length} students...`);

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
      // Small delay to prevent overwhelming
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsGeneratingAll(false);
    toast.success('All remarks generated successfully!');
  }, [data.students, data.language, updateStudentRemark]);

  const handleExportExcel = useCallback(() => {
    if (data.students.length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToExcel(data);
    toast.success('Excel file exported successfully!');
  }, [data]);

  const handleReset = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetAll();
    setShowResetDialog(false);
    toast.success('All data has been reset');
  }, [resetAll]);

  const handleImportJSON = useCallback((file: File) => {
    importJSON(file);
    toast.success('Data imported successfully!');
  }, [importJSON]);

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1600px] mx-auto">
        <HeaderSection
          schoolName={data.schoolName}
          className={data.className}
          totalStrength={data.totalStrength}
          language={data.language}
          onUpdateSchoolInfo={updateSchoolInfo}
          onToggleLanguage={toggleLanguage}
        />

        <ActionButtons
          onAddStudent={addStudent}
          onExportExcel={handleExportExcel}
          onExportJSON={exportJSON}
          onImportJSON={handleImportJSON}
          onReset={handleReset}
          onGenerateAllRemarks={handleGenerateAllRemarks}
          isGeneratingAll={isGeneratingAll}
          studentCount={data.students.filter(s => s.name.trim()).length}
        />

        <AssessmentTable
          students={data.students}
          onUpdateStudent={updateStudent}
          onRemoveStudent={removeStudent}
          onGenerateRemark={handleGenerateRemark}
        />

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Data is automatically saved to your browser. Use "Backup JSON" to create a portable backup.</p>
          <p className="mt-1">Connect to Lovable Cloud for AI-powered remark generation.</p>
        </div>
      </div>

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
