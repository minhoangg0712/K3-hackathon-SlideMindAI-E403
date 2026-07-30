# Script pitch — 8 điểm yếu của AI Assistant VLearn

Kịch bản demo trực tiếp trước ban giám khảo. Mỗi điểm yếu gồm: **bằng chứng code** (có sẵn, không cần mạng) và **cách tái hiện tại chỗ** (gõ prompt hoặc mở DevTools).

> **Nguyên tắc xuyên suốt:** chỉ nói những gì tái hiện được ngay trước mặt giám khảo. Một điểm bị bắt bẻ là mất uy tín của cả bảy điểm còn lại.

---

## Chuẩn bị trước khi lên (10 phút)

| Việc | Chi tiết |
|---|---|
| Tab 1 | `vlearn.dev` đã đăng nhập, mở sẵn reader một slide bất kỳ, panel Tutor bung ra |
| Tab 2 | DevTools của tab 1, tab **Network**, đã lọc `agent`, bật **Preserve log** |
| Tab 3 | Terminal ở thư mục repo, sẵn sàng gõ `node evidence/verify.mjs` |
| Quota | Tutor gốc giới hạn **15 câu/ngày**. Script này tốn **5 lượt**. Đừng thử trước bằng chính tài khoản demo |
| Dự phòng | Nếu mạng hỏng: toàn bộ phần bằng chứng code chạy offline được bằng `node evidence/verify.mjs` |

**Kiểm tra 30 giây trước khi lên sân khấu:** gõ một câu bất kỳ vào Tutor, xác nhận nó trả lời được. Nếu backend VLearn sập thì chuyển hẳn sang kịch bản offline (chỉ dùng terminal + slide chụp màn hình).

---

## Mở đầu (20 giây)

> "VLearn có một AI Tutor. Nó trả lời được. Câu hỏi của chúng tôi không phải *nó có trả lời được không* — mà là **học viên có cách nào biết câu trả lời đó đáng tin hay không**.
>
> Chúng tôi đã đọc toàn bộ mã nguồn JavaScript mà VLearn gửi xuống trình duyệt của mọi học viên. Tám vấn đề. Tôi sẽ chứng minh từng cái ngay bây giờ, không dùng slide."

Mở terminal, gõ:

```bash
node evidence/verify.mjs
```

> "Đây là bundle production của vlearn.dev, tải ngày 30/07. Ai muốn tự kiểm chứng: repo có sẵn file, chạy đúng một lệnh này."

---

## Phần A — Ba điểm chứng minh bằng DevTools (không tốn quota, mạnh nhất)

### ① Quota 15 câu/ngày đếm bằng localStorage — xoá là reset

**Bằng chứng code** (`node evidence/verify.mjs 5`):

```js
function W(e){ return `vlearn_quota_${e.toLowerCase()}_${t}` }
function K(e){ let t=localStorage.getItem(W(e)); return { usedCount:a, maxLimit:15, ... } }
```

**Demo tại chỗ** — DevTools → Console:

```js
Object.keys(localStorage).filter(k => k.startsWith("vlearn_quota"))
```

> "Đây là bộ đếm quota. Nó nằm trên máy học viên."

```js
localStorage.removeItem(Object.keys(localStorage).find(k => k.startsWith("vlearn_quota")))
```

F5 lại trang. Chỉ vào thanh quota:

> "Quota vừa về 0. Giới hạn 15 câu một ngày là giới hạn *đề nghị*, không phải giới hạn *thi hành*. Nếu VLearn tính chi phí token theo đầu học viên, con số đó không kiểm soát được gì."

**Điều cần lưu ý khi nói:** đây là lỗi kiến trúc, không phải lỗ hổng bảo mật nghiêm trọng — đừng thổi phồng thành "hack được hệ thống".

---

### ② Ngữ cảnh gửi lên server gần như rỗng

**Bằng chứng code** (`node evidence/verify.mjs 3`):

```js
body: JSON.stringify({ threadId, runId, messages:[{role:"user",content:r}],
                       tools:[], context:[], forwardedProps:{...} })
```

**Demo tại chỗ** — bôi đen một đoạn dài trên slide, hỏi một câu, rồi mở Network → `agent` → **Payload**.

Chỉ vào hai trường:

> "`tools` rỗng. `context` rỗng. Giao thức AG-UI có sẵn hai trường để mang ngữ cảnh, cả hai đều bỏ trống.
>
> Toàn bộ ngữ cảnh nằm ở đây — " *(chỉ vào `messages[0].content`)* " — một chuỗi text: số trang, cộng tối đa 300 ký tự đoạn tôi vừa bôi đen. Không có nội dung slide. Model đang trả lời về một tài liệu mà nó chưa từng đọc."

