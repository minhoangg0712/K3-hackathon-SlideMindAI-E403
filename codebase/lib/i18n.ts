/**
 * Bảng chuỗi VI/EN. Các chuỗi ở đây lấy nguyên văn từ bảng i18n của
 * vlearn.dev (bundle chunk 6334) để giao diện khớp từng chữ với bản gốc.
 * Nhóm `courseDetail` bản gốc hardcode tiếng Việt trong page, phần EN là
 * bản dịch bổ sung của mình.
 */

export type Locale = "vi" | "en";

export const LOCALES: Locale[] = ["vi", "en"];

const vi = {
  brand: {
    eyebrow: "VLEARN · VINUNI AI THỰC CHIẾN",
  },
  account: {
    logout: "Đăng xuất",
    account: "Tài khoản",
    openAccountMenu: "Mở menu tài khoản",
    accountMenuTitle: "Tài khoản VLearn",
    roleField: "Vai trò",
    cohortField: "Cohort",
    openCodelabs: "Mở Codelabs",
    switchLanguage: "Switch to English",
    toDark: "Chuyển giao diện tối",
    toLight: "Chuyển giao diện sáng",
  },
  nav: {
    home: "Trang chủ",
    myCourses: "Khóa học của tôi",
    studyNotebook: "Sổ tay học tập",
  },
  roles: {
    student: "Sinh viên",
  },
  dashboard: {
    title: "Không gian học tập VLearn",
    subtitle:
      "Theo dõi tiến độ, học liệu và phần kiến thức cần củng cố tại VinUni AI Thực Chiến.",
    coursesInProgress: (n: number) => `${n} khóa học đang theo học`,
    welcomeBack: (name: string) => `Chào mừng trở lại, ${name}!`,
    defaultStudentName: "Sinh viên",
    heroBody:
      "VLearn đang tổng hợp tiến độ đọc và các tín hiệu học tập. Mở Khóa học của tôi để tiếp tục ngày học hoặc trao đổi cùng VLearn Tutor.",
    signalActive: "Tín hiệu học tập đang hoạt động",
    mission: "Nhiệm vụ: Hoàn thành Tuần 3",
    metrics: {
      courses: "Khóa học",
      flashcards: "Flashcard đã xem",
      tutorQuestions: "Câu hỏi với Tutor",
      avgProgress: "Tiến độ TB",
    },
    myCourses: "Khóa học của tôi",
    myCoursesSubtitle:
      "Mỗi khóa học lưu trữ tài liệu, giáo án và phần ghi chú tương tác của riêng bạn.",
    viewMyCourses: "Xem khóa học của tôi",
    viewMyCoursesHint: "Mở danh sách đầy đủ các lớp bạn đang theo học.",
    studyNotebookHint: "Ghi chú, flashcard và phần kiến thức cần củng cố của bạn.",
    loadingCourses: "Đang tải danh sách lớp từ database...",
    emptyTitle: "Chưa có khóa học nào được ghi danh.",
    emptyBody: "Khi khoa tạo khóa học mới, bạn sẽ thấy lớp học xuất hiện tại đây.",
    readyToStudy: "Sẵn sàng học",
  },
  courseCard: {
    openCourseAria: (name: string) => `Mở khóa học ${name}`,
    readPercent: (n: number) => `${n}% đọc`,
    openCourse: "Mở khóa học",
    description: (name: string) => `Khóa học ${name}`,
  },
  courseDetail: {
    subtitle: (students: number, done: number, total: number) =>
      `${students} học viên cùng lớp · ${done}/${total} ngày đã hoàn thành`,
    startReading: "Bắt đầu đọc",
    day: "DAY",
    notCompleted: "Chưa hoàn thành",
    completed: "Đã hoàn thành",
    readSlide: "Đọc Slide",
    otherSlides: (n: number) => `CHỌN SLIDE KHÁC (${n})`,
    personalProgress: "Tiến độ cá nhân",
    personalProgressBody: (done: number, total: number) => ({
      before: "Bạn đã hoàn thành ",
      done: String(done),
      middle: " trên tổng số ",
      total: String(total),
      after: " ngày học của học phần này.",
    }),
    noMaterial: "Chưa có tài liệu cho ngày học này.",
    notFound: "Không tìm thấy khóa học.",
  },
  readerSidebar: {
    title: "Học liệu môn học",
    subtitle: "Chương, slide và tài liệu đã upload",
    noMaterials: "Chưa có tài liệu nào cho môn học này.",
    loadFailed: "Không tải được danh sách tài liệu. Kiểm tra server đang chạy và đã chạy `npm run setup`.",
    materialsCount: (n: number, status: string) => `${n} tài liệu · ${status}`,
    studying: "Studying",
    pages: (n: number) => `${n} trang`,
    showMaterials: "Hiện danh sách học liệu",
    hideMaterials: "Thu gọn danh sách học liệu",
  },
  readerHeader: {
    back: "Quay lại",
    defaultTitle: "Trình đọc học liệu VLearn",
    anonymousStudent: "Sinh viên ẩn danh",
  },
  readerToolbar: {
    read: "Đọc",
    pen: "Bút",
    highlight: "Highlight",
    moreTip: "Công cụ bổ sung",
    zoomOut: "Thu nhỏ canvas",
    zoomReset: "Đặt lại zoom 100%",
    zoomIn: "Phóng to canvas",
    download: "Tải tài liệu",
    pageNote: (page: number, notes: number) => `Trang ${page} · ${notes} note`,
    page: (current: number, total: number) => `Trang ${current} / ${total}`,
    prevPage: "Trang trước",
    nextPage: "Trang sau",
  },
  canvas: {
    loading: "Đang tải trình đọc PDF...",
    failed: "Không tải được PDF. Kiểm tra file trong public/materials.",
  },
  readerChat: {
    openAssistant: "Mở VLearn Tutor",
    hideAssistant: "Thu gọn VLearn Tutor",
    title: "VLearn Tutor",
    ragStatus: "Trợ lý học theo ngữ cảnh",
    newChat: "Cuộc trò chuyện mới",
    history: "Lịch sử trò chuyện",
    emptyHistory: "Chưa có cuộc trò chuyện đã lưu.",
    historyAria: "Mở lịch sử trò chuyện",
    slidePage: (n: number) => `Trang slide: ${n}`,
    contextPage: (n: number) => `Ngữ cảnh: Slide trang ${n}`,
    welcome:
      "Xin chào! Mình là VLearn Tutor. Bạn có thể bôi đen một đoạn trên slide để hỏi hoặc gửi câu hỏi tự do nhé!",
    inputPlaceholder: "Nhập câu hỏi hoặc bôi đen tài liệu...",
    newChatAria: "Bắt đầu cuộc trò chuyện mới",
    quotaReached: (n: number) => `Đã đạt hạn mức ${n} câu/ngày.`,
    quotaPlaceholder: "Đã chạm trần lượt chat...",
    send: "Gửi câu hỏi",
  },
  quota: {
    label: "Quota Tutor trong ngày",
    count: (used: number, max: number) =>
      max > 0 ? `${used} / ${max} câu` : `${used} câu · không giới hạn`,
    byokInfo: "Thông tin BYOK",
  },
  aiMessage: {
    confidence: {
      veryHigh: "Rất tin cậy",
      high: "Tin cậy",
      medium: "Trung bình",
      low: "Thấp",
      unsure: "Không chắc",
    },
    answered: "Đã trả lời",
    notFound: "Không tìm thấy",
    unavailable: "AI không khả dụng",
    helpfulPrompt: "Phản hồi này có hữu ích không?",
    thumbsUp: "Phản hồi hữu ích",
    thumbsDown: "Phản hồi không hữu ích",
    ratingRecorded: "Đã ghi nhận phản hồi.",
    sources: (n: number) => `${n} nguồn`,
    tryHighlight:
      "Thử bôi đen một đoạn cụ thể trên slide để AI trả lời chính xác hơn.",
  },
  byok: {
    title: "Khóa cá nhân sẽ được bảo vệ phía server",
    notReady:
      "VLearn chưa nhận API key trên giao diện này cho tới khi backend hỗ trợ kiểm tra, mã hóa và xóa khóa an toàn. Khóa sẽ không được lưu trong trình duyệt.",
    close: "Đóng",
  },
};

