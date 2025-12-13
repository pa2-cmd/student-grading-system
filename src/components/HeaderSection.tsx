import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap } from 'lucide-react';
import { Language, LANGUAGES, Term, CLASS_OPTIONS, SECTION_OPTIONS } from '@/types/assessment';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface HeaderSectionProps {
  schoolName: string;
  examName?: string;
  className: string;
  section: string;
  academicYear: string;
  term: Term;
  totalStrength: number;
  language: Language;
  onUpdateSchoolInfo: (field: string, value: string | number) => void;
  onChangeLanguage: (lang: Language) => void;
  onChangeTerm?: (term: Term) => void;
}

export function HeaderSection({
  schoolName,
  examName,
  className,
  section,
  academicYear,
  term,
  totalStrength,
  language,
  onUpdateSchoolInfo,
  onChangeLanguage,
  onChangeTerm,
}: HeaderSectionProps) {
  return (
    <div className="card-elevated mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 rounded-xl bg-primary/10">
          <GraduationCap className="h-8 w-8 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-heading font-bold text-foreground">Cambridge Court Marksheet</h1>
          <p className="text-muted-foreground">Consolidated Student Assessment System</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-4">
        {/* School Name */}
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => onUpdateSchoolInfo('schoolName', e.target.value)}
            className="input-field"
            placeholder="Cambridge Court High School"
          />
        </div>

        {/* Exam Name */}
        <div className="space-y-2 lg:col-span-2">
          <Label htmlFor="examName" className="text-sm font-medium">Exam Name</Label>
          <Input
            id="examName"
            value={examName || ''}
            onChange={(e) => onUpdateSchoolInfo('examName', e.target.value)}
            className="input-field"
            placeholder="Half Yearly Examination"
          />
        </div>

        {/* Class Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="className" className="text-sm font-medium">Class</Label>
          <Select 
            value={className} 
            onValueChange={(v) => onUpdateSchoolInfo('className', v)}
          >
            <SelectTrigger className="input-field">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {CLASS_OPTIONS.map(cls => (
                <SelectItem key={cls} value={cls}>{cls}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Section Dropdown */}
        <div className="space-y-2">
          <Label htmlFor="section" className="text-sm font-medium">Section</Label>
          <Select 
            value={section} 
            onValueChange={(v) => onUpdateSchoolInfo('section', v)}
          >
            <SelectTrigger className="input-field">
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {SECTION_OPTIONS.map(sec => (
                <SelectItem key={sec} value={sec}>{sec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Term Selection */}
        <div className="space-y-2">
          <Label htmlFor="term" className="text-sm font-medium">Term</Label>
          <Select 
            value={term} 
            onValueChange={(v) => {
              onUpdateSchoolInfo('term', v);
              onChangeTerm?.(v as Term);
            }}
          >
            <SelectTrigger className="input-field">
              <SelectValue placeholder="Select term" />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              <SelectItem value="Term 1">Term 1</SelectItem>
              <SelectItem value="Term 2">Term 2</SelectItem>
              <SelectItem value="Annual">Annual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Language</Label>
          <Select value={language} onValueChange={(v) => onChangeLanguage(v as Language)}>
            <SelectTrigger className="input-field">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {LANGUAGES.map(lang => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.nativeLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
