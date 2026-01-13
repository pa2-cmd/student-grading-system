import { Button } from '@/components/ui/button';
import { 
  Plus, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  RotateCcw, 
  Sparkles,
  Loader2 
} from 'lucide-react';
import { useRef } from 'react';

interface ActionButtonsProps {
  onAddStudent: () => void;
  onExportExcel: () => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onReset: () => void;
  onGenerateAllRemarks: () => void;
  isGeneratingAll: boolean;
  studentCount: number;
}

export function ActionButtons({
  onAddStudent,
  onExportExcel,
  onExportJSON,
  onImportJSON,
  onReset,
  onGenerateAllRemarks,
  isGeneratingAll,
  studentCount,
}: ActionButtonsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      <Button onClick={onAddStudent} className="btn-primary gap-2">
        <Plus className="h-4 w-4" />
        Add Student
      </Button>

      <Button 
        onClick={onGenerateAllRemarks} 
        disabled={isGeneratingAll || studentCount === 0}
        className="btn-success gap-2"
      >
        {isGeneratingAll ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        Generate All Remarks
      </Button>

      <Button 
        onClick={onExportExcel} 
        variant="outline" 
        className="gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
      >
        <FileSpreadsheet className="h-4 w-4" />
        Export Excel
      </Button>

      <Button onClick={onExportJSON} variant="outline" className="gap-2">
        <Download className="h-4 w-4" />
        Backup JSON
      </Button>

      <Button onClick={handleImportClick} variant="outline" className="gap-2">
        <Upload className="h-4 w-4" />
        Import JSON
      </Button>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />

      <Button 
        onClick={onReset} 
        variant="outline" 
        className="gap-2 text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
      >
        <RotateCcw className="h-4 w-4" />
        Reset All
      </Button>
    </div>
  );
}
