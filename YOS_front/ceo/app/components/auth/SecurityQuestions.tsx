// components/SecurityQuestions.tsx
import { useState } from 'react';
import { toast } from 'react-hot-toast';

interface SecurityQuestion {
  id: number;
  question: string;
}

interface SecurityQuestionsProps {
  questions: SecurityQuestion[];
  initialAnswers?: { question_id: number; answer: string }[];
  onNext: (answers: { question_id: number; answer: string }[]) => void;
}

export default function SecurityQuestions({ questions, initialAnswers = [], onNext }: SecurityQuestionsProps) {
  const [answers, setAnswers] = useState(
    questions.map(q => {
      const existing = initialAnswers.find(a => a.question_id === q.id);
      return { question_id: q.id, answer: existing?.answer || '' };
    })
  );

  const handleAnswerChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = { ...updated[index], answer: value };
    setAnswers(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (answers.some(a => !a.answer.trim())) {
      toast.error('Please answer all questions');
      return;
    }
    onNext(answers);
  };

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-6">
      <div className="space-y-4">
        {questions.map((q, idx) => (
          <div key={q.id}>
            <label htmlFor={`question-${q.id}`} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              {q.question}
            </label>
            <input
              id={`question-${q.id}`}
              type="text"
              value={answers[idx]?.answer || ''}
              onChange={(e) => handleAnswerChange(idx, e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
              required
            />
          </div>
        ))}
      </div>
      <button
        type="submit"
        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Continue
      </button>
    </form>
  );
}