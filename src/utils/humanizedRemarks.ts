import { Student, Language, getGradeFromPercentage } from '@/types/assessment';

/**
 * =============================================================
 * ENHANCED HUMANIZED REMARKS GENERATOR
 * =============================================================
 * 
 * Generates natural, teacher-like remarks based on student performance.
 * More detailed, expressive, and personalized. Not AI-sounding.
 */

interface RemarkTemplates {
  excellent: string[];  // 90+
  veryGood: string[];   // 75-89
  good: string[];       // 60-74
  needsImprovement: string[];  // <60
}

const ENGLISH_TEMPLATES: RemarkTemplates = {
  excellent: [
    "Shows outstanding knowledge and consistency across all subjects. A sincere learner who puts in admirable effort and demonstrates remarkable academic maturity. Continues to inspire peers with dedication.",
    "An exceptional student with remarkable academic achievements and a keen intellectual curiosity. Demonstrates deep understanding, genuine enthusiasm for learning, and excellent analytical abilities.",
    "Exhibits brilliant performance and maintains exceptionally high standards consistently. A true role model for peers who balances academic excellence with positive classroom participation.",
    "Outstanding work throughout the term! Shows exceptional dedication, thorough preparation, and complete mastery of concepts. Continues to exceed expectations in every assessment.",
    "A brilliant mind with excellent work ethic and commendable discipline. Demonstrates thorough understanding, creative thinking abilities, and consistent pursuit of excellence.",
    "Truly exceptional in academics with remarkable consistency. Shows passionate engagement with learning and sets an inspiring example for the entire class.",
    "An outstanding performer who consistently achieves top results while maintaining humility and helpfulness. A pleasure to teach and guide throughout the academic year.",
    "Demonstrates superior understanding, excellent analytical skills, and mature approach to learning. Sets a great example for the class with both performance and conduct.",
  ],
  veryGood: [
    "Demonstrates strong understanding and a positive attitude toward studies throughout the term. Continues to perform well in most subjects with steady improvement visible.",
    "A diligent student with commendable academic performance and reliable work habits. Shows good grasp of concepts, enthusiasm for learning, and consistent preparation.",
    "Performs consistently well with strong fundamentals across subjects. Has excellent potential to reach even greater heights with continued focused effort.",
    "Shows very good progress and maintains quality work throughout assessments. A reliable and responsible student who can always be counted on for good results.",
    "A capable student with solid academic performance and mature approach to studies. Demonstrates good understanding, regular preparation, and positive learning attitude.",
    "Exhibits very good work quality and increasingly positive learning attitude. Showing steady improvement across subjects with noticeable growth in confidence.",
    "A well-rounded student with strong academic capabilities and balanced approach. Maintains good standards consistently with clear room to grow further.",
    "Demonstrates good command over subjects and sincere approach to studies. Shows improvement with each assessment. Keep up the excellent work!",
  ],
  good: [
    "Shows steady progress throughout the term with visible effort. A little more revision, focused practice, and attention to detail will help achieve even better results.",
    "Making satisfactory progress with room for improvement. Regular practice, attention to weak areas, and consistent study habits will lead to significant improvement.",
    "A sincere student showing consistent effort and positive attitude. With more focused study habits and dedicated practice, can achieve significantly better results.",
    "Demonstrates decent understanding of concepts with genuine interest in learning. Extra attention to challenging subjects will boost overall performance noticeably.",
    "Shows promising potential and genuine effort throughout the term. More practice, regular revision, and seeking help when needed will lead to noticeable improvement.",
    "Making good progress overall with steady work ethic. Focused preparation in specific areas and regular revision will help strengthen performance further.",
    "A capable student who can achieve more with regular study habits and dedicated practice. Keep working on building stronger foundations in all subjects.",
    "Shows reasonable progress with sincere effort. With dedicated effort, consistent practice, and timely completion of work, improvement is definitely within reach.",
  ],
  needsImprovement: [
    "Needs consistent practice and guidance to strengthen fundamentals. Shows potential and willingness to learn. Regular support and encouragement will help build stronger foundations.",
    "Requires more focused attention on basic concepts across subjects. With dedicated practice, parental support, and regular revision, improvement is definitely achievable.",
    "Shows willingness to learn but needs additional support and structured guidance. Regular practice, revision, and one-on-one attention will help build confidence.",
    "Needs to work on fundamental concepts with more dedication and focus. Supportive guidance from teachers and parents will help improve understanding over time.",
    "Requires extra attention and practice in core subjects. With patience, regular effort, and consistent study schedule, progress will definitely come.",
    "Shows effort but needs more consistent study habits and focus. Additional support, regular practice, and positive reinforcement will help strengthen skills.",
    "Needs to focus more on foundational concepts with guided practice. Regular revision, seeking help promptly, and dedicated effort will lead to improvement.",
    "Requires additional support to build stronger foundations. Keep trying, maintain positive attitude, and seek help when concepts seem difficult. We believe in you!",
  ],
};

