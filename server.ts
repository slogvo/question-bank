import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase limit to handle document uploads
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Initialize Google Gen AI securely
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Healtcheck API
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
});

// Generate Quiz Questions API
app.post("/api/generate-questions", async (req, res) => {
  try {
    const {
      levelType, // "course" | "chapter" | "lesson"
      levelName, // Tên khoá học/chương/bài học
      contextText, // Văn bản tài liệu nhập tay
      syllabusContext, // Giáo án/bài giải sẵn có trong lesson
      fileBase64, // Base64 của PDF/TXT
      fileMimeType, // MIME type của file
      numQuestions = 10,
      numOptions = 4,
      difficulty = "trung bình",
      questionTypes = ["multiple-choice"],
    } = req.body;

    if (!apiKey) {
      return res.status(500).json({
        error: "Yêu cầu cấu hình GEMINI_API_KEY trong Settings > Secrets.",
      });
    }

    // Build parts for multimodal prompt
    const parts: any[] = [];

    if (fileBase64 && fileMimeType) {
      parts.push({
        inlineData: {
          data: fileBase64,
          mimeType: fileMimeType,
        },
      });
    }

    const typeDesc = questionTypes.map((t: string) => {
      if (t === "multiple-choice") return "- 'multiple-choice': Trắc nghiệm 1 đáp án đúng";
      if (t === "checkboxes") return "- 'checkboxes': Trắc nghiệm nhiều đáp án đúng (hộp kiểm)";
      if (t === "true-false") return "- 'true-false': Đúng / Sai (Cung cấp 2 lựa chọn 'Đúng' và 'Sai')";
      if (t === "short-answer") return "- 'short-answer': Trả lời ngắn, điền từ";
      return t;
    }).join("\n");

    const promptText = `
Hãy soạn một ngân hàng gồm chính xác ${numQuestions} câu hỏi trắc nghiệm chất lượng cao bằng tiếng Việt dựa trên giáo án bài giảng và các tài liệu bổ sung đa dạng hóa đi kèm sau:

MỤC TIÊU CẤU PHẦN:
- Tên cấu phần học tập: "${levelName}" (Phân loại cấp độ: ${levelType})
- Định dạng yêu cầu về độ khó: "${difficulty.toUpperCase()}"
- Cấu hình số lượng phương án cho câu hỏi trắc nghiệm/hộp kiểm: tối đa ${numOptions} phương án.

NGUỒN 1: GIÁO ÁN BÀI GIẢNG GỐC (HỌC LIỆU CHÍNH THỨC):
${syllabusContext ? `"""\n${syllabusContext}\n"""` : "Chưa cấu hình sẵn học liệu gốc từ lesson plan bài học. Vui lòng tập trung khai thác Nguồn 2 và Nguồn 3 bên dưới để sinh câu hỏi."}

NGUỒN 2: GHI CHÚ BỔ SUNG / GHI CHÚ ĐA DẠNG HÓA CỦA GIÁO VIÊN:
${contextText ? `"""\n${contextText}\n"""` : "Không có ghi chú thêm."}

NGUỒN 3: TÀI LIỆU FILE NGOÀI (PDF/TXT ĐƯỢC TẢI LÊN):
${fileBase64 ? "Đã đính kèm tệp tin tài liệu ngoài ở định dạng đa phương tiện (multimodal). Hãy đọc hiểu sâu sắc tệp tin đính kèm này và kết hợp nhuần nhuyễn với GIÁO ÁN BÀI GIẢNG GỐC ở Nguồn 1 để đa dạng hóa câu đố, tạo ra các câu hỏi mở rộng thú vị, phong phú và đa chiều nhất." : "Không có tệp tin đính kèm."}

CÁC LOẠI CÂU HỎI ĐƯỢC PHÉP SINH RA (hãy phân bổ phân chia đều hoặc đa dạng các loại câu hỏi theo danh sách này):
${typeDesc}

YÊU CẦU CHẤT LƯỢNG SƯ PHẠM:
1. Câu hỏi phải bám sát GIÁO ÁN BÀI GIẢNG GỐC (Nguồn 1) để đảm bảo bám sát khung giáo án chương trình học, nhưng đồng thời hãy linh động đan xen các ngữ cảnh, thuật ngữ hay câu chuyện phân tích sâu từ tài liệu file tải lên (Nguồn 3) để đa dạng hóa câu đố và tăng độ phong phú kiểm tra.
2. Tránh các câu hỏi quá đơn giản, nông cạn. Hãy đưa ra các câu hỏi đòi hỏi tư duy, phân tích hoặc hiểu sâu kiến thức bài học nếu đặt ở độ khó học thuật TB hoặc KHÓ.
3. Giải thích (explanation) bằng tiếng Việt thật tỉ mỉ, chi tiết về lý do tại sao phương án đó lại đúng. Giải thích này cực kỳ quan trọng cho người học.
4. Với câu hỏi loại 'true-false', danh sách 'options' phải gồm đúng 2 lựa chọn: một cái là "Đúng", một cái là "Sai", và đánh dấu chính xác 'isCorrect' ứng với đáp án thực tế.
5. Với câu hỏi 'short-answer' (trả lời ngắn), trường 'options' có thể để trống hoặc rỗng [], nhưng bạn BẮT BUỘC phải điền thông tin đáp án mẫu gợi ý vào trường 'correctShortAnswer'.

Sử dụng định dạng JSON hoàn hảo khớp với cấu trúc schema được yêu cầu. Đảm bảo toàn bộ ngôn ngữ hiển thị là tiếng Việt chuẩn.
`;

    parts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: parts,
      config: {
        systemInstruction: "Bạn là một giảng viên đại học, một chuyên gia nghiên cứu và xây dựng đề kiểm tra, ngân hàng câu hỏi khảo thí trắc nghiệm chuyên nghiệp bằng tiếng Việt. Nhiệm vụ của bạn là luôn tạo ra các câu hỏi chất lượng cao, đúng chuẩn kiến thức sư phạm và trình bày dưới dạng cấu trúc JSON chính xác theo yêu cầu.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionText: {
                    type: Type.STRING,
                    description: "Nội dung câu hỏi sư phạm rõ ràng, súc tích.",
                  },
                  questionType: {
                    type: Type.STRING,
                    description: "Loại câu hỏi: 'multiple-choice', 'checkboxes', 'true-false', hoặc 'short-answer'.",
                  },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        optionText: {
                          type: Type.STRING,
                          description: "Nội dung phương án lựa chọn.",
                        },
                        isCorrect: {
                          type: Type.BOOLEAN,
                          description: "Đánh dấu True nếu đây là phương án đúng, ngược lại False.",
                        },
                      },
                      required: ["optionText", "isCorrect"],
                    },
                    description: "Danh sách các lựa chọn phương án. Trống với câu ngắn.",
                  },
                  explanation: {
                    type: Type.STRING,
                    description: "Giải thích rõ ràng tại sao đáp án lại đúng và phương pháp làm bài.",
                  },
                  correctShortAnswer: {
                    type: Type.STRING,
                    description: "Đáp án mẫu hợp lệ (chỉ cần thiết cho câu trả lời ngắn).",
                  },
                },
                required: ["questionText", "questionType", "options", "explanation"],
              },
            },
          },
          required: ["questions"],
        },
      },
    });

    const parsedResponse = JSON.parse(response.text || "{}");
    res.json(parsedResponse);
  } catch (err: any) {
    console.error("Lỗi sinh câu hỏi bằng AI:", err);
    res.status(500).json({
      error: "Không thể sinh câu hỏi bằng AI. Chi tiết: " + (err.message || err),
    });
  }
});

// Vite middleware in dev or static server in prod
async function setupExpress() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting in DEVELOPMENT mode, mounting Vite...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting in PRODUCTION mode, serving static files...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

setupExpress();