---

### ③ Câu hỏi dài bị cắt âm thầm, mất phần đuôi

**Bằng chứng code** (`node evidence/verify.mjs 8`):

```js
let r = ((prefix `(Trang ${page})\n`) + user_question).slice(0, 2e3);
```

**Demo tại chỗ** — dán vào ô hỏi một câu dài (chuẩn bị sẵn trong clipboard, ~2.400 ký tự, **kết thúc bằng câu hỏi thật ở cuối**):

```
[2300 ký tự mô tả bối cảnh bài toán của tôi...]
...Vậy câu hỏi cuối cùng của tôi là: nên chọn chatbot hay agent cho bài toán này?
```

Gửi. Mở Network → Payload → cuộn xuống cuối `content`.

> "Câu hỏi thật của tôi nằm ở cuối. Nó bị cắt mất. Model trả lời phần bối cảnh, không trả lời câu hỏi.
>
> Ô nhập không có `maxLength`, không đếm ký tự, không cảnh báo. Học viên gõ 2.400 chữ, mất 400 chữ cuối, và không bao giờ biết."

**Vì sao prefix nằm ở đầu lại quan trọng:** `(Trang N)` được ghép vào **trước** câu hỏi rồi mới cắt — nên thứ bị mất luôn là phần người dùng viết, không phải phần hệ thống thêm vào.

---

## Phần B — Ba điểm cần gửi câu hỏi (tốn 3 lượt quota)

### ④ Thanh tin cậy là hằng số

**Bằng chứng code** (`node evidence/verify.mjs 1`):

```js
confidence: n.length ? .85 : .6
```

**Demo tại chỗ** — hỏi hai câu, một câu chắc chắn có trong slide, một câu chắc chắn không:

| Lượt | Prompt |
|---|---|
| 1 | `Slide này định nghĩa khái niệm chính là gì?` |
| 2 | `Slide này nói gì về chuẩn hóa trong SVD?` |

Chỉ vào thanh confidence sau mỗi câu.

> "85%. Và 60%. Luôn luôn chỉ hai con số này.
>
> `n.length ? .85 : .6` — `n` là số citation. Nghĩa là thanh 'độ tin cậy' này chỉ trả lời đúng một câu hỏi: *có tìm được citation hay không*. Nó không biết câu trả lời đúng hay sai. Học viên nhìn thấy 85% và nghĩ hệ thống đã kiểm chứng điều gì đó."

---

### ⑤ Chỉ một công cụ, khoá cứng trong tài liệu một buổi

**Bằng chứng code** (`node evidence/verify.mjs 7`):

```js
"search_slides" === r.toolCallName    // tên tool duy nhất trong toàn bundle
```

**Demo tại chỗ** — dùng lại chính lượt 2 ở trên, hoặc hỏi một khái niệm nền mà slide có nhắc nhưng không giải thích:

```
Giải thích kỹ hơn khái niệm mà slide vừa nhắc ở trên, phần tôi chưa hiểu.
```

> "'Trong tài liệu của bài học này không đề cập.'
>
> Đây là kiến thức nền của chính slide đó, và có thể nó nằm ở tài liệu buổi khác trong cùng khoá. Nhưng tool chỉ tìm trong tài liệu đang mở. Học viên bị chặn ngay ở chỗ họ cần giúp nhất."

---

### ⑥ Trích dẫn không đối chiếu với slide

**Bằng chứng code** (`node evidence/verify.mjs 2`):

```js
r = /\[trang (\d+)\]\s*([^\n]+)/g;
a.push({ document_title:"", page:Number(t[1]), section:null, quote:t[2].trim().slice(0,300) })
```

**Demo tại chỗ** — không cần hỏi thêm. Mở Network → response của lượt trước → tìm `STATE_SNAPSHOT`.

> "`document_title` rỗng. `section` luôn `null`.
>
> Quan trọng hơn: regex này chạy trên **văn bản do model tự viết ra**. Nếu model viết 'trang 12', hệ thống tin là trang 12. Không ai mở trang 12 ra đối chiếu xem câu trích có thật ở đó không.
>
> Học viên chép số trang đó vào bài nộp."

---

## Phần C — Hai điểm chỉ chứng minh bằng code (30 giây)

### ⑦ Không có bộ nhớ, không có cache — hai cờ hardcode

`node evidence/verify.mjs 4`:

```js
memory_used: !1, cache_hit: !1
```

> "`!1` là `false` sau khi rút gọn. Hai trường này chưa bao giờ mang giá trị nào khác. Một lớp 1.074 học viên hỏi cùng một câu về cùng một slide — mỗi lần đều là một lượt gọi model mới."