const HINDI_TEMPLATES: RemarkTemplates = {
  excellent: [
    "सभी विषयों में उत्कृष्ट ज्ञान और निरंतरता दिखाते हैं। एक ईमानदार विद्यार्थी जो प्रशंसनीय प्रयास और उल्लेखनीय शैक्षणिक परिपक्वता प्रदर्शित करते हैं।",
    "उल्लेखनीय शैक्षणिक उपलब्धियों और तीव्र बौद्धिक जिज्ञासा वाले असाधारण छात्र। गहरी समझ, सीखने का उत्साह और उत्कृष्ट विश्लेषणात्मक क्षमता प्रदर्शित करते हैं।",
    "शानदार प्रदर्शन और असाधारण उच्च मानकों को लगातार बनाए रखते हैं। साथियों के लिए एक सच्चे आदर्श हैं जो शैक्षणिक उत्कृष्टता के साथ सकारात्मक भागीदारी रखते हैं।",
    "पूरे सत्र में बेहतरीन काम! असाधारण समर्पण, पूर्ण तैयारी और अवधारणाओं पर पूर्ण महारत दिखाते हैं। हर मूल्यांकन में उम्मीदों से बढ़कर प्रदर्शन करते हैं।",
    "उत्कृष्ट कार्य नीति और सराहनीय अनुशासन के साथ प्रतिभाशाली। गहन समझ, रचनात्मक सोच और उत्कृष्टता की निरंतर खोज प्रदर्शित करते हैं।",
  ],
  veryGood: [
    "पूरे सत्र में मजबूत समझ और पढ़ाई के प्रति सकारात्मक दृष्टिकोण प्रदर्शित करते हैं। अधिकांश विषयों में अच्छा प्रदर्शन जारी है और स्थिर सुधार दिखाई देता है।",
    "सराहनीय शैक्षणिक प्रदर्शन और विश्वसनीय कार्य आदतों वाले मेहनती छात्र। अवधारणाओं की अच्छी समझ, सीखने का उत्साह और निरंतर तैयारी दिखाते हैं।",
    "सभी विषयों में मजबूत बुनियादी बातों के साथ लगातार अच्छा प्रदर्शन। निरंतर केंद्रित प्रयास से और भी ऊंचाई हासिल करने की उत्कृष्ट क्षमता है।",
    "बहुत अच्छी प्रगति और मूल्यांकन में गुणवत्तापूर्ण कार्य बनाए रखते हैं। एक विश्वसनीय और जिम्मेदार छात्र जिनसे हमेशा अच्छे परिणामों की उम्मीद की जा सकती है।",
    "ठोस शैक्षणिक प्रदर्शन और पढ़ाई के प्रति परिपक्व दृष्टिकोण वाले सक्षम छात्र। अच्छी समझ, नियमित तैयारी और सकारात्मक सीखने का रवैया प्रदर्शित करते हैं।",
  ],
  good: [
    "पूरे सत्र में दृश्य प्रयास के साथ स्थिर प्रगति दिखाते हैं। थोड़ा और अभ्यास, केंद्रित तैयारी और विस्तार पर ध्यान बेहतर परिणाम लाएगा।",
    "सुधार की गुंजाइश के साथ संतोषजनक प्रगति कर रहे हैं। नियमित अभ्यास, कमजोर क्षेत्रों पर ध्यान और निरंतर अध्ययन की आदतें महत्वपूर्ण सुधार लाएंगी।",
    "निरंतर प्रयास और सकारात्मक दृष्टिकोण दिखाने वाले ईमानदार छात्र। अधिक केंद्रित अध्ययन की आदतों और समर्पित अभ्यास से काफी बेहतर परिणाम प्राप्त कर सकते हैं।",
    "सीखने में वास्तविक रुचि के साथ अवधारणाओं की अच्छी समझ प्रदर्शित करते हैं। चुनौतीपूर्ण विषयों पर अतिरिक्त ध्यान समग्र प्रदर्शन को उल्लेखनीय रूप से बढ़ाएगा।",
    "पूरे सत्र में आशाजनक क्षमता और वास्तविक प्रयास दिखाते हैं। अधिक अभ्यास, नियमित पुनरावृत्ति और जरूरत पड़ने पर मदद लेने से उल्लेखनीय सुधार होगा।",
  ],
  needsImprovement: [
    "बुनियादी बातों को मजबूत करने के लिए निरंतर अभ्यास और मार्गदर्शन की आवश्यकता है। क्षमता और सीखने की इच्छा दिखाते हैं। नियमित समर्थन और प्रोत्साहन मजबूत नींव बनाने में मदद करेगा।",
    "सभी विषयों में मूल अवधारणाओं पर अधिक केंद्रित ध्यान देने की आवश्यकता है। समर्पित अभ्यास, माता-पिता के समर्थन और नियमित पुनरावृत्ति से सुधार निश्चित रूप से संभव है।",
    "सीखने की इच्छा दिखाते हैं लेकिन अतिरिक्त समर्थन और संरचित मार्गदर्शन की आवश्यकता है। नियमित अभ्यास, पुनरावृत्ति और व्यक्तिगत ध्यान आत्मविश्वास बनाने में मदद करेगी।",
    "अधिक समर्पण और ध्यान के साथ मौलिक अवधारणाओं पर काम करने की आवश्यकता है। शिक्षकों और माता-पिता से सहायक मार्गदर्शन समय के साथ समझ को बेहतर बनाने में मदद करेगा।",
    "मूल विषयों में अतिरिक्त ध्यान और अभ्यास की आवश्यकता है। धैर्य, नियमित प्रयास और निरंतर अध्ययन कार्यक्रम से प्रगति निश्चित रूप से होगी।",
  ],
};

