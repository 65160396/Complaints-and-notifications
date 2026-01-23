# มาตรฐานการเขียนโค้ด

### 1. ชื่อคลาส (Class Names)

**ข้อกำหนด:** PascalCase, ใช้คำนาม

class User {}
class IssueReport {}
class EmergencyAlert {}
class Notification {}
class Category {}
class Location {}


### 2. ชื่อเมธอด (Method Names)

**ข้อกำหนด:** camelCase, ใช้คำกริยา


class User {
  getUserById(userId) {}
}

class IssueReport {
  createIssueReport(reporterUserId, payload) {}
  getIssueReportById(issueId) {}
  listIssueReports(filters) {}
  updateIssueReport(issueId, updates) {}
  updateIssueStatus(issueId, status) {}
  updateIssuePriority(issueId, priorityLevel) {}
}

### 3. ชื่อตัวแปร (Variable Names)

**ข้อกำหนด:** camelCase, ชื่ออธิบายได้

userId, issueId, alertId, categoryId, locationId, departmentId

reporterUserId, recipientUserId

assignedByUserId, assignedToUserId

priorityLevel, severityLevel

createdAt, updatedAt



### 5. ชื่อฐานข้อมูล (Database Names)

**ข้อกำหนด:** snake_case สำหรับตารางและคอลัมน์


```sql
CREATE TABLE user (
  user_id SERIAL PRIMARY KEY,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255) UNIQUE NOT NULL,
  phone_number VARCHAR(20),
  role VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE category (
  category_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE location (
  location_id SERIAL PRIMARY KEY,
  building VARCHAR(100),
  floor_number INT,
  room_number VARCHAR(50)
);

CREATE TABLE issue_report (
  issue_id SERIAL PRIMARY KEY,
  reporter_user_id INT REFERENCES user(user_id),
  category_id INT REFERENCES category(category_id),
  location_id INT REFERENCES location(location_id),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50),
  priority_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```


## ความเห็นและเอกสาร

### ความเห็นในโค้ด

**ข้อกำหนด:** ใช้ความเห็น **WHY** ไม่ใช่ **WHAT**


class User {
  constructor(userId, role) {
    this.userId = userId;
    this.role = role;

    // ใช้ role เพื่อกำหนดสิทธิ์การเข้าถึงของผู้ใช้แต่ละประเภท
  }
}






