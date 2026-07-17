# 📱 중고폰 매장 매뉴얼 웹앱 (phone-shop-manual)

중고폰 매장 직원이 태블릿/스마트폰으로 매장에서 사용하는 내부 웹앱입니다.
백엔드 없는 **정적 사이트**(Vite + React + Tailwind CSS)로, GitHub Pages에 자동 배포됩니다.

## 기능 (탭 3개)

| 탭 | 내용 |
|---|---|
| 💰 **시세표** | 브랜드/모델 검색, 매입배율(S·A·B) 설정, 판매·매입시세·예상마진 실시간 계산 |
| 📋 **등급 판정** | 판정 원칙, S/A/B 비교, 부위별 기준, 기능 감가표, 검수 체크리스트, 판정 퀴즈, 금지사항 |
| 🧮 **마진 계산기** | 모델·등급·감가 항목 선택 → 제시 매입가·예상 판매가·예상 마진 산출 |

- 📱 모바일 퍼스트 반응형, 🌙 다크모드(시스템 따름 + 수동 토글)
- 배율 설정과 검수 체크리스트는 **브라우저(localStorage)에 자동 저장** → 새로고침해도 유지
- 외부 API 호출 없음 (완전 정적)

---

## 로컬 실행 방법

> [Node.js](https://nodejs.org) 18 이상이 설치돼 있어야 합니다.

```bash
npm install      # 최초 1회, 의존성 설치
npm run dev      # 개발 서버 실행 → 터미널에 뜨는 http://localhost:5173/phone-shop-manual/ 접속
```

빌드(배포용 정적 파일 생성)와 미리보기:

```bash
npm run build    # dist/ 폴더에 결과물 생성
npm run preview  # 빌드 결과 로컬 미리보기
```

---

## GitHub Pages 배포 방법 (최초 1회 설정)

1. 이 코드를 GitHub 저장소 **`phone-shop-manual`** 에 올립니다(push).
2. GitHub 저장소 → **Settings → Pages** 이동
3. **Build and deployment → Source** 를 **`GitHub Actions`** 로 선택 후 저장
4. 끝. 이후 **main 브랜치에 push할 때마다** `.github/workflows/deploy.yml`이 자동으로 빌드·배포합니다.

배포 주소: `https://<GitHub사용자명>.github.io/phone-shop-manual/`

> 배포 진행 상황은 저장소 상단 **Actions** 탭에서 확인할 수 있어요(보통 1~2분 소요).

---

## 🔄 시세 갱신 방법 (비개발자용 · 코드 몰라도 OK)

시세는 **`src/data/prices.json`** 파일의 숫자만 고치면 됩니다.

### 방법 A — GitHub 웹에서 직접 (가장 쉬움)

1. GitHub 저장소에서 **`src` → `data` → `prices.json`** 파일을 클릭합니다.
2. 오른쪽 위 **연필(✏️ Edit) 아이콘**을 누릅니다.
3. 바꾸고 싶은 모델의 `"price"` 숫자를 수정합니다. (예: `"price": 860000` → `"price": 830000`)
   - `"baseDate"` 의 날짜도 오늘 날짜로 바꿔주세요. (예: `"2026-07-17"`)
   - 콤마(`,`)·따옴표(`"`)·중괄호(`{ }`)는 **그대로 두고 숫자만** 바꿉니다.
4. 아래 **Commit changes** 버튼을 누릅니다.
5. **1~2분 뒤 사이트에 자동 반영**됩니다. (Actions 탭에서 초록 체크 뜨면 완료)

### 방법 B — 내 컴퓨터에서

```bash
# prices.json 을 편집기로 열어 숫자 수정 후
git add src/data/prices.json
git commit -m "시세 갱신 2026-07-17"
git push        # → 자동 배포
```

### prices.json 항목 설명

```jsonc
{
  "baseDate": "2026-07-17",              // 화면 상단에 표시되는 시세 기준일
  "defaultRates": { "S": 0.80, "A": 0.70, "B": 0.58 },  // 매입배율 기본값(80%,70%,58%)
  "models": [
    {
      "brand": "애플",                    // 브랜드: "애플" 또는 "삼성"
      "model": "아이폰 16",               // 모델명(검색·드롭다운에 표시)
      "price": 860000,                    // ★ 판매시세(S급·기본용량). 이 숫자만 바꾸면 됨
      "estimated": false                  // true면 "추정" 배지 표시(공식 시세 미확정)
    }
  ]
}
```

> ⚠️ 매입시세는 저장하지 않습니다. **`판매시세 × 매입배율`** 로 화면에서 자동 계산돼요.
> 매입배율은 앱의 **시세표 탭 상단**에서 매장 상황에 맞게 조절할 수 있고(브라우저에 저장), 기본값은 `prices.json`의 `defaultRates`를 따릅니다.

매뉴얼(등급 기준·감가표·검수 절차 등) 내용은 **`src/data/manual.json`** 에서 같은 방식으로 수정합니다.

---

## 기술 스택

- **Vite 5** + **React 18** + **Tailwind CSS 3**
- 데이터: `src/data/*.json` (코드와 분리 — 비개발자가 JSON만 수정 가능)
- 배포: GitHub Actions → GitHub Pages
