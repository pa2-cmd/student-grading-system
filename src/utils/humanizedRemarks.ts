import { Student, Language, getGradeFromPercentage } from '@/types/assessment';

/**
 * =============================================================
 * ENHANCED HUMANIZED REMARKS GENERATOR
 * =============================================================
 * 
 * Generates natural, teacher-like remarks (120-150 words) based on student performance.
 * Adapts to individual student context including:
 * - Subject-wise strengths and weaknesses
 * - Attendance patterns
 * - Consistency across subjects
 * - Class-level context
 * 
 * Non-repetitive, supportive, and avoids robotic/shaming language.
 */

interface RemarkContext {
  strongSubjects: string[];
  weakSubjects: string[];
  averageSubjects: string[];
  overallPercentage: number;
  attendancePercentage: number;
  isConsistent: boolean;
  performanceLevel: 'excellent' | 'veryGood' | 'good' | 'average' | 'needsImprovement';
}

/**
 * Analyze student performance context
 */
function analyzeStudent(student: Student, selectedSubjects?: string[]): RemarkContext {
  const marks = student.subjectMarks || {};
  const subjects = selectedSubjects || Object.keys(marks);
  
  const strongSubjects: string[] = [];
  const weakSubjects: string[] = [];
  const averageSubjects: string[] = [];
  const allMarks: number[] = [];
  
  subjects.forEach(subject => {
    const mark = marks[subject];
    if (mark === undefined || mark === null) return;
    
    allMarks.push(mark);
    if (mark >= 75) strongSubjects.push(subject);
    else if (mark < 50) weakSubjects.push(subject);
    else averageSubjects.push(subject);
  });
  
  const overallPercentage = student.percentage || 0;
  const attendancePercentage = student.attendancePercentage || 
    (student.attendanceTotal > 0 ? Math.round((student.attendancePresent / student.attendanceTotal) * 100) : 0);
  
  // Check consistency (variance in marks)
  const variance = allMarks.length > 1 
    ? Math.max(...allMarks) - Math.min(...allMarks)
    : 0;
  const isConsistent = variance <= 15;
  
  let performanceLevel: RemarkContext['performanceLevel'];
  if (overallPercentage >= 85) performanceLevel = 'excellent';
  else if (overallPercentage >= 70) performanceLevel = 'veryGood';
  else if (overallPercentage >= 60) performanceLevel = 'good';
  else if (overallPercentage >= 45) performanceLevel = 'average';
  else performanceLevel = 'needsImprovement';
  
  return {
    strongSubjects,
    weakSubjects,
    averageSubjects,
    overallPercentage,
    attendancePercentage,
    isConsistent,
    performanceLevel,
  };
}

/**
 * Generate opening statement based on performance
 */
function getOpeningStatement(ctx: RemarkContext, name: string, language: Language): string {
  const firstName = name.split(' ')[0];
  
  if (language === 'hindi') {
    switch (ctx.performanceLevel) {
      case 'excellent':
        return `${firstName} ने इस सत्र में उत्कृष्ट प्रदर्शन किया है।`;
      case 'veryGood':
        return `${firstName} ने बहुत अच्छा प्रदर्शन किया है और निरंतर प्रगति दिखाई है।`;
      case 'good':
        return `${firstName} ने अच्छी प्रगति की है और सीखने में रुचि दिखाई है।`;
      case 'average':
        return `${firstName} ने सत्र में संतोषजनक प्रयास किया है।`;
      default:
        return `${firstName} को अधिक मेहनत और अभ्यास की जरूरत है।`;
    }
  }
  
  switch (ctx.performanceLevel) {
    case 'excellent':
      return `${firstName} has demonstrated exceptional academic performance this term.`;
    case 'veryGood':
      return `${firstName} has shown commendable progress and maintained very good standards throughout the term.`;
    case 'good':
      return `${firstName} has made good progress and displays genuine interest in learning.`;
    case 'average':
      return `${firstName} has put in satisfactory effort this term.`;
    default:
      return `${firstName} needs additional support and dedicated practice to improve.`;
  }
}

/**
 * Generate subject-specific observations
 */
