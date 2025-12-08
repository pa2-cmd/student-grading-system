import { Student, SKILL_VALUES, LANGUAGES, Language, getMoodFromPerformance, getGradeFromPercentage, CommentTone } from '@/types/assessment';

interface RemarkGeneratorParams {
  student: Student;
  language: Language;
  selectedSubjects: string[];
  teacherNotes?: string;
  tone?: CommentTone;
}

// ============================================
// HUMANIZED PHRASE TEMPLATES BY TONE
// Warm, encouraging, teacher-like language
// ============================================

const TONE_TEMPLATES = {
  english: {
    encouraging: {
      opening: {
        excellent: [
          "is truly exceptional and continues to inspire everyone",
          "has shown remarkable dedication and brilliance",
          "is a shining star who lights up our classroom",
          "has exceeded all expectations magnificently",
        ],
        good: [
          "is making wonderful progress every single day",
          "shows great enthusiasm and love for learning",
          "brings positive energy and joy to every class",
          "is on a fantastic and rewarding learning journey",
        ],
        average: [
          "is growing stronger and more confident each day",
          "shows promising potential that we're excited to nurture",
          "is building a solid foundation for future success",
          "is making meaningful progress step by step",
        ],
        needsSupport: [
          "is discovering their unique strengths with our support",
          "shows wonderful resilience and determination",
          "is on their own special path to success",
          "continues to try with heart and courage",
        ],
      },
      closing: [
        "We believe in you wholeheartedly!",
        "Keep up the wonderful work!",
        "The future is bright and full of possibilities!",
        "You make us incredibly proud!",
        "Every step forward counts!",
      ],
    },
    formal: {
      opening: {
        excellent: [
          "has demonstrated exceptional academic performance",
          "exhibits outstanding proficiency across subjects",
          "maintains consistently high academic standards",
          "has achieved commendable results this term",
        ],
        good: [
          "has shown satisfactory progress in academics",
          "demonstrates good understanding of curriculum",
          "maintains steady academic performance",
          "exhibits consistent effort in studies",
        ],
        average: [
          "is progressing at an acceptable pace",
          "shows adequate grasp of fundamental concepts",
          "demonstrates room for improvement",
          "maintains baseline academic performance",
        ],
        needsSupport: [
          "requires additional academic support",
          "would benefit from focused remedial attention",
          "needs structured guidance to improve",
          "shows areas requiring immediate attention",
        ],
      },
      closing: [
        "Continued effort is recommended.",
        "We encourage sustained academic focus.",
        "Regular practice will yield improvement.",
        "Consistent effort will lead to progress.",
      ],
    },
    warm: {
      opening: {
        excellent: [
          "has been absolutely wonderful this term",
          "brings such joy and brilliance to our class",
          "is a treasure we're so grateful to teach",
          "has blossomed beautifully in every way",
        ],
        good: [
          "continues to grow in such lovely ways",
          "brings warmth and positivity to learning",
          "is developing beautifully day by day",
          "makes learning such a pleasant experience",
        ],
        average: [
          "is finding their rhythm and we're cheering them on",
          "is blossoming at their own beautiful pace",
          "is learning and growing every single day",
          "brings their own special light to class",
        ],
        needsSupport: [
          "is cherished and supported in their journey",
          "is surrounded by care as they learn and grow",
          "is valued and encouraged every step of the way",
          "has our full support and belief in them",
        ],
      },
      closing: [
        "We care about you deeply!",
        "You're special to us!",
        "Keep shining, dear one!",
        "We're here for you always!",
      ],
    },
    strict: {
      opening: {
        excellent: [
          "has met the high standards expected",
          "has performed at the required level of excellence",
          "demonstrates the discipline needed for success",
          "shows the commitment expected of top students",
        ],
        good: [
          "has shown acceptable academic progress",
          "meets expectations in most areas",
          "demonstrates adequate effort",
          "shows reasonable application to studies",
        ],
        average: [
          "needs to increase effort and focus",
          "must work harder to meet expectations",
          "requires more discipline and dedication",
          "should prioritize academic improvement",
        ],
        needsSupport: [
          "must urgently address academic weaknesses",
          "requires immediate intervention and effort",
          "needs to take studies more seriously",
          "must commit to significant improvement",
        ],
      },
      closing: [
        "Increased effort is expected.",
        "Higher standards must be maintained.",
        "Improvement is mandatory.",
        "More dedication is required.",
      ],
    },
    balanced: {
      opening: {
        excellent: [
          "has achieved excellent results through hard work",
          "demonstrates both talent and dedication",
          "shows admirable academic performance",
          "has earned recognition for outstanding effort",
        ],
        good: [
          "shows good progress with room to grow further",
          "demonstrates solid understanding and effort",
          "is performing well and can achieve even more",
          "balances strengths while working on improvements",
        ],
        average: [
          "is making steady progress with clear areas to develop",
          "shows understanding but needs more practice",
          "demonstrates potential that requires nurturing",
          "is building skills while addressing gaps",
        ],
        needsSupport: [
          "faces challenges but shows willingness to improve",
          "needs support in key areas while building on strengths",
          "requires focused attention to develop skills",
          "is working to overcome current difficulties",
        ],
      },
      closing: [
        "Keep working and growing!",
        "Progress comes with consistent effort!",
        "Every improvement matters!",
        "Stay focused and keep learning!",
      ],
    },
  },
  hindi: {
    encouraging: {
      opening: {
        excellent: [
          "वास्तव में असाधारण है और सभी को प्रेरित करते हैं",
          "उल्लेखनीय समर्पण और प्रतिभा दिखाई है",
          "हमारी कक्षा के चमकते सितारे हैं",
          "सभी उम्मीदों से बढ़कर प्रदर्शन किया है",
        ],
        good: [
          "हर दिन अद्भुत प्रगति कर रहे हैं",
          "सीखने के प्रति बहुत उत्साह दिखाते हैं",
          "हर कक्षा में सकारात्मक ऊर्जा लाते हैं",
          "शानदार सीखने की यात्रा पर हैं",
        ],
        average: [
          "हर दिन और मजबूत हो रहे हैं",
          "आशाजनक क्षमता दिखाते हैं",
          "मजबूत नींव बना रहे हैं",
          "सार्थक प्रगति कर रहे हैं",
        ],
        needsSupport: [
          "अपनी अनूठी ताकत खोज रहे हैं",
          "अद्भुत दृढ़ता दिखाते हैं",
          "अपने विशेष मार्ग पर हैं",
          "दिल से प्रयास करते रहते हैं",
        ],
      },
      closing: [
        "हमें तुम पर पूरा विश्वास है!",
        "इसी तरह शानदार काम करते रहो!",
        "भविष्य उज्ज्वल है!",
        "तुम हमें गर्वित करते हो!",
      ],
    },
    formal: {
      opening: {
        excellent: [
          "ने उत्कृष्ट शैक्षणिक प्रदर्शन दिखाया है",
          "सभी विषयों में उत्कृष्ट दक्षता प्रदर्शित करते हैं",
          "लगातार उच्च शैक्षणिक मानक बनाए रखते हैं",
          "इस सत्र में सराहनीय परिणाम प्राप्त किए हैं",
        ],
        good: [
          "ने शिक्षा में संतोषजनक प्रगति दिखाई है",
          "पाठ्यक्रम की अच्छी समझ प्रदर्शित करते हैं",
          "स्थिर शैक्षणिक प्रदर्शन बनाए रखते हैं",
          "अध्ययन में निरंतर प्रयास करते हैं",
        ],
        average: [
          "स्वीकार्य गति से प्रगति कर रहे हैं",
          "मूल अवधारणाओं की पर्याप्त समझ दिखाते हैं",
          "सुधार की गुंजाइश है",
          "आधारभूत शैक्षणिक प्रदर्शन बनाए रखते हैं",
        ],
        needsSupport: [
          "अतिरिक्त शैक्षणिक सहायता की आवश्यकता है",
          "केंद्रित उपचारात्मक ध्यान से लाभ होगा",
          "सुधार के लिए संरचित मार्गदर्शन की आवश्यकता है",
          "तत्काल ध्यान देने वाले क्षेत्र हैं",
        ],
      },
      closing: [
        "निरंतर प्रयास की सिफारिश की जाती है।",
        "सतत शैक्षणिक ध्यान प्रोत्साहित है।",
        "नियमित अभ्यास से सुधार होगा।",
        "लगातार प्रयास से प्रगति होगी।",
      ],
    },
    warm: {
      opening: {
        excellent: [
          "इस सत्र में बिल्कुल अद्भुत रहे हैं",
          "हमारी कक्षा में खुशी और प्रतिभा लाते हैं",
          "एक खजाना हैं जिन्हें पढ़ाना हमारा सौभाग्य है",
          "हर तरह से खूबसूरती से खिले हैं",
        ],
        good: [
          "बहुत प्यारे तरीकों से बढ़ते जा रहे हैं",
          "सीखने में गर्मजोशी और सकारात्मकता लाते हैं",
          "दिन-ब-दिन खूबसूरती से विकसित हो रहे हैं",
          "सीखने को एक सुखद अनुभव बनाते हैं",
        ],
        average: [
          "अपनी लय ढूंढ रहे हैं और हम उनका साथ दे रहे हैं",
          "अपनी सुंदर गति से खिल रहे हैं",
          "हर दिन सीख रहे और बढ़ रहे हैं",
          "कक्षा में अपनी खास रोशनी लाते हैं",
        ],
        needsSupport: [
          "अपनी यात्रा में प्यार और समर्थन पा रहे हैं",
          "सीखते और बढ़ते हुए देखभाल से घिरे हैं",
          "हर कदम पर सराहे और प्रोत्साहित किए जाते हैं",
          "हमारा पूरा समर्थन और विश्वास उनके साथ है",
        ],
      },
      closing: [
        "हम तुम्हारी बहुत परवाह करते हैं!",
        "तुम हमारे लिए खास हो!",
        "चमकते रहो, प्यारे!",
        "हम हमेशा तुम्हारे साथ हैं!",
      ],
    },
    strict: {
      opening: {
        excellent: [
          "ने अपेक्षित उच्च मानकों को पूरा किया है",
          "आवश्यक उत्कृष्टता के स्तर पर प्रदर्शन किया है",
          "सफलता के लिए जरूरी अनुशासन दिखाते हैं",
          "शीर्ष छात्रों से अपेक्षित प्रतिबद्धता दिखाते हैं",
        ],
        good: [
          "ने स्वीकार्य शैक्षणिक प्रगति दिखाई है",
          "अधिकांश क्षेत्रों में अपेक्षाओं को पूरा करते हैं",
          "पर्याप्त प्रयास प्रदर्शित करते हैं",
          "अध्ययन में उचित लगन दिखाते हैं",
        ],
        average: [
          "प्रयास और ध्यान बढ़ाने की जरूरत है",
          "अपेक्षाओं को पूरा करने के लिए कड़ी मेहनत करनी होगी",
          "अधिक अनुशासन और समर्पण की आवश्यकता है",
          "शैक्षणिक सुधार को प्राथमिकता देनी चाहिए",
        ],
        needsSupport: [
          "शैक्षणिक कमजोरियों को तत्काल दूर करना होगा",
          "तत्काल हस्तक्षेप और प्रयास की आवश्यकता है",
          "पढ़ाई को अधिक गंभीरता से लेना होगा",
          "महत्वपूर्ण सुधार के लिए प्रतिबद्ध होना होगा",
        ],
      },
      closing: [
        "बढ़े हुए प्रयास की अपेक्षा है।",
        "उच्च मानक बनाए रखने होंगे।",
        "सुधार अनिवार्य है।",
        "अधिक समर्पण की आवश्यकता है।",
      ],
    },
    balanced: {
      opening: {
        excellent: [
          "ने कड़ी मेहनत से उत्कृष्ट परिणाम हासिल किए हैं",
          "प्रतिभा और समर्पण दोनों दिखाते हैं",
          "सराहनीय शैक्षणिक प्रदर्शन दिखाते हैं",
          "ने उत्कृष्ट प्रयास के लिए पहचान अर्जित की है",
        ],
        good: [
          "अच्छी प्रगति दिखाते हैं और आगे बढ़ सकते हैं",
          "ठोस समझ और प्रयास प्रदर्शित करते हैं",
          "अच्छा प्रदर्शन कर रहे हैं और और भी हासिल कर सकते हैं",
          "ताकत और सुधार में संतुलन बनाते हैं",
        ],
        average: [
          "स्थिर प्रगति कर रहे हैं और विकास के क्षेत्र हैं",
          "समझ दिखाते हैं लेकिन अधिक अभ्यास चाहिए",
          "क्षमता प्रदर्शित करते हैं जिसे पोषित करना है",
          "कौशल निर्माण करते हुए कमियों को दूर कर रहे हैं",
        ],
        needsSupport: [
          "चुनौतियों का सामना करते हैं लेकिन सुधार की इच्छा दिखाते हैं",
          "ताकत बनाते हुए प्रमुख क्षेत्रों में समर्थन चाहिए",
          "कौशल विकसित करने के लिए केंद्रित ध्यान चाहिए",
          "वर्तमान कठिनाइयों को दूर करने के लिए काम कर रहे हैं",
        ],
      },
      closing: [
        "काम और विकास जारी रखो!",
        "प्रगति निरंतर प्रयास से आती है!",
        "हर सुधार मायने रखता है!",
        "केंद्रित रहो और सीखते रहो!",
      ],
    },
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

export async function generateRemark({ 
  student, 
  language, 
  selectedSubjects, 
  teacherNotes,
  tone = 'encouraging' 
}: RemarkGeneratorParams): Promise<string> {
  // Simulate processing time for natural feel
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
  
  return generateHumanizedRemark(student, language, selectedSubjects, teacherNotes, tone);
}

function generateHumanizedRemark(
  student: Student,
  language: Language,
  selectedSubjects: string[],
  teacherNotes?: string,
  tone: CommentTone = 'encouraging'
): string {
  // Use English or Hindi templates (fallback to English for other languages)
  const langKey = language === 'hindi' ? 'hindi' : 'english';
  const toneTemplates = TONE_TEMPLATES[langKey][tone] || TONE_TEMPLATES[langKey].encouraging;
  
  const studentName = student.name || (language === 'hindi' ? 'छात्र' : 'The student');
  const remarkParts: string[] = [];
  
  // Calculate performance level
  const percentage = student.percentage || 0;
  
  // Get performance category
  let performanceCategory: 'excellent' | 'good' | 'average' | 'needsSupport';
  if (percentage >= 85) {
    performanceCategory = 'excellent';
  } else if (percentage >= 70) {
    performanceCategory = 'good';
  } else if (percentage >= 50) {
    performanceCategory = 'average';
  } else {
    performanceCategory = 'needsSupport';
  }
  
  // Opening based on overall performance and tone
  const openingPhrases = toneTemplates.opening[performanceCategory];
  remarkParts.push(`${studentName} ${getRandomItem(openingPhrases)}.`);
  
  // Identify strengths (subjects with 75%+ marks)
  const strengths = selectedSubjects.filter(subject => 
    (student.subjectMarks?.[subject] || 0) >= 75
  );
  
  if (strengths.length > 0) {
    const strengthSubjects = strengths.slice(0, 2).map(s => getSubjectDisplayName(s, language));
    const strengthList = strengthSubjects.join(language === 'hindi' ? ' और ' : ' and ');
    
    if (language === 'hindi') {
      remarkParts.push(`${strengthList} में उत्कृष्ट प्रदर्शन सराहनीय है।`);
    } else {
      remarkParts.push(`Their performance in ${strengthList} is commendable.`);
    }
  }
  
  // Identify areas for improvement (subjects below 50%)
  const improvements = selectedSubjects.filter(subject => 
    (student.subjectMarks?.[subject] || 0) < 50
  );
  
  if (improvements.length > 0 && improvements.length <= 2) {
    const improvementSubjects = improvements.map(s => getSubjectDisplayName(s, language));
    const improvementList = improvementSubjects.join(language === 'hindi' ? ' और ' : ' and ');
    
    if (language === 'hindi') {
      if (tone === 'strict') {
        remarkParts.push(`${improvementList} में तत्काल सुधार आवश्यक है।`);
      } else {
        remarkParts.push(`${improvementList} में थोड़े और अभ्यास से और भी प्रगति होगी।`);
      }
    } else {
      if (tone === 'strict') {
        remarkParts.push(`Immediate improvement is required in ${improvementList}.`);
      } else {
        remarkParts.push(`With a little more practice in ${improvementList}, they will flourish even more.`);
      }
    }
  }
  
  // Attendance note (if available)
  if (student.attendancePercentage > 0) {
    if (student.attendancePercentage >= 90) {
      remarkParts.push(language === 'hindi' 
        ? 'उत्कृष्ट उपस्थिति सीखने के प्रति प्रतिबद्धता दर्शाती है।'
        : 'Excellent attendance demonstrates commitment to learning.');
    } else if (student.attendancePercentage >= 75) {
      remarkParts.push(language === 'hindi' 
        ? 'नियमित उपस्थिति से और अधिक लाभ होगा।'
        : 'Regular attendance will maximize learning opportunities.');
    } else if (tone === 'strict') {
      remarkParts.push(language === 'hindi' 
        ? 'उपस्थिति में तत्काल सुधार आवश्यक है।'
        : 'Attendance requires immediate improvement.');
    }
  }
  
  // Include teacher's custom notes if provided
  if (teacherNotes || student.teacherNotes) {
    const notes = teacherNotes || student.teacherNotes;
    remarkParts.push(notes);
  }
  
  // Warm closing based on tone
  remarkParts.push(getRandomItem(toneTemplates.closing));
  
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
  if (student.attendancePercentage < 80 && student.attendancePercentage > 0) {
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
