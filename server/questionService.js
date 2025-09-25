import { questions } from "./questions.js";

export function getQuestion(usedQuestions) {
    let index = Math.floor(Math.random() * questions.length);

    if (!usedQuestions) return questions[index];

    while (usedQuestions.includes(index)) {
        index = Math.floor(Math.random() * questions.length);
    }

    return { question: questions[index], index };
}