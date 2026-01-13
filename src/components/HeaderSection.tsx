import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { GraduationCap, Languages } from 'lucide-react';

interface HeaderSectionProps {
  schoolName: string;
  className: string;
  totalStrength: number;
  language: 'english' | 'hindi';
  onUpdateSchoolInfo: (field: 'schoolName' | 'className' | 'totalStrength', value: string | number) => void;
  onToggleLanguage: () => void;
}

export function HeaderSection({
  schoolName,
  className,
  totalStrength,
  language,
  onUpdateSchoolInfo,
  onToggleLanguage,
}: HeaderSectionProps) {
  return (
    <div className="card-elevated mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Student Assessment Tool</h1>
          <p className="text-muted-foreground">Generate AI-powered remarks for student evaluations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => onUpdateSchoolInfo('schoolName', e.target.value)}
            className="input-field"
            placeholder="Enter school name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="className" className="text-sm font-medium">Class</Label>
          <Input
            id="className"
            value={className}
            onChange={(e) => onUpdateSchoolInfo('className', e.target.value)}
            className="input-field"
            placeholder="e.g., Grade 5-A"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalStrength" className="text-sm font-medium">Total Strength</Label>
          <Input
            id="totalStrength"
            type="number"
            value={totalStrength || ''}
            onChange={(e) => onUpdateSchoolInfo('totalStrength', parseInt(e.target.value) || 0)}
            className="input-field"
            placeholder="Number of students"
            min={0}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Remark Language</Label>
          <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
            <Languages className="h-5 w-5 text-muted-foreground" />
            <span className={`text-sm ${language === 'english' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              English
            </span>
            <Switch
              checked={language === 'hindi'}
              onCheckedChange={onToggleLanguage}
            />
            <span className={`text-sm ${language === 'hindi' ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
              हिंदी
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
