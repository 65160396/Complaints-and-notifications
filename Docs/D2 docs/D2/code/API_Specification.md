## 1) POST /api/v1/auth/login
Request:
{
  "email": "user@buu.ac.th",
  "password": "********"
}

Response (200):
{
  "access_token": "jwt_token_here",
  "user": {
    "user_id": 45,
    "firstname": "A",
    "lastname": "B",
    "role": "reporter"
  }
}

Error (401):
{
  "error": "Invalid credentials"
}

==================================================
USER
==================================================

## 2) GET /api/v1/users/me
Response (200):
{
  "user_id": 45,
  "student_id": "65000000",
  "firstname": "A",
  "lastname": "B",
  "email": "user@buu.ac.th",
  "role": "reporter"
}

==================================================
ISSUE REPORT
==================================================

## 3) POST /api/v1/issues
Request:
{
  "title": "ไฟดับหน้าห้อง 101",
  "description": "ไฟดับตั้งแต่เช้า",
  "category_id": 3,
  "location_id": 12,
  "priority": "MEDIUM"
}

Response (201):
{
  "issue_id": 901,
  "user_id": 45,
  "status": "PENDING",
  "created_at": "2026-01-21T10:00:00Z"
}

Error (400):
{
  "error": "Invalid category ID or location ID"
}

--------------------------------------------------

## 4) GET /api/v1/issues
Response (200):
{
  "items": [
    {
      "issue_id": 901,
      "title": "ไฟดับหน้าห้อง 101",
      "status": "PENDING"
    }
  ]
}

--------------------------------------------------

## 5) GET /api/v1/issues/{issueId}
Response (200):
{
  "issue_id": 901,
  "title": "ไฟดับหน้าห้อง 101",
  "description": "ไฟดับตั้งแต่เช้า",
  "status": "PENDING",
  "priority": "MEDIUM"
}

Error (404):
{
  "error": "Issue not found"
}

--------------------------------------------------

## 6) PATCH /api/v1/issues/{issueId}
Request:
{
  "title": "ไฟดับอาคาร A",
  "priority": "HIGH"
}

Response (200):
{
  "issue_id": 901,
  "updated_at": "2026-01-21T10:05:00Z"
}

--------------------------------------------------

## 7) PATCH /api/v1/issues/{issueId}/status
Request:
{
  "status": "IN_PROGRESS"
}

Response (200):
{
  "issue_id": 901,
  "status": "IN_PROGRESS"
}

Error (400):
{
  "error": "Invalid status value"
}

--------------------------------------------------

## 8) POST /api/v1/issues/{issueId}/cancel
Request:
{
  "reason": "แก้ไขเองแล้ว"
}

Response (200):
{
  "issue_id": 901,
  "status": "CANCELLED"
}

Error (409):
{
  "error": "Cannot cancel issue in current status"
}

==================================================
ASSIGNMENT
==================================================

## 9) POST /api/v1/issues/{issueId}/assignments
Request:
{
  "department_id": 2,
  "assigned_to": 77
}

Response (201):
{
  "assignment_id": 5001,
  "issue_id": 901,
  "assigned_to": 77
}

--------------------------------------------------

## 10) GET /api/v1/issues/{issueId}/assignments
Response (200):
{
  "items": [
    {
      "assignment_id": 5001,
      "department_id": 2,
      "assigned_to": 77
    }
  ]
}

==================================================
ATTACHMENT
==================================================

## 11) POST /api/v1/issues/{issueId}/attachments
Request:
{
  "file_name": "evidence.jpg",
  "file_url": "https://files.example.com/evidence.jpg"
}

Response (201):
{
  "attachment_id": 7001
}

==================================================
COMPLETION
==================================================

## 12) POST /api/v1/issues/{issueId}/complete
Request:
{
  "resolution_note": "ซ่อมเรียบร้อยแล้ว"
}

Response (200):
{
  "issue_id": 901,
  "status": "COMPLETED"
}

==================================================
NOTIFICATION
==================================================

## 13) GET /api/v1/notifications
Response (200):
{
  "items": [
    {
      "notification_id": 3001,
      "message": "คำร้องถูกอัปเดตสถานะ"
    }
  ]
}

--------------------------------------------------

## 14) PATCH /api/v1/notifications/{notificationId}/read
Response (200):
{
  "notification_id": 3001,
  "read": true
}

==================================================
MASTER DATA
==================================================

## 15) GET /api/v1/categories
Response (200):
{
  "items": [
    {
      "category_id": 3,
      "category_name": "ไฟฟ้า"
    }
  ]
}

--------------------------------------------------

## 16) GET /api/v1/locations
Response (200):
{
  "items": [
    {
      "location_id": 12,
      "building": "A",
      "floor": "1",
      "room": "101"
    }
  ]
}

==================================================
EMERGENCY ALERT
==================================================

## 17) POST /api/v1/emergency-alerts
Request:
{
  "title": "ประกาศด่วน",
  "message": "ปิดอาคารชั่วคราว",
  "severity": "HIGH"
}

Response (201):
{
  "alert_id": 8001,
  "created_at": "2026-01-21T12:00:00Z"
}

--------------------------------------------------

## 18) GET /api/v1/emergency-alerts
Response (200):
{
  "items": [
    {
      "alert_id": 8001,
      "title": "ประกาศด่วน",
      "severity": "HIGH"
    }
  ]
}