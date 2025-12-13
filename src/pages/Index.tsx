import { useState, useCallback, useMemo } from 'react';
import { useAssessment } from '@/hooks/useAssessment';
import { HeaderSection } from '@/components/HeaderSection';
import { ActionButtons } from '@/components/ActionButtons';
import { AssessmentTable } from '@/components/AssessmentTable';
import { SubjectSelector } from '@/components/SubjectSelector';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { IndividualReports } from '@/components/IndividualReports';
import { DataSourceGate } from '@/components/DataSourceGate';
import { DataValidationWarnings } from '@/components/DataValidationWarnings';
import { ExcelPreview } from '@/components/ExcelPreview';
import { exportToExcel } from '@/utils/excelExport';
import { exportToPDF } from '@/utils/pdfExport';
import { importStudentsFromExcel, createStudentsFromImport, ExcelImportResult } from '@/utils/excelImport';
import { generateStrengthsWeaknessesNextSteps } from '@/utils/remarkGenerator';
import { generateHumanizedRemark } from '@/utils/humanizedRemarks';
import { calculateClassAnalytics, Term } from '@/types/assessment';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Users, BarChart3, UserCheck, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const {
    data,
    updateSchoolInfo,
    changeLanguage,
    updateSelectedSubjects,
    updateSubjectMarksDetail,
    switchTerm,
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
  const [excelPreview, setExcelPreview] = useState<ExcelImportResult | null>(null);
  const [dataSourceConnected, setDataSourceConnected] = useState(false);

  // Check if data source is connected (has students with names)
  const hasValidData = useMemo(() => {
    return data.students.some(s => s.name && s.name.trim() !== '');
  }, [data.students]);

  const handleGenerateRemark = useCallback(async (studentId: string) => {
    const student = data.students.find(s => s.id === studentId);
    if (!student || !student.name) {
      toast.error('Please enter student name first');
      return;
    }

    updateStudentRemark(studentId, '', true);

    try {
      // Use humanized remarks for better natural-sounding comments
      const humanizedRemark = generateHumanizedRemark(student, data.language);
      
      // Also generate detailed analysis
      const analysis = generateStrengthsWeaknessesNextSteps(student, data.language, data.selectedSubjects);
      updateStudentAnalysis(studentId, analysis.strengths, analysis.improvements, analysis.nextSteps);
      
      // Set the humanized remark
      updateStudentRemark(studentId, humanizedRemark, false);
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
        // Use humanized remarks
        const humanizedRemark = generateHumanizedRemark(student, data.language);
        
        const analysis = generateStrengthsWeaknessesNextSteps(student, data.language, data.selectedSubjects);
        updateStudentAnalysis(student.id, analysis.strengths, analysis.improvements, analysis.nextSteps);
        updateStudentRemark(student.id, humanizedRemark, false);
      } catch {
        updateStudentRemark(student.id, '', false);
      }
      await new Promise(resolve => setTimeout(resolve, 50));
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
      // Show preview instead of immediate import
      setExcelPreview(result);
      
      // Show warnings if any
      if (result.warnings.length > 0) {
        result.warnings.forEach(warning => {
          if (warning.includes('⚠️')) {
            toast.warning(warning.replace('⚠️ ', ''));
          }
        });
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import');
    }
  }, []);

  const confirmExcelImport = useCallback(() => {
    if (!excelPreview) return;
    
    // If subjects were detected from Excel, use them
    const subjectsToUse = excelPreview.detectedSubjects.length > 0 
      ? excelPreview.detectedSubjects 
      : data.selectedSubjects;
    
    // Update selected subjects if new ones were detected
    if (excelPreview.detectedSubjects.length > 0) {
      updateSelectedSubjects(excelPreview.detectedSubjects);
    }
    
    const students = createStudentsFromImport(excelPreview.students, subjectsToUse);
    const firstClassName = excelPreview.students.find(s => s.className)?.className;
    if (firstClassName) updateSchoolInfo('className', firstClassName);
    
    // Get first section if available
    const firstSection = excelPreview.students.find(s => s.section)?.section;
    if (firstSection) updateSchoolInfo('section', firstSection);
    
    importStudents(students);
    setDataSourceConnected(true);
    toast.success(`Imported ${students.length} students with ${subjectsToUse.length} subjects!`);
    setExcelPreview(null);
  }, [excelPreview, data.selectedSubjects, importStudents, updateSchoolInfo, updateSelectedSubjects]);

  const handleGoogleSheetsLink = useCallback((link: string) => {
    toast.info('Google Sheets integration coming soon. Please use Excel export from Google Sheets for now.');
  }, []);

  const handleDisconnectDataSource = useCallback(() => {
    setShowResetDialog(true);
  }, []);

  const confirmReset = useCallback(() => {
    resetAll();
    setDataSourceConnected(false);
    setShowResetDialog(false);
    toast.success('All data reset');
  }, [resetAll]);

  const handleTermChange = useCallback((term: Term) => {
    switchTerm(term);
    toast.info(`Switched to ${term}`);
  }, [switchTerm]);

  const analytics = calculateClassAnalytics(data.students, data.selectedSubjects);

  // Show data source gate if no data is connected
  if (!dataSourceConnected && !hasValidData) {
    return (
      <>
        <DataSourceGate 
          onFileSelect={handleImportExcel}
          onGoogleSheetsLink={handleGoogleSheetsLink}
        />
        
        {/* Excel Preview Dialog */}
        {excelPreview && (
          <ExcelPreview
            result={excelPreview}
            onConfirm={confirmExcelImport}
            onCancel={() => setExcelPreview(null)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-background py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-[1900px] mx-auto">
        <div className="flex items-center justify-between mb-4">
          <HeaderSection
            schoolName={data.schoolName}
            examName={data.examName}
            className={data.className}
            section={data.section}
            academicYear={data.academicYear}
            term={data.term}
            totalStrength={data.totalStrength}
            language={data.language}
            onUpdateSchoolInfo={updateSchoolInfo}
            onChangeLanguage={changeLanguage}
            onChangeTerm={handleTermChange}
          />
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnectDataSource}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <XCircle className="h-4 w-4 mr-2" />
            Reset Data
          </Button>
        </div>

        {/* Data Validation Warnings */}
        <DataValidationWarnings 
          students={data.students} 
          className="mb-4"
        />

        <Tabs defaultValue="students" className="space-y-6">
          <TabsList className="bg-muted">
            <TabsTrigger value="students" className="gap-2">
              <Users className="h-4 w-4" /> Students ({data.students.filter(s => s.name.trim()).length})
            </TabsTrigger>
            <TabsTrigger value="individual" className="gap-2">
              <UserCheck className="h-4 w-4" /> Individual Reports
            </TabsTrigger>
            <TabsTrigger value="analytics" className="gap-2">
              <BarChart3 className="h-4 w-4" /> Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="students" className="space-y-6">
            {/* Excel Preview Dialog */}
            {excelPreview && (
              <ExcelPreview
                result={excelPreview}
                onConfirm={confirmExcelImport}
                onCancel={() => setExcelPreview(null)}
              />
            )}

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
              onUpdateSubjectMarksDetail={updateSubjectMarksDetail}
              onRemoveStudent={removeStudent}
              onGenerateRemark={handleGenerateRemark}
              schoolName={data.schoolName}
              className={data.className}
              section={data.section}
              term={data.term}
            />
          </TabsContent>

          <TabsContent value="individual">
            <IndividualReports
              students={data.students}
              selectedSubjects={data.selectedSubjects}
              schoolName={data.schoolName}
              className={data.className}
              section={data.section}
              term={data.term}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsDashboard analytics={analytics} selectedSubjects={data.selectedSubjects} />
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>Data auto-saves to browser. Use "Reset Data" to clear and upload a new file.</p>
        </div>
      </div>

      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent className="bg-card">
          <AlertDialogHeader>
            <AlertDialogTitle>Reset All Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all students, remarks, and settings permanently. You will need to upload a new Excel file to continue.
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
