import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BookOpen, Calculator, FlaskConical, Globe } from 'lucide-react';
import { SubjectType, SUBJECTS } from '@/types/assessment';

interface SubjectSelectorProps {
  initialSchoolName?: string;
  initialClassName?: string;
  initialStrength?: number;
  onSelect: (subject: SubjectType, schoolName: string, className: string, strength: number) => void;
}

const SUBJECT_ICONS: Record<SubjectType, typeof BookOpen> = {
  'English': BookOpen,
  'Maths': Calculator,
  'Science': FlaskConical,
  'Social Science': Globe,
};

const SUBJECT_COLORS: Record<SubjectType, string> = {
  'English': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Maths': 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  'Science': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Social Science': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
};

export function SubjectSelector({ 
  initialSchoolName = '', 
  initialClassName = '',
  initialStrength = 0,
  onSelect 
}: SubjectSelectorProps) {
  const [schoolName, setSchoolName] = useState(initialSchoolName);
  const [className, setClassName] = useState(initialClassName);
  const [strength, setStrength] = useState(initialStrength);
  const [selectedSubject, setSelectedSubject] = useState<SubjectType | ''>('');

  const handleStart = () => {
    if (!selectedSubject) return;
    onSelect(selectedSubject, schoolName, className, strength);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <div className="card-elevated p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-foreground mb-2">
              Student Assessment Tool
            </h1>
            <p className="text-muted-foreground">
              Select a subject and enter class details to begin assessment
            </p>
          </div>

          <div className="space-y-6">
            {/* School Name */}
            <div className="space-y-2">
              <Label htmlFor="schoolName" className="text-sm font-medium">School Name</Label>
              <Input
                id="schoolName"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="Enter school name"
                className="input-field"
              />
            </div>

            {/* Class */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="className" className="text-sm font-medium">Class</Label>
                <Input
                  id="className"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Grade 5"
                  className="input-field"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="strength" className="text-sm font-medium">Total Strength</Label>
                <Input
                  id="strength"
                  type="number"
                  value={strength || ''}
                  onChange={(e) => setStrength(parseInt(e.target.value) || 0)}
                  placeholder="No. of students"
                  className="input-field"
                  min={0}
                />
              </div>
            </div>

            {/* Subject Selection */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Select Subject</Label>
              <div className="grid grid-cols-2 gap-3">
                {SUBJECTS.map((subject) => {
                  const Icon = SUBJECT_ICONS[subject];
                  const isSelected = selectedSubject === subject;
                  return (
                    <button
                      key={subject}
                      onClick={() => setSelectedSubject(subject)}
                      className={`p-4 rounded-xl border-2 transition-all flex items-center gap-3
                        ${isSelected 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : `border-border hover:border-primary/50 ${SUBJECT_COLORS[subject]}`
                        }`}
                    >
                      <div className={`p-2 rounded-lg ${SUBJECT_COLORS[subject]}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {subject}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={!selectedSubject}
              className="w-full btn-primary h-12 text-lg mt-4"
            >
              Start {selectedSubject || 'Assessment'}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Good = 2 • Average = 1 • Needs Improvement = 0
          </p>
        </div>
      </div>
    </div>
  );
}