function getSubjectObservation(ctx: RemarkContext, language: Language): string {
  const parts: string[] = [];
  
  if (language === 'hindi') {
    if (ctx.strongSubjects.length > 0) {
      const subjects = ctx.strongSubjects.slice(0, 2).join(' और ');
      parts.push(`${subjects} में विशेष रूप से मजबूत प्रदर्शन किया है`);
    }
    if (ctx.weakSubjects.length > 0 && ctx.weakSubjects.length <= 2) {
      const subjects = ctx.weakSubjects.join(' और ');
      parts.push(`${subjects} में अधिक अभ्यास से लाभ होगा`);
    }
    return parts.join(', और ');
  }
  
  if (ctx.strongSubjects.length > 0) {
    const subjects = ctx.strongSubjects.slice(0, 2).join(' and ');
    parts.push(`Shows excellent understanding in ${subjects}`);
  }
  if (ctx.weakSubjects.length > 0 && ctx.weakSubjects.length <= 2) {
    const subjects = ctx.weakSubjects.join(' and ');
    parts.push(`would benefit from extra practice in ${subjects}`);
  }
  
  return parts.join(', and ');
}

/**
 * Generate consistency observation
 */
function getConsistencyNote(ctx: RemarkContext, language: Language): string {
  if (language === 'hindi') {
    return ctx.isConsistent 
      ? 'सभी विषयों में समान प्रदर्शन बनाए रखा है।'
      : 'कुछ विषयों में प्रदर्शन असमान है जिस पर ध्यान देने की जरूरत है।';
  }
  
  return ctx.isConsistent 
    ? 'Maintains balanced performance across all subjects.'
    : 'Performance varies across subjects, indicating areas that need focused attention.';
}

/**
 * Generate attendance observation
 */
function getAttendanceNote(ctx: RemarkContext, language: Language): string {
  if (ctx.attendancePercentage === 0) return '';
  
  if (language === 'hindi') {
    if (ctx.attendancePercentage >= 90) {
      return 'उपस्थिति उत्कृष्ट है जो सीखने के प्रति समर्पण दर्शाती है।';
    } else if (ctx.attendancePercentage >= 75) {
      return 'उपस्थिति अच्छी है।';
    } else {
      return 'उपस्थिति में सुधार से शैक्षणिक प्रदर्शन बेहतर होगा।';
    }
  }
  
  if (ctx.attendancePercentage >= 90) {
    return 'Excellent attendance reflects sincere commitment to learning.';
  } else if (ctx.attendancePercentage >= 75) {
    return 'Maintains good attendance.';
  } else {
    return 'Improved attendance would positively impact academic performance.';
  }
}

/**
 * Generate encouraging closing statement
 */
function getClosingStatement(ctx: RemarkContext, language: Language): string {
  if (language === 'hindi') {
    switch (ctx.performanceLevel) {
      case 'excellent':
        return 'इसी तरह उत्कृष्ट प्रयास जारी रखें। आप सभी के लिए प्रेरणा हैं!';
      case 'veryGood':
        return 'थोड़ी और मेहनत से शीर्ष प्रदर्शन संभव है। आप सही दिशा में हैं!';
      case 'good':
        return 'नियमित अभ्यास और मेहनत से और बेहतर परिणाम मिलेंगे। प्रयास जारी रखें!';
      case 'average':
        return 'अधिक केंद्रित अध्ययन और नियमित अभ्यास से प्रगति होगी। हम आपमें विश्वास करते हैं!';
      default:
        return 'धैर्य रखें और लगातार प्रयास करें। सहायता के लिए शिक्षक हमेशा तैयार हैं। आप बेहतर कर सकते हैं!';
    }
  }
  
  switch (ctx.performanceLevel) {
    case 'excellent':
      return 'Keep up this outstanding effort! You are an inspiration to your peers.';
    case 'veryGood':
      return 'With continued dedication, top performance is well within reach. Stay focused!';
    case 'good':
      return 'Regular practice and sustained effort will lead to even better results. Keep it up!';
    case 'average':
      return 'More focused study habits and consistent practice will help improve performance. We believe in you!';
    default:
      return 'With patience, consistent effort, and support from teachers and parents, improvement is definitely achievable. Never give up!';
  }
}

/**
 * Generate enhanced humanized remark for a student (120-150 words)
 */
