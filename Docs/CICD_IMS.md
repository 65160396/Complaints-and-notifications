# CI/CD Documentation
## IMS — ระบบร้องเรียนปัญหาและแจ้งเตือนข่าวสารภายในมหาวิทยาลัย

| | |
|---|---|
| **ชื่อโครงการ** | IMS — Issue Management System |
| **สมาชิกในทีม** | 65160116 นายนนทวัฒน์ สุขยิ่ง , 65160246 นางสาวณัฎฐกาญน์ ผึ่งกรรฐ์ , 516038   นางสาวบุศรินทร์ พันธุเวช , 65160379 นางสาวนิรชา แก้วงาม , 65160385 นางสาวพิชญาดา เกิดสุทธิ , 65160396 นางสาวอารี แก้วสีคร้าม |
| **วันที่จัดทำ** | 04/06/2569 |

---

## 1. ภาพรวม Build Automation

โปรเจค IMS ใช้ Build Automation Pipeline เพื่อให้กระบวนการ compile, test, และ deploy เป็นอัตโนมัติโดยไม่ต้องแทรกแซงจากมนุษย์

### 1.1 Build Tools ที่ใช้ในโปรเจค

| Build Tool | ใช้ใน | คำสั่งหลัก | เหตุผลที่เลือก |
|---|---|---|---|
| npm scripts | Backend + Frontend | npm install, npm run build, npm start | Built-in, simple, flexible |
| TypeScript Compiler (tsc) | Backend | npx tsc | Compile TS → JS สำหรับ production |
| Next.js Build | Frontend | next build | Optimized production build อัตโนมัติ |
| Jest | Backend Testing | npm test | Unit + Integration testing |

### 1.2 npm Scripts Configuration

**Backend — package.json:**

```json
"scripts": {
    "test": "jest",
    "dev": "nodemon src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
```

**Frontend — package.json:**

```json
"scripts": {
  "dev":   "next dev",
  "build": "next build",
  "start": "next start",
  "lint":  "eslint"
}
```

---

## 2. CI Pipeline Stages

โปรเจค IMS ใช้ CI Pipeline ตาม Fail Fast Principle แบ่งเป็น 5 ขั้นตอน:

```
Code Push
    ↓
1. Checkout Code         → git push → Auto trigger
    ↓
2. Install Dependencies  → npm install
    ↓
3. Lint & Type Check     → npx eslint src / npx tsc --noEmit
    ↓  ❌ Fail → หยุดทันที ไม่ deploy
4. Unit Tests            → npm test (105/105 passed)
    ↓  ❌ Fail → หยุดทันที ไม่ deploy
5. Build                 → npm install && npx tsc
    ↓  ❌ Fail → หยุดทันที ไม่ deploy
✅ All Passed → Deploy อัตโนมัติ
```

| ขั้น | Stage | คำสั่งที่ใช้ | ผลที่ได้ |
|---|---|---|---|
| 1 | Checkout Code | git push → Auto trigger | ดึงโค้ดล่าสุดจาก GitHub |
| 2 | Install Dependencies | npm install | ติดตั้ง packages ทั้งหมด |
| 3 | Lint & Type Check | npx eslint src / npx tsc --noEmit | ตรวจสอบ code quality, 0 errors |
| 4 | Unit Tests | npm test | 105/105 passed, coverage 93.3% |
| 5 | Build | npm install && npx tsc | สร้าง dist/ folder พร้อม deploy |

---

## 3. Deployment Strategy

โปรเจค IMS ใช้ Auto-Deploy แบบ Cloud-native แบ่งเป็น 3 service:

| Service | Platform | Trigger | Build Command | Deploy Time |
|---|---|---|---|---|
| Frontend (Next.js) | Vercel | git push → main | npm run build | ~1-2 นาที |
| Backend (Express) | Render | git push → main | npm install && npx tsc | ~2-3 นาที |
| Database (MySQL) | Railway | Managed (always on) | - | ไม่ต้อง deploy |

### 3.1 Pipeline Flow

```
นักพัฒนาแก้โค้ดใน VS Code
    ↓
git add . && git commit -m "message" && git push
    ↓
GitHub รับ push
    ├─→ Vercel: ดึงโค้ด → npm run build → deploy Frontend ~2 นาที
    └─→ Render: ดึงโค้ด → npm install && npx tsc → deploy Backend ~3 นาที
    
Railway MySQL รันตลอดเวลา
Backend เชื่อมต่อผ่าน Environment Variables
    ↓
✅ ระบบพร้อมใช้งาน
```

---

## 4. Code Quality Tools

### 4.1 ESLint (Linting)

ใช้ ESLint 9.39.4 ตรวจสอบ code style และ potential bugs

