import { useState } from 'react';
import { FileSpreadsheet, Upload, X, Link2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DataSourceGateProps {
  onFileSelect: (file: File) => void;
  onGoogleSheetsLink?: (link: string) => void;
}

export function DataSourceGate({ onFileSelect, onGoogleSheetsLink }: DataSourceGateProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [sheetsLink, setSheetsLink] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  const isValidExcelFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ];
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    return validTypes.includes(file.type) || hasValidExtension;
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragError(null);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setDragError('No file detected');
      return;
    }

    const file = files[0];
    if (!isValidExcelFile(file)) {
      setDragError('Please drop an Excel file (.xlsx or .xls)');
      return;
    }

    setDragError(null);
    onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidExcelFile(file)) {
      onFileSelect(file);
    } else if (file) {
      setDragError('Please select an Excel file (.xlsx or .xls)');
    }
    e.target.value = '';
  };

  const handleGoogleSheetsSubmit = () => {
    if (!sheetsLink.trim()) {
      setLinkError('Please enter a Google Sheets link');
      return;
    }
    
    if (!sheetsLink.includes('docs.google.com/spreadsheets') && 
        !sheetsLink.includes('sheets.google.com')) {
      setLinkError('Please enter a valid Google Sheets link');
      return;
    }

    setLinkError(null);
    onGoogleSheetsLink?.(sheetsLink);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 mb-4">
            <FileSpreadsheet className="h-10 w-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Cambridge Court Marksheet System
          </h1>
          <p className="text-muted-foreground text-lg max-w-md mx-auto">
            Please upload the official marksheet Excel file or paste a Google Sheets link to continue.
          </p>
        </div>

        {/* Main Upload Card */}
        <Card className="border-2 shadow-lg">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl">Import Student Data</CardTitle>
            <CardDescription>
              Supports Excel (.xlsx, .xls) files with student marks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={cn(
                'relative rounded-xl border-2 border-dashed p-12 transition-all duration-200 cursor-pointer',
                'flex flex-col items-center justify-center gap-4 text-center',
                isDragging
                  ? 'border-primary bg-primary/5 scale-[1.02]'
                  : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
                dragError && 'border-destructive bg-destructive/5'
              )}
            >
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                aria-label="Upload Excel file"
              />

              <div className={cn(
                'p-5 rounded-full transition-colors',
                isDragging ? 'bg-primary/10' : 'bg-muted'
              )}>
                {isDragging ? (
                  <Upload className="h-10 w-10 text-primary animate-bounce" />
                ) : (
                  <FileSpreadsheet className="h-10 w-10 text-muted-foreground" />
                )}
              </div>

              <div className="space-y-2">
                <p className={cn(
                  'text-lg font-medium',
                  isDragging ? 'text-primary' : 'text-foreground'
                )}>
                  {isDragging ? 'Drop your Excel file here' : 'Drag & drop Excel file here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to browse • Supports .xlsx and .xls
                </p>
              </div>

              {dragError && (
                <div className="flex items-center gap-2 text-sm text-destructive mt-2">
                  <X className="h-4 w-4" />
                  {dragError}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-muted-foreground/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-3 text-muted-foreground">or</span>
              </div>
            </div>

            {/* Google Sheets Link Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Link2 className="h-4 w-4" />
                Import from Google Sheets
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste Google Sheets link here..."
                  value={sheetsLink}
                  onChange={(e) => {
                    setSheetsLink(e.target.value);
                    setLinkError(null);
                  }}
                  className={cn(linkError && 'border-destructive')}
                />
                <Button 
                  onClick={handleGoogleSheetsSubmit}
                  disabled={!sheetsLink.trim()}
                >
                  Import
                </Button>
              </div>
              {linkError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <X className="h-3 w-3" />
                  {linkError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Note: The sheet must be shared publicly or you must have access.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
          <CardContent className="flex items-start gap-3 pt-6">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-amber-800 dark:text-amber-200">
                Expected File Format
              </p>
              <ul className="text-amber-700 dark:text-amber-300 space-y-1 list-disc list-inside">
                <li>Student Name column (required)</li>
                <li>Enrollment Number column (required)</li>
                <li>Roll Number column (separate from enrollment)</li>
                <li>Subject columns with marks (e.g., English, Maths, Science)</li>
                <li>Attendance columns (optional)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
