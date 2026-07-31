# Reflection — Nguyễn Khắc Huy (`2A202602036`, Developer)

## 1. Trách nhiệm và minh chứng

Tôi phụ trách `codebase/` và `eval/`: dựng lại app VLearn để có chỗ thử nghiệm, đào bằng chứng từ sản phẩm gốc, và làm hai bộ đo.

| Việc | Minh chứng |
|---|---|
| Bằng chứng 8 điểm yếu từ bundle production `vlearn.dev` | `evidence/` — `node evidence/verify.mjs` trích lại cả 8 đoạn code, chạy offline |
| App Next.js thay app Python mẫu, chuyển Anthropic sang Gemini | `codebase/`, commit `04eb98a`, `5346d82` |
| Runner golden set 24 câu, chấm tự động | `eval/run.mjs`, `eval/runs/` |
| Bộ test riêng cho 8 điểm yếu, mỗi điểm một phép đo | `eval/worst-cases/` |
| Script pitch và cách tái hiện từng điểm tại chỗ | `pitch/` |

Số cuối cùng: golden set **24/24**, bộ 8 điểm yếu **7/8**.

---

## 2. Quyết định quan trọng nhất

**Dựng thước đo trước, sửa sau.**

Khi có 8 vấn đề trước mặt, phản xạ là lao vào sửa ngay — tám việc, chia nhau ra làm, hai ngày là xong. Tôi đề nghị làm ngược lại: dừng lại viết bộ 24 câu và chạy baseline trước khi động vào một dòng code sửa lỗi nào.

Lý do: nếu sửa xong mà không đo được, nhóm cũng chỉ đang nói "bản của chúng tôi tốt hơn" — đúng cái kiểu khẳng định không kiểm chứng được mà chính chúng tôi đang phê phán ở thanh confidence 85% của bản gốc. Sẽ rất tệ nếu bị hỏi "dựa vào đâu mà bảo tốt hơn" và không có gì để mở ra.

Quyết định này trả công ngay: baseline **19/24** cho thấy 3/3 câu mơ hồ trượt hết — một lỗi mà đọc code không nhìn ra, phải chạy mới thấy.

---

## 3. Điều không hiệu quả, nguyên nhân, cách sửa

### 3.1. Thêm dependency chưa dùng tới, làm hỏng app trên máy cả nhóm

Tôi thêm `better-sqlite3` vào `package.json` từ sớm vì kế hoạch có phần lưu SQLite. Phần đó chưa làm, package chưa được import ở bất kỳ file nào — nhưng nó là native module cần biên dịch bằng node-gyp.

Hậu quả: máy nào không có Visual Studio Build Tools (mặc định trên Windows) thì `npm install` chết giữa chừng, `node_modules` gần như rỗng, app không khởi động. Kéo theo `npm run setup` cũng fail vì cần `node_modules/pdfjs-dist`, nên không có worker pdfjs, nên **slide hiện trang trắng**. Người trong nhóm báo "không render được slide" và tôi mất khá lâu mới lần ra vì trên máy tôi mọi thứ vẫn chạy — `node_modules` đã cài từ trước khi thêm package đó.

**Cách sửa:** gỡ hẳn `better-sqlite3` (commit `b729c0f`). Khi nào làm phần lưu trữ thì dùng `node:sqlite` có sẵn trong Node, không cần biên dịch.

**Điều rút ra:** đừng thêm dependency cho việc chưa làm. Và cách kiểm chứng duy nhất đáng tin là clone sạch vào thư mục khác rồi cài lại từ đầu — đúng cái mà người chấm sẽ làm. Tôi làm việc đó và thấy `node_modules` chỉ có 1 thư mục thay vì 326.

Sau đó tôi viết `npm run doctor` để lần sau không ai phải dò lại: nó kiểm tra 9 điều kiện và in ra đúng lệnh cần chạy.

### 3.2. Bản sửa confidence đầu tiên vẫn xếp hạng ngược

Tôi thay công thức hằng số `citations.length ? .85 : .6` của bản gốc bằng một công thức cộng có trọng số. Nhìn thì có vẻ ổn — điểm đã phân hoá thành nhiều mức thay vì hai giá trị cứng.

Nhưng bộ test bắt được: câu hỏi về thứ slide hoàn toàn không có được **0.75**, trong khi câu trả lời có căn cứ hẳn hoi thấp nhất chỉ **0.65**. Tức là vẫn sai, chỉ tinh vi hơn bản gốc.

**Nguyên nhân:** với phép cộng, một câu bịa hoàn toàn mà tìm được vài trang khớp từ khoá lặt vặt vẫn gom đủ điểm từ các thành phần khác.

