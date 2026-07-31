# Script pitch — VLearn Tutor

Kịch bản kể toàn bộ câu chuyện: **quy trình làm việc → cách tìm ra điểm yếu → cách sửa → số đo**.

Phần chứng minh từng điểm yếu bằng DevTools nằm ở [demo-script.md](demo-script.md); prompt copy-paste ở [prompts.md](prompts.md). File này là phần *nói*.

**Tổng: 5 phút.** Bản rút gọn 2 phút ở cuối.

---

## Chuẩn bị (làm trước khi lên)

| Việc | Lệnh / chi tiết |
|---|---|
| Server chạy sẵn | `npm run dev`, **đừng restart** — cache câu trả lời nằm trong bộ nhớ tiến trình |
| Nạp cache các câu demo | Hỏi trước 3 câu sẽ dùng, để lúc pitch trả lời tức thì kể cả khi hết quota |
| Kiểm tra máy | `npm run doctor` — phải OK hết 9 mục |
| Quota Gemini | Đặt `GEMINI_API_KEY_POOL` 2 key khác tài khoản. Hết quota giữa pitch là hỏng |
| Quota Tutor | `NEXT_PUBLIC_TUTOR_DAILY_LIMIT=0` để không bị chặn ở câu thứ 16 |
| Terminal | Mở sẵn ở thư mục repo, gõ trước `node evidence/verify.mjs` một lần cho khỏi lag |

---

## 1. Mở đầu — vấn đề (30 giây)

> "VLearn có một AI Tutor. Nó trả lời được.
>
> Câu hỏi của chúng tôi không phải *nó có trả lời được không*. Mà là: **học viên có cách nào biết câu trả lời đó đáng tin hay không.**
>
> Trên giao diện có một thanh 'độ tin cậy 85%'. Chúng tôi đi tìm xem con số đó được tính từ đâu."

*(Ngừng. Đây là câu móc — đừng vội nói tiếp.)*

---

## 2. Cách chúng tôi tìm ra điểm yếu (60 giây)

> "Chúng tôi làm ba lớp, từ ngoài vào trong.
>
> **Lớp một — dùng thật.** Ngồi đọc slide và hỏi Tutor như một học viên. Ghi lại mọi chỗ khó chịu: hỏi khái niệm học buổi trước thì nó bảo 'tài liệu không đề cập'; gõ câu dài thì câu trả lời lạc đề; đóng tab là mất sạch hội thoại.
>
> **Lớp hai — mở DevTools.** Xem đúng cái gói tin trình duyệt gửi lên server mỗi lần hỏi. Nó dài khoảng 300 byte. Không có số trang. Không có tên tài liệu. Không có lịch sử. `tools` rỗng, `context` rỗng.
>
> **Lớp ba — đọc mã nguồn.** VLearn gửi toàn bộ JavaScript xuống trình duyệt của mọi học viên. Chúng tôi tải bundle production về, đọc, và tìm thấy dòng này:"

Gõ terminal:

```bash
node evidence/verify.mjs 1
```

> ```js
> confidence: n.length ? .85 : .6
> ```
>
> "Thanh tin cậy không đo gì cả. Nó là hai con số cứng. Có trích dẫn thì 85%, không có thì 60%. Câu trả lời đúng hay sai không ảnh hưởng gì.
>
> Tổng cộng tám điểm. Toàn bộ bằng chứng nằm trong repo, chạy một lệnh là ra — không cần tin lời chúng tôi."

**Nếu bị hỏi "sao dám đọc code người ta?"**
> "Đây là mã nguồn được gửi công khai tới trình duyệt mọi người dùng, xem bằng DevTools mà ai cũng có. Chúng tôi không truy cập server, không đăng nhập bằng tài khoản người khác, không khai thác lỗ hổng nào."

---

## 3. Việc đầu tiên không phải là sửa (45 giây)