/**
 * Get detailed subject analysis
 */
function getSubjectAnalysis(subjectMarks: Record<string, number>, language: Language): { 
  strengths: string[]; 
  improvements: string[];
  observation: string;
} {
  const subjects = Object.entries(subjectMarks).filter(([_, v]) => v !== undefined && v !== null);
  if (subjects.length === 0) {
    return { strengths: [], improvements: [], observation: '' };
  }

  const sorted = subjects.sort((a, b) => b[1] - a[1]);
  const strengths: string[] = [];
  const improvements: string[] = [];
  
  // Top performers (>= 75)
  sorted.forEach(([subject, marks]) => {
    if (marks >= 75) strengths.push(subject);
    else if (marks < 50) improvements.push(subject);
  });

  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];
  let observation = '';

  if (language === 'hindi') {
    if (strengths.length >= 2) {
      observation = ` ${strengths.slice(0, 2).join(' और ')} में विशेष रूप से उत्कृष्ट।`;
    } else if (strongest && strongest[1] >= 75) {
      observation = ` ${strongest[0]} में विशेष रूप से मजबूत।`;
    }
    if (improvements.length > 0 && improvements.length <= 2) {
      observation += ` ${improvements.join(' और ')} में अतिरिक्त अभ्यास से लाभ होगा।`;
    }
  } else {
    if (strengths.length >= 2) {
      observation = ` Excels particularly in ${strengths.slice(0, 2).join(' and ')}.`;
    } else if (strongest && strongest[1] >= 75) {
      observation = ` Particularly strong in ${strongest[0]}.`;
    }
    if (improvements.length > 0 && improvements.length <= 2) {
      observation += ` Would benefit from extra practice in ${improvements.join(' and ')}.`;
    }
  }

  return { strengths, improvements, observation };
}

/**
 * Get consistency observation
 */