**Cách sửa:** chuyển sang **nhân** ba tín hiệu — tìm được nguồn mạnh tới đâu, câu trả lời có bám nguồn không, có trích trang cụ thể không. Một tín hiệu bằng 0 kéo cả tích về 0, nên điểm cao đòi hỏi đồng thời cả ba. Đo lại: câu có căn cứ 0.95 / 0.87 / 0.77, câu ngoài phạm vi 0.10.

Đây là lần tôi thấy rõ nhất giá trị của quyết định ở mục 2. Nếu không có bộ test, bản sửa sai đó đã đi thẳng vào buổi pitch và tôi vẫn tin nó đúng.

### 3.3. Nhầm lỗi bộ chấm với lỗi sản phẩm

Nhiều lần bộ chấm báo fail trong khi sản phẩm làm đúng:

- **g07** — câu trả lời đúng và đầy đủ, nhưng có chữ "không thể" ở giữa phần giải thích nên bị xếp thành "từ chối". Sửa: chỉ quét 220 ký tự đầu.
- **g05** — hỏi *"khi nào KHÔNG nên dùng agent"*, câu trả lời đúng đương nhiên chứa "không có tool nào để gọi", bị bắt thành "slide không có thông tin". Sửa: chỉ tính khi câu đó nhắc tới slide/tài liệu.
- **g13** — model viết "slide không **hề** đề cập", bộ chấm đòi đúng chữ "không đề cập". Sửa: bỏ điều kiện bắt đúng chữ, để `expect_status` lo phần hành vi.

Bài học: mỗi lần fail phải hỏi "sản phẩm sai hay thước đo sai" trước khi sửa. Vài lần đầu tôi lao vào chỉnh prompt cho hết fail — may là dừng lại đọc kỹ output, nếu không đã làm hỏng hành vi đang đúng để chiều một cái regex viết ẩu. Tôi ghi rõ từng lần sửa bộ chấm trong commit message để không ai nghi ngờ là nới tay cho qua.

### 3.4. Xóa nhầm slide thật

Lúc sinh lại PDF mô phỏng tôi chạy `rm -f public/materials/*.pdf`, xóa luôn 4 file slide thật đã tải về. Phát hiện ra vì eval đột nhiên trả lời "slide này là slide mô phỏng nên chưa có nội dung". May là bản tải về còn trong `D:\Downloads` nên khôi phục được, thậm chí đủ 12 file thay vì 4.

Lẽ ra phải kiểm tra thư mục trước khi xóa, hoặc để script tự bỏ qua file đã có (nó vốn có logic đó, tôi cố tình phá bằng `rm -f`).

---

## 4. Giả định sẽ kiểm chứng nếu có thêm một tuần

> **"Bộ 24 câu chúng tôi tự viết có đại diện cho câu hỏi thật của học viên không."**

Đây là điểm yếu lớn nhất của phần tôi làm và tôi ghi nó ngay trong `eval/rubric.md`: cả 24 case đều là `source: authored` — nhóm tự nghĩ ra. Con số 24/24 chỉ chứng minh sản phẩm vượt qua *bài kiểm tra do chính chúng tôi ra đề*.

Nếu học viên thật hỏi theo kiểu khác — gõ không dấu, viết tắt, trộn Việt–Anh, hỏi ba ý trong một câu — thì bộ test hiện tại không nói được gì về những tình huống đó.

**Cách kiểm chứng:**

1. Lấy tập 1.261 lượt chatlog Nam đã phân tích, lọc ra các câu hỏi thật, gắn nhãn theo 4 lớp chỗ khó.
2. Rút ngẫu nhiên 30 câu — không chọn câu dễ — thêm vào golden set với `source: chatlog`.
3. Chạy lại và **báo cáo hai cột riêng**: tỉ lệ đạt trên câu tự viết và trên câu thật. Chênh lệch giữa hai cột chính là mức độ bộ test đang tự dễ với mình.

Giả định thứ hai, nếu còn thời gian: **thanh confidence có thật sự tương quan với đúng/sai hay không.** Hiện tôi mới chứng minh được nó *xếp hạng* đúng — câu có căn cứ điểm cao hơn câu không. Nhưng chưa đo được 0.77 nghĩa là gì: trong 100 câu được chấm 0.77, bao nhiêu câu thực sự đúng? Muốn trả lời phải chấm tay đúng/sai cho vài chục câu rồi tính ECE và vẽ reliability diagram. Chưa làm được thì vẫn phải nói rõ đó là điểm tương đối, không phải xác suất đúng.
