import { Student, SKILL_VALUES, LANGUAGES, Language, getMoodFromPerformance, getGradeFromPercentage } from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: Language;
  selectedSubjects: string[];
  teacherNotes?: string;
}

// ============================================
// HUMANIZED PHRASE TEMPLATES
// Warm, encouraging, teacher-like language
// ============================================

const PHRASE_TEMPLATES = {
  english: {
    excellent: [
      "is truly exceptional and continues to inspire",
      "has shown remarkable dedication and excellence",
      "is a shining star in our classroom",
      "demonstrates outstanding commitment to learning",
      "has exceeded all expectations brilliantly",
    ],
    good: [
      "is making wonderful progress",
      "shows great enthusiasm for learning",
      "is developing beautifully in all areas",
      "brings positive energy to every class",
      "is on a fantastic learning journey",
    ],
    average: [
      "is growing steadily each day",
      "shows promising potential",
      "is building a strong foundation",
      "is making meaningful progress",
      "continues to develop well",
    ],
    needsSupport: [
      "is discovering their unique strengths",
      "is working with determination",
      "shows resilience in their learning",
      "is on their own special path",
      "continues to try with heart",
    ],
    strengthPhrases: [
      "It's wonderful to see their talent in",
      "We're so proud of their ability in",
      "They truly shine when it comes to",
      "Their natural gift for",
      "We celebrate their excellence in",
    ],
    improvementPhrases: [
      "With a little more practice in",
      "We believe with support in",
      "Focusing on",
      "Working together on",
      "With encouragement in",
    ],
    nextStepPhrases: [
      "We suggest",
      "A great next step would be",
      "To grow further,",
      "We recommend",
      "Moving forward,",
    ],
    closings: [
      "We believe in you!",
      "Keep up the wonderful work!",
      "The future is bright!",
      "You're doing amazing!",
      "We're cheering you on!",
      "Every step counts!",
      "You make us proud!",
    ],
    attendanceGood: "Excellent attendance shows great commitment to learning.",
    attendanceAverage: "Regular attendance will help maximize learning opportunities.",
    attendanceNeedsWork: "Improving attendance will greatly benefit academic progress.",
  },
  hindi: {
    excellent: [
      "वास्तव में असाधारण है और प्रेरित करते रहते हैं",
      "उल्लेखनीय समर्पण और उत्कृष्टता दिखाई है",
      "हमारी कक्षा के चमकते सितारे हैं",
      "सीखने के प्रति उत्कृष्ट प्रतिबद्धता दिखाते हैं",
      "सभी उम्मीदों से बढ़कर प्रदर्शन किया है",
    ],
    good: [
      "अद्भुत प्रगति कर रहे हैं",
      "सीखने के प्रति बहुत उत्साह दिखाते हैं",
      "सभी क्षेत्रों में सुंदर विकास कर रहे हैं",
      "हर कक्षा में सकारात्मक ऊर्जा लाते हैं",
      "शानदार सीखने की यात्रा पर हैं",
    ],
    average: [
      "हर दिन लगातार बढ़ रहे हैं",
      "आशाजनक क्षमता दिखाते हैं",
      "मजबूत नींव बना रहे हैं",
      "सार्थक प्रगति कर रहे हैं",
      "अच्छी तरह विकसित हो रहे हैं",
    ],
    needsSupport: [
      "अपनी अनूठी ताकत खोज रहे हैं",
      "दृढ़ संकल्प के साथ काम कर रहे हैं",
      "सीखने में लचीलापन दिखाते हैं",
      "अपने विशेष मार्ग पर हैं",
      "दिल से प्रयास जारी रखते हैं",
    ],
    strengthPhrases: [
      "उनकी प्रतिभा देखकर खुशी होती है",
      "हमें उनकी क्षमता पर गर्व है",
      "वे वास्तव में चमकते हैं जब बात आती है",
      "उनका प्राकृतिक उपहार है",
      "हम उनकी उत्कृष्टता का जश्न मनाते हैं",
    ],
    improvementPhrases: [
      "थोड़े और अभ्यास से",
      "हमें विश्वास है कि सहयोग से",
      "ध्यान केंद्रित करने से",
      "मिलकर काम करने से",
      "प्रोत्साहन के साथ",
    ],
    nextStepPhrases: [
      "हम सुझाव देते हैं",
      "अगला कदम होगा",
      "आगे बढ़ने के लिए",
      "हम अनुशंसा करते हैं",
      "आगे बढ़ते हुए",
    ],
    closings: [
      "हमें तुम पर विश्वास है!",
      "इसी तरह शानदार काम जारी रखो!",
      "भविष्य उज्ज्वल है!",
      "तुम अद्भुत कर रहे हो!",
      "हम तुम्हारे साथ हैं!",
      "हर कदम मायने रखता है!",
      "तुम हमें गर्वित करते हो!",
    ],
    attendanceGood: "उत्कृष्ट उपस्थिति सीखने के प्रति महान प्रतिबद्धता दर्शाती है।",
    attendanceAverage: "नियमित उपस्थिति सीखने के अवसरों को अधिकतम करने में मदद करेगी।",
    attendanceNeedsWork: "उपस्थिति में सुधार से शैक्षणिक प्रगति में बहुत लाभ होगा।",
  },
};

function getRandomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getSubjectDisplayName(subject: string, language: Language): string {
  const translations: Record<string, Record<string, string>> = {
    hindi: {
      'English': 'अंग्रेज़ी',
      'Hindi': 'हिंदी',
      'Mathematics': 'गणित',
      'Science': 'विज्ञान',
      'Social Studies': 'सामाजिक अध्ययन',
      'Computer Science': 'कंप्यूटर विज्ञान',
      'Art & Craft': 'कला और शिल्प',
      'Physical Education': 'शारीरिक शिक्षा',
      'Music': 'संगीत',
    },
  };
  
  if (language !== 'english' && translations[language]?.[subject]) {
    return translations[language][subject];
  }
  return subject;
}

