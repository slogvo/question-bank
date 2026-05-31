import React, { useState } from "react";
import { GraduationCap, Folder, FileText, ChevronDown, ChevronRight, Plus, Trash2, Edit3, HelpCircle, Check, X, BookOpen, AlertCircle } from "lucide-react";
import { Course, Chapter, Lesson } from "../types";

interface StructureSidebarProps {
  courses: Course[];
  selectedNode: {
    type: "course" | "chapter" | "lesson";
    id: string; // Course ID, Chapter ID or Lesson ID
    courseId: string;
    chapterId?: string;
    lessonId?: string;
  };
  onSelectNode: (node: {
    type: "course" | "chapter" | "lesson";
    id: string;
    courseId: string;
    chapterId?: string;
    lessonId?: string;
  }) => void;
  // Node manipulation API
  onAddCourse: (name: string) => void;
  onAddChapter: (courseId: string, name: string) => void;
  onAddLesson: (courseId: string, chapterId: string, name: string) => void;
  onDeleteNode: (type: "course" | "chapter" | "lesson", courseId: string, chapterId?: string, id?: string) => void;
}

export default function StructureSidebar({
  courses,
  selectedNode,
  onSelectNode,
  onAddCourse,
  onAddChapter,
  onAddLesson,
  onDeleteNode,
}: StructureSidebarProps) {
  const [expandedChapters, setExpandedChapters] = useState<{ [id: string]: boolean }>({
    "chap-1": true,
    "chap-2": true,
    "chap-3": true,
  });

  // Modal triggers
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [addType, setAddType] = useState<"course" | "chapter" | "lesson">("chapter");
  const [newItemName, setNewItemName] = useState<string>("");
  const [selectedParentChapterId, setSelectedParentChapterId] = useState<string>("");
  const [selectedParentCourseId, setSelectedParentCourseId] = useState<string>(courses[0]?.id || "");

  const toggleChapter = (chapterId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedChapters({
      ...expandedChapters,
      [chapterId]: !expandedChapters[chapterId],
    });
  };

  const handleOpenAddForm = (type: "course" | "chapter" | "lesson", parentCourseId: string, parentChapterId?: string) => {
    setAddType(type);
    setSelectedParentCourseId(parentCourseId);
    if (parentChapterId) {
      setSelectedParentChapterId(parentChapterId);
    } else {
      // Find first chapter of current course if exists
      const course = courses.find((c) => c.id === parentCourseId);
      setSelectedParentChapterId(course?.chapters[0]?.id || "");
    }
    setNewItemName("");
    setShowAddModal(true);
  };

  const submitAddForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (addType === "course") {
      onAddCourse(newItemName.trim());
    } else if (addType === "chapter") {
      onAddChapter(selectedParentCourseId, newItemName.trim());
    } else if (addType === "lesson") {
      if (!selectedParentChapterId) return;
      onAddLesson(selectedParentCourseId, selectedParentChapterId, newItemName.trim());
    }

    setShowAddModal(false);
    setNewItemName("");
  };

  return (
    <div className="w-full h-full flex flex-col border-r border-gray-200 bg-white select-none">
      
      {/* Structural Sidebar Sub-Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between text-zinc-900 bg-zinc-50/50">
        <span className="text-sm font-bold flex items-center gap-1.5 uppercase tracking-wide">
          <BookOpen className="w-4 h-4 text-emerald-600" />
          Cấu trúc bài học
        </span>
        <button
          onClick={() => handleOpenAddForm("course", courses[0]?.id || "")}
          className="p-1 px-2 rounded-md hover:bg-zinc-150 bg-white border border-gray-200 text-xs text-gray-700 font-bold hover:border-gray-300 flex items-center gap-1 transition"
          title="Tạo cấu phần học tập mới"
        >
          <Plus className="w-3.5 h-3.5" />
          Mới
        </button>
      </div>

      {/* Structured Curriculum Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {courses.map((course) => {
          const isCourseSelected = selectedNode.type === "course" && selectedNode.courseId === course.id;
          const courseQuestionsCount = course.questions.length;

          return (
            <div key={course.id} className="space-y-2">
              
              {/* Course Node Element */}
              <div
                onClick={() => onSelectNode({ type: "course", id: course.id, courseId: course.id })}
                className={`p-3 rounded-xl cursor-pointer border transition-all flex items-start justify-between group ${
                  isCourseSelected
                    ? "bg-emerald-50 text-emerald-950 border-emerald-300 font-bold shadow-xs"
                    : "bg-white hover:bg-zinc-50 border-gray-150"
                }`}
              >
                <div className="flex items-start gap-2 max-w-[80%]">
                  <GraduationCap className={`w-5 h-5 mt-0.5 ${isCourseSelected ? "text-emerald-700" : "text-gray-400"}`} />
                  <div>
                    <h4 className="text-sm font-semibold truncate leading-tight">{course.name}</h4>
                    <p className="text-[10px] text-gray-400 mt-1 truncate">
                      {courseQuestionsCount > 0 ? `Ngân hàng: ${courseQuestionsCount} câu` : "Chưa có câu hỏi - Click để tạo"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold" title={`${courseQuestionsCount} câu hỏi tổng quan`}>
                    {courseQuestionsCount} câu
                  </span>
                  
                  {courses.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm("Bạn có chắc chắn muốn xóa khóa học này cùng toàn bộ chương và bài học bên trong?")) {
                          onDeleteNode("course", course.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Chapters Tree rendering */}
              <div className="space-y-1 pl-1">
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-extrabold text-gray-400 uppercase tracking-wider">
                  <span>Syllabus Chương</span>
                  <button
                    onClick={() => handleOpenAddForm("chapter", course.id)}
                    className="p-1 rounded text-gray-400 hover:text-emerald-600 hover:bg-slate-50 transition"
                    title="Thêm Chương mới"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {course.chapters.length === 0 ? (
                  <div className="text-center p-3 text-xs text-gray-400 italic">
                    Chưa có chương nào. Hãy nhấn '+' để tạo.
                  </div>
                ) : (
                  course.chapters.map((chapter) => {
                    const isChapterSelected = selectedNode.type === "chapter" && selectedNode.id === chapter.id;
                    const isChapterExpanded = expandedChapters[chapter.id];
                    const chapterQuestionsCount = chapter.questions.length;

                    return (
                      <div key={chapter.id} className="relative">
                        
                        {/* Chapter Row Panel */}
                        <div
                          onClick={() =>
                            onSelectNode({
                              type: "chapter",
                              id: chapter.id,
                              courseId: course.id,
                              chapterId: chapter.id,
                            })
                          }
                          className={`group w-full p-2.5 rounded-lg text-xs font-semibold cursor-pointer border flex items-center justify-between transition-all ${
                            isChapterSelected
                              ? "bg-slate-100 text-slate-800 border-gray-300 shadow-2xs font-bold"
                              : "bg-white hover:bg-slate-50/70 border-transparent text-gray-700"
                          }`}
                        >
                          <div className="flex items-center gap-2 max-w-[70%]">
                            <button
                              onClick={(e) => toggleChapter(chapter.id, e)}
                              className="p-0.5 rounded text-gray-400 hover:text-gray-700 hover:bg-slate-200 transition shrink-0"
                            >
                              {isChapterExpanded ? (
                                <ChevronDown className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronRight className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <Folder className={`w-4 h-4 shrink-0 ${isChapterSelected ? "text-slate-700" : "text-gray-400"}`} />
                            <span className="truncate leading-none">{chapter.name}</span>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-bold leading-none" title={`${chapterQuestionsCount} câu hỏi chương`}>
                              {chapterQuestionsCount} câu
                            </span>
                            
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAddForm("lesson", course.id, chapter.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-emerald-700 rounded transition"
                              title="Thêm Bài học mới"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (confirm("Xóa chương này sẽ xóa tất cả câu hỏi và giáo trình bên trong?")) {
                                  onDeleteNode("chapter", course.id, chapter.id);
                                }
                              }}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded transition"
                              title="Xóa Chương"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Indented Lessons beneath current chapter */}
                        {isChapterExpanded && (
                          <div className="pl-6 border-l border-dashed border-gray-200 ml-4 my-1 space-y-1 relative">
                            {chapter.lessons.length === 0 ? (
                              <div className="text-[10px] text-gray-450 italic py-1 px-1.5">
                                Trống bài học
                              </div>
                            ) : (
                              chapter.lessons.map((lesson) => {
                                const isLessonSelected = selectedNode.type === "lesson" && selectedNode.id === lesson.id;
                                const lessonQuestionsCount = lesson.questions.length;

                                return (
                                  <div
                                    key={lesson.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectNode({
                                        type: "lesson",
                                        id: lesson.id,
                                        courseId: course.id,
                                        chapterId: chapter.id,
                                        lessonId: lesson.id,
                                      });
                                    }}
                                    className={`group p-2 rounded-lg cursor-pointer text-xs font-medium flex items-center justify-between border select-none transition-all ${
                                      isLessonSelected
                                        ? "bg-emerald-50 text-emerald-900 border-emerald-300 font-semibold"
                                        : "bg-white hover:bg-slate-50/50 border-transparent text-gray-600"
                                    }`}
                                  >
                                    <div className="flex items-center gap-2 max-w-[75%]">
                                      <FileText className={`w-3.5 h-3.5 shrink-0 ${isLessonSelected ? "text-emerald-700" : "text-gray-400"}`} />
                                      <span className="truncate leading-tight">{lesson.name}</span>
                                    </div>

                                    <div className="flex items-center gap-1 shrink-0">
                                      <span className="text-[10px] bg-emerald-100 text-emerald-850 px-1.5 py-0.5 rounded font-bold leading-none scale-90" title={`${lessonQuestionsCount} câu hỏi bài học`}>
                                        {lessonQuestionsCount} câu
                                      </span>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (confirm("Xóa bài học này?")) {
                                            onDeleteNode("lesson", course.id, chapter.id, lesson.id);
                                          }
                                        }}
                                        className="opacity-0 group-hover:opacity-100 p-0.5 text-gray-400 hover:text-red-500 rounded transition"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })
                )}
              </div>

            </div>
          );
        })}
      </div>

      {/* Sticky Bottom Actions / Credit */}
      <div className="p-3 border-t border-gray-100 bg-slate-50 text-center text-[10px] text-gray-400 font-medium">
        Cung cấp bởi trí tuệ nhân tạo @Google GenAI
      </div>

      {/* Creation Popup overlay form */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <form
            onSubmit={submitAddForm}
            className="bg-white rounded-xl shadow-xl border border-gray-100 max-w-sm w-full p-5 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h4 className="text-sm font-bold text-gray-800">
                {addType === "course" && "Thêm Học phần / Khóa học mới"}
                {addType === "chapter" && "Thêm Chương học phần mới"}
                {addType === "lesson" && "Thêm Bài học cụ thể học mới"}
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Tên cấu phần hiển thị</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Nhập tên..."
                  className="w-full text-xs font-medium border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              {addType === "lesson" && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Thuộc Chương</label>
                  <select
                    value={selectedParentChapterId}
                    onChange={(e) => setSelectedParentChapterId(e.target.value)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 outline-none focus:border-emerald-500 bg-white"
                  >
                    {courses.find((c) => c.id === selectedParentCourseId)?.chapters.map((ch) => (
                      <option key={ch.id} value={ch.id}>
                        {ch.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 font-medium hover:bg-slate-100 rounded-md transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md shadow-xs active:scale-95 transition"
              >
                Lưu lại
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
