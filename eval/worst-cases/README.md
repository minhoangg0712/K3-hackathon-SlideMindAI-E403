# Bộ test 8 điểm yếu — bản gốc so với bản của nhóm

Mỗi điểm yếu của AI Assistant trên `vlearn.dev` có một phép đo riêng, chạy được
bằng một lệnh, kết quả ghi ra `runs/`.

```bash
cd codebase && npm run dev     # cửa sổ khác
node eval/worst-cases/run.mjs
node eval/worst-cases/run.mjs --only=W1,W8
```

## Hai cột so sánh lấy từ đâu

**Cột bản gốc không chạy qua mạng.** Hành vi bản gốc là hằng số nằm trong bundle
production đã lưu ở `evidence/vlearn-bundle/` — `confidence` luôn là `.85` hoặc
`.6`, `memory_used` luôn `false`, `tools` luôn rỗng. Chạy lại trên tài khoản thật
chỉ tốn quota mà kết quả vẫn thế. Tự kiểm chứng từng dòng code:

```bash
node evidence/verify.mjs 1     # confidence
node evidence/verify.mjs 8     # cắt 2000 ký tự
```

**Cột bản của nhóm chạy thật** qua endpoint SSE ở `--base`, không mock lớp nào.
Case nào chưa làm thì bảng ghi "chưa sửa" — không có case nào được cho điểm dựa
trên ý định.

## Vì sao W5 và W6 chỉ kiểm tra endpoint

Kiểm tra đầy đủ W5 phải bắn 16 request liên tiếp để xem request thứ 16 có bị 429
không, và như thế là đốt sạch quota Gemini free tier trong một lần chạy. Script
chỉ hỏi endpoint có tồn tại không — đủ để kết luận quota còn nằm ở client hay đã
lên server. Kiểm chứng đầy đủ bằng tay:

- **W5:** hỏi cho hết 15 lượt → xoá key `vlearn_quota_*` trong DevTools →
  F5. Bộ đếm về 0 nghĩa là quota vẫn ở client.
- **W6:** hỏi vài câu → F5. Hội thoại biến mất nghĩa là chưa lưu ở server.

## Đọc kết quả

`runs/<timestamp>.md` là bảng để dán vào slide; `runs/<timestamp>.jsonl` là dữ
liệu thô của cùng lượt chạy, mỗi dòng một case kèm số đo chi tiết.

Bộ này đo **8 điểm yếu đã tìm ra**, khác với `eval/golden_set.jsonl` đo **chất
lượng trả lời** trên 24 tình huống. Hai bộ trả lời hai câu hỏi khác nhau, không
thay thế nhau.
