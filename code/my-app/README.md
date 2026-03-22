[README.md](https://github.com/user-attachments/files/26162320/README.md)
# IMS — ระบบแจ้งปัญหาและแจ้งเตือนข่าวสารภายในมหาวิทยาลัย

> Issue Management System | Sprint 1 & 2 — Completed

---

## 📋 สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [Tech Stack](#tech-stack)
- [โครงสร้างโปรเจกต์](#โครงสร้างโปรเจกต์)
- [การติดตั้ง](#การติดตั้ง)
- [Database](#database)
- [API Endpoints](#api-endpoints)
- [หน้าต่างๆ (Frontend)](#หน้าต่างๆ-frontend)
- [Roles และสิทธิ์](#roles-และสิทธิ์)
- [ความคืบหน้า Sprint](#ความคืบหน้า-sprint)
- [ฟังก์ชันที่ยังไม่ได้ทำ](#ฟังก์ชันที่ยังไม่ได้ทำ)

---

## ภาพรวมระบบ

ระบบสำหรับแจ้งปัญหา ติดตามสถานะ และแจ้งเตือนภายในมหาวิทยาลัย รองรับผู้ใช้ 4 บทบาทหลัก ได้แก่ นักศึกษา บุคลากร สโมสรคณะ และเจ้าหน้าที่มหาวิทยาลัย

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Backend | Node.js + Express + TypeScript |
| Frontend | Next.js (App Router) + Tailwind CSS |
| Database | MySQL (MariaDB) |
| Auth | JWT (jsonwebtoken) |
| File Upload | Multer |
| Password | bcryptjs |
| HTTP Client | Axios |
| Font | Sarabun (Google Fonts) |

---

## โครงสร้างโปรเจกต์

```
MY-APP/
├── backend/
│   └── src/
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── complaintController.ts
│       │   ├── notificationController.ts
│       │   ├── notificationSettingsController.ts
│       │   ├── profileController.ts
│       │   └── surveyController.ts
│       ├── middleware/
│       │   ├── authMiddleware.ts
│       │   └── uploadMiddleware.ts
│       ├── routes/
│       │   ├── auth.ts
│       │   ├── complaints.ts
│       │   ├── categories.ts
│       │   ├── locations.ts
│       │   ├── notifications.ts
│       │   ├── notification-settings.ts
│       │   ├── profile.ts
│       │   └── survey.ts
│       ├── db.ts
│       └── index.ts
│
└── frontend/
    └── app/
        ├── components/
        │   └── Navbar.tsx
        ├── lib/
        │   └── api.ts
        ├── login/
        ├── register/
        ├── complaints/
        ├── my-complaints/
        ├── create-complaint/
        ├── dashboard/
        ├── notifications/
        ├── notification-settings/
        ├── profile/
        ├── layout.tsx
        └── page.tsx
```

---

## การติดตั้ง

### Backend

```bash
cd backend
npm install
npm install multer
npm install --save-dev @types/multer
```

สร้างไฟล์ `.env`

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=ims
JWT_SECRET=your_secret_key
```

รันเซิร์ฟเวอร์

```bash
npm run dev
```

### Frontend

```bash
cd frontend
npm install
```

สร้างไฟล์ `.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

รัน

```bash
npm run dev
```

---

## Database

### ตารางหลัก (จาก ims.sql)

| ตาราง | ใช้สำหรับ |
|-------|---------|
| `app_user` | ข้อมูลผู้ใช้ทุก role |
| `issue_report` | คำร้องเรียน |
| `category` | หมวดหมู่ (แยกตาม role) |
| `location` | สถานที่เกิดเหตุ |
| `notification` | การแจ้งเตือน |
| `assignment` | การมอบหมายงาน |
| `department` | แผนก/หน่วยงาน |
| `emergency_alert` | แจ้งเตือนฉุกเฉิน |

### ตารางที่เพิ่มใน Sprint 1-2

| ตาราง / คอลัมน์ | ใช้สำหรับ |
|----------------|---------|
| `issue_image` | เก็บ path รูปภาพที่แนบมากับคำร้อง |
| `satisfaction_survey` | ผลประเมินความพึงพอใจ (1-4 ระดับ) |
| `notification_settings` | การตั้งค่าแจ้งเตือนของแต่ละ user |
| `notification.is_read` | สถานะอ่านแล้ว/ยังไม่อ่าน |
| `category.for_role` | แยก category ตาม role |

### SQL ที่ต้อง run เพิ่ม

```sql
-- 1. เพิ่ม is_read ใน notification
ALTER TABLE `notification`
  ADD COLUMN `is_read` tinyint(1) NOT NULL DEFAULT 0 AFTER `channel`;

-- 2. สร้างตาราง issue_image
CREATE TABLE `issue_image` (
  `image_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `issue_id` bigint(20) NOT NULL,
  `image_path` varchar(500) NOT NULL,
  `uploaded_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`image_id`),
  CONSTRAINT `issue_image_ibfk_1` FOREIGN KEY (`issue_id`)
    REFERENCES `issue_report` (`issue_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. สร้างตาราง satisfaction_survey
CREATE TABLE `satisfaction_survey` (
  `survey_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `issue_id` bigint(20) NOT NULL,
  `user_id` bigint(20) NOT NULL,
  `rating` tinyint(1) NOT NULL,
  `comment` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`survey_id`),
  UNIQUE KEY `unique_survey` (`issue_id`),
  CONSTRAINT `survey_ibfk_1` FOREIGN KEY (`issue_id`)
    REFERENCES `issue_report` (`issue_id`) ON DELETE CASCADE,
  CONSTRAINT `survey_ibfk_2` FOREIGN KEY (`user_id`)
    REFERENCES `app_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. สร้างตาราง notification_settings
CREATE TABLE `notification_settings` (
  `setting_id` bigint(20) NOT NULL AUTO_INCREMENT,
  `user_id` bigint(20) NOT NULL,
  `in_app_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `notify_status_change` tinyint(1) NOT NULL DEFAULT 1,
  `notify_new_complaint` tinyint(1) NOT NULL DEFAULT 1,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`setting_id`),
  UNIQUE KEY `unique_user_setting` (`user_id`),
  CONSTRAINT `notif_settings_ibfk_1` FOREIGN KEY (`user_id`)
    REFERENCES `app_user` (`user_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. เพิ่ม for_role ใน category
ALTER TABLE `category`
  ADD COLUMN `for_role` varchar(30) NOT NULL DEFAULT 'all' AFTER `description`;

UPDATE `category` SET `for_role` = 'student'
  WHERE `category_name` IN ('ซ่อมแซม', 'ทำความสะอาด', 'ความปลอดภัย');

INSERT INTO `category` (`category_name`, `description`, `for_role`) VALUES
  ('นโยบาย', 'เรื่องร้องเรียนด้านนโยบายและกฎระเบียบ', 'personnel'),
  ('การบริหาร', 'เรื่องร้องเรียนด้านการบริหารจัดการ', 'personnel'),
  ('การประสานงาน', 'ปัญหาการประสานงานระหว่างภาควิชา', 'personnel');
```

---

## API Endpoints

### Auth
| Method | Endpoint | ต้อง Login | ฟังก์ชัน |
|--------|----------|-----------|---------|
| POST | `/api/auth/register` | ❌ | สมัครสมาชิก |
| POST | `/api/auth/login` | ❌ | เข้าสู่ระบบ → คืน JWT |

### Complaints
| Method | Endpoint | ต้อง Login | ฟังก์ชัน |
|--------|----------|-----------|---------|
| GET | `/api/complaints` | ✅ | ดึงรายการทั้งหมด |
| GET | `/api/complaints/my` | ✅ | ดึงเฉพาะของตัวเอง |
| POST | `/api/complaints` | ✅ | แจ้งเรื่องใหม่ (multipart/form-data) |
| PATCH | `/api/complaints/:id/status` | ✅ | อัปเดตสถานะ |
| PATCH | `/api/complaints/:id/priority` | ✅ (staff) | อัปเดต priority |
| PATCH | `/api/complaints/:id/cancel` | ✅ (เจ้าของ) | ยกเลิกคำร้อง |
| GET | `/api/complaints/:id/images` | ✅ | ดึงรูปภาพของคำร้อง |

### Notifications
| Method | Endpoint | ต้อง Login | ฟังก์ชัน |
|--------|----------|-----------|---------|
| GET | `/api/notifications` | ✅ | ดึงรายการทั้งหมด |
| GET | `/api/notifications/unread-count` | ✅ | จำนวนที่ยังไม่อ่าน |
| PATCH | `/api/notifications/:id/read` | ✅ | mark อ่านแล้ว |
| PATCH | `/api/notifications/read-all` | ✅ | mark อ่านทั้งหมด |

### Notification Settings
| Method | Endpoint | ต้อง Login | ฟังก์ชัน |
|--------|----------|-----------|---------|
| GET | `/api/notification-settings` | ✅ | ดึงการตั้งค่า |
| PATCH | `/api/notification-settings` | ✅ | บันทึกการตั้งค่า |
| POST | `/api/notification-settings/reset` | ✅ | คืนค่าเริ่มต้น |

### Profile
| Method | Endpoint | ต้อง Login | ฟังก์ชัน |
|--------|----------|-----------|---------|
| GET | `/api/profile` | ✅ | ดึงโปรไฟล์ |
| PATCH | `/api/profile` | ✅ | แก้ไขโปรไฟล์ |
| PATCH | `/api/profile/change-password` | ✅ | เปลี่ยนรหัสผ่าน |

### Survey
| Method | Endpoint | ต้อง Login | ฟังก์ชัน |
|--------|----------|-----------|---------|
| POST | `/api/survey` | ✅ | ส่งผลประเมิน |
| GET | `/api/survey/:issue_id` | ✅ | ดึงผลประเมิน |

### Others
| Method | Endpoint | ฟังก์ชัน |
|--------|----------|---------|
| GET | `/api/categories` | ดึง category ตาม role |
| GET | `/api/locations` | ดึงสถานที่ทั้งหมด |

---

## หน้าต่างๆ (Frontend)

| Route | Role ที่เข้าได้ | ฟังก์ชัน |
|-------|--------------|---------|
| `/login` | ทุกคน | เข้าสู่ระบบ |
| `/register` | ทุกคน | สมัครสมาชิก |
| `/complaints` | ทุกคน | รายการคำร้องทั้งหมด |
| `/my-complaints` | student, personnel | คำร้องของฉัน + timeline + ยกเลิก + ประเมิน |
| `/create-complaint` | ทุกคน | แจ้งเรื่องใหม่ + แนบรูปภาพ |
| `/dashboard` | personnel, samo, officer, admin | ภาพรวม stats + เปลี่ยนสถานะ/priority |
| `/notifications` | ทุกคน | รายการแจ้งเตือน |
| `/notification-settings` | ทุกคน | ตั้งค่าการแจ้งเตือน |
| `/profile` | ทุกคน | แก้ไขโปรไฟล์ + เปลี่ยนรหัสผ่าน |

---

## Roles และสิทธิ์

| Role | ค่าใน DB | สิทธิ์หลัก |
|------|---------|-----------|
| นักศึกษา | `student` | แจ้งเรื่อง, ติดตามของตัวเอง, ประเมิน |
| บุคลากร | `personnel` | แจ้งเรื่อง, เห็น dashboard, เปลี่ยน priority |
| สโมสรคณะ | `samo` | เห็น dashboard, เปลี่ยนสถานะ/priority |
| เจ้าหน้าที่มหาวิทยาลัย | `officer` | เห็น dashboard, เปลี่ยนสถานะ/priority |
| ผู้ดูแลระบบ | `admin` | เข้าถึงได้ทุกหน้า |

### Category ตาม Role

| Role | Category ที่เห็น |
|------|----------------|
| student | ซ่อมแซม, ทำความสะอาด, ความปลอดภัย |
| personnel / samo / officer | นโยบาย, การบริหาร, การประสานงาน |

---

## ความคืบหน้า Sprint

### Sprint 1 & 2 — เสร็จครบ 100%

#### 🎓 Student (11/11)

| # | ฟังก์ชัน | สถานะ |
|---|---------|--------|
| 1 | การเข้าสู่ระบบ | ✅ Done |
| 2 | การจัดการโปรไฟล์ผู้ใช้ | ✅ Done |
| 3 | กระบวนการร้องเรียน | ✅ Done |
| 4 | การแจ้งเตือน | ✅ Done |
| 5 | การตั้งค่าแจ้งเตือน | ✅ Done |
| 6 | การติดตามสถานะ (เฉพาะของตัวเอง) | ✅ Done |
| 7 | การประเมินความพึงพอใจ | ✅ Done |
| 8 | การแนบรูปภาพประกอบ | ✅ Done |
| 9 | การระบุสถานที่เกิดเหตุ | ✅ Done |
| 10 | การออกจากระบบ | ✅ Done |
| 11 | การยกเลิกการร้องเรียน | ✅ Done |

#### 👔 Personnel (11/11)

| # | ฟังก์ชัน | สถานะ |
|---|---------|--------|
| 1 | การเข้าสู่ระบบ (เห็นภาพรวม) | ✅ Done |
| 2 | การจัดการโปรไฟล์ผู้ใช้ | ✅ Done |
| 3 | กระบวนการร้องเรียนเชิงนโยบาย | ✅ Done |
| 4 | การแจ้งเตือน | ✅ Done |
| 5 | การตั้งค่าแจ้งเตือน | ✅ Done |
| 6 | การติดตามสถานะ (ตัวเอง + ภาพรวม) | ✅ Done |
| 7 | การกำหนดระดับความเร่งด่วน | ✅ Done |
| 8 | การแนบรูปภาพประกอบ | ✅ Done |
| 9 | การระบุสถานที่เกิดเหตุ | ✅ Done |
| 10 | การออกจากระบบ | ✅ Done |
| 11 | การยกเลิกการร้องเรียน | ✅ Done |

---

## ฟังก์ชันที่ยังไม่ได้ทำ (Sprint ถัดไป)

| Role | ฟังก์ชัน |
|------|---------|
| **Samo** | กระบวนการรับเรื่อง, คัดกรองหมวดหมู่, มอบหมายงาน, ส่งต่อหน่วยงาน, ติดตามภาพรวมคณะ |
| **University Officer** | กระบวนการรับเรื่อง, ระบุผู้รับผิดชอบ, ติดตามภาพรวมที่ถูกส่งต่อมา |
| **Admin** | จัดการโปรไฟล์และสิทธิ์ผู้ใช้, จัดการข้อมูลพื้นฐาน (category/location), แจ้งเตือนเชิงระบบ, สถิติภาพรวม |

---

## การแจ้งเตือนอัตโนมัติ (Notification Triggers)

| เหตุการณ์ | ผู้รับแจ้งเตือน |
|-----------|--------------|
| มีคำร้องใหม่เข้ามา | personnel, samo, officer, admin ทุกคน |
| สถานะเปลี่ยนเป็น `in_progress` | เจ้าของคำร้อง |
| สถานะเปลี่ยนเป็น `resolved` | เจ้าของคำร้อง |
