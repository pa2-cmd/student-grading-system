import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2, Copy, Check, Pencil } from 'lucide-react';
import { Student, CommentTone, COMMENT_TONES, Language } from '@/types/assessment';
import { toast } from 'sonner';

interface CommentGeneratorProps {
  student: Student;
  language: Language;
  selectedSubjects: string[];
  onUpdateRemark: (remark: string) => void;
  onGenerate: (tone: CommentTone) => Promise<void>;
  isGenerating: boolean;
}

export function CommentGenerator({
  student,
  language,
  selectedSubjects,
  onUpdateRemark,
  onGenerate,
  isGenerating,
}: CommentGeneratorProps) {
  const [tone, setTone] = useState<CommentTone>('encouraging');
  const [isEditing, setIsEditing] = useState(false);
  const [editedRemark, setEditedRemark] = useState(student.remark);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!student.name) {
      toast.error('Please enter student name first');
      return;
    }
    await onGenerate(tone);
    setEditedRemark(student.remark);
  };

  const handleCopy = () => {
    if (student.remark) {
      navigator.clipboard.writeText(student.remark);
      setCopied(true);
      toast.success('Comment copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSave = () => {
    onUpdateRemark(editedRemark);
    setIsEditing(false);
    toast.success('Comment saved!');
  };

  const handleCancel = () => {
    setEditedRemark(student.remark);
    setIsEditing(false);
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          Comment Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tone Selector */}
        <div className="space-y-2">
          <Label className="text-sm">Comment Tone</Label>
          <Select value={tone} onValueChange={(v) => setTone(v as CommentTone)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border z-50">
              {COMMENT_TONES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  <div className="flex flex-col">
                    <span>{t.label}</span>
                    <span className="text-xs text-muted-foreground">{t.description}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || !student.name}
          className="w-full gap-2"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Generate Comment
            </>
          )}
        </Button>

        {/* Comment Display/Edit */}
        {student.remark && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Generated Comment</Label>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleCopy}
                  className="h-7 px-2 gap-1"
                >
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => { setEditedRemark(student.remark); setIsEditing(true); }}
                  className="h-7 px-2 gap-1"
                >
                  <Pencil className="h-3 w-3" />
                  Edit
                </Button>
              </div>
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editedRemark}
                  onChange={(e) => setEditedRemark(e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Edit the generated comment..."
                />
                <div className="flex gap-2 justify-end">
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleSave}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm leading-relaxed">{student.remark}</p>
              </div>
            )}
          </div>
        )}

        {/* Student Summary */}
        {student.name && (
          <div className="bg-muted/30 rounded-lg p-3 text-xs space-y-1">
            <p><strong>Student:</strong> {student.name}</p>
            <p><strong>Enrollment:</strong> {student.enrollmentNumber}</p>
            <p><strong>Overall:</strong> {student.percentage}%</p>
            {student.strengths?.length > 0 && (
              <p><strong>Strengths:</strong> {student.strengths.slice(0, 2).join(', ')}</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