> "Có tám vấn đề trước mặt, phản xạ tự nhiên là lao vào sửa. Chúng tôi không làm thế.
>
> Vì nếu sửa xong mà không đo được, thì chúng tôi cũng chỉ đang nói 'sản phẩm của tôi tốt hơn' — đúng cái kiểu khẳng định không kiểm chứng được mà chúng tôi vừa phê phán.
>
> **Nên việc đầu tiên là dựng thước đo.**
>
> Bộ 24 tình huống, chia theo bốn lớp chỗ khó của chính sản phẩm này:
> - **Không có nguồn** — hỏi thứ slide không hề nói. Đạt là nói thẳng 'không có', không bịa.
> - **Câu mơ hồ** — 'cho vd', 'cái này là gì'. Đạt là hỏi lại, không đoán bừa.
> - **Ngoài phạm vi** — xin đáp án bài kiểm tra. Đạt là từ chối và chỉ cách tự làm.
> - **Sai là hại** — số liệu, trang trích dẫn. Sai một chữ số là trượt.
>
> Chạy bản đầu tiên: **19 trên 24**. Ba câu mơ hồ trượt cả ba — nó đoán thay vì hỏi lại."

---

## 4. Cách sửa (90 giây)

> "Sửa theo thứ tự tác động, mỗi thứ kèm một phép đo."

### Câu mơ hồ: 0/3 → 3/3

> "Không phải đổi model. Là một luật trong system prompt, đặt ưu tiên **cao hơn** mọi luật trả lời: câu hỏi không nêu rõ đối tượng thì cấm trả lời nội dung, kể cả khi đoán được. Phải hỏi lại bằng đúng một câu dưới 40 từ.
>
> Điểm chung của tất cả các sửa: **19/24 lên 23/24**."

### Thanh tin cậy: từ hai hằng số thành số có căn cứ

> "Bản gốc: `citations.length ? .85 : .6`.
>
> Bản của chúng tôi nhân ba tín hiệu — tìm được nguồn mạnh tới đâu, câu trả lời có bám nguồn không, có trích trang cụ thể không.
>
> **Nhân chứ không cộng.** Với phép cộng có trọng số, một câu bịa hoàn toàn mà model tự tin vẫn được nửa điểm. Với phép nhân, một tín hiệu bằng không kéo cả tích về không.
>
> Đo lại: câu có căn cứ **0.95, 0.87, 0.77**. Câu hỏi về thứ slide không có: **0.10**.
>
> Và tôi phải nói thẳng — bản sửa **đầu tiên** của chúng tôi vẫn sai. Nó cho câu không có căn cứ 0.75, cao hơn cả câu có căn cứ thấp nhất là 0.65. Chính bộ test bắt được, không phải chúng tôi tự nhìn ra."

*(Đây là chỗ mạnh nhất của bài. Nói chậm.)*

### Hỏi khái niệm buổi trước

Demo trực tiếp — mở Day 5, gõ:

```
Vòng lặp ReAct gồm những bước nào?
```

> "Bản gốc chỉ có một công cụ tìm kiếm, khoá cứng trong tài liệu đang mở. Học viên hỏi khái niệm dạy buổi trước thì nhận 'tài liệu không đề cập' — trong khi nó nằm ngay trong khoá.
>
> Chúng tôi thêm công cụ thứ hai, tìm xuyên cả khoá."

*(Chỉ vào màn hình: trả lời đủ ba bước Thought–Action–Observation, ghi nguồn day03.)*

### Câu hỏi dài

> "Bản gốc cắt ở 2000 ký tự. Và vì nó ghép tiền tố vào **đầu** rồi mới cắt, phần mất là **đuôi** — tức là câu hỏi thật. Ô nhập không có giới hạn, không đếm chữ, không cảnh báo gì.
>
> Chúng tôi không nới giới hạn. Chúng tôi từ chối tường minh: mã 400, kèm giới hạn và số ký tự thực tế. Cắt thì được, cắt câm thì không."

### Hỏi lại câu vừa hỏi

> "Bản gốc trả `cache_hit: false` — hằng số. Hỏi lại y hệt vẫn tốn một lượt gọi model và một lượt quota.
>
> Của chúng tôi: **1541ms xuống 60ms**, không tốn lượt nào."

---

## 5. Kết quả (30 giây)

> "Chúng tôi làm một bộ test riêng cho tám điểm yếu đó. Mỗi điểm một phép đo, chạy một lệnh."

```bash
node eval/worst-cases/run.mjs
```

