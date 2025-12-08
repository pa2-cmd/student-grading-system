import { useState, useCallback } from 'react';
import { Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { downloadStudentTemplate } from '@/utils/excelTemplate';
import { strictImportStudents, StrictExcelImportResult, StrictImportedStudent } from '@/utils/strictExcelImport';
import { toast } from 'sonner';

interface StudentImportProps {
  onImportComplete: (students: StrictImportedStudent[]) => void;
  className?: string;
}

export function StudentImport({ onImportComplete, className }: StudentImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [importResult, setImportResult] = useState<StrictExcelImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDownloadTemplate = () => {
    downloadStudentTemplate();
    toast.success('Template downloaded! Fill in your student data and upload.');
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setImportError(null);
    setImportResult(null);

    try {
      const result = await strictImportStudents(file);
      setImportResult(result);
      
      if (result.warnings.length > 0) {
        toast.warning(`${result.skippedRows} rows were skipped due to missing data.`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to import file';
      setImportError(message);
      toast.error('Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const isValidExcelFile = (file: File): boolean => {
    const validExtensions = ['.xlsx', '.xls'];
    return validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) return;

    const file = files[0];
    if (!isValidExcelFile(file)) {
      setImportError('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    processFile(file);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!isValidExcelFile(file)) {
        setImportError('Please upload an Excel file (.xlsx or .xls)');
        return;
      }
      processFile(file);
    }
    e.target.value = '';
  }, []);

  const handleConfirmImport = () => {
    if (importResult) {
      onImportComplete(importResult.students);
      toast.success(`Imported ${importResult.students.length} students!`);
      setImportResult(null);
    }
  };

  const handleCancelImport = () => {
    setImportResult(null);
    setImportError(null);
  };

  return (
    <Card className={cn('border-border', className)}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Import Students
        </CardTitle>
        <CardDescription>
          Download the template, fill in student data, then upload
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Step 1: Download Template */}
        <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border border-border">
          <div className="flex-1">
            <p className="font-medium text-sm">Step 1: Download Template</p>
            <p className="text-xs text-muted-foreground mt-1">
              Get the official template with correct column headers
            </p>
          </div>
          <Button onClick={handleDownloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>

        {/* Step 2: Upload File */}
        <div className="space-y-2">
          <p className="font-medium text-sm">Step 2: Upload Filled Template</p>
          
          {/* Error Display */}
          {importError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Import Error</AlertTitle>
              <AlertDescription className="whitespace-pre-line">
                {importError}
              </AlertDescription>
            </Alert>
          )}

          {/* Preview Mode */}
          {importResult ? (
            <div className="space-y-4">
              <Alert className="bg-primary/5 border-primary/20">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <AlertTitle className="text-primary">Preview Ready</AlertTitle>
                <AlertDescription>
                  {importResult.validRows} students ready to import
                  {importResult.skippedRows > 0 && (
                    <span className="text-muted-foreground">
                      {' '}({importResult.skippedRows} rows skipped)
                    </span>
                  )}
                </AlertDescription>
              </Alert>

              {/* Warnings */}
              {importResult.warnings.length > 0 && (
                <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg max-h-24 overflow-y-auto">
                  {importResult.warnings.slice(0, 5).map((w, i) => (
                    <p key={i}>⚠️ {w}</p>
                  ))}
                  {importResult.warnings.length > 5 && (
                    <p className="mt-1">...and {importResult.warnings.length - 5} more</p>
                  )}
                </div>
              )}

              {/* Preview Table */}
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">S.No</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Enrollment No</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importResult.students.slice(0, 10).map((student, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {student.serialNo}
                        </TableCell>
                        <TableCell>{student.studentName}</TableCell>
                        <TableCell className="font-mono text-sm">
                          {student.enrollmentNo}
                        </TableCell>
                      </TableRow>
                    ))}
                    {importResult.students.length > 10 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-muted-foreground text-sm">
                          ...and {importResult.students.length - 10} more students
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={handleCancelImport}>
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button onClick={handleConfirmImport}>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Confirm Import ({importResult.students.length})
                </Button>
              </div>
            </div>
          ) : (
            /* Drop Zone */
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-lg border-2 border-dashed p-6 transition-all duration-200 cursor-pointer',
                'flex flex-col items-center justify-center gap-2 text-center',
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                isProcessing && 'opacity-50 pointer-events-none'
              )}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={isProcessing}
                aria-label="Upload Excel file"
              />

              <div className={cn(
                'p-3 rounded-full transition-colors',
                isDragging ? 'bg-primary/10' : 'bg-muted'
              )}>
                {isProcessing ? (
                  <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className={cn(
                    'h-6 w-6',
                    isDragging ? 'text-primary' : 'text-muted-foreground'
                  )} />
                )}
              </div>

              <div>
                <p className="text-sm font-medium">
                  {isProcessing ? 'Processing...' : isDragging ? 'Drop file here' : 'Drag & drop or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Supports .xlsx and .xls files
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Template Info */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p className="font-medium mb-1">Template Requirements:</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Column headers must be exactly: <Badge variant="outline" className="text-[10px] px-1 py-0">S.No</Badge> <Badge variant="outline" className="text-[10px] px-1 py-0">Student Name</Badge> <Badge variant="outline" className="text-[10px] px-1 py-0">Enrollment No</Badge></li>
            <li>Student Name and Enrollment No are required for each row</li>
            <li>S.No will auto-generate if empty</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
