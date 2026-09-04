// ═══════════════════════════════════════════════════════
// MARATHI UTILITIES: Numeral Conversion & Phonetic Transliteration
// ═══════════════════════════════════════════════════════

const DEV_DIGITS = ['\u0966', '\u0967', '\u0968', '\u0969', '\u096A', '\u096B', '\u096C', '\u096D', '\u096E', '\u096F'];

/**
 * Convert any string or number to Marathi Devanagari digits (0-9 -> ०-९)
 */
export function toMarathiDigits(val) {
  if (val == null || val === '') return '';
  const str = String(val);
  return str.replace(/[0-9]/g, (d) => DEV_DIGITS[Number(d)] || d);
}

/**
 * Convert any Marathi Devanagari digits to standard English digits (०-९ -> 0-9)
 */
export function toEnglishDigits(val) {
  if (val == null || val === '') return '';
  const str = String(val);
  return str.replace(/[\u0966-\u096F]/g, (d) => {
    const idx = DEV_DIGITS.indexOf(d);
    return idx >= 0 ? String(idx) : d;
  });
}

/**
 * Format numbers according to active language
 */
export function formatNumberByLang(val, lang = 'mr') {
  if (val == null || val === '') return '';
  if (lang === 'mr') {
    return toMarathiDigits(val);
  }
  return toEnglishDigits(val);
}

// ─── PHONETIC TRANSLITERATION DICTIONARY & ENGINE ───
const COMMON_NAMES_MAP = {
  'omkar': 'ओमकार',
  'om': 'ओम',
  'more': 'मोरे',
  'abasaheb': 'आबासाहेब',
  'aba': 'आबा',
  'sakshi': 'साक्षी',
  'ganesh': 'गणेश',
  'gavkar': 'गावकर',
  'gaokar': 'गावकर',
  'gaonkar': 'गावकर',
  'sangeeta': 'संगीता',
  'sangita': 'संगीता',
  'nitin': 'नितीन',
  'prashant': 'प्रशांत',
  'sachin': 'सचिन',
  'vikas': 'विकास',
  'sunil': 'सुनील',
  'amit': 'अमित',
  'rahul': 'राहुल',
  'ramesh': 'रमेश',
  'suresh': 'सुरेश',
  'mahesh': 'महेश',
  'santosh': 'संतोष',
  'anand': 'आनंद',
  'vijay': 'विजय',
  'ajay': 'अजय',
  'sanjay': 'संजय',
  'ashok': 'अशोक',
  'deepak': 'दीपक',
  'dipak': 'दीपक',
  'dilip': 'दिलीप',
  'pravin': 'प्रवीण',
  'pradeep': 'प्रदीप',
  'rajesh': 'राजेश',
  'dattatray': 'दत्तात्रय',
  'datta': 'दत्त',
  'gurudev': 'गुरुदेव',
  'shree': 'श्री',
  'shri': 'श्री',
  'patil': 'पाटील',
  'deshmukh': 'देशमुख',
  'kadam': 'कदम',
  'shinde': 'शिंदे',
  'jadhav': 'जाधव',
  'pawar': 'पवार',
  'chavan': 'चव्हाण',
  'sawant': 'सावंत',
  'joshi': 'जोशी',
  'kulkarni': 'कुलकर्णी',
  'bhosale': 'भोसले',
  'bhise': 'भिसे',
  'ghadge': 'घाडगे',
  'salunkhe': 'साळुंखे',
  'ingale': 'इंगळे',
  'nikam': 'निकम',
  'mane': 'माने',
  'salve': 'साळवे',
  'shelar': 'शेलार',
  'gharge': 'घारगे',
};

