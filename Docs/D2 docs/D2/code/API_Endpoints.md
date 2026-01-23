For University Issue Reporting and Emergency Notification System

## 1) Auth
- POST   /auth/login
- POST   /auth/logout
- GET    /auth/me

## 2) Users (Profile)
- GET    /users/me
- PATCH  /users/me

## 3) Master Data
### Categories
- GET    /categories
- POST   /categories              (admin)
- PATCH  /categories/{categoryId} (admin)
- DELETE /categories/{categoryId} (admin)

### Locations
- GET    /locations
- POST   /locations              (admin)
- PATCH  /locations/{locationId} (admin)
- DELETE /locations/{locationId} (admin)

### Departments
- GET    /departments
- POST   /departments              (admin)
- PATCH  /departments/{departmentId} (admin)
- DELETE /departments/{departmentId} (admin)

## 4) Issues (Issue Reports)
- POST   /issues                         (reporter)
- GET    /issues                         (role-based list)
- GET    /issues/{issueId}               (role-based)
- PATCH  /issues/{issueId}               (role-based update fields)
- POST   /issues/{issueId}/cancel        (reporter; only PENDING)

## 5) Workflow / Assignments
- POST   /issues/{issueId}/assignments           (samo/officer/admin)
- GET    /issues/{issueId}/assignments           (role-based)
- PATCH  /assignments/{assignmentId}             (samo/officer/admin)
- POST   /issues/{issueId}/forward               (samo -> officer/admin flow)

## 6) Issue Status
- PATCH  /issues/{issueId}/status                (samo/officer/admin)
- POST   /issues/{issueId}/complete              (samo/officer/admin)
- POST   /issues/{issueId}/evidence/after        (samo/officer/admin)  (upload link/metadata)

## 7) Attachments (Evidence)
- POST   /issues/{issueId}/attachments           (reporter) (upload link/metadata)
- GET    /issues/{issueId}/attachments           (role-based)

## 8) Notifications
- GET    /notifications                          (current user)
- PATCH  /notifications/{notificationId}/read    (current user)

## 9) Emergency Alerts
- POST   /emergency-alerts                       (admin)
- GET    /emergency-alerts                       (all authenticated)
- GET    /emergency-alerts/{alertId}             (all authenticated)

## 10) Reporting / Export
- GET    /reports/issues/summary                 (admin)
- GET    /reports/issues/export?format=csv|pdf   (admin)