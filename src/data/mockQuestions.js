// src/data/mockQuestions.js
import details from './questions/details.json';
import crossText from './questions/crossText.json';
import inference from './questions/inference.json';
import grammar from './questions/grammar.json';
import transition from './questions/transition.json';
import commandOfEvidence from './questions/commandOfEvidence.json';
import wordInContext from './questions/wordInContext.json';
import vocabulary from './questions/vocabulary.json';

// Tự động gộp tất cả các chuyên đề thành một mảng duy nhất
const allQuestions = [
  ...details,
  ...crossText,
  ...inference,
  ...grammar,
  ...transition,
  ...commandOfEvidence,
  ...wordInContext,
  ...vocabulary
];

export default allQuestions;