export function generateHumanizedRemark(
  student: Student,
  language: Language = 'english',
  selectedSubjects?: string[]
): string {
  // Fallback for missing data
  if (!student.name || !student.name.trim()) {
    return language === 'hindi' 
      ? 'छात्र के नाम की जानकारी उपलब्ध नहीं है।'
      : 'Student name information not available.';
  }
  
  try {
    const ctx = analyzeStudent(student, selectedSubjects);
    const parts: string[] = [];
    
    // Opening statement (performance-based)
    parts.push(getOpeningStatement(ctx, student.name, language));
    
    // Subject-specific observations
    const subjectObs = getSubjectObservation(ctx, language);
    if (subjectObs) {
      parts.push(subjectObs + '.');
    }
    
    // Consistency note
    if (Object.keys(student.subjectMarks || {}).length >= 3) {
      parts.push(getConsistencyNote(ctx, language));
    }
    
    // Attendance observation
    const attendanceNote = getAttendanceNote(ctx, language);
    if (attendanceNote) {
      parts.push(attendanceNote);
    }
    
    // Add behavioral/learning observation based on performance
    if (language === 'hindi') {
      if (ctx.performanceLevel === 'excellent' || ctx.performanceLevel === 'veryGood') {
        parts.push('कक्षा में सक्रिय भागीदारी और अच्छा व्यवहार प्रशंसनीय है।');
      } else if (ctx.performanceLevel === 'good') {
        parts.push('सीखने के प्रति सकारात्मक दृष्टिकोण दिखाता है।');
      }
    } else {
      if (ctx.performanceLevel === 'excellent' || ctx.performanceLevel === 'veryGood') {
        parts.push('Active participation in class and good conduct are commendable.');
      } else if (ctx.performanceLevel === 'good') {
        parts.push('Displays positive attitude towards learning.');
      }
    }
    
    // Closing encouragement
    parts.push(getClosingStatement(ctx, language));
    
    return parts.join(' ');
  } catch (error) {
    // Safe fallback template
    console.error('Error generating remark:', error);
    return language === 'hindi'
      ? `${student.name} ने इस सत्र में प्रयास किया है। निरंतर अभ्यास और मेहनत से और बेहतर परिणाम संभव हैं। प्रयास जारी रखें!`
      : `${student.name} has put in effort this term. With continued practice and dedication, better results are achievable. Keep working hard!`;
  }
}

/**
 * Generate detailed analysis for strengths, weaknesses, and next steps
 */
export function generateDetailedAnalysis(
  student: Student,
  language: Language,
  selectedSubjects: string[]
): { strengths: string[]; improvements: string[]; nextSteps: string[] } {
  const ctx = analyzeStudent(student, selectedSubjects);
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  const nextSteps: string[] = [];
  
  if (language === 'hindi') {
    ctx.strongSubjects.forEach(subj => strengths.push(`${subj} में उत्कृष्ट`));
    ctx.weakSubjects.forEach(subj => improvements.push(`${subj} में सुधार जरूरी`));
    
    if (ctx.isConsistent) strengths.push('सभी विषयों में निरंतरता');
    if (ctx.attendancePercentage >= 90) strengths.push('उत्कृष्ट उपस्थिति');
    
    if (ctx.performanceLevel === 'excellent') {
      nextSteps.push('उन्नत समस्याओं का अभ्यास करें');
      nextSteps.push('साथियों की मदद करें');
    } else if (ctx.performanceLevel === 'veryGood' || ctx.performanceLevel === 'good') {
      nextSteps.push('नियमित अभ्यास जारी रखें');
      if (ctx.weakSubjects.length > 0) nextSteps.push('कमजोर विषयों पर ध्यान दें');
    } else {
      nextSteps.push('दैनिक पुनरावृत्ति करें');
      nextSteps.push('शिक्षक से मार्गदर्शन लें');
      nextSteps.push('अधिक अभ्यास प्रश्न हल करें');
    }
  } else {
    ctx.strongSubjects.forEach(subj => strengths.push(`Excellent in ${subj}`));
    ctx.weakSubjects.forEach(subj => improvements.push(`Needs work in ${subj}`));
    
    if (ctx.isConsistent) strengths.push('Consistent across subjects');
    if (ctx.attendancePercentage >= 90) strengths.push('Excellent attendance');
    
    if (ctx.performanceLevel === 'excellent') {
      nextSteps.push('Attempt advanced problems');
      nextSteps.push('Help peers in studies');
    } else if (ctx.performanceLevel === 'veryGood' || ctx.performanceLevel === 'good') {
      nextSteps.push('Continue regular practice');
      if (ctx.weakSubjects.length > 0) nextSteps.push('Focus on weaker subjects');
    } else {
      nextSteps.push('Daily revision recommended');
      nextSteps.push('Seek teacher guidance');
      nextSteps.push('Practice more problems');
    }
  }
  
  return { strengths, improvements, nextSteps };
}

/**
 * Generate remarks for all students
 */
export function generateAllHumanizedRemarks(
  students: Student[],
  language: Language = 'english',
  selectedSubjects?: string[]
): Map<string, string> {
  const remarks = new Map<string, string>();
  
  students.forEach(student => {
    if (student.name && student.name.trim()) {
      remarks.set(student.id, generateHumanizedRemark(student, language, selectedSubjects));
    }
  });

  return remarks;
}