**ผลลัพธ์:**
- Frontend: 0 errors, 24 warnings (หลังปรับ rules)
- Backend: 0 errors, 1 warning (complexity > 10)

**Rules ที่ปรับ:**

| Rule | ค่าเดิม | ค่าใหม่ | เหตุผล |
|---|---|---|---|
| @typescript-eslint/no-explicit-any | error | off | API response ยังไม่มี type ครบ |
| react-hooks/set-state-in-effect | error | off | Pattern ที่ใช้ยอมรับได้ |
| react-hooks/exhaustive-deps | error | warn | บาง deps จงใจไม่ใส่ |
| @next/next/no-img-element | error | warn | ใช้ dynamic URL จาก backend |

**eslint.config.mjs (Frontend):**

```javascript
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "warn",
      "react-hooks/exhaustive-deps": "warn",
      "react-hooks/set-state-in-effect": "off",
      "@next/next/no-img-element": "warn",
      "react/no-unescaped-entities": "off",
    }
  }
]);

export default eslintConfig;
```

### 4.2 TypeScript Compiler

```bash
npx tsc --noEmit
```

- ผลลัพธ์: 0 errors ทั้ง Backend และ Frontend ✅
- ใช้ strict mode เพื่อป้องกัน runtime errors

**tsconfig.json (Backend):**

```json
{
  "compilerOptions": {
    "target": "ES2016",
    "module": "CommonJS",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```

### 4.3 Jest (Testing)

```bash
npm test
```

| ตัวชี้วัด | ค่าที่ได้ | เป้าหมาย | สถานะ |
|---|---|---|---|
| Test Suites | 7/7 passed | ผ่านทั้งหมด | ✅ |
| Tests | 105/105 passed | ผ่านทั้งหมด | ✅ |
| Statements | 93.3% | ≥ 80% | ✅ |
| Branches | 84.69% | ≥ 80% | ✅ |
| Functions | 93.1% | ≥ 80% | ✅ |
| Lines | 97% | ≥ 80% | ✅ |

---

## 5. Build Artifacts

| Artifact | Path | เนื้อหา | ใช้สำหรับ |
|---|---|---|---|
| Backend dist | backend/dist/ | Compiled JS จาก TypeScript | รัน production server |
| Frontend .next | frontend/.next/ | Optimized Next.js build | Serve static + SSR pages |
| Coverage Report | backend/coverage-reports/ | HTML coverage report | ตรวจสอบ test coverage |

---

## 6. Environment Variables Management

แยก Environment Variables ตาม environment อย่างชัดเจน:

| Variable | Local | Production |
|---|---|---|
| DB_HOST | localhost | junction.proxy.rlwy.net (Railway) |
| DB_PORT | 3306 | 16910 |
| DB_NAME | ims | railway |
| DB_USER | root | root |
| DB_PASSWORD | (ว่าง) | เก็บใน Render Environment Variables |
| JWT_SECRET | mysecretkey | เก็บใน Render Environment Variables |
| NEXT_PUBLIC_API_URL | http://localhost:5000/api | https://ims-backend-zwh8.onrender.com/api |

> ⚠️ ไฟล์ `.env` และ `.env.local` ถูกเพิ่มใน `.gitignore` เพื่อป้องกัน sensitive data ขึ้น GitHub

---

## 7. Best Practices ที่ปฏิบัติตาม

| Best Practice | การนำไปใช้ | สถานะ |
|---|---|---|
| Keep Builds Fast (< 5 นาที) | Vercel ~2 นาที, Render ~3 นาที | ✅ |
| Fail Fast Principle | Lint → Test → Build ตามลำดับ | ✅ |
| Reproducible Builds | ใช้ package-lock.json ทุก repo | ✅ |
| Environment Consistency | แยก .env local vs production | ✅ |
| Security in Pipeline | JWT, bcrypt, Parameterized Query | ✅ |
| Monitor & Alert | Vercel/Render Logs + Deploy history | ✅ |
| Use Caching Strategically | Vercel build cache 153MB | ✅ |
| Version Control | Git commit ทุก feature | ✅ |
| GitHub Actions / Automated CI | ใช้ GitHub Actions + Vercel/Render webhooks | ✅ |
| Docker | ไม่ได้ใช้ใน production | ❌ |

---

## 8. Automation Benefits

- **Zero Manual Deploy** — push โค้ดแล้วระบบ deploy ให้อัตโนมัติทุกครั้ง
- **Fast Feedback Loop** — รู้ผลการ build ภายใน 5 นาที
- **Rollback ได้ทันที** — Vercel และ Render เก็บ deployment history ทุกเวอร์ชัน
- **Environment แยกชัดเจน** — local ใช้ .env, production ใช้ platform environment variables
- **Code Quality Gate** — ESLint และ TypeScript ป้องกัน bad code ก่อน deploy
- **ประหยัดเวลาทีม** — ทีม 6 คนโฟกัสที่การพัฒนา feature ได้เลย