### ⑧ Hội thoại lưu ở sessionStorage

`node evidence/verify.mjs 6`:

```js
["edupulse_chat_conversation", course_id, lecture_id, material_id].join(":")
// đọc/ghi bằng sessionStorage
```

**Demo nhanh nếu còn thời gian:** đóng tab, mở lại reader → hội thoại trống.

> "Đóng tab là mất. Học viên hỏi mười lượt để hiểu một khái niệm, đóng nhầm tab, làm lại từ đầu."

---

## Chuyển sang phần giải pháp (15 giây)

> "Tám vấn đề này có một điểm chung: **hệ thống không có cách nào tự biết mình đang đúng hay sai**. Confidence là hằng số. Citation không đối chiếu. Không có gì đo được thì không có gì cải thiện được.
>
> Nên việc đầu tiên chúng tôi làm không phải là sửa AI. Là dựng thước đo."

→ chuyển sang bộ 24 câu thử và bảng 19/24 → 23/24.

---

## Phụ lục — điều KHÔNG được nói

Bundle production còn nguyên một nhánh trả lời viết sẵn: bốn câu trả lời tiếng Việt hardcode cho "gradient descent", "learning rate", "tối ưu", kèm flashcard, mindmap, và hiệu ứng gõ chữ giả bằng `setInterval(...,20)`.

**Nhưng nó là dead code.** Chỉ chạy trong nhánh `catch`, và cờ điều khiển trả `false` cứng:

```js
76503:(e,t,a)=>{ a.d(t,{A:()=>r}); function r(){ return !1 } }
```

- ✅ Được nói: *"chế độ demo scripted đã tắt trong production, nhưng code vẫn nằm trong bundle gửi tới trình duyệt mọi học viên — bật lại chỉ cần đổi một ký tự."*
- ❌ Không được nói: *"AI của họ là giả"*, *"họ hardcode câu trả lời"*. Sai sự thật. Một giám khảo biết đọc bundle sẽ bác ngay tại chỗ, và kéo đổ uy tín của cả bảy điểm phía trên.

Nếu bị hỏi xoáy về điểm này, trả lời thẳng: *"Chúng tôi kiểm tra và xác nhận nó không chạy trong production. Chúng tôi nêu ra vì nó cho thấy sản phẩm từng có chế độ demo — không phải để nói AI của họ là giả."*

---

## Phụ lục — câu hỏi giám khảo có thể hỏi

| Câu hỏi | Trả lời |
|---|---|
| "Bundle này lấy lúc nào, còn đúng không?" | 30/07/2026, lưu trong `evidence/vlearn-bundle/`. Tên chunk có hash nên sẽ đổi khi VLearn deploy — đó chính là lý do chúng tôi giữ bản sao trong repo. |
| "Sao biết `search_slides` là tool duy nhất?" | Grep toàn bộ 28 chunk JavaScript, không có `toolCallName` nào khác. Lệnh kiểm tra có trong `evidence/README.md`. |
| "Confidence 85%/60% có thể là backend trả về chứ?" | Không. Dòng gán nằm trong client, ngay tại `RUN_FINISHED`, tính từ `citations.length` của chính client. Backend không gửi trường `confidence` nào. |
| "Các anh sửa được mấy trong tám điểm rồi?" | Trả lời trung thực theo bảng trạng thái trong README. Đừng nói "sửa hết". |
| "Vì sao dùng Gemini mà không phải model mạnh hơn?" | Free tier, và bài toán chính là retrieval + policy chứ không phải suy luận nặng. Có cascade tụt bậc khi hết quota. |

---

## Bảng thời lượng

| Phần | Thời gian | Cắt được không |
|---|---|---|
| Mở đầu + `verify.mjs` | 0:20 | Không |
| A① quota | 0:40 | Không — mạnh nhất |
| A② context rỗng | 0:40 | Không — mạnh nhất |
| A③ cắt 2000 ký tự | 0:40 | Cắt nếu thiếu giờ |
| B④ confidence | 0:40 | Không |
| B⑤ một tool | 0:30 | Cắt nếu thiếu giờ |
| B⑥ citation | 0:30 | Cắt nếu thiếu giờ |
| C⑦⑧ | 0:30 | Cắt còn 1 câu |
| Chuyển tiếp | 0:15 | Không |
| **Tổng** | **~4:45** | Bản rút gọn: ~2:30 |

Nếu chỉ có 2 phút: giữ **① quota**, **② context rỗng**, **④ confidence** — ba cái này demo trực tiếp được và không cần giải thích dài.