function getConsistencyNote(subjectMarks: Record<string, number>, language: Language): string {
  const marks = Object.values(subjectMarks).filter(m => m !== undefined && m !== null);
  if (marks.length < 2) return '';

  const min = Math.min(...marks);
  const max = Math.max(...marks);
  const range = max - min;

  if (range <= 10) {
    return language === 'hindi' 
      ? ' सभी विषयों में उल्लेखनीय निरंतरता दिखाते हैं।'
      : ' Shows remarkable consistency across all subjects.';
  }
  if (range >= 40) {
    return language === 'hindi'
      ? ' कुछ विषयों में असमान प्रदर्शन जिस पर ध्यान देने की जरूरत है।'
      : ' Performance varies across subjects - focused attention needed in weaker areas.';
  }
  return '';
}

/**
 * Get effort and attitude note
 */
function getEffortNote(average: number, language: Language): string {
  if (language === 'hindi') {
    if (average >= 90) return ' उत्कृष्ट प्रयास और समर्पण जारी रखें!';
    if (average >= 75) return ' इसी तरह अच्छा काम करते रहें। आप सही दिशा में हैं!';
    if (average >= 60) return ' आप और बेहतर कर सकते हैं। थोड़ा और प्रयास सफलता लाएगा!';
    return ' हमें आप पर विश्वास है। लगातार प्रयास से सुधार होगा!';
  }

  if (average >= 90) return ' Keep up the excellent effort and dedication!';
  if (average >= 75) return ' Continue this wonderful progress. You are on the right track!';
  if (average >= 60) return ' You have the potential to do even better. A little more effort will bring success!';
  return ' We believe in you. Consistent effort will lead to improvement!';
}

/**
 * Generate enhanced humanized remark for a student
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

  // Select a remark deterministically based on student name for consistency
  const nameHash = (name || '').split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const remarkIndex = nameHash % remarkPool.length;
  let remark = remarkPool[remarkIndex];

  // Add subject analysis
  const { observation } = getSubjectAnalysis(subjectMarks || {}, language);
  remark += observation;

  // Add consistency note for students with multiple subjects
  if (Object.keys(subjectMarks || {}).length >= 3) {
    remark += getConsistencyNote(subjectMarks || {}, language);
  }

  // Add effort note
  remark += getEffortNote(average, language);

  return remark;
}

/**
 * Generate detailed analysis for strengths, weaknesses, and next steps
 */
export function generateDetailedAnalysis(
  student: Student,
  language: Language,
  selectedSubjects: string[]
): { strengths: string[]; improvements: string[]; nextSteps: string[] } {
  const marks = student.subjectMarks || {};
  const { strengths: strongSubjects, improvements: weakSubjects } = getSubjectAnalysis(marks, language);
  
  const strengths: string[] = [];
  const improvements: string[] = [];
  const nextSteps: string[] = [];
  
  // English responses
  if (language !== 'hindi') {
    strongSubjects.forEach(subj => strengths.push(`Strong in ${subj}`));
    weakSubjects.forEach(subj => improvements.push(`Needs work in ${subj}`));
    
    if (student.percentage >= 75) {
      strengths.push('Consistent performer');
      nextSteps.push('Challenge with advanced problems');
    } else if (student.percentage >= 50) {
      nextSteps.push('Practice regularly');
      nextSteps.push('Focus on weak areas');
    } else {
      nextSteps.push('Need extra support');
      nextSteps.push('Daily revision recommended');
    }
  } else {
    strongSubjects.forEach(subj => strengths.push(`${subj} में मजबूत`));
    weakSubjects.forEach(subj => improvements.push(`${subj} में सुधार जरूरी`));
    
    if (student.percentage >= 75) {
      strengths.push('निरंतर प्रदर्शनकर्ता');
      nextSteps.push('उन्नत समस्याओं के साथ चुनौती दें');
    } else if (student.percentage >= 50) {
      nextSteps.push('नियमित अभ्यास करें');
      nextSteps.push('कमजोर क्षेत्रों पर ध्यान दें');
    } else {
      nextSteps.push('अतिरिक्त सहायता की जरूरत');
      nextSteps.push('दैनिक पुनरावृत्ति की सिफारिश');
    }
  }
  
  return { strengths, improvements, nextSteps };
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
