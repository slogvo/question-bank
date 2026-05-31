import React, { useState } from "react";
import { Play, ArrowLeft, Check, X, HelpCircle, Award, CheckCircle2, ChevronRight, ChevronLeft, RefreshCw, Eye } from "lucide-react";
import { Question, Option } from "../types";

interface QuizSimulatorProps {
  questions: Question[];
  levelName: string;
  onExit: () => void;
}

export default function QuizSimulator({ questions, levelName, onExit }: QuizSimulatorProps) {
  const [examMode, setExamMode] = useState<"study" | "exam">("study"); // study: instant review, exam: submit at end
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qId: string]: string[] }>({}); // questionId -> optionId[]
  const [shortAnswers, setShortAnswers] = useState<{ [qId: string]: string }>({}); // questionId -> text
  const [checkedQuestions, setCheckedQuestions] = useState<{ [qId: string]: boolean }>({}); // study mode checked status
  const [isExamSubmitted, setIsExamSubmitted] = useState<boolean>(false);

  if (questions.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center max-w-xl mx-auto space-y-4">
        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center text-zinc-400 mx-auto border border-zinc-100">
          <HelpCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-gray-800">Không có câu hỏi để luyện tập</h3>
        <p className="text-sm text-gray-500">
          Ngân hàng câu hỏi hiện tại cho học phần này trống. Vui lòng chuyển cấu phần khác hoặc tạo mới câu hỏi bằng AI trước.
        </p>
        <button
          onClick={onExit}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition"
        >
          Quay lại soạn thảo
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentIdx];

  const handleOptionSelect = (optionId: string) => {
    if (isExamSubmitted || checkedQuestions[currentQuestion.id]) return;

    const qId = currentQuestion.id;
    const currentSelections = selectedAnswers[qId] || [];

    if (currentQuestion.questionType === "multiple-choice" || currentQuestion.questionType === "true-false") {
      setSelectedAnswers({ ...selectedAnswers, [qId]: [optionId] });
    } else {
      // checklists
      if (currentSelections.includes(optionId)) {
        setSelectedAnswers({
          ...selectedAnswers,
          [qId]: currentSelections.filter((id) => id !== optionId),
        });
      } else {
        setSelectedAnswers({
          ...selectedAnswers,
          [qId]: [...currentSelections, optionId],
        });
      }
    }
  };

  const handleShortInputChange = (text: string) => {
    if (isExamSubmitted || checkedQuestions[currentQuestion.id]) return;
    setShortAnswers({
      ...shortAnswers,
      [currentQuestion.id]: text,
    });
  };

  const checkStudyAnswer = () => {
    setCheckedQuestions({
      ...checkedQuestions,
      [currentQuestion.id]: true,
    });
  };

  const resetSimulator = () => {
    setSelectedAnswers({});
    setShortAnswers({});
    setCheckedQuestions({});
    setIsExamSubmitted(false);
    setCurrentIdx(0);
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (q.questionType === "short-answer") {
        const textAns = (shortAnswers[q.id] || "").trim().toLowerCase();
        const correctAns = (q.correctShortAnswer || "").trim().toLowerCase();
        if (textAns && correctAns && textAns === correctAns) {
          score++;
        }
      } else {
        const choiceAnswers = selectedAnswers[q.id] || [];
        const correctOpts = q.options.filter((o) => o.isCorrect).map((o) => o.id);
        const correctSelections = choiceAnswers.length === correctOpts.length &&
          choiceAnswers.every((id) => correctOpts.includes(id));
        if (correctSelections) score++;
      }
    });
    return score;
  };

  // Check if a question's response is correct (used in reports and study mode)
  const isQuestionResponseCorrect = (q: Question) => {
    if (q.questionType === "short-answer") {
      const textAns = (shortAnswers[q.id] || "").trim().toLowerCase();
      const correctAns = (q.correctShortAnswer || "").trim().toLowerCase();
      return textAns === correctAns;
    } else {
      const choiceAnswers = selectedAnswers[q.id] || [];
      const correctOpts = q.options.filter((o) => o.isCorrect).map((o) => o.id);
      return choiceAnswers.length === correctOpts.length &&
        choiceAnswers.every((id) => correctOpts.includes(id));
    }
  };

  const isSelected = (optionId: string) => {
    return (selectedAnswers[currentQuestion.id] || []).includes(optionId);
  };

  return (
    <div className="space-y-6">
      
      {/* Simulation Room Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-gray-150 shadow-xs">
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-600" />
              Luyện thi thông minh
            </h3>
            <p className="text-xs text-gray-400">
              Cấu phần: <span className="font-semibold text-gray-600">{levelName}</span> ({questions.length} câu hỏi)
            </p>
          </div>
        </div>

        {/* Practice Mode Selector */}
        {!isExamSubmitted && (
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs self-start sm:self-center font-medium">
            <button
              onClick={() => {
                resetSimulator();
                setExamMode("study");
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                examMode === "study"
                  ? "bg-white text-emerald-800 shadow-xs font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Chế độ Học tập <span className="text-[10px] text-gray-400 font-normal">(Giải thích tức thì)</span>
            </button>
            <button
              onClick={() => {
                resetSimulator();
                setExamMode("exam");
              }}
              className={`px-3 py-1.5 rounded-md transition-all ${
                examMode === "exam"
                  ? "bg-white text-emerald-800 shadow-xs font-semibold"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Chế độ Thi cử <span className="text-[10px] text-gray-400 font-normal">(Chấm điểm tổng kết)</span>
            </button>
          </div>
        )}
      </div>

      {isExamSubmitted ? (
        /* Report Summary Scoring Card */
        <div className="bg-white rounded-xl border border-gray-100 shadow-xl p-8 max-w-2xl mx-auto space-y-6">
          <div className="text-center space-y-3">
            <div className="w-24 h-24 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-100">
              <Award className="w-12 h-12 text-emerald-600 animate-bounce" />
            </div>
            <h2 className="text-2xl font-black text-gray-800">Kết Quả Bài Thi</h2>
            <p className="text-sm text-gray-500">Chúc mừng bạn đã hoàn thành bài thi trắc nghiệm!</p>

            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm font-semibold text-slate-700 mt-2">
              Điểm số: <span className="text-lg font-extrabold text-emerald-600">{calculateScore()}</span> / {questions.length} câu đúng
            </div>
            
            {/* Visual Progress percentage */}
            <div className="w-48 h-2 bg-gray-100 rounded-full mx-auto overflow-hidden mt-4">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${(calculateScore() / questions.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-800">Xem lại chi tiết từng câu:</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {questions.map((q, idx) => {
                const correct = isQuestionResponseCorrect(q);
                return (
                  <div
                    key={q.id}
                    className={`p-4 rounded-xl border text-sm transition-all ${
                      correct ? "bg-emerald-50/45 border-emerald-100" : "bg-red-50/45 border-red-100"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 ${
                        correct ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}>
                        {idx + 1}
                      </span>
                      <div className="space-y-2">
                        <p className="font-semibold text-gray-800">{q.questionText}</p>
                        
                        {q.questionType === "short-answer" ? (
                          <div className="text-xs space-y-1">
                            <p className="text-gray-500">Câu trả lời của bạn: <span className="font-mono text-gray-800">"{shortAnswers[q.id] || "Bỏ trống"}"</span></p>
                            <p className="text-emerald-700">Đáp án chuẩn mẫu: <span className="font-mono font-bold">"{q.correctShortAnswer}"</span></p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 gap-1 pl-1">
                            {q.options.map((o) => {
                              const wasSelected = (selectedAnswers[q.id] || []).includes(o.id);
                              return (
                                <div
                                  key={o.id}
                                  className={`flex items-center gap-1.5 text-xs py-1 px-2 rounded ${
                                    o.isCorrect
                                      ? "bg-emerald-100/70 text-emerald-900 font-bold"
                                      : wasSelected
                                      ? "bg-red-100/70 text-red-900 font-medium"
                                      : "text-zinc-500"
                                  }`}
                                >
                                  <div className="w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                                  <span>{o.optionText}</span>
                                  {o.isCorrect && <span className="text-[10px] text-emerald-700 italic">(Đúng)</span>}
                                  {wasSelected && !o.isCorrect && <span className="text-[10px] text-red-700 italic">(Bạn chọn - Sai)</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}
                        
                        <p className="text-xs text-gray-500 italic mt-2 border-t border-dashed border-gray-200/50 pt-2 leading-relaxed">
                          📌 <span className="font-semibold">Giải thích của AI:</span> {q.explanation}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex gap-3 justify-end border-t border-gray-100 pt-6">
            <button
              onClick={resetSimulator}
              className="px-4 py-2 border border-gray-200 text-gray-600 hover:text-gray-800 font-medium hover:bg-slate-50 text-sm rounded-lg transition"
            >
              Thử sức lại
            </button>
            <button
              onClick={onExit}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-lg transition"
            >
              Xong & Đồng ý
            </button>
          </div>
        </div>
      ) : (
        /* Question Card Stepper UI */
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Question progress stepper indicators */}
          <div className="flex items-center justify-between text-xs text-gray-500 font-medium bg-white p-3 rounded-xl border border-gray-150">
            <span>Câu hỏi: <strong className="text-emerald-700 text-sm">{currentIdx + 1}</strong> / {questions.length}</span>
            <div className="flex gap-1">
              {questions.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold transition-all ${
                    idx === currentIdx
                      ? "bg-emerald-600 text-white shadow-xs scale-110"
                      : (selectedAnswers[questions[idx].id]?.length > 0 || shortAnswers[questions[idx].id])
                      ? "bg-emerald-55 bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-slate-50 text-gray-400 border border-slate-200 hover:border-gray-300"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Core Question Card */}
          <div className="bg-white rounded-2xl border border-gray-150 p-6 space-y-6 shadow-sm">
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs px-2.5 py-1 bg-zinc-100 text-zinc-650 font-semibold rounded-full uppercase tracking-wider">
                  {currentQuestion.questionType === "multiple-choice" && "Trắc nghiệm"}
                  {currentQuestion.questionType === "checkboxes" && "Hộp kiểm (Nhiều đáp án)"}
                  {currentQuestion.questionType === "true-false" && "Đúng / Sai"}
                  {currentQuestion.questionType === "short-answer" && "Điền từ tự do"}
                </span>

                {examMode === "study" && checkedQuestions[currentQuestion.id] && (
                  <span className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${
                    isQuestionResponseCorrect(currentQuestion)
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-red-100 text-red-800"
                  }`}>
                    {isQuestionResponseCorrect(currentQuestion) ? "Đúng" : "Chưa đúng"}
                  </span>
                )}
              </div>

              <h2 className="text-lg font-bold text-gray-950 leading-relaxed">
                {currentQuestion.questionText}
              </h2>
            </div>

            {/* Answer Display Layout depending on type */}
            {currentQuestion.questionType === "short-answer" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  value={shortAnswers[currentQuestion.id] || ""}
                  onChange={(e) => handleShortInputChange(e.target.value)}
                  placeholder="Nhập câu trả lời ngắn của bạn tại đây..."
                  disabled={examMode === "study" && checkedQuestions[currentQuestion.id]}
                  className="w-full text-sm border border-gray-200 rounded-lg p-3 outline-none focus:border-emerald-500 transition font-mono bg-slate-50"
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options.map((option) => {
                  const sel = isSelected(option.id);
                  const isChecked = examMode === "study" && checkedQuestions[currentQuestion.id];
                  
                  let optionStyle = "border-gray-200 hover:border-emerald-400 hover:bg-slate-50/50";
                  if (sel) {
                    optionStyle = "border-emerald-600 bg-emerald-50/20";
                  }

                  if (isChecked) {
                    if (option.isCorrect) {
                      optionStyle = "border-emerald-500 bg-emerald-500/10 text-emerald-950 ring-2 ring-emerald-500/20";
                    } else if (sel) {
                      optionStyle = "border-red-500 bg-red-50 text-red-950 ring-2 ring-red-500/10";
                    } else {
                      optionStyle = "border-gray-200 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => handleOptionSelect(option.id)}
                      disabled={isChecked}
                      className={`w-full p-4 text-left rounded-xl border text-sm font-medium flex items-center justify-between gap-3 transition-all ${optionStyle}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          sel ? "bg-emerald-600 border-emerald-600 text-white" : "border-gray-300"
                        }`}>
                          {sel && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span>{option.optionText}</span>
                      </div>
                      
                      {isChecked && option.isCorrect && (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                      )}
                      {isChecked && sel && !option.isCorrect && (
                        <X className="w-5 h-5 text-red-500 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Answer check or showing explanations in instant Study Mode */}
            {examMode === "study" && (
              <div className="pt-4 border-t border-gray-150">
                {!checkedQuestions[currentQuestion.id] ? (
                  <button
                    onClick={checkStudyAnswer}
                    disabled={
                      currentQuestion.questionType === "short-answer"
                        ? !(shortAnswers[currentQuestion.id] || "").trim()
                        : !(selectedAnswers[currentQuestion.id] || []).length
                    }
                    className="px-5 py-2.5 bg-zinc-800 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Kiểm tra đáp án
                  </button>
                ) : (
                  <div className="bg-slate-50 border border-gray-200 rounded-xl p-4 space-y-2 animate-fade-in">
                    <h5 className="text-xs font-extrabold text-emerald-800 uppercase tracking-tight flex items-center gap-1.5 leading-none">
                      <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Giải thích sư phạm:
                    </h5>
                    <p className="text-sm text-gray-700 leading-relaxed font-sans">
                      {currentQuestion.explanation}
                    </p>
                    {currentQuestion.questionType === "short-answer" && (
                      <p className="text-xs font-semibold text-emerald-700 pt-1">
                        👉 Đáp án gợi ý: "{currentQuestion.correctShortAnswer}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stepper Footer Controllers */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => setCurrentIdx(Math.max(0, currentIdx - 1))}
              disabled={currentIdx === 0}
              className="px-4 py-2 text-xs font-bold uppercase tracking-wider border border-gray-200 text-gray-600 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              Trước đó
            </button>

            {currentIdx === questions.length - 1 ? (
              <button
                onClick={() => setIsExamSubmitted(true)}
                disabled={
                  examMode === "exam" &&
                  questions.some((q) => {
                    if (q.questionType === "short-answer") return !shortAnswers[q.id];
                    return !selectedAnswers[q.id] || selectedAnswers[q.id].length === 0;
                  })
                }
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm hover:shadow transition disabled:opacity-50"
              >
                Nộp bài & Chấm điểm
              </button>
            ) : (
              <button
                onClick={() => setCurrentIdx(currentIdx + 1)}
                className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-zinc-800 hover:bg-black text-white rounded-lg transition flex items-center gap-1.5"
              >
                Kế tiếp
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {examMode === "exam" && (
            <div className="text-center">
              <span className="text-[10px] text-gray-400">
                ⚠️ Chế độ Thi cử: Trả lời toàn bộ các câu hỏi để kích hoạt nút Nộp bài chấm điểm.
              </span>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
