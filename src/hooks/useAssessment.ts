import { useState, useEffect, useCallback } from 'react';
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
  SKILL_VALUES 
} from '@/types/assessment';

const STORAGE_KEY = 'assessment-data-v2';

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
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        // Ensure section exists
        if (!imported.section) {
          imported.section = '';
        }
        // Ensure subject exists
        if (!imported.subject) {
          imported.subject = 'English';
        }
        setData(imported);
      } catch (error) {
        console.error('Failed to import JSON:', error);
      }
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
