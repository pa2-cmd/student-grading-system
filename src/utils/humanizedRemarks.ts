import { Student, Language } from '@/types/assessment';

/**
 * =============================================================
 * HUMANIZED REMARKS GENERATOR
 * =============================================================
 * 
 * Generates natural, teacher-like remarks based on student performance.
 * Not AI-sounding, warm and encouraging.
 */

interface RemarkTemplates {
  excellent: string[];  // 90+
  veryGood: string[];   // 75-89
  good: string[];       // 60-74
  needsImprovement: string[];  // <60
}

const ENGLISH_TEMPLATES: RemarkTemplates = {
  excellent: [
    "Shows outstanding knowledge and consistency. A sincere learner who puts in admirable effort across all subjects.",
    "An exceptional student with remarkable academic achievements. Demonstrates deep understanding and genuine enthusiasm for learning.",
    "Exhibits brilliant performance and maintains high standards consistently. A true role model for peers.",
    "Outstanding work! Shows exceptional dedication and mastery of concepts. Continues to exceed expectations.",
    "A brilliant mind with excellent work ethic. Demonstrates thorough understanding and creative thinking abilities.",
    "Truly exceptional in academics. Shows remarkable consistency and passion for excellence in every subject.",
    "An outstanding performer who consistently achieves top results. A pleasure to teach and guide.",
    "Demonstrates superior understanding and excellent analytical skills. Sets a great example for the class.",
  ],
  veryGood: [
    "Demonstrates strong understanding and a positive attitude toward studies. Continues to perform well in most subjects.",
    "A diligent student with commendable academic performance. Shows good grasp of concepts and enthusiasm for learning.",
    "Performs consistently well with strong fundamentals. Has potential to reach even greater heights with continued effort.",
    "Shows very good progress and maintains quality work. A reliable student who can be counted on for good results.",
    "A capable student with solid academic performance. Demonstrates good understanding and regular preparation.",
    "Exhibits very good work quality and positive learning attitude. Showing steady improvement across subjects.",
    "A well-rounded student with strong academic capabilities. Maintains good standards with room to grow further.",
    "Demonstrates good command over subjects and sincere approach to studies. Keep up the excellent work!",
  ],
  good: [
    "Shows steady progress. A little more revision and focus will help achieve even better results in upcoming assessments.",
    "Making satisfactory progress with room for improvement. Regular practice and attention to weak areas will help.",
    "A sincere student showing consistent effort. With more focused study habits, can achieve significantly better results.",
    "Demonstrates decent understanding of concepts. Extra attention to challenging subjects will boost overall performance.",
    "Shows promising potential and genuine effort. More practice and revision will lead to noticeable improvement.",
    "Making good progress overall. Focused preparation in specific areas will help strengthen performance further.",
    "A capable student who can achieve more with regular study habits. Keep working on building stronger foundations.",
    "Shows reasonable progress. With dedicated effort and consistent practice, improvement is definitely within reach.",
  ],
  needsImprovement: [
    "Needs consistent practice and guidance. Shows potential, and regular support will help strengthen fundamentals.",
    "Requires more focused attention on basic concepts. With dedicated practice and support, improvement is achievable.",
    "Shows willingness to learn but needs additional support. Regular practice and revision will help build confidence.",
    "Needs to work on fundamental concepts with more dedication. Supportive guidance will help improve understanding.",
    "Requires extra attention and practice in core subjects. With patience and regular effort, progress will come.",
    "Shows effort but needs more consistent study habits. Additional support and practice will help strengthen skills.",
    "Needs to focus more on foundational concepts. Regular revision and guided practice will lead to improvement.",
    "Requires additional support to build stronger foundations. Keep trying and seek help when concepts seem difficult.",
  ],
};

