import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { Language, LANGUAGES } from '@/types/assessment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeaderSectionProps {
  schoolName: string;
  className: string;
  section: string;
  academicYear: string;
  term: string;
  totalStrength: number;
  language: Language;
  onUpdateSchoolInfo: (field: string, value: string | number) => void;
  onChangeLanguage: (lang: Language) => void;
}

export function HeaderSection({
  schoolName,
  className,
  section,
  academicYear,
  term,
  totalStrength,
  language,
  onUpdateSchoolInfo,
  onChangeLanguage,
}: HeaderSectionProps) {
  return (
    <div className="card-elevated mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Student Grading Tool</h1>
          <p className="text-muted-foreground">Generate warm, personalized report cards with AI</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="space-y-2 lg:col-span-2">
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
            placeholder="e.g., 5"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="section" className="text-sm font-medium">Section</Label>
          <Input
            id="section"
            value={section}
            onChange={(e) => onUpdateSchoolInfo('section', e.target.value)}
            className="input-field"
            placeholder="e.g., A"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="term" className="text-sm font-medium">Term</Label>
          <Select value={term} onValueChange={(v) => onUpdateSchoolInfo('term', v)}>
            <SelectTrigger className="input-field">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="Term 1">Term 1</SelectItem>
              <SelectItem value="Term 2">Term 2</SelectItem>
              <SelectItem value="Mid-Term">Mid-Term</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-sm font-medium">Report Language</Label>
          <Select value={language} onValueChange={(v) => onChangeLanguage(v as Language)}>
            <SelectTrigger className="input-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.nativeLabel} ({lang.label})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
