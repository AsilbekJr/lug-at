const fs = require('fs');
const path = require('path');

const curriculumDir = path.join(__dirname, '../content/curriculum');
const curriculumFiles = fs.readdirSync(curriculumDir).filter((f) => f.endsWith('.js')).sort();

const allTopics = [];

for (const file of curriculumFiles) {
  const filePath = path.join(curriculumDir, file);
  try {
    const raw = require(filePath);
    if (Array.isArray(raw)) {
      for (const t of raw) {
        allTopics.push({
          id: `curr-${t.day}`,
          day: t.day,
          cefr: t.cefr,
          emoji: t.emoji || '📚',
          topic: t.topic,
          topicUz: t.topicUz,
          description: t.description || '',
          grammarFocus: t.grammarFocus || null,
          words: (t.words || []).map((w) => {
            if (Array.isArray(w)) {
              return {
                word: w[0],
                translation: w[1],
                phonetic: w[2],
                partOfSpeech: w[3],
                definition: w[4],
                example: w[5],
                exampleUz: w[6],
                cefr: w[7] || t.cefr,
                collocations: Array.isArray(w[8]) ? w[8] : [],
              };
            }
            return w;
          }),
        });
      }
    }
  } catch (err) {
    console.error(`Error loading ${file}:`, err.message);
  }
}

// Also load vocab topics from elementary, upper-intermediate, advanced
const vocabDir = path.join(__dirname, '../content/vocab-topics');
const vocabLevels = [];

try {
  const elem = require(path.join(vocabDir, 'elementary.js'));
  vocabLevels.push(elem);
} catch (e) {
  console.warn('elementary.js load error:', e.message);
}

try {
  const upper = require(path.join(vocabDir, 'upper-intermediate.js'));
  vocabLevels.push(upper);
} catch (e) {
  console.warn('upper-intermediate.js load error:', e.message);
}

try {
  const adv = require(path.join(vocabDir, 'advanced.js'));
  vocabLevels.push(adv);
} catch (e) {
  console.warn('advanced.js load error:', e.message);
}

const vocabTopics = [];
for (const lvl of vocabLevels) {
  if (lvl && Array.isArray(lvl.topics)) {
    for (const t of lvl.topics) {
      vocabTopics.push({
        id: `topic-${lvl.key}-${t.unit}`,
        levelKey: lvl.key,
        levelTitleUz: lvl.titleUz,
        cefr: lvl.cefr,
        unit: t.unit,
        title: t.title,
        titleUz: t.titleUz,
        emoji: t.emoji || '📖',
        words: (t.words || []).map((w) => {
          if (Array.isArray(w)) {
            return {
              word: w[0],
              partOfSpeech: w[1],
              translation: w[2],
              example: w[3],
              exampleUz: w[4],
              cefr: lvl.cefr,
              collocations: [],
            };
          }
          return w;
        }),
      });
    }
  }
}

const outDir = path.join(__dirname, '../src/data/curriculum');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

fs.writeFileSync(
  path.join(outDir, 'curriculum.json'),
  JSON.stringify({ curriculum: allTopics, vocabTopics }, null, 2),
  'utf-8'
);

console.log(`Successfully built curriculum.json: ${allTopics.length} curriculum days, ${vocabTopics.length} thematic units!`);
