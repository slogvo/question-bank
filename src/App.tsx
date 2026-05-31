import React, { useState, useEffect } from "react";
import { Sparkles, Plus, Trash2, Edit3, Play, Download, Save, Check, X, GraduationCap, ChevronRight, FileText, Info, HelpCircle, FileJson, Copy, CheckSquare, BookOpen, FileCheck, ArrowUpRight, AlignLeft, RefreshCw } from "lucide-react";
import { Course, Chapter, Lesson, Question, Option, QuestionType } from "./types";
import { initialCourses } from "./initialData";
import StructureSidebar from "./components/StructureSidebar";
import QuizModal from "./components/QuizModal";
import QuizSimulator from "./components/QuizSimulator";

export default function App() {
  // Sync state with localStorage to support solid persistent caching
  const [courses, setCourses] = useState<Course[]>(() => {
    const saved = localStorage.getItem("ai_quiz_bank_courses");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Lỗi đọc dữ liệu từ cache:", e);
      }
    }
    return initialCourses;
  });

  const [selectedNode, setSelectedNode] = useState<{
    type: "course" | "chapter" | "lesson";
    id: string;
    courseId: string;
    chapterId?: string;
    lessonId?: string;
  }>(() => {
    const defaultCourseId = courses[0]?.id || "";
    return {
      type: "course",
      id: defaultCourseId,
      courseId: defaultCourseId,
    };
  });

  // Modal, Simulation and Export states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Focus Question inline editor state
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [tempQuestion, setTempQuestion] = useState<Question | null>(null);

  // Edit Syllabus Node info states
  const [isEditingNodeInfo, setIsEditingNodeInfo] = useState<boolean>(false);
  const [tempNodeName, setTempNodeName] = useState<string>("");
  const [tempNodeDesc, setTempNodeDesc] = useState<string>("");
  const [tempNodeMaterial, setTempNodeMaterial] = useState<string>("");

  // Persist course changes immediately
  useEffect(() => {
    localStorage.setItem("ai_quiz_bank_courses", JSON.stringify(courses));
  }, [courses]);

  // Find active data elements
  const activeCourse = courses.find((c) => c.id === selectedNode.courseId);
  const activeChapter = activeCourse?.chapters.find((ch) => ch.id === selectedNode.chapterId);
  const activeLesson = activeChapter?.lessons.find((l) => l.id === selectedNode.lessonId);

  let activeNodeName = "";
  let activeNodeDesc = "";
  let activeQuestions: Question[] = [];
  let activeMaterialText = "";

  if (selectedNode.type === "course" && activeCourse) {
    activeNodeName = activeCourse.name;
    activeNodeDesc = activeCourse.description || "Chưa có mô tả khóa học.";
    activeQuestions = activeCourse.questions;
    activeMaterialText = "Khóa học chính bao quát kiến thức toàn bộ chương và bài học dưới đây.";
  } else if (selectedNode.type === "chapter" && activeChapter) {
    activeNodeName = activeChapter.name;
    activeNodeDesc = activeChapter.description || "Chưa có mô tả chương học.";
    activeQuestions = activeChapter.questions;
    activeMaterialText = "Cơ cấu chương gồm các bài giảng chi tiết trong menu bên trái.";
  } else if (selectedNode.type === "lesson" && activeLesson) {
    activeNodeName = activeLesson.name;
    activeNodeDesc = activeLesson.description || "Chưa có mô tả bài học.";
    activeQuestions = activeLesson.questions;
    activeMaterialText = activeLesson.materialText || "Hãy dập nhật tóm tắt tài liệu tự học tại đây để AI sinh câu hỏi chính xác hơn.";
  }

  // Compute aggregated syllabus context from active course/chapter/lesson
  let activeSyllabusContext = "";
  if (selectedNode.type === "lesson" && activeLesson) {
    activeSyllabusContext = activeLesson.materialText || "";
  } else if (selectedNode.type === "chapter" && activeChapter) {
    activeSyllabusContext = activeChapter.lessons
      .filter((l) => l.materialText)
      .map((l) => `[Bài học: ${l.name}]\nTài liệu học tập:\n${l.materialText}`)
      .join("\n\n-------------------\n\n");
  } else if (selectedNode.type === "course" && activeCourse) {
    activeSyllabusContext = activeCourse.chapters
      .map((ch) => {
        const chapterLessons = ch.lessons
          .filter((l) => l.materialText)
          .map((l) => `  - [Bài học: ${l.name}]\n  Tài liệu học tập:\n  ${l.materialText}`)
          .join("\n\n");
        return `[Chương: ${ch.name}]\n${chapterLessons || "  (Chưa có bài giảng chi tiết)"}`;
      })
      .join("\n\n===================\n\n");
  }

  // Setup/Reset temporary Node details editor
  const handleStartEditingNodeInfo = () => {
    setTempNodeName(activeNodeName);
    setTempNodeDesc(activeNodeDesc);
    setTempNodeMaterial(selectedNode.type === "lesson" ? activeLesson?.materialText || "" : "");
    setIsEditingNodeInfo(true);
  };

  const handleSaveNodeInfo = () => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== selectedNode.courseId) return c;

        if (selectedNode.type === "course") {
          return { ...c, name: tempNodeName, description: tempNodeDesc };
        }

        return {
          ...c,
          chapters: c.chapters.map((ch) => {
            if (ch.id !== selectedNode.chapterId) return ch;

            if (selectedNode.type === "chapter") {
              return { ...ch, name: tempNodeName, description: tempNodeDesc };
            }

            return {
              ...ch,
              lessons: ch.lessons.map((les) => {
                if (les.id !== selectedNode.lessonId) return les;
                return {
                  ...les,
                  name: tempNodeName,
                  description: tempNodeDesc,
                  materialText: tempNodeMaterial,
                };
              }),
            };
          }),
        };
      })
    );
    setIsEditingNodeInfo(false);
  };

  // Node Syllabus Manipulation triggers
  const handleAddCourse = (name: string) => {
    const newCourse: Course = {
      id: `course-${Date.now()}`,
      name,
      description: `Khóa học khám phá nội dung tự biên soạn ${name}`,
      chapters: [],
      questions: [],
    };
    setCourses([...courses, newCourse]);
    setSelectedNode({ type: "course", id: newCourse.id, courseId: newCourse.id });
  };

  const handleAddChapter = (courseId: string, name: string) => {
    const newChapter: Chapter = {
      id: `chap-${Date.now()}`,
      name,
      description: `Chương học phần mở rộng: ${name}`,
      lessons: [],
      questions: [],
    };

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return { ...c, chapters: [...c.chapters, newChapter] };
      })
    );
  };

  const handleAddLesson = (courseId: string, chapterId: string, name: string) => {
    const newLesson: Lesson = {
      id: `les-${Date.now()}`,
      name,
      description: `Bài học chi tiết: ${name}`,
      materialText: `Tài liệu tự học cho bài ${name}...`,
      questions: [],
    };

    setCourses((prev) =>
      prev.map((c) => {
        if (c.id !== courseId) return c;
        return {
          ...c,
          chapters: c.chapters.map((ch) => {
            if (ch.id !== chapterId) return ch;
            return { ...ch, lessons: [...ch.lessons, newLesson] };
          }),
        };
      })
    );
  };

  const handleDeleteNode = (
    type: "course" | "chapter" | "lesson",
    courseId: string,
    chapterId?: string,
    id?: string
  ) => {
    if (type === "course") {
      setCourses((prev) => prev.filter((c) => c.id !== courseId));
      // Re-route safely
      const remaining = courses.filter((c) => c.id !== courseId);
      if (remaining.length > 0) {
        setSelectedNode({ type: "course", id: remaining[0].id, courseId: remaining[0].id });
      }
    } else if (type === "chapter") {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c;
          return { ...c, chapters: c.chapters.filter((ch) => ch.id !== chapterId) };
        })
      );
      setSelectedNode({ type: "course", id: courseId, courseId });
    } else if (type === "lesson") {
      setCourses((prev) =>
        prev.map((c) => {
          if (c.id !== courseId) return c;
          return {
            ...c,
            chapters: c.chapters.map((ch) => {
              if (ch.id !== chapterId) return ch;
              return { ...ch, lessons: ch.lessons.filter((l) => l.id !== id) };
            }),
          };
        })
      );
      setSelectedNode({ type: "chapter", id: chapterId!, courseId, chapterId });
    }
  };

  // AI Callback receiver
  const handleAIQuestionsGenerated = (generated: Question[], append: boolean) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== selectedNode.courseId) return c;

        if (selectedNode.type === "course") {
          return {
            ...c,
            questions: append ? [...c.questions, ...generated] : generated,
          };
        }

        return {
          ...c,
          chapters: c.chapters.map((ch) => {
            if (ch.id !== selectedNode.chapterId) return ch;

            if (selectedNode.type === "chapter") {
              return {
                ...ch,
                questions: append ? [...ch.questions, ...generated] : generated,
              };
            }

            return {
              ...ch,
              lessons: ch.lessons.map((les) => {
                if (les.id !== selectedNode.lessonId) return les;
                return {
                  ...les,
                  questions: append ? [...les.questions, ...generated] : generated,
                };
              }),
            };
          }),
        };
      })
    );
  };

  // Google Forms manual editing methods
  const handleStartManualAdd = () => {
    const newQ: Question = {
      id: `man-q-${Date.now()}`,
      questionText: "Nội dung câu hỏi trắc nghiệm mới?",
      questionType: "multiple-choice",
      explanation: "Giải thích chi tiết tại sao đáp án đã chọn lại chính xác.",
      options: [
        { id: `opt-${Date.now()}-1`, optionText: "Phương án lựa chọn A", isCorrect: true },
        { id: `opt-${Date.now()}-2`, optionText: "Phương án lựa chọn B", isCorrect: false },
        { id: `opt-${Date.now()}-3`, optionText: "Phương án lựa chọn C", isCorrect: false },
        { id: `opt-${Date.now()}-4`, optionText: "Phương án lựa chọn D", isCorrect: false },
      ],
    };

    // Auto trigger editing for new question
    setEditingQuestionId(newQ.id);
    setTempQuestion(newQ);

    // Save initial object
    updateActiveNodeQuestions([...activeQuestions, newQ]);
  };

  const handleStartEditingQuestion = (q: Question) => {
    setEditingQuestionId(q.id);
    setTempQuestion(JSON.parse(JSON.stringify(q))); // deep copy
  };

  const handleCancelEditingQuestion = () => {
    setEditingQuestionId(null);
    setTempQuestion(null);
  };

  const handleSaveQuestion = () => {
    if (!tempQuestion) return;

    const updated = activeQuestions.map((q) => {
      if (q.id === tempQuestion.id) return tempQuestion;
      return q;
    });

    updateActiveNodeQuestions(updated);
    setEditingQuestionId(null);
    setTempQuestion(null);
  };

  const handleDeleteQuestion = (qId: string) => {
    if (confirm("Bạn có thực sự muốn xóa câu hỏi khảo thí này khỏi ngân hàng?")) {
      const updated = activeQuestions.filter((q) => q.id !== qId);
      updateActiveNodeQuestions(updated);
    }
  };

  // State sync wrapper
  const updateActiveNodeQuestions = (updatedQs: Question[]) => {
    setCourses((prevCourses) =>
      prevCourses.map((c) => {
        if (c.id !== selectedNode.courseId) return c;

        if (selectedNode.type === "course") {
          return { ...c, questions: updatedQs };
        }

        return {
          ...c,
          chapters: c.chapters.map((ch) => {
            if (ch.id !== selectedNode.chapterId) return ch;

            if (selectedNode.type === "chapter") {
              return { ...ch, questions: updatedQs };
            }

            return {
              ...ch,
              lessons: ch.lessons.map((les) => {
                if (les.id !== selectedNode.lessonId) return les;
                return { ...les, questions: updatedQs };
              }),
            };
          }),
        };
      })
    );
  };

  // Google Forms fields changes inside inline Temp Question
  const handleTempFieldChange = (field: keyof Question, value: any) => {
    if (!tempQuestion) return;

    if (field === "questionType") {
      const newType = value as QuestionType;
      let newOptions: Option[] = [...tempQuestion.options];

      if (newType === "true-false") {
        newOptions = [
          { id: `opt-${Date.now()}-1`, optionText: "Đúng", isCorrect: true },
          { id: `opt-${Date.now()}-2`, optionText: "Sai", isCorrect: false },
        ];
      } else if (newType === "short-answer") {
        newOptions = [];
      } else if (tempQuestion.questionType === "true-false" || tempQuestion.questionType === "short-answer") {
        // recover default grid options
        newOptions = [
          { id: `opt-${Date.now()}-1`, optionText: "Lựa chọn phương án 1", isCorrect: true },
          { id: `opt-${Date.now()}-2`, optionText: "Lựa chọn phương án 2", isCorrect: false },
        ];
      }

      setTempQuestion({
        ...tempQuestion,
        questionType: newType,
        options: newOptions,
        correctShortAnswer: newType === "short-answer" ? "Đáp án chính xác" : undefined,
      });
    } else {
      setTempQuestion({
        ...tempQuestion,
        [field]: value,
      });
    }
  };

  const handleTempOptionTextChange = (optId: string, text: string) => {
    if (!tempQuestion) return;
    setTempQuestion({
      ...tempQuestion,
      options: tempQuestion.options.map((o) => {
        if (o.id !== optId) return o;
        return { ...o, optionText: text };
      }),
    });
  };

  const handleTempOptionCorrectToggle = (optId: string) => {
    if (!tempQuestion) return;

    setTempQuestion({
      ...tempQuestion,
      options: tempQuestion.options.map((o) => {
        if (tempQuestion.questionType === "multiple-choice" || tempQuestion.questionType === "true-false") {
          // single correct answer
          return { ...o, isCorrect: o.id === optId };
        } else {
          // checkboxes (multi selectable)
          return { ...o, isCorrect: o.id === optId ? !o.isCorrect : o.isCorrect };
        }
      }),
    });
  };

  const handleAddTempOption = () => {
    if (!tempQuestion) return;
    const newOpt: Option = {
      id: `opt-${Date.now()}-${tempQuestion.options.length + 1}`,
      optionText: `Phương án lựa chọn mới ${tempQuestion.options.length + 1}`,
      isCorrect: false,
    };
    setTempQuestion({
      ...tempQuestion,
      options: [...tempQuestion.options, newOpt],
    });
  };

  const handleRemoveTempOption = (optId: string) => {
    if (!tempQuestion) return;
    setTempQuestion({
      ...tempQuestion,
      options: tempQuestion.options.filter((o) => o.id !== optId),
    });
  };

  // Document formatting utilities
  const exportAsJSONFile = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(activeQuestions, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ngan_hang_cau_hoi_${activeNodeName.toLowerCase().replace(/\s+/g, "_")}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const generateAestheticTextExport = (): string => {
    return activeQuestions
      .map((q, idx) => {
        let text = `Câu hỏi ${idx + 1}: ${q.questionText} (${
          q.questionType === "multiple-choice"
            ? "Trắc nghiệm 1 lựa chọn"
            : q.questionType === "checkboxes"
            ? "Trắc nghiệm nhiều lựa chọn"
            : q.questionType === "true-false"
            ? "Đúng/Sai"
            : "Trả lời ngắn"
        })\n`;

        if (q.questionType === "short-answer") {
          text += `👉 Đáp án chuẩn mẫu: ${q.correctShortAnswer}\n`;
        } else {
          q.options.forEach((o, oIdx) => {
            const label = String.fromCharCode(65 + oIdx);
            text += `  [${o.isCorrect ? "x" : " "}] ${label}. ${o.optionText}\n`;
          });
        }
        text += `📌 Đắc dẫn giải thích: ${q.explanation}\n\n`;
        return text;
      })
      .join("--------------------------------------------\n");
  };

  const copyToClipboard = () => {
    const formatted = generateAestheticTextExport();
    navigator.clipboard.writeText(formatted);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-zinc-50 overflow-hidden font-sans antialiased text-gray-800">
      
      {/* Dynamic Top App Header */}
      <header className="px-6 py-4 bg-zinc-900 text-white flex items-center justify-between border-b border-zinc-800 shrink-0 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-600 flex items-center justify-center rounded-xl shadow-inner text-white">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Ngân Hàng Câu Hỏi Trắc Nghiệm AI</h1>
            <p className="text-[10px] text-zinc-400 mt-0.5">Trình sinh đề thi học điển, soạn thảo Google Forms & quản lý học liệu rực rỡ</p>
          </div>
        </div>

        {/* Info panel */}
        <div className="hidden md:flex items-center gap-4 text-xs font-medium text-zinc-300">
          <div className="flex items-center gap-1.5 px-3 py-1 bg-zinc-800 rounded-full border border-zinc-700/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-[10px]">Gemini 3.5 Flash hoạt động tốt</span>
          </div>
        </div>
      </header>

      {/* Main Core Body Container Split Left Menu & Content Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Side Tree Syllabus Sidebar */}
        <div className="w-80 shrink-0 h-full flex flex-col">
          <StructureSidebar
            courses={courses}
            selectedNode={selectedNode}
            onSelectNode={(node) => {
              setSelectedNode(node);
              setIsSimulating(false); // reset room
            }}
            onAddCourse={handleAddCourse}
            onAddChapter={handleAddChapter}
            onAddLesson={handleAddLesson}
            onDeleteNode={handleDeleteNode}
          />
        </div>

        {/* Right Active Workspace Content area */}
        <div className="flex-1 h-full overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* Practice exam simulation mode */}
          {isSimulating ? (
            <QuizSimulator
              questions={activeQuestions}
              levelName={activeNodeName}
              onExit={() => setIsSimulating(false)}
            />
          ) : (
            <>
              {/* Breadcrumb Info Path Selector Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                  <div className="flex items-center gap-1 text-xs text-slate-450 font-semibold mb-2">
                    <span className="hover:text-slate-750 transition">{activeCourse?.name}</span>
                    {activeChapter && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="hover:text-slate-750 transition truncate max-w-[150px]">{activeChapter.name}</span>
                      </>
                    )}
                    {activeLesson && (
                      <>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
                        <span className="font-extrabold text-emerald-800 truncate max-w-[150px]">{activeLesson.name}</span>
                      </>
                    )}
                  </div>

                  {/* Active Name display panel (Editable) */}
                  {isEditingNodeInfo ? (
                    <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-200 shadow-sm max-w-xl">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Tên cấu phần</label>
                        <input
                          type="text"
                          value={tempNodeName}
                          onChange={(e) => setTempNodeName(e.target.value)}
                          className="w-full text-sm font-semibold border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Mô tả khái quát</label>
                        <input
                          type="text"
                          value={tempNodeDesc}
                          onChange={(e) => setTempNodeDesc(e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500"
                        />
                      </div>
                      {selectedNode.type === "lesson" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Tài liệu học tập / Nội dung bài giảng chính</label>
                          <textarea
                            value={tempNodeMaterial}
                            onChange={(e) => setTempNodeMaterial(e.target.value)}
                            className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500 h-24 font-sans resize-none"
                            placeholder="Dán đề cương tóm tắt kiến thức của bài học để AI đọc làm nguồn tư liệu sinh ngân hàng đề thi..."
                          />
                        </div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setIsEditingNodeInfo(false)}
                          className="px-3 py-1.5 border border-gray-200 rounded-md text-xs font-bold text-gray-500 hover:bg-slate-50 transition"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          onClick={handleSaveNodeInfo}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-extrabold transition flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Lưu lại
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 group">
                        <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-tight">{activeNodeName}</h2>
                        <button
                          onClick={handleStartEditingNodeInfo}
                          className="p-1 px-2 rounded hover:bg-slate-100 text-gray-400 hover:text-emerald-700 text-[10px] font-bold flex items-center gap-0.5 transition"
                          title="Chỉnh sửa chi tiết"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Sửa học phần
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 max-w-xl font-medium">{activeNodeDesc}</p>
                    </div>
                  )}
                </div>

                {/* Floating main triggers */}
                <div className="flex flex-wrap gap-2.5 items-center shrink-0">
                  <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm shrink-0 flex items-center gap-1.5 transition active:scale-95"
                  >
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Sinh câu hỏi AI
                  </button>

                  <button
                    onClick={handleStartManualAdd}
                    className="px-3.5 py-2.5 border border-zinc-300 text-zinc-700 hover:text-zinc-900 hover:border-zinc-400 rounded-xl text-xs font-bold shrink-0 flex items-center gap-1.5 bg-white transition active:scale-95"
                  >
                    <Plus className="w-4 h-4 text-zinc-500" />
                    Thêm câu hỏi
                  </button>

                  {activeQuestions.length > 0 && (
                    <>
                      <button
                        onClick={() => setIsSimulating(true)}
                        className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-950 text-white rounded-xl text-xs font-black shadow-xs shrink-0 flex items-center gap-1.5 transition active:scale-95"
                      >
                        <Play className="w-4 h-4" />
                        Thi thử
                      </button>

                      <button
                        onClick={() => setShowExportModal(true)}
                        className="p-2.5 border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-white rounded-xl transition"
                        title="Xuất đề thi chuẩn hóa"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Show warning if viewing Course or Chapter level and they are empty */}
              {selectedNode.type !== "lesson" && activeQuestions.length === 0 && (
                <div className="p-4 bg-slate-50 border border-dashed border-gray-300 rounded-xl text-xs text-gray-500 flex items-start gap-2 max-w-2xl">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-slate-700">Mẹo thiết kế giáo khoa:</span> Bạn đang xem ngân hàng câu hỏi tổng thể của cấp độ <strong className="capitalize">{selectedNode.type}</strong>. Bạn có thể sinh đề trực tiếp cho cấp độ này hoặc nhấn vào một <strong className="text-emerald-700">Bài học cụ thể (ví dụ "Thời Gian Tổ Chức...")</strong> từ danh sách bên trái để biên soạn câu hỏi chi tiết bám sát bài đọc hơn.
                  </div>
                </div>
              )}

              {/* Material box preview if lesson has material content */}
              {selectedNode.type === "lesson" && activeLesson?.materialText && (
                <div className="bg-slate-50 border border-slate-150 p-4 rounded-xl space-y-2">
                  <h4 className="text-xs font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-zinc-500" />
                    Bản tóm tắt bài giảng hiện tại:
                  </h4>
                  <p className="text-xs text-gray-600 leading-relaxed font-sans line-clamp-3 bg-white p-2.5 rounded-lg border border-slate-100">
                    {activeLesson.materialText}
                  </p>
                </div>
              )}

              {/* Core Quiz Bank List displaying section */}
              <div className="space-y-4">
                
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    Danh mục Ngân Hàng ({activeQuestions.length} câu đã tạo)
                  </span>
                </div>

                {activeQuestions.length === 0 ? (
                  /* Soft Cozy Empty State layout */
                  <div className="bg-white rounded-2xl border border-gray-150 p-12 text-center max-w-xl mx-auto space-y-5 shadow-xs">
                    <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto text-emerald-600 border border-emerald-100">
                      <Sparkles className="w-8 h-8 animate-pulse" />
                    </div>
                    <div className="space-y-1.5">
                      <h3 className="text-lg font-bold text-gray-800">Ngân hàng câu hỏi trống</h3>
                      <p className="text-xs text-gray-400 max-w-xs mx-auto">
                        Cấu phần học tập này chưa chứa cấu trúc câu hỏi nào. Bạn muốn biên soạn nhanh chóng bằng AI hay thêm thủ công?
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full sm:w-auto px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold tracking-normal shadow-sm flex items-center justify-center gap-1.5 transition active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Sinh tự động bằng AI
                      </button>
                      <button
                        onClick={handleStartManualAdd}
                        className="w-full sm:w-auto px-4 py-2.5 border border-gray-200 hover:border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition"
                      >
                        Khởi tạo thủ công
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Normal Questions Flow */
                  <div className="space-y-5">
                    {activeQuestions.map((q, idx) => {
                      const isEditing = editingQuestionId === q.id;

                      if (isEditing && tempQuestion) {
                        return (
                          /* Interactive Google Forms style editing panel */
                          <div
                            key={q.id}
                            className="bg-white rounded-2xl border-2 border-emerald-500 shadow-lg p-6 space-y-6 animate-pulse-slow font-sans"
                          >
                            <div className="flex items-center justify-between pb-3 border-b border-dashed border-gray-100">
                              <span className="text-xs font-extrabold text-emerald-800 tracking-wider uppercase flex items-center gap-1.5 leading-none">
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                                Chỉnh sửa câu hỏi {idx + 1}
                              </span>
                              
                              {/* Type Picker Selector */}
                              <select
                                value={tempQuestion.questionType}
                                onChange={(e) => handleTempFieldChange("questionType", e.target.value)}
                                className="text-xs font-bold border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500 bg-white"
                              >
                                <option value="multiple-choice">Trắc nghiệm chọn một</option>
                                <option value="checkboxes">Hộp kiểm (chọn nhiều)</option>
                                <option value="true-false">True / False</option>
                                <option value="short-answer">Tự do ghi ngắn</option>
                              </select>
                            </div>

                            {/* Question text box input */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-semibold text-gray-500">Nội dung câu đố</label>
                              <input
                                type="text"
                                value={tempQuestion.questionText}
                                onChange={(e) => handleTempFieldChange("questionText", e.target.value)}
                                className="w-full text-sm font-bold border border-gray-200 rounded-lg p-3 outline-none focus:border-emerald-500"
                                placeholder="Hãy điền nội dung câu hỏi..."
                              />
                            </div>

                            {/* Options List */}
                            {tempQuestion.questionType === "short-answer" ? (
                              <div className="space-y-2">
                                <label className="block text-xs font-semibold text-gray-400">Đáp án chuẩn gợi ý:</label>
                                <input
                                  type="text"
                                  value={tempQuestion.correctShortAnswer || ""}
                                  onChange={(e) => handleTempFieldChange("correctShortAnswer", e.target.value)}
                                  className="w-full text-xs font-mono border border-gray-200 rounded-lg p-2.5 outline-none focus:border-emerald-500 bg-slate-50"
                                />
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <span className="block text-xs font-semibold text-gray-400 mb-1">
                                  Các phương án lựa chọn <span className="font-normal italic">(Đánh dấu chọn tích vào dấu tròn/hộp đầu dòng để đặt đó làm đáp án ĐÚNG)</span>
                                </span>
                                <div className="grid grid-cols-1 gap-2.5">
                                  {tempQuestion.options.map((opt, oIdx) => (
                                    <div key={opt.id} className="flex items-center gap-2 animate-fade-in">
                                      
                                      {/* Correctness toggle button */}
                                      <button
                                        type="button"
                                        onClick={() => handleTempOptionCorrectToggle(opt.id)}
                                        className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                                          opt.isCorrect
                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                            : "border-gray-200 hover:border-emerald-400"
                                        }`}
                                        title={opt.isCorrect ? "Đang chọn là đáp án đúng" : "Đặt làm đáp án đúng"}
                                      >
                                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                                      </button>

                                      {/* Option label indicator */}
                                      <span className="text-xs font-bold text-gray-400 font-mono w-4">
                                        {String.fromCharCode(65 + oIdx)}.
                                      </span>

                                      {/* Text value field */}
                                      <input
                                        type="text"
                                        value={opt.optionText}
                                        onChange={(e) => handleTempOptionTextChange(opt.id, e.target.value)}
                                        className="flex-1 text-xs border border-gray-150 rounded-lg p-2 outline-none focus:border-emerald-300 bg-slate-50/50"
                                        placeholder={`Lựa chọn phương án ${oIdx + 1}`}
                                      />

                                      {/* Remove option trigger */}
                                      {tempQuestion.questionType !== "true-false" && tempQuestion.options.length > 2 && (
                                        <button
                                          type="button"
                                          onClick={() => handleRemoveTempOption(opt.id)}
                                          className="text-gray-400 hover:text-red-500 p-1.5 hover:bg-slate-100 rounded"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>

                                {/* Add option button */}
                                {tempQuestion.questionType !== "true-false" && tempQuestion.options.length < 6 && (
                                  <button
                                    type="button"
                                    onClick={handleAddTempOption}
                                    className="px-3 py-1.5 border border-dashed border-gray-200 hover:border-emerald-400 text-slate-600 hover:text-emerald-700 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ml-8 mt-2 bg-white"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    Thêm phương án mới
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Explanation field */}
                            <div className="space-y-1.5 pt-2 border-t border-gray-100">
                              <label className="block text-xs font-semibold text-gray-500">Lời lý dẫn / Giải trình chi tiết của sư phạm</label>
                              <textarea
                                value={tempQuestion.explanation}
                                onChange={(e) => handleTempFieldChange("explanation", e.target.value)}
                                className="w-full text-xs border border-gray-200 rounded-lg p-3 outline-none focus:border-emerald-500 h-20 resize-none font-sans"
                                placeholder="Tại sao phương án này lại chính xác?"
                              />
                            </div>

                            {/* Footer triggers */}
                            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100">
                              <button
                                type="button"
                                onClick={handleCancelEditingQuestion}
                                className="px-4 py-2 border border-gray-250 text-gray-500 hover:text-gray-700 font-bold hover:bg-gray-50 text-xs rounded-lg transition"
                              >
                                Hủy bỏ
                              </button>
                              <button
                                type="button"
                                onClick={handleSaveQuestion}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-lg shadow-sm flex items-center gap-1.5 transition active:scale-95"
                              >
                                <Save className="w-3.5 h-3.5" />
                                Lưu câu hỏi
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        /* Modern Reader View display card */
                        <div
                          key={q.id}
                          className="bg-white rounded-2xl border border-gray-150 p-6 space-y-4 hover:shadow-xs transition group relative"
                        >
                          {/* Inner card header info & edits */}
                          <div className="flex items-start justify-between pb-3 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-zinc-100 text-zinc-800 text-xs font-bold flex items-center justify-center font-mono">
                                {idx + 1}
                              </span>
                              <span className="text-[10px] px-2.5 py-1 bg-zinc-50 text-zinc-500 font-bold uppercase tracking-wider rounded-md border border-gray-100">
                                {q.questionType === "multiple-choice" && "Trắc nghiệm"}
                                {q.questionType === "checkboxes" && "Hộp kiểm (Nhiều lựa chọn)"}
                                {q.questionType === "true-false" && "Đúng / Sai"}
                                {q.questionType === "short-answer" && "Điền từ tự do"}
                              </span>
                            </div>

                            {/* Edit/Delete Controllers */}
                            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity duration-250">
                              <button
                                onClick={() => handleStartEditingQuestion(q)}
                                className="p-1 px-2 hover:bg-slate-100 border border-transparent hover:border-gray-200 text-gray-400 hover:text-emerald-700 text-[10px] font-bold flex items-center gap-1 rounded transition"
                                title="Chỉnh sửa câu hỏi"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                Sửa
                              </button>
                              <button
                                onClick={() => handleDeleteQuestion(q.id)}
                                className="p-1 px-2 hover:bg-slate-150 border border-transparent hover:border-gray-200 text-gray-400 hover:text-red-500 text-[10px] font-bold flex items-center gap-1 rounded transition"
                                title="Xóa câu hỏi khỏi ngân hàng"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Xóa
                              </button>
                            </div>
                          </div>

                          {/* Phrasing Display */}
                          <h3 className="text-base font-bold text-gray-900 leading-relaxed font-sans pr-10">
                            {q.questionText}
                          </h3>

                          {/* Specific interactive outcomes depending on type */}
                          {q.questionType === "short-answer" ? (
                            <div className="p-3 bg-zinc-50 border border-slate-100 rounded-xl text-xs flex items-center gap-2">
                              <span className="font-semibold text-slate-500 shrink-0">Đáp án chuẩn:</span>
                              <span className="font-mono text-emerald-800 font-extrabold">"{q.correctShortAnswer}"</span>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              {q.options.map((opt, oIdx) => (
                                <div
                                  key={opt.id}
                                  className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 transition ${
                                    opt.isCorrect
                                      ? "bg-emerald-50/45 text-emerald-950 border-emerald-250"
                                      : "bg-white border-gray-150 text-gray-600"
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5 truncate">
                                    <span className="text-gray-400 font-mono shrink-0">
                                      {String.fromCharCode(65 + oIdx)}.
                                    </span>
                                    <span className="truncate leading-none">{opt.optionText}</span>
                                  </div>

                                  {opt.isCorrect && (
                                    <div className="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xs font-extrabold shrink-0 scale-90">
                                      <Check className="w-3 h-3 stroke-[3]" />
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pedagogical Explanation display */}
                          {q.explanation && (
                            <div className="bg-slate-50 border border-gray-150 rounded-xl p-4 space-y-1.5">
                              <h5 className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1 leading-none">
                                <Info className="w-3.5 h-3.5 text-zinc-400" />
                                Giải trình đáp án của sư phạm:
                              </h5>
                              <p className="text-xs text-gray-600 leading-relaxed font-medium font-sans">
                                {q.explanation}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            </>
          )}

        </div>
      </div>

      {/* Structured interactive Quiz Generator Modal overlay */}
      <QuizModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        levelName={activeNodeName}
        levelType={selectedNode.type}
        syllabusContext={activeSyllabusContext}
        onQuestionsGenerated={handleAIQuestionsGenerated}
      />

      {/* Aesthetic Export Trigger Overlay Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[85vh]">
            <div className="px-5 py-4 border-b border-gray-100 bg-zinc-50 flex items-center justify-between">
              <h4 className="text-sm font-bold text-gray-800 flex items-center gap-1.5 uppercase tracking-wider">
                <Download className="w-4 h-4 text-emerald-650" />
                Xuất đề thi chuẩn hóa
              </h4>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto pr-4">
              <p className="text-xs text-gray-500">
                Hãy lựa chọn định dạng phù hợp để xuất đề thi của bài học <strong className="text-gray-800">"{activeNodeName}"</strong>. Bạn có thể chép văn bản tóm gọn nhanh hoặc lưu tệp tin cấu trúc JSON.
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={exportAsJSONFile}
                  className="p-4 rounded-xl border border-gray-150 hover:border-emerald-500 hover:bg-emerald-50/10 text-center space-y-2 group transition"
                >
                  <FileJson className="w-8 h-8 text-slate-500 group-hover:text-emerald-700 mx-auto" />
                  <span className="block text-xs font-bold text-gray-800 text-center">Tệp tin cấu trúc JSON</span>
                  <p className="text-[10px] text-gray-400">Tương thích các phần mềm khảo thí hoặc phục hồi sau này</p>
                </button>

                <button
                  onClick={copyToClipboard}
                  className="p-4 rounded-xl border border-gray-150 hover:border-emerald-500 hover:bg-emerald-50/10 text-center space-y-2 group transition"
                >
                  {copiedText ? (
                    <span className="text-emerald-650 font-bold text-xs inline-block bg-emerald-50 px-2 py-1 rounded w-full border border-emerald-200">
                      Sao chép xong!
                    </span>
                  ) : (
                    <>
                      <Copy className="w-8 h-8 text-slate-500 group-hover:text-emerald-750 mx-auto" />
                      <span className="block text-xs font-bold text-gray-800">Sao chép văn bản thuần</span>
                      <p className="text-[10px] text-gray-400">Nội dung có định dạng rõ ràng, tiện in ấn hoặc lưu trữ nhanh</p>
                    </>
                  )}
                </button>
              </div>

              {/* Printable visual text preview pane */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-extrabold uppercase tracking-wide text-zinc-400">Xem trước sơ khởi:</label>
                <div className="p-3 bg-zinc-50 border border-slate-200 rounded-lg max-h-40 overflow-y-auto text-[10px] font-mono text-zinc-500 leading-relaxed whitespace-pre-wrap select-all">
                  {generateAestheticTextExport()}
                </div>
              </div>
            </div>

            <div className="px-5 py-3 border-t border-gray-100 bg-zinc-50 flex justify-end">
              <button
                onClick={() => setShowExportModal(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-black text-white text-xs font-bold rounded-lg transition"
              >
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
