import { useState, useCallback } from 'react';
import { useAssessment } from '@/hooks/useAssessment';
import { HeaderSection } from '@/components/HeaderSection';
import { ActionButtons } from '@/components/ActionButtons';
import { AssessmentTable } from '@/components/AssessmentTable';
import { SubjectSelector } from '@/components/SubjectSelector';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { ExcelDropZone } from '@/components/ExcelDropZone';
import { exportToExcel } from '@/utils/excelExport';
import { exportToPDF } from '@/utils/pdfExport';
import { importStudentsFromExcel, createStudentsFromImport } from '@/utils/excelImport';
import { generateRemark, generateStrengthsWeaknessesNextSteps } from '@/utils/remarkGenerator';
import { calculateClassAnalytics } from '@/types/assessment';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, BarChart3 } from 'lucide-react';

const Index = () => {
  const {
    data,
    updateSchoolInfo,
    changeLanguage,
    updateSelectedSubjects,
    addStudent,
    removeStudent,
    updateStudent,
    updateSubjectMark,
    updateSubjectRating,
    updateStudentRemark,
    updateStudentAnalysis,
    importStudents,
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
        selectedSubjects: data.selectedSubjects,
      });
      
      const analysis = generateStrengthsWeaknessesNextSteps(student, data.language, data.selectedSubjects);
      updateStudentAnalysis(studentId, analysis.strengths, analysis.improvements, analysis.nextSteps);
      updateStudentRemark(studentId, remark, false);
      toast.success('Report generated!');
    } catch (error) {
      updateStudentRemark(studentId, '', false);
      toast.error('Failed to generate remark');
    }
  }, [data.students, data.language, data.selectedSubjects, updateStudentRemark, updateStudentAnalysis]);

  const handleGenerateAllRemarks = useCallback(async () => {
    const studentsWithNames = data.students.filter(s => s.name.trim());
    if (studentsWithNames.length === 0) {
      toast.error('Please add student names first');
      return;
    }

    setIsGeneratingAll(true);
    toast.info(`Generating reports for ${studentsWithNames.length} students...`);

    for (const student of studentsWithNames) {
      updateStudentRemark(student.id, '', true);
      try {
        const remark = await generateRemark({
          student,
          language: data.language,
          selectedSubjects: data.selectedSubjects,
        });
        const analysis = generateStrengthsWeaknessesNextSteps(student, data.language, data.selectedSubjects);
        updateStudentAnalysis(student.id, analysis.strengths, analysis.improvements, analysis.nextSteps);
        updateStudentRemark(student.id, remark, false);
      } catch {
        updateStudentRemark(student.id, '', false);
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setIsGeneratingAll(false);
    toast.success('All reports generated!');
  }, [data.students, data.language, data.selectedSubjects, updateStudentRemark, updateStudentAnalysis]);

  const handleExportExcel = useCallback(() => {
    if (data.students.filter(s => s.name).length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToExcel(data);
    toast.success('Excel exported!');
  }, [data]);

  const handleExportPDF = useCallback(() => {
    if (data.students.filter(s => s.name).length === 0) {
      toast.error('No students to export');
      return;
    }
    exportToPDF(data);
    toast.success('PDF exported!');
  }, [data]);

  const handleImportExcel = useCallback(async (file: File) => {
    try {
      toast.info('Reading Excel file...');
      const result = await importStudentsFromExcel(file);
      
      // Show warnings if any (auto-generated columns, filled blanks, etc.)
      if (result.warnings.length > 0) {
        // Show first 3 warnings as individual toasts, rest as summary
        const displayWarnings = result.warnings.slice(0, 3);
        displayWarnings.forEach(warning => toast.warning(warning, { duration: 5000 }));
        
        if (result.warnings.length > 3) {
          toast.info(`+ ${result.warnings.length - 3} more adjustments made`);
        }
      }
      
      const students = createStudentsFromImport(result.students, data.selectedSubjects);
      
      const firstClassName = result.students.find(s => s.className)?.className;
      if (firstClassName) updateSchoolInfo('className', firstClassName);
      
      importStudents(students);
      toast.success(`Imported ${students.length} students!`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import');
    }
  }, [data.selectedSubjects, importStudents, updateSchoolInfo]);

  const confirmReset = useCallback(() => {
    resetAll();
    setShowResetDialog(false);
    toast.success('All data reset');
  }, [resetAll]);

  const analytics = calculateClassAnalytics(data.students, data.selectedSubjects);

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1900px] mx-auto">
        <HeaderSection
          schoolName={data.schoolName}
          className={data.className}
          section={data.section}
          academicYear={data.academicYear}
          term={data.term}
          totalStrength={data.totalStrength}
          language={data.language}
          onUpdateSchoolInfo={updateSchoolInfo}
          onChangeLanguage={changeLanguage}
        />

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" /> Students
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            {/* Drag & Drop Excel Import Zone */}
            <ExcelDropZone 
              onFileSelect={handleImportExcel} 
              className="mb-4"
            />

            <SubjectSelector
              selectedSubjects={data.selectedSubjects}
              onUpdateSubjects={updateSelectedSubjects}
            />

            <ActionButtons
              onAddStudent={addStudent}
              onExportExcel={handleExportExcel}
              onExportPDF={handleExportPDF}
              onExportJSON={exportJSON}
              onImportJSON={(file) => { importJSON(file); toast.success('Imported!'); }}
              onImportExcel={handleImportExcel}
              onReset={() => setShowResetDialog(true)}
              onGenerateAllRemarks={handleGenerateAllRemarks}
              isGeneratingAll={isGeneratingAll}
              studentCount={data.students.filter(s => s.name.trim()).length}
            />

            <AssessmentTable
              students={data.students}
              selectedSubjects={data.selectedSubjects}
              onUpdateStudent={updateStudent}
              onUpdateSubjectMark={updateSubjectMark}
              onUpdateSubjectRating={updateSubjectRating}
              onRemoveStudent={removeStudent}
              onGenerateRemark={handleGenerateRemark}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard analytics={analytics} selectedSubjects={data.selectedSubjects} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Data auto-saves to browser. Import students from Excel to auto-populate.</p>
        </div>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all students, remarks, and settings permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmReset} className="bg-destructive text-destructive-foreground">
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Index;
