import React, { useState, useRef } from "react";
import { Upload, Trash2, HelpCircle, Plus, Minus, Info, Settings, Loader2, Sparkles, CheckSquare, AlignLeft, Check, CheckCircle2 } from "lucide-react";
import { Question, QuestionType } from "../types";

interface QuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  levelName: string;
  levelType: "course" | "chapter" | "lesson";
  syllabusContext: string;
  onQuestionsGenerated: (questions: Question[], append: boolean) => void;
}

export default function QuizModal({
  isOpen,
  onClose,
  levelName,
  levelType,
  syllabusContext,
  onQuestionsGenerated,
}: QuizModalProps) {
  const [numQuestions, setNumQuestions] = useState<number>(10);
  const [numOptions, setNumOptions] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<"dễ" | "trung bình" | "khó">("trung bình");
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    "multiple-choice",
    "checkboxes",
  ]);
  const [contextText, setContextText] = useState<string>("");
  const [appendMode, setAppendMode] = useState<boolean>(false); // false: replace, true: append

  // File states
  const [file, setFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>("");
  const [fileMimeType, setFileMimeType] = useState<string>("");
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Generation status
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    setFileMimeType(selectedFile.type || "application/octet-stream");

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      if (dataUrl) {
         const base64 = dataUrl.split(",")[1];
         setFileBase64(base64);
      }
    };
    reader.onerror = () => {
      setErrorMsg("Không thể đọc tệp tin. Vui lòng thử tệp khác.");
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFileBase64("");
    setFileMimeType("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const toggleQuestionType = (type: QuestionType) => {
    if (questionTypes.includes(type)) {
      if (questionTypes.length > 1) {
        setQuestionTypes(questionTypes.filter((t) => t !== type));
      }
    } else {
      setQuestionTypes([...questionTypes, type]);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg("");
    setLoadingStep(1);

    // Multi-step loading messages
    const steps = [
      "Đang kết nối tới máy chủ AI...",
      "Đang đọc tài liệu nguồn và trích xuất ngữ cảnh...",
      "Đang kiểm định bối cấu trúc bài giảng...",
      "AI đang biên soạn đề thi trắc nghiệm học thuật...",
      "Bổ sung lời giải chi tiết cho từng phương án trả lời...",
      "Chuẩn hóa dữ liệu tương thích Google Forms...",
    ];

    const interval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 2800);

    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          levelType,
          levelName,
          contextText,
          syllabusContext,
          fileBase64,
          fileMimeType,
          numQuestions,
          numOptions,
          difficulty,
          questionTypes,
        }),
      });

      const data = await res.json();
      clearInterval(interval);

      if (res.ok && data.questions) {
        // Map questions with client-side IDs
        const generated: Question[] = data.questions.map((q: any, index: number) => ({
          id: `ai-q-${Date.now()}-${index}`,
          questionText: q.questionText || "Câu hỏi không có tên",
          questionType: q.questionType || "multiple-choice",
          explanation: q.explanation || "Chưa có giải thích.",
          correctShortAnswer: q.correctShortAnswer || "",
          options: (q.options || []).map((o: any, oIdx: number) => ({
            id: `ai-opt-${Date.now()}-${index}-${oIdx}`,
            optionText: o.optionText || "",
            isCorrect: !!o.isCorrect,
          })),
        }));

        onQuestionsGenerated(generated, appendMode);
        onClose();
      } else {
        setErrorMsg(data.error || "Rất tiếc, đã xảy ra lỗi trong quá trình xử lý của AI.");
        setIsGenerating(false);
      }
    } catch (err: any) {
      clearInterval(interval);
      console.error(err);
      setErrorMsg("Không thể kết nối tới server. Vui lòng thử lại sau.");
      setIsGenerating(false);
    }
  };

  const stepsText = [
    "Khởi tạo tiến trình...",
    "Đang phân tích tài liệu học liệu...",
    "Trích xuất từ khóa học thuật chính...",
    "AI lập trình ngân hàng câu hỏi thông minh...",
    "Lập luận đáp án đúng & giải thuật sư phạm...",
    "Tối ưu hóa cấu trúc dữ liệu JSON...",
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-zinc-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600 animate-pulse" />
              Sinh lại câu hỏi bằng AI
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              AI sẽ tự động đọc tài liệu và sinh bộ đề trắc nghiệm cho hạt nhân học tập: <span className="font-semibold text-emerald-800">"{levelName}"</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <Plus className="w-5 h-5 rotate-45" />
          </button>
        </div>

        {/* Content Panel (Scrollable) */}
        {!isGenerating ? (
          <div className="p-6 overflow-y-auto space-y-5 flex-1">
            {errorMsg && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-100">
                {errorMsg}
              </div>
            )}

            {/* Source Materials Section */}
            <div className="space-y-4">
              
              {/* Source 1: Built-in Lesson Syllabus (Primary) */}
              <div className="bg-emerald-50/40 border border-emerald-200/60 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800 text-[10px] font-bold">
                      1
                    </div>
                    <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                      GIÁO ÁN BÀI GIẢNG GỐC (Học liệu chuẩn)
                    </span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full border border-emerald-200">
                    Sẵn dùng
                  </span>
                </div>
                
                {syllabusContext && syllabusContext.trim() ? (
                  <div className="space-y-1.5">
                    <p className="text-xs text-emerald-900 leading-relaxed font-sans bg-white p-3 rounded-lg border border-emerald-100 max-h-24 overflow-y-auto whitespace-pre-wrap select-all">
                      {syllabusContext}
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium">
                      ✓ Đã tự động tải {syllabusContext.trim().length} ký tự nội dung giáo án chính thức để AI bám sát chương trình giảng dạy.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed">
                    ⚠ <strong>Cấp độ học phần này hiện chưa có tài liệu/giáo án tóm tắt.</strong> AI sẽ chủ yếu kiến tạo câu hỏi thông minh dựa trên mô tả tên và các tài liệu đa dạng bổ sung (Nguồn 2 & 3) do bạn thêm bên dưới.
                  </div>
                )}
              </div>

              {/* Source 2: External File Upload (Secondary / For diversification) */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-2.5 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-[10px] font-bold">
                    2
                  </div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    TẢI LÊN TÀI LIỆU NGOÀI (ĐỂ ĐA DẠNG HÓA CHỦ ĐỀ)
                  </span>
                </div>
                
                <p className="text-xs text-gray-500">
                  Tải thêm tài liệu từ bên ngoài (như tóm tắt rải rác, sách giáo khoa phụ trợ) để AI kết hợp và sinh đề thi phong phú, đa diện hơn.
                </p>

                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                    isDragging
                      ? "border-emerald-500 bg-emerald-50"
                      : file
                      ? "border-emerald-200 bg-emerald-50/10"
                      : "border-gray-200 hover:border-emerald-400 hover:bg-emerald-50/5"
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileChange}
                    accept=".pdf,.txt"
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-1.5">
                    <div className="p-2 bg-slate-50 text-slate-500 rounded-full border border-gray-150">
                      <Upload className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-bold text-gray-700">
                      Nhấn để tải lên <span className="text-gray-400 font-normal">hoặc kéo/thả tài liệu phụ trợ</span>
                    </p>
                    <p className="text-[10px] text-gray-400">Chấp nhận PDF, TXT (Tối đa 15MB)</p>
                  </div>
                </div>

                {/* Uploaded File Pill */}
                {file && (
                  <div className="mt-1 flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 transition-all">
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="px-2 py-1 bg-emerald-600 text-white rounded font-bold text-[10px] uppercase">
                        {file.name.split('.').pop() || "FILE"}
                      </div>
                      <div className="truncate">
                        <h4 className="text-xs font-bold text-gray-800 truncate max-w-[280px]">
                          {file.name}
                        </h4>
                        <p className="text-[10px] text-gray-400">
                          {(file.size / 1024).toFixed(1)} KB • <span className="text-emerald-600 font-semibold">Tích hợp thành công</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile();
                      }}
                      className="text-gray-400 hover:text-red-500 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                      title="Xóa tài liệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Source 3: Manual Extra Instructions */}
              <div className="border border-gray-200 rounded-xl p-4 space-y-2 bg-white">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-slate-800 text-[10px] font-bold">
                    3
                  </div>
                  <span className="text-xs font-bold text-gray-800 uppercase tracking-wide">
                    Viết tay bối cảnh / Gợi ý bổ sung (Tùy chọn)
                  </span>
                </div>
                
                <textarea
                  value={contextText}
                  onChange={(e) => setContextText(e.target.value)}
                  placeholder="Nhập thêm thuật ngữ đặc biệt, dán thêm ghi chép hoặc định hướng trọng tâm biên soạn để hướng dẫn AI..."
                  className="w-full text-xs border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 transition-colors h-16 resize-none font-sans bg-slate-50/20"
                />
              </div>

            </div>

            {/* Dynamic Controls Grid */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Question count */}
              <div className="border border-gray-150 p-4 rounded-xl space-y-2 bg-slate-50/50">
                <span className="text-xs font-medium text-gray-500">Số lượng câu hỏi (1-30)</span>
                <div className="flex items-center justify-between bg-white border border-gray-250 rounded-lg px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setNumQuestions(Math.max(1, numQuestions - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-gray-600 border border-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-lg text-gray-800">{numQuestions}</span>
                  <button
                    type="button"
                    onClick={() => setNumQuestions(Math.min(30, numQuestions + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-gray-600 border border-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Option Count */}
              <div className="border border-gray-150 p-4 rounded-xl space-y-2 bg-slate-50/50">
                <span className="text-xs font-medium text-gray-500">Số phương án mỗi câu (2-6)</span>
                <div className="flex items-center justify-between bg-white border border-gray-250 rounded-lg px-2 py-1">
                  <button
                    type="button"
                    onClick={() => setNumOptions(Math.max(2, numOptions - 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-gray-600 border border-gray-200"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold text-lg text-gray-800">{numOptions}</span>
                  <button
                    type="button"
                    onClick={() => setNumOptions(Math.min(6, numOptions + 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-slate-100 text-gray-600 border border-gray-200"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>

            {/* Difficulty choosing */}
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">Độ khó</span>
              <div className="grid grid-cols-3 gap-2">
                {(["dễ", "trung bình", "khó"] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setDifficulty(lvl)}
                    className={`py-2 px-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                      difficulty === lvl
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                        : "bg-white text-gray-700 border-gray-200 hover:border-emerald-300 hover:bg-slate-50"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Type Choosing Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Các loại câu hỏi kết hợp
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { id: "multiple-choice", label: "Trắc nghiệm" },
                  { id: "checkboxes", label: "Hộp kiểm" },
                  { id: "true-false", label: "Đúng / Sai" },
                  { id: "short-answer", label: "Ghi ngắn" },
                ].map((type) => {
                  const isChecked = questionTypes.includes(type.id as QuestionType);
                  return (
                    <button
                      key={type.id}
                      type="button"
                      onClick={() => toggleQuestionType(type.id as QuestionType)}
                      className={`py-2 px-3 rounded-lg border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        isChecked
                          ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                          : "bg-white text-gray-500 border-gray-200 hover:bg-slate-50"
                      }`}
                    >
                      {isChecked ? (
                        <Check className="w-3.5 h-3.5 text-emerald-605" />
                      ) : (
                        <div className="w-3 h-3 rounded-xs border border-gray-400" />
                      )}
                      {type.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Import Mode Radio Options */}
            <div className="p-3 bg-zinc-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-700 flex items-center gap-1 leading-none">
                <Settings className="w-3.5 h-3.5 text-gray-400" /> Chế độ tích hợp dữ liệu:
              </span>
              <div className="flex gap-4">
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="appendMode"
                    checked={!appendMode}
                    onChange={() => setAppendMode(false)}
                    className="accent-emerald-600"
                  />
                  Thay thế toàn bộ câu hỏi cũ
                </label>
                <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                  <input
                    type="radio"
                    name="appendMode"
                    checked={appendMode}
                    onChange={() => setAppendMode(true)}
                    className="accent-emerald-600"
                  />
                  Bổ sung nối tiếp vào danh sách
                </label>
              </div>
            </div>

          </div>
        ) : (
          /* Loading Processing Interface */
          <div className="flex-1 p-10 flex flex-col items-center justify-center text-center space-y-6">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-emerald-600 animate-spin flex items-center justify-center">
              </div>
              <Sparkles className="w-6 h-6 text-emerald-600 absolute inset-0 m-auto animate-pulse" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-gray-800 animate-pulse">
                AI đang xử lý học liệu trí tuệ...
              </h4>
              <p className="text-sm text-emerald-700 font-semibold max-w-[400px]">
                {stepsText[loadingStep]}
              </p>
              <div className="w-60 h-1.5 bg-gray-100 rounded-full mx-auto overflow-hidden mt-3">
                <div
                  className="h-full bg-emerald-600 rounded-full transition-all duration-700"
                  style={{ width: `${((loadingStep + 1) / stepsText.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="text-xs text-gray-400 max-w-sm">
              * Quá trình đọc PDF và lập văn bản trắc nghiệm có cấu hình câu hỏi, phân tích đáp án có thể mất từ 10 - 20 giây nhờ tốc độ ánh sáng của hệ thống Gemini Flash 3.5.
            </div>
          </div>
        )}

        {/* Action Button Footer */}
        {!isGenerating && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3 bg-zinc-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 font-medium hover:bg-gray-100 rounded-lg transition-all"
            >
              Hủy bỏ
            </button>
            <button
              onClick={handleGenerate}
              className="px-5 py-2.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg shadow-sm hover:shadow flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4" />
              Sinh câu hỏi
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
