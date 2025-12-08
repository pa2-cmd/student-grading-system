import { useState, useCallback } from 'react';
import { FileSpreadsheet, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExcelDropZoneProps {
  onFileSelect: (file: File) => void;
  className?: string;
}

export function ExcelDropZone({ onFileSelect, className }: ExcelDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);

  // Validate file type
  const isValidExcelFile = (file: File): boolean => {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    const validExtensions = ['.xlsx', '.xls'];
    const hasValidExtension = validExtensions.some(ext => 
      file.name.toLowerCase().endsWith(ext)
    );
    return validTypes.includes(file.type) || hasValidExtension;
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragError(null);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set isDragging to false if we're leaving the drop zone entirely
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
  }, [onFileSelect]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && isValidExcelFile(file)) {
      onFileSelect(file);
    } else if (file) {
      setDragError('Please select an Excel file (.xlsx or .xls)');
    }
    e.target.value = '';
  }, [onFileSelect]);

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={cn(
        'relative rounded-xl border-2 border-dashed p-8 transition-all duration-200 cursor-pointer',
        'flex flex-col items-center justify-center gap-3 text-center',
        isDragging
          ? 'border-primary bg-primary/5 scale-[1.02]'
          : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50',
        dragError && 'border-destructive bg-destructive/5',
        className
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
        'p-4 rounded-full transition-colors',
        isDragging ? 'bg-primary/10' : 'bg-muted'
      )}>
        {isDragging ? (
          <Upload className="h-8 w-8 text-primary animate-bounce" />
        ) : (
          <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="space-y-1">
        <p className={cn(
          'text-sm font-medium',
          isDragging ? 'text-primary' : 'text-foreground'
        )}>
          {isDragging ? 'Drop your Excel file here' : 'Drag & drop Excel file here'}
        </p>
        <p className="text-xs text-muted-foreground">
          or click to browse • Supports .xlsx and .xls
        </p>
      </div>

      {dragError && (
        <div className="flex items-center gap-2 text-xs text-destructive mt-2">
          <X className="h-3 w-3" />
          {dragError}
        </div>
      )}
    </div>
  );
}
