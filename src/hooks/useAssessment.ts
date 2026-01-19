import { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';
import { toast } from 'sonner';
import { 
  AssessmentData, 
  Student, 
  SkillRating,
  SkillRatingOrUnselected,
  calculateTotal, 
  createEmptyStudent, 
  getDefaultAssessmentData,
  getSkillsForSubject,
  SubjectType,
  SKILL_VALUES,
  SUBJECTS
} from '@/types/assessment';

const STORAGE_KEY = 'assessment-data-v2';

// ============================================================
// ZOD SCHEMA VALIDATION FOR JSON IMPORT
// Prevents malformed/malicious JSON from corrupting state
// ============================================================

const SkillRatingSchema = z.enum(['Good', 'Average', 'Needs Improvement']).optional();

const StudentSchema = z.object({
  id: z.string().min(1).max(100),
  serialNo: z.number().int().min(0).max(100000),
  name: z.string().max(200).transform(s => s.trim()),
  rollNumber: z.string().max(50).transform(s => s.trim()),
  subjectRatings: z.record(z.string().max(100), SkillRatingSchema),
  total: z.number().int().min(0).max(1000),
  remark: z.string().max(5000).transform(s => s.trim()),
  isGeneratingRemark: z.boolean(),
}).required();

const AssessmentDataSchema = z.object({
  schoolName: z.string().max(300).transform(s => s.trim()),
  className: z.string().max(100).transform(s => s.trim()),
  section: z.string().max(50).transform(s => s.trim()),
  totalStrength: z.number().int().min(0).max(100000),
  subject: z.enum(['English', 'Maths', 'Science', 'Social Science'] as const),
  students: z.array(StudentSchema).max(10000),
  language: z.enum(['english', 'hindi']),
});

export function useAssessment() {
  const [data, setData] = useState<AssessmentData>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        
        // Ensure section exists for backward compatibility
        if (!parsed.section) {
          parsed.section = '';
        }
        
        // Ensure subject exists
        if (!parsed.subject) {
          parsed.subject = 'English';
        }
        
        // Migrate old student format if needed
        if (parsed.students && parsed.students.length > 0) {
          const skills = getSkillsForSubject(parsed.subject);
          parsed.students = parsed.students.map((student: any, index: number) => {
            // If student already has subjectRatings, keep it (preserve undefined values)
            if (student.subjectRatings) {
              // Filter to keep only relevant skills for current subject
              const filteredRatings: Record<string, SkillRatingOrUnselected> = {};
              skills.forEach(skill => {
                filteredRatings[skill] = student.subjectRatings[skill];
              });
              
              return {
                ...student,
                rollNumber: student.rollNumber || '',
                subjectRatings: filteredRatings,
                total: calculateTotal(filteredRatings),
              };
            }
            
            // Create default ratings
            const subjectRatings: Record<string, SkillRatingOrUnselected> = {};
            skills.forEach(skill => {
              subjectRatings[skill] = 'Good';
            });
            
            return {
              id: student.id || crypto.randomUUID(),
              serialNo: student.serialNo || index + 1,
              name: student.name || '',
              rollNumber: student.rollNumber || '',
              subjectRatings,
              total: calculateTotal(subjectRatings),
              remark: student.remark || '',
              isGeneratingRemark: false,
            };
          });
        }
        
        return parsed;
      } catch {
        return getDefaultAssessmentData();
      }
    }
    return getDefaultAssessmentData();
  });

  // Auto-save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const updateSchoolInfo = useCallback((field: 'schoolName' | 'className' | 'section' | 'totalStrength', value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const setSubject = useCallback((subject: SubjectType) => {
    setData(prev => {
      // Reset students when changing subjects
      return {
        ...prev,
        subject,
        students: [],
      };
    });
  }, []);

  const toggleLanguage = useCallback(() => {
    setData(prev => ({
      ...prev,
      language: prev.language === 'english' ? 'hindi' : 'english',
    }));
  }, []);

  const addStudent = useCallback(() => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, createEmptyStudent(prev.students.length + 1, prev.subject)],
    }));
  }, []);

  const removeStudent = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      students: prev.students
        .filter(s => s.id !== id)
        .map((s, index) => ({ ...s, serialNo: index + 1 })),
    }));
  }, []);

  const updateStudent = useCallback((id: string, field: keyof Student, value: any) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== id) return student;
        
        const updated = { ...student, [field]: value };
        
        // Recalculate total if subject ratings changed
        if (field === 'subjectRatings') {
          updated.total = calculateTotal(updated.subjectRatings);
        }
        
        return updated;
      }),
    }));
  }, []);

  const updateSubjectRating = useCallback((studentId: string, subject: string, rating: SkillRating) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== studentId) return student;
        
        const newRatings = { ...student.subjectRatings, [subject]: rating };
        return {
          ...student,
          subjectRatings: newRatings,
          total: calculateTotal(newRatings),
        };
      }),
    }));
  }, []);

  const updateStudentRemark = useCallback((id: string, remark: string, isGenerating: boolean = false) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => 
        student.id === id 
          ? { ...student, remark, isGeneratingRemark: isGenerating }
          : student
      ),
    }));
  }, []);

  const importStudents = useCallback((students: Student[]) => {
    setData(prev => ({
      ...prev,
      students: students,
    }));
  }, []);

  const resetAll = useCallback(() => {
    setData(getDefaultAssessmentData());
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const exportJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${data.subject.toLowerCase()}-assessment-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importJSON = useCallback((file: File) => {
    // Validate file size (max 10MB to prevent DoS)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File too large. Maximum size is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const rawContent = e.target?.result as string;
        
        // Parse JSON safely
        let parsed: unknown;
        try {
          parsed = JSON.parse(rawContent);
        } catch {
          toast.error('Invalid JSON file format.');
          return;
        }

        // Apply defaults for missing optional fields before validation
        if (typeof parsed === 'object' && parsed !== null) {
          const obj = parsed as Record<string, unknown>;
          if (!obj.section) obj.section = '';
          if (!obj.subject) obj.subject = 'English';
          if (!obj.language) obj.language = 'english';
          if (typeof obj.totalStrength !== 'number') obj.totalStrength = 0;
        }

        // Validate against schema
        const validationResult = AssessmentDataSchema.safeParse(parsed);
        
        if (!validationResult.success) {
          const errorMessages = validationResult.error.errors
            .slice(0, 3)
            .map(e => `${e.path.join('.')}: ${e.message}`)
            .join('; ');
          toast.error(`Invalid backup file: ${errorMessages}`);
          console.error('JSON validation errors:', validationResult.error.errors);
          return;
        }

        // Validated data is safe to use
        const validated = validationResult.data;
        
        // Recalculate totals to ensure integrity and cast to proper types
        const processedStudents: Student[] = validated.students.map(student => ({
          id: student.id,
          serialNo: student.serialNo,
          name: student.name,
          rollNumber: student.rollNumber,
          subjectRatings: student.subjectRatings as Record<string, SkillRatingOrUnselected>,
          total: calculateTotal(student.subjectRatings as Record<string, SkillRatingOrUnselected>),
          remark: student.remark,
          isGeneratingRemark: student.isGeneratingRemark,
        }));

        const processedData: AssessmentData = {
          schoolName: validated.schoolName,
          className: validated.className,
          section: validated.section,
          totalStrength: validated.totalStrength,
          subject: validated.subject,
          language: validated.language,
          students: processedStudents,
        };

        setData(processedData);
        
        toast.success('Backup imported successfully!');
      } catch (error) {
        console.error('Failed to import JSON:', error);
        toast.error('Failed to import backup file.');
      }
    };
    
    reader.onerror = () => {
      toast.error('Failed to read file.');
    };
    
    reader.readAsText(file);
  }, []);

  return {
    data,
    updateSchoolInfo,
    setSubject,
    toggleLanguage,
    addStudent,
    removeStudent,
    updateStudent,
    updateSubjectRating,
    updateStudentRemark,
    importStudents,
    resetAll,
    exportJSON,
    importJSON,
  };
}