export type Dictionary = typeof vi;

const en: Dictionary = {
  brand: {
    eyebrow: "VLEARN · VINUNI AI IN ACTION",
  },
  account: {
    logout: "Log out",
    account: "Account",
    openAccountMenu: "Open account menu",
    accountMenuTitle: "VLearn account",
    roleField: "Role",
    cohortField: "Cohort",
    openCodelabs: "Open Codelabs",
    switchLanguage: "Chuyển sang tiếng Việt",
    toDark: "Switch to dark theme",
    toLight: "Switch to light theme",
  },
  nav: {
    home: "Home",
    myCourses: "My courses",
    studyNotebook: "Study Notebook",
  },
  roles: {
    student: "Student",
  },
  dashboard: {
    title: "VLearn learning space",
    subtitle:
      "Track your progress, materials, and the knowledge to reinforce at VinUni AI In Action.",
    coursesInProgress: (n: number) => `${n} ${n === 1 ? "course" : "courses"} in progress`,
    welcomeBack: (name: string) => `Welcome back, ${name}!`,
    defaultStudentName: "Student",
    heroBody:
      "VLearn is aggregating your reading progress and learning signals. Open My courses to continue your day or chat with VLearn Tutor.",
    signalActive: "Learning signals active",
    mission: "Mission: Complete Week 3",
    metrics: {
      courses: "Courses",
      flashcards: "Flashcards viewed",
      tutorQuestions: "Tutor questions",
      avgProgress: "Avg. progress",
    },
    myCourses: "My courses",
    myCoursesSubtitle:
      "Each course stores its own materials, lesson plans, and your interactive notes.",
    viewMyCourses: "View my courses",
    viewMyCoursesHint: "Open the full list of classes you are enrolled in.",
    studyNotebookHint: "Your notes, flashcards, and the knowledge to reinforce.",
    loadingCourses: "Loading your classes from the database...",
    emptyTitle: "You're not enrolled in any courses yet.",
    emptyBody: "When your faculty creates a new course, it will appear here.",
    readyToStudy: "Ready to study",
  },
  courseCard: {
    openCourseAria: (name: string) => `Open course ${name}`,
    readPercent: (n: number) => `${n}% read`,
    openCourse: "Open course",
    description: (name: string) => `Course ${name}`,
  },
  courseDetail: {
    subtitle: (students: number, done: number, total: number) =>
      `${students} classmates · ${done}/${total} days completed`,
    startReading: "Start reading",
    day: "DAY",
    notCompleted: "Not completed",
    completed: "Completed",
    readSlide: "Read slides",
    otherSlides: (n: number) => `CHOOSE ANOTHER SLIDE (${n})`,
    personalProgress: "Personal progress",
    personalProgressBody: (done: number, total: number) => ({
      before: "You have completed ",
      done: String(done),
      middle: " out of ",
      total: String(total),
      after: " study days in this course.",
    }),
    noMaterial: "No materials for this day yet.",
    notFound: "Course not found.",
  },
  readerSidebar: {
    title: "Course materials",
    subtitle: "Chapters, slides, and uploaded documents",
    noMaterials: "No materials are available for this course yet.",
    loadFailed: "Couldn't load the material list. Check that the server is running and `npm run setup` has been run.",
    materialsCount: (n: number, status: string) => `${n} materials · ${status}`,
    studying: "in progress",
    pages: (n: number) => `${n} pages`,
    showMaterials: "Show course materials",
    hideMaterials: "Collapse course materials",
  },
  readerHeader: {
    back: "Go back",
    defaultTitle: "VLearn learning reader",
    anonymousStudent: "Anonymous student",
  },
  readerToolbar: {
    read: "Read",
    pen: "Pen",
    highlight: "Highlight",
    moreTip: "More tools",
    zoomOut: "Zoom out",
    zoomReset: "Reset zoom to 100%",
    zoomIn: "Zoom in",
    download: "Download material",
    pageNote: (page: number, notes: number) => `Page ${page} · ${notes} notes`,
    page: (current: number, total: number) => `Page ${current} / ${total}`,
    prevPage: "Previous page",
    nextPage: "Next page",
  },
  canvas: {
    loading: "Loading the PDF reader...",
    failed: "Couldn't load the PDF. Check the file in public/materials.",
  },
  readerChat: {
    openAssistant: "Open VLearn Tutor",
    hideAssistant: "Collapse VLearn Tutor",
    title: "VLearn Tutor",
    ragStatus: "Context-aware learning assistant",
    newChat: "New chat",
    history: "Chat history",
    emptyHistory: "No saved conversations yet.",
    historyAria: "Open chat history",
    slidePage: (n: number) => `Slide page: ${n}`,
    contextPage: (n: number) => `Context: Slide page ${n}`,
    welcome:
      "Hello! I am VLearn Tutor. Highlight a passage on the slide to ask about it, or send a free-form question anytime.",
    inputPlaceholder: "Ask a question or highlight text in the material...",
    newChatAria: "Start a new conversation",
    quotaReached: (n: number) => `You've reached the ${n} questions/day limit.`,
    quotaPlaceholder: "You've hit the chat limit...",
    send: "Send question",
  },
  quota: {
    label: "Daily Tutor quota",
    count: (used: number, max: number) =>
      max > 0 ? `${used} / ${max} questions` : `${used} questions · unlimited`,
    byokInfo: "BYOK info",
  },
  aiMessage: {
    confidence: {
      veryHigh: "Very confident",
      high: "Confident",
      medium: "Moderate",
      low: "Low",
      unsure: "Unsure",
    },
    answered: "Answered",
    notFound: "Not found",
    unavailable: "AI unavailable",
    helpfulPrompt: "Was this response helpful?",
    thumbsUp: "Helpful response",
    thumbsDown: "Unhelpful response",
    ratingRecorded: "Feedback recorded.",
    sources: (n: number) => `${n} sources`,
    tryHighlight:
      "Try highlighting a specific passage on the slide so the AI can be more precise.",
  },
  byok: {
    title: "Your personal key stays protected server-side",
    notReady:
      "VLearn does not accept API keys in this interface until the backend supports safe validation, encryption, and deletion. The key is never stored in the browser.",
    close: "Close",
  },
};

export const DICTIONARIES: Record<Locale, Dictionary> = { vi, en };

/** Nhãn confidence theo cùng ngưỡng bản gốc dùng trên thanh tin cậy. */
export function confidenceLabel(dict: Dictionary, confidence: number): string {
  const c = dict.aiMessage.confidence;
  if (confidence >= 0.9) return c.veryHigh;
  if (confidence >= 0.75) return c.high;
  if (confidence >= 0.5) return c.medium;
  if (confidence >= 0.3) return c.low;
  return c.unsure;
}