const HINDI_TEMPLATES: RemarkTemplates = {
  excellent: [
    "उत्कृष्ट ज्ञान और निरंतरता दिखाते हैं। एक ईमानदार विद्यार्थी जो सभी विषयों में प्रशंसनीय प्रयास करते हैं।",
    "उल्लेखनीय शैक्षणिक उपलब्धियों वाले असाधारण छात्र। गहरी समझ और सीखने के प्रति सच्चा उत्साह प्रदर्शित करते हैं।",
    "शानदार प्रदर्शन और उच्च मानकों को बनाए रखते हैं। साथियों के लिए एक सच्चे आदर्श हैं।",
    "बेहतरीन काम! असाधारण समर्पण और अवधारणाओं पर महारत दिखाते हैं। उम्मीदों से बढ़कर प्रदर्शन करते हैं।",
    "उत्कृष्ट कार्य नीति के साथ प्रतिभाशाली। गहन समझ और रचनात्मक सोच क्षमता प्रदर्शित करते हैं।",
  ],
  veryGood: [
    "मजबूत समझ और पढ़ाई के प्रति सकारात्मक दृष्टिकोण प्रदर्शित करते हैं। अधिकांश विषयों में अच्छा प्रदर्शन जारी है।",
    "सराहनीय शैक्षणिक प्रदर्शन वाले मेहनती छात्र। अवधारणाओं की अच्छी समझ और सीखने का उत्साह दिखाते हैं।",
    "मजबूत बुनियादी बातों के साथ लगातार अच्छा प्रदर्शन। निरंतर प्रयास से और भी ऊंचाई हासिल कर सकते हैं।",
    "बहुत अच्छी प्रगति और गुणवत्तापूर्ण कार्य बनाए रखते हैं। एक विश्वसनीय छात्र जिनसे अच्छे परिणामों की उम्मीद की जा सकती है।",
    "ठोस शैक्षणिक प्रदर्शन वाले सक्षम छात्र। अच्छी समझ और नियमित तैयारी प्रदर्शित करते हैं।",
  ],
  good: [
    "स्थिर प्रगति दिखाते हैं। थोड़ा और अभ्यास और ध्यान आगामी परीक्षाओं में बेहतर परिणाम लाएगा।",
    "सुधार की गुंजाइश के साथ संतोषजनक प्रगति कर रहे हैं। नियमित अभ्यास और कमजोर क्षेत्रों पर ध्यान मदद करेगा।",
    "निरंतर प्रयास दिखाने वाले ईमानदार छात्र। अधिक केंद्रित अध्ययन की आदतों से काफी बेहतर परिणाम प्राप्त कर सकते हैं।",
    "अवधारणाओं की अच्छी समझ प्रदर्शित करते हैं। चुनौतीपूर्ण विषयों पर अतिरिक्त ध्यान समग्र प्रदर्शन को बढ़ाएगा।",
    "आशाजनक क्षमता और वास्तविक प्रयास दिखाते हैं। अधिक अभ्यास और पुनरावृत्ति से उल्लेखनीय सुधार होगा।",
  ],
  needsImprovement: [
    "निरंतर अभ्यास और मार्गदर्शन की आवश्यकता है। क्षमता दिखाते हैं, और नियमित समर्थन बुनियादी बातों को मजबूत करने में मदद करेगा।",
    "मूल अवधारणाओं पर अधिक केंद्रित ध्यान देने की आवश्यकता है। समर्पित अभ्यास और समर्थन से सुधार संभव है।",
    "सीखने की इच्छा दिखाते हैं लेकिन अतिरिक्त समर्थन की आवश्यकता है। नियमित अभ्यास और पुनरावृत्ति आत्मविश्वास बनाने में मदद करेगी।",
    "अधिक समर्पण के साथ मौलिक अवधारणाओं पर काम करने की आवश्यकता है। सहायक मार्गदर्शन समझ को बेहतर बनाने में मदद करेगा।",
    "मूल विषयों में अतिरिक्त ध्यान और अभ्यास की आवश्यकता है। धैर्य और नियमित प्रयास से प्रगति होगी।",
  ],
};

/**
 * Get subject-specific observations based on marks
 */
function getSubjectObservation(subjectMarks: Record<string, number>, language: Language): string {
  const subjects = Object.entries(subjectMarks);
  if (subjects.length === 0) return '';

  // Find strongest and weakest subjects
  const sorted = subjects.sort((a, b) => b[1] - a[1]);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  if (language === 'hindi') {
    if (strongest && strongest[1] >= 75) {
      return ` ${strongest[0]} में विशेष रूप से मजबूत।`;
    }
    if (weakest && weakest[1] < 50) {
      return ` ${weakest[0]} में अतिरिक्त अभ्यास से लाभ होगा।`;
    }
    return '';
  }

  // English
  if (strongest && strongest[1] >= 75) {
    return ` Particularly strong in ${strongest[0]}.`;
  }
  if (weakest && weakest[1] < 50) {
    return ` Would benefit from extra practice in ${weakest[0]}.`;
  }
  return '';
}

/**
 * Get encouragement based on trend (if marks show improvement areas)
 */
function getEncouragement(average: number, language: Language): string {
  if (language === 'hindi') {
    if (average >= 90) return ' उत्कृष्ट प्रयास जारी रखें!';
    if (average >= 75) return ' इसी तरह अच्छा काम करते रहें!';
    if (average >= 60) return ' आप और बेहतर कर सकते हैं!';
    return ' हमें आप पर विश्वास है!';
  }

  if (average >= 90) return ' Keep up the excellent work!';
  if (average >= 75) return ' Continue this wonderful progress!';
  if (average >= 60) return ' You have the potential to do even better!';
  return ' We believe in you!';
}

/**
 * Generate humanized remark for a student
 */
export function generateHumanizedRemark(
  student: Student,
  language: Language = 'english'
): string {
  const { subjectMarks, name } = student;
  
  // Calculate average
  const marks = Object.values(subjectMarks || {}).filter(m => m !== undefined && m !== null);
  const average = marks.length > 0 
    ? Math.round(marks.reduce((sum, m) => sum + m, 0) / marks.length)
    : 0;

  // Select appropriate template set
  const templates = language === 'hindi' ? HINDI_TEMPLATES : ENGLISH_TEMPLATES;
  
  // Determine performance level
  let remarkPool: string[];
  if (average >= 90) {
    remarkPool = templates.excellent;
  } else if (average >= 75) {
    remarkPool = templates.veryGood;
  } else if (average >= 60) {
    remarkPool = templates.good;
  } else {
    remarkPool = templates.needsImprovement;
  }

  // Select a random remark (or use deterministic based on student name for consistency)
  const nameHash = (name || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const remarkIndex = nameHash % remarkPool.length;
  let remark = remarkPool[remarkIndex];

  // Add subject-specific observation
  remark += getSubjectObservation(subjectMarks || {}, language);

  // Add encouragement
  remark += getEncouragement(average, language);

  return remark;
}

/**
 * Generate remarks for all students
 */
export function generateAllHumanizedRemarks(
  students: Student[],
  language: Language = 'english'
): Map<string, string> {
  const remarks = new Map<string, string>();
  
  students.forEach(student => {
    if (student.name && student.name.trim()) {
      remarks.set(student.id, generateHumanizedRemark(student, language));
    }
  });

  return remarks;
}
