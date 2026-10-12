/**
 * Phonetic & Lexical correction for common speech-to-text slips in Uzbek & English
 * E.g., "sobuq" -> "sovuq", "navo issiq" -> "havo issiq"
 */

// Common phonetic speech errors in Uzbek -> Correct literary form
const PHONETIC_REPLACEMENTS: [RegExp, string][] = [
  // "sobuq" / "sovuq" (Whisper / STT b <-> v slip)
  [/\bsobuq\b/gi, 'sovuq'],
  [/\bsobuqroq\b/gi, 'sovuqroq'],
  [/\bsobuqda\b/gi, 'sovuqda'],
  [/\bsobuqdan\b/gi, 'sovuqdan'],

  // "navo" -> "havo" (when talking about weather / air / climate)
  [/\bnavo(?=\s+(issiq|sovuq|yaxshi|yomon|ochiq|bulutli|harorati|nam|quruq))\b/gi, 'havo'],
  [/\b(bugungi|ertangi|toza|ochiq|judayam|juda)\s+navo\b/gi, '$1 havo'],
  [/\bnavo\s+issiq\b/gi, 'havo issiq'],
  [/\bnavo\s+sovuq\b/gi, 'havo sovuq'],
  [/\bnavo\s+judayam\b/gi, 'havo judayam'],
  [/\bnavo\s+juda\b/gi, 'havo juda'],
  
  // "judayam" / "juda"
  [/\bjudayam\b/gi, 'judayam'],

  // "issiq" slips
  [/\besiq\b/gi, 'issiq'],
  [/\bisiq\b/gi, 'issiq'],

  // "solom" / "salom"
  [/\bsolom\b/gi, 'salom'],
  
  // "rahmat"
  [/\braxmat\b/gi, 'rahmat'],
  
  // "sabr"
  [/\bsobr\b/gi, 'sabr'],
  
  // "ertalab"
  [/\bertalabki\b/gi, 'ertalabki'],
  
  // "o'rganmoq"
  [/\borganmoq\b/gi, 'o‘rganmoq'],
  [/\borganyapman\b/gi, 'o‘rganyapman'],
  
  // "kitob"
  [/\bketob\b/gi, 'kitob'],
  
  // "maktab"
  [/\bmextab\b/gi, 'maktab'],
  
  // "yuguraman"
  [/\byugiraman\b/gi, 'yuguraman'],
  
  // "yaxshi"
  [/\byaxwi\b/gi, 'yaxshi'],
  [/\byashi\b/gi, 'yaxshi'],
];

export function cleanSpokenTranscript(raw: string): string {
  let cleaned = raw.trim();

  // Remove excessive punctuation from ends
  cleaned = cleaned.replace(/^[.,;:!?"'\s]+|[.,;:!?"'\s]+$/g, '');

  // Apply phonetic corrections
  for (const [pattern, replacement] of PHONETIC_REPLACEMENTS) {
    cleaned = cleaned.replace(pattern, replacement);
  }

  return cleaned;
}