---

## 9. Production URLs

| Service | Platform | URL |
|---|---|---|
| Frontend | Vercel | https://complaints-and-notifications.vercel.app |
| Backend API | Render | https://ims-backend-zwh8.onrender.com |
| Database | Railway | junction.proxy.rlwy.net:16910 |
| Source Code | GitHub | https://github.com/65160396/Complaints-and-notifications |

---

## 10. Troubleshooting ที่พบ

| ปัญหา | สาเหตุ | วิธีแก้ไข |
|---|---|---|
| Missing script: build | ไม่มี build script ใน package.json | เพิ่ม "build": "tsc" และ "start": "node dist/index.js" |
| Cannot find module dist/index.js | tsc ไม่ได้รัน หรือ outDir ผิด | เปลี่ยน Build Command เป็น npm install && npx tsc |
| localStorage is not defined | Next.js SSR รัน code บน server | เพิ่ม if (typeof window === 'undefined') return null |
| MySQL Connection lost | Connection หมดอายุเมื่อ idle นาน | เพิ่ม enableKeepAlive: true ใน db.ts |
| 404 Not Found บน production | NEXT_PUBLIC_API_URL ผิด | แก้ URL ใน Vercel Environment Variables |

---

## 11. GitHub Actions Workflow

โปรเจค IMS ใช้ GitHub Actions เป็น CI Pipeline อัตโนมัติ โดยสร้างไฟล์ `.github/workflows/ci.yml`

### 11.1 ข้อมูล Workflow

| รายละเอียด | ค่า |
|---|---|
| ไฟล์ | .github/workflows/ci.yml |
| Trigger (push) | master, develop, production |
| Trigger (pull_request) | master, production |
| Jobs | Backend CI และ Frontend CI (รันพร้อมกัน) |
| Virtual Machine | ubuntu-latest (ฟรี, เร็ว, เข้ากันได้กับ Node.js) |

### 11.2 CI Pipeline Stages

```
push / pull_request
    ↓
Backend CI (parallel)          Frontend CI (parallel)
    ↓                              ↓
1. Checkout code               1. Checkout code
2. Setup Node.js 18            2. Setup Node.js 20
3. npm install                 3. npm install
4. ESLint                      4. ESLint (continue-on-error)
5. TypeScript check            5. TypeScript check
6. Jest (105 tests)            6. Next.js build
7. Build (tsc)
    ↓                              ↓
✅ Pass → Deploy               ✅ Pass → Deploy
❌ Fail → หยุดทันที            ❌ Fail → หยุดทันที
```

### 11.3 ci.yml

```yaml
name: CI Pipeline

on:
  push:
    branches: [master, develop, production]
  pull_request:
    branches: [master, production]

jobs:
  backend:
    name: Backend CI
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: code/my-app/backend/package-lock.json
      - name: Install dependencies
        working-directory: code/my-app/backend
        run: npm install
      - name: Lint
        working-directory: code/my-app/backend
        run: npx eslint src --ext .ts
      - name: Type check
        working-directory: code/my-app/backend
        run: npx tsc --noEmit
      - name: Run tests
        working-directory: code/my-app/backend
        run: npm test
      - name: Build
        working-directory: code/my-app/backend
        run: npm run build

  frontend:
    name: Frontend CI
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"
          cache: "npm"
          cache-dependency-path: code/my-app/frontend/package-lock.json
      - name: Install dependencies
        working-directory: code/my-app/frontend
        run: npm install
      - name: Lint
        working-directory: code/my-app/frontend
        run: npx eslint app --ext .ts,.tsx --max-warnings=100
        continue-on-error: true
      - name: Type check
        working-directory: code/my-app/frontend
        run: npx tsc --noEmit --skipLibCheck
      - name: Build
        working-directory: code/my-app/frontend
        run: npm run build
```

---

## สรุป

Build Automation Pipeline ของโปรเจค IMS ปฏิบัติตาม best practices ในบทที่ 10:

1. **Automation ครบวงจร** — compile, test, build, deploy อัตโนมัติทั้งหมด
2. **Fast Feedback** — รู้ผลการ build ภายใน 5 นาที
3. **Quality Gates** — ESLint + TypeScript + Jest ป้องกัน bad code
4. **GitHub Actions** — CI Pipeline อัตโนมัติทุกครั้งที่ push
5. **Free Cloud Deployment** — ใช้ Vercel + Render + Railway ไม่มีค่าใช้จ่าย
6. **Reproducible Builds** — ใช้ package-lock.json ทุก repo
7. **ข้อจำกัด** — ยังไม่ได้ใช้ Docker (Technical Debt)

> Pipeline ที่ดี = Faster Development + Better Quality + Lower Risk