// ============================================
// MAIN REMARK GENERATOR
// ============================================

export async function generateRemark({ student, language, selectedSubjects, teacherNotes }: RemarkGeneratorParams): Promise<string> {
  // Simulate processing time for natural feel
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  return generateHumanizedRemark(student, language, selectedSubjects, teacherNotes);
}

function generateHumanizedRemark(
  student: Student,
  language: Language,
  selectedSubjects: string[],
  teacherNotes?: string
): string {
  // Use English or Hindi phrases (fallback to English for other languages)
  const phrases = language === 'hindi' ? PHRASE_TEMPLATES.hindi : PHRASE_TEMPLATES.english;
  const studentName = student.name || (language === 'hindi' ? 'छात्र' : 'The student');
  
  const remarkParts: string[] = [];
  
  // Calculate performance level
  const percentage = student.percentage || 0;
  
  // Opening based on overall performance
  if (percentage >= 85) {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.excellent)}.`);
  } else if (percentage >= 70) {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.good)}.`);
  } else if (percentage >= 50) {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.average)}.`);
  } else {
    remarkParts.push(`${studentName} ${getRandomItem(phrases.needsSupport)}.`);
  }
  
  // Identify strengths (subjects with 75%+ marks)
  const strengths = selectedSubjects.filter(subject => 
    (student.subjectMarks?.[subject] || 0) >= 75
  );
  
  if (strengths.length > 0) {
    const strengthSubjects = strengths.slice(0, 2).map(s => getSubjectDisplayName(s, language));
    const strengthList = strengthSubjects.join(language === 'hindi' ? ' और ' : ' and ');
    remarkParts.push(`${getRandomItem(phrases.strengthPhrases)} ${strengthList}${language === 'hindi' ? ' शानदार है।' : ' is commendable.'}`);
  }
  
  // Identify areas for improvement (subjects below 50%)
  const improvements = selectedSubjects.filter(subject => 
    (student.subjectMarks?.[subject] || 0) < 50
  );
  
  if (improvements.length > 0 && improvements.length <= 2) {
    const improvementSubjects = improvements.map(s => getSubjectDisplayName(s, language));
    const improvementList = improvementSubjects.join(language === 'hindi' ? ' और ' : ' and ');
    remarkParts.push(`${getRandomItem(phrases.improvementPhrases)} ${improvementList}${language === 'hindi' ? ', और भी प्रगति होगी।' : ', they will flourish even more.'}`);
  }
  
  // Attendance note
  if (student.attendancePercentage >= 90) {
    remarkParts.push(phrases.attendanceGood);
  } else if (student.attendancePercentage >= 75) {
    remarkParts.push(phrases.attendanceAverage);
  } else if (student.attendancePercentage > 0) {
    remarkParts.push(phrases.attendanceNeedsWork);
  }
  
  // Include teacher's custom notes if provided
  if (teacherNotes || student.teacherNotes) {
    const notes = teacherNotes || student.teacherNotes;
    remarkParts.push(notes);
  }
  
  // Warm closing
  remarkParts.push(getRandomItem(phrases.closings));
  
  return remarkParts.join(' ');
}

// ============================================
// GENERATE STRENGTHS, WEAKNESSES, NEXT STEPS
// ============================================

export function generateStrengthsWeaknessesNextSteps(
  student: Student,
  language: Language,
  selectedSubjects: string[]
): { strengths: string[]; improvements: string[]; nextSteps: string[] } {
  const isHindi = language === 'hindi';
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  const nextSteps: string[] = [];
  
  // Subject-based analysis
  selectedSubjects.forEach(subject => {
    const marks = student.subjectMarks?.[subject] || 0;
    const subjectName = getSubjectDisplayName(subject, language);
    
    if (marks >= 80) {
      strengths.push(isHindi 
        ? `${subjectName} में उत्कृष्ट प्रदर्शन` 
        : `Excellent performance in ${subjectName}`);
    } else if (marks < 50) {
      improvements.push(isHindi 
        ? `${subjectName} में सुधार की आवश्यकता` 
        : `Needs improvement in ${subjectName}`);
      nextSteps.push(isHindi 
        ? `${subjectName} के लिए अतिरिक्त अभ्यास करें` 
        : `Practice extra exercises for ${subjectName}`);
    }
  });
  
  // Learning skills analysis
  Object.entries(student.learningSkills || {}).forEach(([skill, rating]) => {
    if (rating === 'Excellent' || rating === 'Good') {
      strengths.push(isHindi ? `${skill} में अच्छा` : `Strong ${skill.toLowerCase()}`);
    } else if (rating === 'Needs Improvement') {
      improvements.push(isHindi ? `${skill} में काम करना चाहिए` : `Work on ${skill.toLowerCase()}`);
    }
  });
  
  // Attendance-based suggestions
  if (student.attendancePercentage < 80) {
    improvements.push(isHindi ? 'उपस्थिति में सुधार करें' : 'Improve attendance');
    nextSteps.push(isHindi ? 'नियमित रूप से कक्षा में आएं' : 'Attend classes regularly');
  }
  
  // General next steps
  if (nextSteps.length === 0) {
    nextSteps.push(isHindi 
      ? 'उत्कृष्ट प्रदर्शन जारी रखें' 
      : 'Continue the excellent performance');
  }
  
  return {
    strengths: strengths.slice(0, 4),
    improvements: improvements.slice(0, 3),
    nextSteps: nextSteps.slice(0, 3),
  };
}
