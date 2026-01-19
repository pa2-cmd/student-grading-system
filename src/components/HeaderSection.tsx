import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { BookOpen, Languages, ArrowLeft } from 'lucide-react';
import { SubjectType, getSkillsForSubject, getSkillDisplayName } from '@/types/assessment';

interface HeaderSectionProps {
  schoolName: string;
  className: string;
  section: string;
  totalStrength: number;
  subject: SubjectType;
  language: 'english' | 'hindi';
  onUpdateSchoolInfo: (field: 'schoolName' | 'className' | 'section' | 'totalStrength', value: string | number) => void;
  onToggleLanguage: () => void;
  onChangeSubject: () => void;
}

export function HeaderSection({
  schoolName,
  className,
  section,
  totalStrength,
  subject,
  language,
  onUpdateSchoolInfo,
  onToggleLanguage,
  onChangeSubject,
}: HeaderSectionProps) {
  const skills = getSkillsForSubject(subject);
  
  return (
    <div className="card-elevated mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onChangeSubject} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Change Subject
          </Button>
          <div className="p-3 rounded-xl bg-primary/10">
            <BookOpen className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-heading font-bold text-foreground">{subject} Assessment Tool</h1>
            <p className="text-muted-foreground">Comprehensive {subject.toLowerCase()} skill assessment & reporting</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="space-y-2 lg:col-span-1">
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
            placeholder="e.g., Grade 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section" className="text-sm font-medium">Section (Optional)</Label>
          <Input
            id="section"
            value={section}
            onChange={(e) => onUpdateSchoolInfo('section', e.target.value)}
            className="input-field"
            placeholder="e.g., A, B, C"
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

      {/* Skills Info */}
      <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{subject} Skills:</span>{' '}
          {skills.map(s => getSkillDisplayName(s)).join(' • ')}
          <span className="ml-2 text-xs">(Good = 2, Average = 1, Needs Improvement = 0)</span>
        </p>
      </div>
    </div>
  );
}
