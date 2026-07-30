# AI Startup Demo ? Insight Copilot

> Template repo public cho m?t d? ?n AI hackathon. Prototype c? **m?t l?i g?i AI th?t** khi c?u h?nh `OPENAI_API_KEY`; mock ch? l? ph??ng ?n d? ph?ng ?? demo giao di?n offline.

## 1. ??i ng? & ph?n c?ng

| Th?nh vi?n | M? h?c vi?n | Vai tr? | Ph?n ph? tr?ch |
|---|---|---|---|
| `H? T?N 1` | `M? S?` | Product/PM | B?i to?n, user test, pitch |
| `H? T?N 2` | `M? S?` | AI Engineer | Prompt, model, evaluation |
| `H? T?N 3` | `M? S?` | Full-stack | API, giao di?n, deploy |

> Thay c?c ? `H? T?N` v? `M? S?` tr??c khi public repo.

## 2. V?n ?? & gi?i ph?p

**Insight Copilot** bi?n m?t ghi ch?/v?n b?n th? th?nh: t?m t?t, quy?t ??nh quan tr?ng, r?i ro v? h?nh ??ng ti?p theo. M?c ti?u l? gi?p nh?m s?n ph?m r?t insight t? meeting note nhanh, c? c?u tr?c v? d? ki?m tra.

- **Ng??i d?ng:** Product manager, founder, nghi?n c?u vi?n.
- **??u v?o:** V?n b?n UTF-8 d?i 20?8.000 k? t?, c?u h?i t?y ch?n.
- **??u ra:** T?m t?t, action items, risks, ngu?n ch?ng c? tr?ch t? input v? confidence.
- **Kh?ng d?ng cho:** t? v?n ph?p l?/y t?/t?i ch?nh; kh?ng coi output l? s? th?t n?u ch?a ki?m tra ngu?n.

Xem ti?u ch? th?nh c?ng, l?t c?t MVP v? b?ng ch?ng t?i [`spec.md`](spec.md).

## 3. Ch?y prototype

### ?i?u ki?n
- Python 3.11+
- API key OpenAI (?? ch?ng minh AI th?t)

```powershell
cd codebase
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item ..\.env.example .env
# M? .env, ?i?n OPENAI_API_KEY v? ??t AI_PROVIDER=openai
uvicorn app.main:app --reload --port 8000
```

M? `http://127.0.0.1:8000` v? d?n ghi ch? v?o giao di?n.

### L?i g?i AI th?t

Khi `AI_PROVIDER=openai`, `POST /api/analyze` g?i n?i dung ng??i d?ng t?i OpenAI Responses API. Th?ng tin hi?n th? r? trong UI qua badge **OpenAI ? live**. Kh?ng commit `.env` hay API key.

Khi ch?a c? key, ??t `AI_PROVIDER=mock` ?? ki?m tra lu?ng UI v? evaluation offline. ??y l? **mock**, kh?ng ???c tr?nh b?y l? AI ch?y th?t.

## 4. API nhanh

```json
POST /api/analyze
{
  "text": "Nh?m th?ng nh?t ra m?t beta ng?y 15/8...",
  "question": "Vi?c n?o c?n ?u ti?n?"
}
```

Response lu?n theo schema `summary`, `decisions`, `action_items`, `risks`, `evidence`, `confidence`, `provider`.

## 5. Ki?m th? & b?ng ch?ng

```powershell
cd codebase
python -m pytest
python scripts/run_eval.py
```

- Golden set v? rubric: [`eval/`](eval/)
- K?t qu? l?n ch?y: [`eval/results/`](eval/results/)
- Feedback user test: [`validation/feedback-log.md`](validation/feedback-log.md)
- Reflection t?ng th?nh vi?n: [`reflection/`](reflection/)

## 6. C?u tr?c

```text
.
??? README.md
??? spec.md
??? demo-slides.pdf             # deck 6 trang xu?t b?n ?? n?p
??? demo-slides.md              # m? ngu?n n?i dung deck ?? ch?nh s?a
??? codebase/                   # prototype FastAPI
??? eval/                       # golden set + k?t qu? evaluation
??? validation/                 # log ki?m ch?ng v?i ng??i d?ng
??? reflection/                 # ph?n t? c? nh?n
```

## 7. Checklist tr??c demo

- [ ] Thay th?ng tin th?nh vi?n v? ph?n c?ng.
- [ ] C?u h?nh `AI_PROVIDER=openai`, ch?y m?t input th?t tr?n m?y demo.
- [ ] Quay/l?u ?nh m?n h?nh response c? badge **OpenAI ? live**.
- [ ] Ch?y golden set, l?u k?t qu? c? ng?y gi? v?o `eval/results/`.
- [ ] Th?c hi?n ?t nh?t 3 user tests v? ?i?n `validation/feedback-log.md`.
- [ ] C?p nh?t `demo-slides.md`, xu?t l?i `demo-slides.pdf`.
