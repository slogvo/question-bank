import { Course } from "./types";

export const initialCourses: Course[] = [
  {
    id: "course-1",
    name: "Ngày Lễ Phật Đản",
    description: "Khóa học tìm hiểu về ngày lễ Phật Đản - một trong những lễ hội tôn giáo lớn nhất thế giới của Phật giáo.",
    questions: [
      {
        id: "q-c1-1",
        questionText: "Ngày Đại lễ Phật Đản Liên Hợp Quốc hay còn gọi là tên gọi nào dưới đây?",
        questionType: "multiple-choice",
        options: [
          { id: "opt-c1-1-1", optionText: "Vesak", isCorrect: true },
          { id: "opt-c1-1-2", optionText: "Vu Lan", isCorrect: false },
          { id: "opt-c1-1-3", optionText: "Ullambana", isCorrect: false },
          { id: "opt-c1-1-4", optionText: "Lễ Thành Đạo", isCorrect: false }
        ],
        explanation: "Vesak là ngày Đại lễ Phật Đản được Đại Hội đồng Liên Hợp Quốc công nhận chính thức từ năm 1999."
      }
    ],
    chapters: [
      {
        id: "chap-1",
        name: "Nguồn Gốc Lịch Sử Và Thời Gian",
        description: "Khám phá nguồn gốc lịch sử, cuộc đời của Đức Phật Thích Ca Mâu Ni và mốc thời gian diễn ra sự kiện.",
        questions: [
          {
            id: "q-ch1-1",
            questionText: "Đức Phật Thích Ca Mâu Ni đản sinh tại vườn nào có thực tại Nepal ngày nay?",
            questionType: "multiple-choice",
            options: [
              { id: "opt-ch1-1-1", optionText: "Vườn tràm chim", isCorrect: false },
              { id: "opt-ch1-1-2", optionText: "Vườn Lâm-tỳ-ni (Lumbini)", isCorrect: true },
              { id: "opt-ch1-1-3", optionText: "Rừng Lộc Uyển", isCorrect: false },
              { id: "opt-ch1-1-4", optionText: "Vườn Kỳ Đà", isCorrect: false }
            ],
            explanation: "Sự kiện Phật đản sinh diễn ra tại vườn Lâm-tỳ-ni (Lumbini), thuộc quốc gia Nepal ngày nay."
          }
        ],
        lessons: [
          {
            id: "les-1",
            name: "Tổng Quan Và Sự Công Nhận",
            description: "Bài diễn giải về các nghị quyết quốc tế quốc tế công nhận ngày lễ trọng đại này.",
            materialText: "Ngày Phật đản (hay Đại lễ Vesak) là ngày kỷ niệm ba sự kiện trọng đại trong cuộc đời Đức Phật Thích Ca Mâu Ni: Đản sinh, Thành đạo và Nhập Niết-bàn. Vào ngày 15 tháng 12 năm 1999, tại phiên họp thứ 54 của Đại hội đồng Liên Hợp Quốc, ngày lễ này đã được công nhận là ngày lễ văn hóa tôn giáo quốc tế.",
            questions: []
          },
          {
            id: "les-2",
            name: "Thời Gian Tổ Chức Và Sự Kiện",
            description: "Nội dung học tập chi tiết lịch âm dương và sự chuyển biến sự kiện.",
            materialText: "Đại lễ Phật Đản thường được tổ chức vào ngày Rằm tháng Tư âm lịch hàng năm ở các quốc gia Phật giáo Bắc truyền, hoặc vào ngày trăng tròn tháng 5 dương lịch ở các nước Phật giáo Nam truyền (được gọi là lễ Vesak).",
            questions: []
          }
        ]
      },
      {
        id: "chap-2",
        name: "Ý Nghĩa Tâm Linh Và Triết Học",
        description: "Phân tích triết lý hòa bình, trí tuệ đạo Phật hướng tới cuộc sống nhân sinh.",
        questions: [],
        lessons: [
          {
            id: "les-3",
            name: "Ánh Sáng Trí Tuệ Và Tinh Thần",
            description: "Thuyết giảng về triết lý vô thường, vô ngã kích hoạt trí tuệ nội tâm.",
            materialText: "Ánh sáng trí tuệ của Đức Phật giúp con người phá tan màng u tối của vô minh, hiểu rõ quy luật duyên sinh, vô thường và vô ngã để tìm thấy sự giải thoát thực sự ngay trong đời sống thường nhật.",
            questions: []
          },
          {
            id: "les-4",
            name: "Thông Điệp Hòa Bình Và Khiêm Cung",
            description: "Lòng từ bi và đạo đức nhân bản của con người trong bình đẳng tuyệt đối.",
            materialText: "Một trong những thông điệp cốt lõi của lễ Phật đản là kêu gọi hòa bình thế giới, tôn trọng sự sống, trưởng dưỡng lòng từ bi bỉ xả vô điều kiện đối với mọi chúng sinh.",
            questions: []
          }
        ]
      },
      {
        id: "chap-3",
        name: "Nghi Thức Truyền Thống Và Tình Huống",
        description: "Các nghi thức văn hóa Phật giáo như Tắm Phật, ăn chay, phóng sinh và làm từ thiện.",
        questions: [],
        lessons: [
          {
            id: "les-5",
            name: "Các Nghi Lễ Tâm Linh Và Hoạt Động",
            description: "Tìm hiểu nghi thức tắm Phật tôn kính và rước hoa đăng đầy mầu sắc.",
            materialText: "Nghi lễ Tắm Phật (Tẩy trần Đức Phật sơ sinh) là nghi thức linh thiêng nhất. Người tham gia múc nước thơm rưới lên tượng Phật sơ sinh, biểu trưng cho sự tẩy trừ phiền não, gột rửa thân tâm trong sạch của chính mình.",
            questions: []
          },
          {
            id: "les-6",
            name: "Tinh Thần Phật Đản Trong Đời Sống",
            description: "Lan tỏa hạnh nguyện sẻ chia, làm việc thiện và bảo vệ môi trường sinh thái.",
            materialText: "Tinh thần Phật đản được biểu hiện thông qua việc ăn chay tế sống cứu khổ, thực hành bố thí quyên góp từ thiện giúp đỡ các gia đình khó khăn, dọn dẹp vệ sinh môi trường xã hội ôn hòa.",
            questions: []
          }
        ]
      }
    ]
  }
];
