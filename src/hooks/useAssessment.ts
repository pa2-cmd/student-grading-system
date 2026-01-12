import { useState, useEffect, useCallback } from 'react';
import { 
  AssessmentData, 
  Student, 
  SkillRating, 
  Language,
  Term,
  SavedComment,
  SubjectMarksDetail,
  calculateTotal, 
  calculatePercentage,
  createEmptyStudent, 
  createEmptySubjectMarksDetail,
  getDefaultAssessmentData,
  SKILL_VALUES,
  getMoodFromPerformance,
  recalculateStudentTotals
} from '@/types/assessment';
import { encryptData, decryptData, isEncrypted, migrateToEncrypted } from '@/utils/storage';

const STORAGE_KEY = 'grading-tool-data';

export function useAssessment() {
  const [data, setData] = useState<AssessmentData>(() => {
    // Migrate any existing unencrypted data to encrypted format
    migrateToEncrypted(STORAGE_KEY);
    
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        // Try to decrypt if encrypted, otherwise parse directly (for migration)
        let parsed: unknown;
        if (isEncrypted(saved)) {
          parsed = decryptData<AssessmentData>(saved);
          if (!parsed) {
            return getDefaultAssessmentData();
          }
        } else {
          parsed = JSON.parse(saved);
        }
        return migrateData(parsed);
      } catch {
        return getDefaultAssessmentData();
      }
    }
    return getDefaultAssessmentData();
  });

  // Auto-save to localStorage with encryption
  useEffect(() => {
    const encrypted = encryptData(data);
    localStorage.setItem(STORAGE_KEY, encrypted);
  }, [data]);

  const updateSchoolInfo = useCallback((field: string, value: string | number) => {
    setData(prev => ({ ...prev, [field]: value }));
  }, []);

  const changeLanguage = useCallback((lang: Language) => {
    setData(prev => ({ ...prev, language: lang }));
  }, []);

  const updateSelectedSubjects = useCallback((subjects: string[]) => {
    setData(prev => {
      const updatedStudents = prev.students.map(student => {
        const newRatings: Record<string, SkillRating> = {};
        const newMarks: Record<string, number> = {};
        const newMarksDetail: Record<string, SubjectMarksDetail> = {};
        subjects.forEach(subject => {
          newRatings[subject] = student.subjectRatings?.[subject] || 'Good';
          newMarks[subject] = student.subjectMarks?.[subject] ?? 0;
          newMarksDetail[subject] = student.subjectMarksDetail?.[subject] || createEmptySubjectMarksDetail();
        });
        return {
          ...student,
          subjectRatings: newRatings,
          subjectMarks: newMarks,
          subjectMarksDetail: newMarksDetail,
          total: calculateTotal(newRatings),
          percentage: calculatePercentage(newMarks),
        };
      });
      
      return {
        ...prev,
        selectedSubjects: subjects,
        students: updatedStudents,
      };
    });
  }, []);

  // Update subject marks detail (Theory + Internal)
  const updateSubjectMarksDetail = useCallback((studentId: string, subject: string, marks: SubjectMarksDetail) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== studentId) return student;
        
        const newMarksDetail = { ...student.subjectMarksDetail, [subject]: marks };
        const updates = recalculateStudentTotals({ ...student, subjectMarksDetail: newMarksDetail }, prev.selectedSubjects);
        
        // Also update simple marks for compatibility
        const newSimpleMarks = { ...student.subjectMarks, [subject]: marks.total };
        
        return {
          ...student,
          ...updates,
          subjectMarks: newSimpleMarks,
        };
      }),
    }));
  }, []);

  // Switch term and load/save term data
  const switchTerm = useCallback((newTerm: Term) => {
    setData(prev => ({
      ...prev,
      term: newTerm,
      students: prev.students.map(student => {
        // Load term data if it exists
        const termData = student.termData?.[newTerm];
        if (termData) {
          return {
            ...student,
            subjectMarksDetail: termData.subjectMarksDetail,
            total: termData.total,
            percentage: termData.percentage,
          };
        }
        return student;
      }),
    }));
  }, []);

  const addStudent = useCallback(() => {
    setData(prev => ({
      ...prev,
      students: [...prev.students, createEmptyStudent(prev.students.length + 1, prev.selectedSubjects)],
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

  const updateStudent = useCallback((id: string, updates: Partial<Student>) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== id) return student;
        
        const updated = { ...student, ...updates };
        
        // Recalculate derived fields
        if (updates.subjectRatings) {
          updated.total = calculateTotal(updated.subjectRatings);
        }
        if (updates.subjectMarks) {
          updated.percentage = calculatePercentage(updated.subjectMarks);
          updated.moodRating = getMoodFromPerformance(updated.percentage);
        }
        if (updates.attendancePresent !== undefined || updates.attendanceTotal !== undefined) {
          updated.attendancePercentage = updated.attendanceTotal > 0 
            ? Math.round(updated.attendancePresent / updated.attendanceTotal * 100)
            : 0;
        }
        
        return updated;
      }),
    }));
  }, []);

  const updateSubjectMark = useCallback((studentId: string, subject: string, marks: number) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => {
        if (student.id !== studentId) return student;
        
        const newMarks = { ...student.subjectMarks, [subject]: marks };
        const newRatings = { ...student.subjectRatings };
        
        // Auto-assign rating based on marks
        if (marks >= 85) newRatings[subject] = 'Excellent';
        else if (marks >= 70) newRatings[subject] = 'Good';
        else if (marks >= 50) newRatings[subject] = 'Average';
        else newRatings[subject] = 'Needs Improvement';
        
        const percentage = calculatePercentage(newMarks);
        
        return {
          ...student,
          subjectMarks: newMarks,
          subjectRatings: newRatings,
          total: calculateTotal(newRatings),
          percentage,
          moodRating: getMoodFromPerformance(percentage),
        };
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

  const updateStudentAnalysis = useCallback((id: string, strengths: string[], improvements: string[], nextSteps: string[]) => {
    setData(prev => ({
      ...prev,
      students: prev.students.map(student => 
        student.id === id 
          ? { ...student, strengths, improvements, nextSteps }
          : student
      ),
    }));
  }, []);

  const importStudents = useCallback((students: Student[]) => {
    setData(prev => ({
      ...prev,
      students,
      totalStrength: students.length,
    }));
  }, []);

  // Comment Library Management
  const addComment = useCallback((text: string, category: SavedComment['category']) => {
    setData(prev => ({
      ...prev,
      commentLibrary: [
        ...prev.commentLibrary,
        {
          id: crypto.randomUUID(),
          text,
          category,
          usageCount: 0,
          createdAt: new Date().toISOString(),
        },
      ],
    }));
  }, []);

  const removeComment = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      commentLibrary: prev.commentLibrary.filter(c => c.id !== id),
    }));
  }, []);

  const useComment = useCallback((id: string) => {
    setData(prev => ({
      ...prev,
      commentLibrary: prev.commentLibrary.map(c =>
        c.id === id ? { ...c, usageCount: c.usageCount + 1 } : c
      ),
    }));
  }, []);

  // Branding & Settings
  const updateBranding = useCallback((updates: Partial<AssessmentData['branding']>) => {
    setData(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates },
    }));
  }, []);

  const updateReportSettings = useCallback((updates: Partial<AssessmentData['reportSettings']>) => {
    setData(prev => ({
      ...prev,
      reportSettings: { ...prev.reportSettings, ...updates },
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
    a.download = `grading-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [data]);

  const importJSON = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        setData(migrateData(imported));
      } catch (error) {
        console.error('Failed to import JSON:', error);
      }
    };
    reader.readAsText(file);
  }, []);

  return {
    data,
    updateSchoolInfo,
    changeLanguage,
    updateSelectedSubjects,
    updateSubjectMarksDetail,
    switchTerm,
    addStudent,
    removeStudent,
    updateStudent,
    updateSubjectMark,
    updateSubjectRating,
    updateStudentRemark,
    updateStudentAnalysis,
    importStudents,
    addComment,
    removeComment,
    useComment,
    updateBranding,
    updateReportSettings,
    resetAll,
    exportJSON,
    importJSON,
  };
}

// Migrate old data format to new format
function migrateData(parsed: any): AssessmentData {
  const defaults = getDefaultAssessmentData();
  
  // Ensure all required fields exist
  const migrated: AssessmentData = {
    schoolName: parsed.schoolName || defaults.schoolName,
    examName: parsed.examName || '',
    className: parsed.className || '',
    section: parsed.section || '',
    academicYear: parsed.academicYear || defaults.academicYear,
    term: parsed.term || defaults.term,
    totalStrength: parsed.totalStrength || 0,
    language: parsed.language || 'english',
    selectedSubjects: parsed.selectedSubjects || defaults.selectedSubjects,
    commentLibrary: parsed.commentLibrary || [],
    branding: { ...defaults.branding, ...parsed.branding },
    reportSettings: { ...defaults.reportSettings, ...parsed.reportSettings },
    students: [],
  };
  
  // Migrate students
  if (parsed.students && Array.isArray(parsed.students)) {
    migrated.students = parsed.students.map((student: any, index: number) => {
      const subjectRatings: Record<string, SkillRating> = student.subjectRatings || {};
      const subjectMarks: Record<string, number> = student.subjectMarks || {};
      const subjectMarksDetail: Record<string, SubjectMarksDetail> = student.subjectMarksDetail || {};
      
      // Handle old format with individual skill properties
      if (!student.subjectRatings && student.speakingListening) {
        subjectRatings['Speaking & Listening'] = student.speakingListening;
        subjectRatings['Writing Skills'] = student.writing;
        subjectRatings['Vocabulary'] = student.vocabulary;
        subjectRatings['Grammar'] = student.grammar;
        subjectRatings['Reading Comprehension'] = student.reading;
      }
      
      // Fill defaults for missing subjects
      migrated.selectedSubjects.forEach(subject => {
        if (!subjectRatings[subject]) subjectRatings[subject] = 'Good';
        if (subjectMarks[subject] === undefined) subjectMarks[subject] = 0;
        if (!subjectMarksDetail[subject]) {
          // Migrate from simple marks to detailed marks
          const marks = subjectMarks[subject] || 0;
          subjectMarksDetail[subject] = {
            theory: Math.min(80, Math.round(marks * 0.8)),
            internal: Math.min(20, Math.round(marks * 0.2)),
            total: marks
          };
        }
      });
      
      // Create empty term data
      const emptyTermData = {
        'Term 1': { subjectMarksDetail: { ...subjectMarksDetail }, total: 0, percentage: 0 },
        'Term 2': { subjectMarksDetail: {}, total: 0, percentage: 0 },
        'Annual': { subjectMarksDetail: {}, total: 0, percentage: 0 },
      };
      
      return {
        id: student.id || crypto.randomUUID(),
        serialNo: student.serialNo || index + 1,
        enrollmentNumber: student.enrollmentNumber || '',
        name: student.name || '',
        rollNumber: student.rollNumber || String(student.serialNo || index + 1),
        fatherName: student.fatherName || '',
        motherName: student.motherName || '',
        dob: student.dob || '',
        gender: student.gender || '',
        photo: student.photo || '',
        subjectMarks,
        subjectMarksDetail,
        subjectRatings,
        termData: student.termData || emptyTermData,
        attendancePresent: student.attendancePresent || 0,
        attendanceTotal: student.attendanceTotal || 0,
        attendancePercentage: student.attendancePercentage || 0,
        maxGrandTotal: student.maxGrandTotal || 0,
        grandTotal: student.grandTotal || 0,
        grade: student.grade || '',
        behaviorNotes: student.behaviorNotes || '',
        learningSkills: student.learningSkills || {},
        moodRating: student.moodRating || 'good',
        strengths: student.strengths || [],
        improvements: student.improvements || [],
        nextSteps: student.nextSteps || [],
        remark: student.remark || '',
        teacherNotes: student.teacherNotes || '',
        isGeneratingRemark: false,
        total: calculateTotal(subjectRatings),
        percentage: calculatePercentage(subjectMarks),
        classPosition: student.classPosition || index + 1,
      };
    });
  }
  
  // Don't add default students - keep empty if no students imported
  // This ensures app starts with no data until Excel is uploaded
  
  return migrated;
}