> "Lần chạy đầu: **3 trên 8**. Sau khi sửa: **7 trên 8**.
>
> Điểm còn lại là hạn mức 15 câu mỗi ngày, vẫn đếm ở trình duyệt — xoá một dòng trong DevTools là về 0. Chúng tôi biết cách sửa, chưa kịp làm. Nói ra ở đây vì bộ test của chúng tôi cũng ghi đúng như vậy, ai mở repo cũng thấy.
>
> Bảng so sánh này không phải slide vẽ tay. Nó là file do script sinh ra, có timestamp, nằm trong repo."

---

## 6. Chốt (25 giây)

> "Chúng tôi không xây một AI thông minh hơn.
>
> Chúng tôi xây một AI **biết mình đang không biết** — và nói ra điều đó thay vì đưa một con số 85% cho mọi câu trả lời.
>
> Ba thứ chúng tôi mang đi được: bộ đo có thể tái sử dụng cho bất kỳ trợ lý học tập nào; phương pháp đọc bằng chứng từ chính sản phẩm đang chạy; và thói quen đo trước khi sửa.
>
> Tám vấn đề, bảy đã sửa, một đang mở — và tất cả đều có số."

---

## Câu hỏi hay gặp

| Hỏi | Trả lời |
|---|---|
| "AI của họ có phải giả không? Nghe nói có câu trả lời viết sẵn." | "Trong bundle có một nhánh trả lời viết sẵn, nhưng nó là code chết — cờ điều khiển trả về `false` cứng, người dùng không bao giờ thấy. Nói AI của họ là giả thì sai." |
| "Sao chỉ 24 câu test?" | "24 câu đi qua đủ bốn lớp chỗ khó, mỗi lớp có tiêu chí đạt riêng. Thêm câu dễ chỉ làm đẹp tỉ lệ chứ không tìm ra lỗi mới. Điểm yếu thật của bộ này là phần lớn câu do nhóm tự viết, chưa lấy từ log người dùng thật." |
| "Sao không dùng embedding cho tìm kiếm?" | "Embedding tốn thêm một lượt gọi API cho mỗi câu hỏi, mà chúng tôi chạy trên free tier siết theo ngày. Slide dày thuật ngữ tiếng Anh nguyên bản, tìm theo từ khoá đã đủ tốt. Có để sẵn feature flag khi cần đổi." |
| "Bao nhiêu phần trăm là mock?" | "Lời gọi model, nội dung slide, trích text từng trang — thật. Backend dữ liệu khoá học, đăng nhập — mock, và README có bảng ghi rõ từng dòng." |
| "Sao không sửa nốt điểm thứ tám?" | "Nó cần chuyển hạn mức lên server và đổi luồng của client, rủi ro cao hơn lợi ích trong khung thời gian này. Chúng tôi chọn giữ nguyên và ghi rõ, thay vì sửa vội rồi hỏng thứ đang chạy." |
| "Nếu VLearn sửa hết thì sản phẩm các bạn còn gì?" | "Bộ đo. Sửa một lỗi là việc một lần; có thước đo thì lần sau biết mình có làm tệ đi hay không." |

---

## Tuyệt đối không nói

- ❌ "AI của họ là giả" — sai, và mất uy tín của cả bảy điểm còn lại
- ❌ "Chúng tôi sửa hết 8 điểm" — 7/8, con số này nằm trong repo ai cũng đọc được
- ❌ "Chúng tôi hack được hệ thống của họ" — chỉ đọc mã nguồn công khai gửi tới trình duyệt
- ❌ Bất kỳ số nào không có file sinh ra nó trong `eval/`

---

## Bản 2 phút

Khi bị cắt giờ, giữ đúng bốn khối:

1. **Mở đầu** (20s) — "thanh tin cậy 85% được tính từ đâu?"
2. **Bằng chứng** (30s) — `node evidence/verify.mjs 1`, chỉ vào `confidence: n.length ? .85 : .6`
3. **Thước đo trước, sửa sau** (40s) — 4 lớp chỗ khó, 19/24 → 23/24, và chuyện bộ test bắt được lỗi của chính bản sửa đầu tiên
4. **Chốt** (30s) — 3/8 → 7/8, "AI biết mình đang không biết"

Bỏ toàn bộ demo trực tiếp. Bỏ phần Q&A.