const PHONETIC_CONSONANTS = [
  { en: 'shh', mr: 'ष्' },
  { en: 'chh', mr: 'छ' },
  { en: 'kh', mr: 'ख' },
  { en: 'gh', mr: 'घ' },
  { en: 'ch', mr: 'च' },
  { en: 'jh', mr: 'झ' },
  { en: 'th', mr: 'थ' },
  { en: 'dh', mr: 'ध' },
  { en: 'ph', mr: 'फ' },
  { en: 'bh', mr: 'भ' },
  { en: 'sh', mr: 'श' },
  { en: 'gn', mr: 'ज्ञ' },
  { en: 'dny', mr: 'ज्ञ' },
  { en: 'tr', mr: 'त्र' },
  { en: 'shr', mr: 'श्र' },
  { en: 'k', mr: 'क' },
  { en: 'g', mr: 'ग' },
  { en: 'c', mr: 'क' },
  { en: 'j', mr: 'ज' },
  { en: 't', mr: 'त' },
  { en: 'd', mr: 'द' },
  { en: 'n', mr: 'न' },
  { en: 'p', mr: 'प' },
  { en: 'f', mr: 'फ' },
  { en: 'b', mr: 'ब' },
  { en: 'm', mr: 'म' },
  { en: 'y', mr: 'य' },
  { en: 'r', mr: 'र' },
  { en: 'l', mr: 'ल' },
  { en: 'v', mr: 'व' },
  { en: 'w', mr: 'व' },
  { en: 's', mr: 'स' },
  { en: 'h', mr: 'ह' },
];

const PHONETIC_VOWELS = [
  { en: 'aa', matra: 'ा', initial: 'आ' },
  { en: 'ee', matra: 'ी', initial: 'ई' },
  { en: 'oo', matra: 'ू', initial: 'ऊ' },
  { en: 'ai', matra: 'ै', initial: 'ऐ' },
  { en: 'au', matra: 'ौ', initial: 'औ' },
  { en: 'ou', matra: 'ौ', initial: 'औ' },
  { en: 'a', matra: '', initial: 'अ' },
  { en: 'i', matra: 'ि', initial: 'इ' },
  { en: 'u', matra: 'ु', initial: 'उ' },
  { en: 'e', matra: 'े', initial: 'ए' },
  { en: 'o', matra: 'ो', initial: 'ओ' },
];

/**
 * Phonetically transliterates a single English word into Marathi
 */
function transliterateWord(word) {
  if (!word) return '';
  const lower = word.toLowerCase().trim();
  
  // 1. Check direct dictionary
  if (COMMON_NAMES_MAP[lower]) {
    return COMMON_NAMES_MAP[lower];
  }

  // 2. Transliterate syllable-by-syllable
  let res = '';
  let i = 0;
  let prevWasConsonant = false;

  while (i < lower.length) {
    let matchedConsonant = null;
    for (const c of PHONETIC_CONSONANTS) {
      if (lower.startsWith(c.en, i)) {
        matchedConsonant = c;
        break;
      }
    }

    if (matchedConsonant) {
      res += matchedConsonant.mr;
      i += matchedConsonant.en.length;
      prevWasConsonant = true;
      continue;
    }

    let matchedVowel = null;
    for (const v of PHONETIC_VOWELS) {
      if (lower.startsWith(v.en, i)) {
        matchedVowel = v;
        break;
      }
    }

    if (matchedVowel) {
      if (prevWasConsonant) {
        res += matchedVowel.matra;
      } else {
        res += matchedVowel.initial;
      }
      i += matchedVowel.en.length;
      prevWasConsonant = false;
      continue;
    }

    res += lower[i];
    i++;
    prevWasConsonant = false;
  }

  return res;
}

/**
 * Convert full name or text from English to Marathi phonetically
 */
export function transliterateToMarathi(text) {
  if (!text || !text.trim()) return text;
  if (/[\u0900-\u097F]/.test(text) && !/[a-zA-Z]/.test(text)) {
    return text;
  }

  const words = text.split(/\s+/);
  const converted = words.map(w => {
    if (!/[a-zA-Z]/.test(w)) return w;
    return transliterateWord(w);
  });

  return converted.join(' ');
}

export default {
  toMarathiDigits,
  toEnglishDigits,
  formatNumberByLang,
  transliterateToMarathi,
};
