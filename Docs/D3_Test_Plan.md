#(Test Plan Document)
 
## 1. Introduction

- โปรเจกต: ระบบร้องเรียนปัญหาและแจ้งเตือนข่าวสารภายในมหาวิทยาลัย
- เวอร์ชัน: 1.0
- วันที่: 21 มีนาคม 2569
- ผู้เขียน: ทีม QA — บุศรินทร์ พันธุเวช / นิรชา แก้วงาม

## 2. Testing Scope

- ฟีเจอร์ที่ทดสอบ
1. การจัดการบัญชีและสิทธิ์การเข้าถึง
2. การแจ้งเรื่องร้องเรียนและระบุสถานที่
3. กระบวนการจัดการและส่งต่องาน
4. ระบบแจ้งเตือนและติดตามสถานะ
5. การบริหารจัดการระบบโดยผู้ดูแล

- ฟีเจอร์ที่ไม่ทดสอบ
1. ระบบ LDAP/Active Directory จริงของมหาวิทยาลัย — ใช้ Mock API แทน
2. การส่ง Push Notification บนสภาพแวดล้อมจริง — ทดสอบใน Staging เท่านั้น
3. ฮาร์ดแวร์เซิร์ฟเวอร์จริงของมหาวิทยาลัย — ทดสอบบน Cloud แทน
4. เบราว์เซอร์รุ่นเก่ากว่า 2 เวอร์ชันย้อนหลัง
5. การรับโหลดผู้ใช้งานพร้อมกันเกิน 500 คน

## 3. กลยุทธ์การทดสอบ (Testing Strategy)

- Unit Testing
- ทดสอบ: ฟังก์ชัน, methods, logic
- ขอบเขต: 93 test cases
- Coverage: >= 80%
- Framework: Jest

**บริการยืนยันตัวตน (Authentication Service) — 15 กรณี**
- test_login_withValidBuuEmail_returnsJwtToken
- test_login_withNonBuuEmail_throwsUnauthorizedError
- test_login_withWrongPassword_throwsUnauthorizedError
- test_login_withWrongPassword5Times_locksAccountFor15min
- test_login_withLockedAccount_throwsForbiddenError
- test_validateToken_withValidToken_returnsUserPayload
- test_validateToken_withExpiredToken_returnsNull
- test_validateToken_withTamperedToken_throwsInvalidError
- test_logout_clearsSessionAndToken
- test_rbac_studentRole_cannotAccessAdminPanel
- test_rbac_samoRole_canOnlySeeOwnFacultyIssues
- test_rbac_officerRole_canSeeAllForwardedIssues
- test_rbac_adminRole_canManageAllUsers
- test_session_afterLogout_isInvalidated
- test_refreshToken_withValidToken_returnsNewToken

**บริการแจ้งเรื่องร้องเรียน (Issue Submission Service) — 15 กรณี**
- test_createIssue_withAllRequiredFields_returnsIssueId
- test_createIssue_withoutLocation_throwsValidationError
- test_createIssue_withoutCategory_throwsValidationError
- test_createIssue_initialStatus_isPending
- test_getLocations_byZone_loadsWithin2Seconds
- test_getLocations_selectOthers_allowsFreeTextInput
- test_uploadImage_withFileSizeUnder5MB_succeeds
- test_uploadImage_withFileSizeOver5MB_throwsError
- test_uploadImage_withInvalidMimeType_throwsError
- test_cancelIssue_withStatusPending_changesStatusToCancelled
- test_cancelIssue_withStatusInProgress_throwsForbiddenError
- test_cancelIssue_byNonOwner_throwsForbiddenError
- test_submitSatisfaction_byStudent_savesRating
- test_submitSatisfaction_byEmployee_throwsForbiddenError
- test_submitSatisfaction_afterAlreadyRated_throwsConflictError

**บริการการแจ้งเตือน (Notification Service) — 12 กรณี**
- test_sendEmailNotification_onStatusChange_within60Seconds
- test_sendNotification_toCorrectUser_byIssueId
- test_sendNotification_toSamo_onNewIssueInFaculty
- test_sendNotification_toOfficer_onForwardFromSamo
- test_sendEmergencyAlert_toAllUsers_bySeverity
- test_notification_channel_email_savesToTable
- test_notification_channel_app_savesToTable
- test_getNotificationHistory_byUserId_returnsCorrectList
- test_notification_mustLinkToIssueOrAlert_notBoth
- test_notification_withNullIssueAndNullAlert_throwsConstraintError
- test_saveNotificationSettings_toggleOffEmail_doesNotSend
- test_saveNotificationSettings_filterByCategory_onlySendsRelevant

**บริการผู้ดูแลระบบ (Admin Service) — 12 กรณี**
- test_createUser_withStudentRole_requiresStudentId
- test_createUser_withEmployeeRole_requiresEmployeeCode
- test_createUser_withDuplicateEmail_throwsUniqueConstraintError
- test_changeUserRole_updatesRbacImmediately
- test_disableUser_blocksLoginImmediately
- test_changeRoleToAdmin_requiresPasswordConfirmation
- test_adminAction_logsAuditTrail_whoWhenWhat
- test_addBuilding_toLocationTable_updatesDropdown
- test_addCategory_toTable_appearsInComplaintForm
- test_deleteCategory_withLinkedIssues_throwsRestrictError
- test_exportReport_withDateRange_returnsCsvFile
- test_exportReport_withCategoryFilter_returnsPdfFile

### Integration Testing
- ทดสอบ: การทำงานร่วมกันระหว่างโมดูล
- ขอบเขต: 5 ชุดทดสอบ

1. กระบวนการยืนยันตัวตน (Authentication Flow)
- เข้าสู่ระบบด้วยอีเมล @buu.ac.th → 200 OK + JWT Token
- เข้าสู่ระบบด้วยอีเมลอื่น → 401 Unauthorized
- ดูข้อมูลโปรไฟล์พร้อม Token → 200 OK + ข้อมูลผู้ใช้
- ดูข้อมูลโปรไฟล์โดยไม่มี Token → 401 Unauthorized

2. API การแจ้งเรื่องร้องเรียน (Issue Submission API)
- ดึงรายการสถานที่ → 200 OK + รายการอาคาร
- สร้างคำร้องพร้อมรูปภาพ → 201 Created + หมายเลขคำร้อง
- สร้างคำร้องโดยไม่ระบุสถานที่ → 400 Bad Request
- ยกเลิกคำร้องสถานะรอดำเนินการ → 200 OK + สถานะยกเลิก
- ยกเลิกคำร้องสถานะกำลังดำเนินการ → 403 Forbidden

3. กระบวนการจัดการงาน (Workflow Management)
- สโมสรรับเรื่องและเปลี่ยนสถานะ → 200 OK
- สโมสรส่งต่อให้เจ้าหน้าที่ → 200 OK + สิทธิ์โอนไปเจ้าหน้าที่
- เจ้าหน้าที่จบงานพร้อมรูปภาพหลังซ่อม → 200 OK + ส่งอีเมล
- ผู้ดูแลเพิ่มอาคารใหม่ → 201 Created + Dropdown อัปเดต
- นิสิตพยายามกดจบงาน → 403 Forbidden

4. ระบบการแจ้งเตือนทางอีเมล (Email Notifications)
- เจ้าหน้าที่กดจบงาน → อีเมลส่งถึงผู้แจ้งภายใน 60 วินาที
- ผู้ดูแลส่งประกาศ → ผู้ใช้ทุกคนเห็นบน Dashboard
- คำร้องเสร็จสิ้น + นิสิต → แบบประเมินความพึงพอใจปรากฏ

5. การจัดการข้อผิดพลาด (API Error Handling)
- ส่งข้อมูลผิดรูปแบบ → 400 Bad Request
- นิสิตเข้าถึงหน้าผู้ดูแล → 403 Forbidden
- ดึงข้อมูลคำร้องที่ไม่มีในระบบ → 404 Not Found

### System Testing / End-to-End
- ทดสอบ: กระบวนการทำงานตั้งแต่ต้นจนจบ
- Scenario: 6 สถานการณ์

**Scenario 1: นิสิตแจ้งปัญหาครบวงจร**
- เลือกหมวดหมู่และสถานที่ → แนบรูปภาพ → ส่ง → ได้หมายเลขคำร้อง → ดูไทม์ไลน์ → ยกเลิกคำร้อง
**Scenario 2: สโมสรคัดกรองและส่งต่องาน**
- เห็นเฉพาะคำร้องคณะตนเอง → แก้ไขหมวดหมู่ → รับเรื่อง → ส่งต่อกองกลาง
**Scenario 3: เจ้าหน้าที่รับงานและจบงาน**
- รับคำร้องที่ส่งต่อมา → มอบหมายทีมช่าง → กดจบงานพร้อมรูปภาพหลังซ่อม → ส่งอีเมลแจ้งนิสิต
**Scenario 4: ผู้ดูแลระบบจัดการและออกรายงาน**
- เพิ่มข้อมูลอาคาร → Dropdown อัปเดต → เปลี่ยนบทบาทผู้ใช้ → ส่งประกาศ → ส่งออกรายงาน CSV/PDF
**Scenario 5: การจัดการข้อผิดพลาด**
กรอกรหัสผ่านผิด 5 ครั้ง → บัญชีถูกล็อค → ส่งฟอร์มไม่ระบุสถานที่ → แสดงข้อผิดพลาด → นิสิตเข้าหน้าผู้ดูแล → 403
**Scenario 6: กระบวนการครบวงจรทุกบทบาท**
- [นิสิต] แจ้งคำร้อง → [สโมสร] คัดกรองและส่งต่อ → [เจ้าหน้าที่] รับและจบงาน → [นิสิต] ได้รับอีเมลและให้คะแนน → [ผู้ดูแล] ส่งออกรายงาน

### UAT (User Acceptance Testing)
- ทดสอบกับ: ตัวแทนผู้ใช้จริง
- scenarios: 5 สถานการณ์จากการใช้งานจริง
- scenarios 1: นิสิต — แจ้งปัญหาจริงโดยไม่มีคำแนะนำ ทำสำเร็จภายใน 10 นาที
- scenarios 2: บุคลากร — ส่งเรื่องร้องเรียนและกำหนดระดับความเร่งด่วน ทำสำเร็จภายใน 10 นาที
- scenarios 3: สโมสรคณะ — คัดกรอง แก้ไขหมวดหมู่ และส่งต่อคำร้อง ทำสำเร็จภายใน 15 นาที
- scenarios 4: เจ้าหน้าที่ — รับงาน มอบหมายทีมช่าง และจบงานพร้อมยืนยันอีเมล ทำสำเร็จภายใน 10 นาที
- scenarios 5: ผู้ดูแลระบบ — จัดการข้อมูลหลัก เปลี่ยนบทบาทผู้ใช้ และส่งออกรายงาน PDF ทำสำเร็จภายใน 15 นาที

## 4. Test Tools & Environment
- ทดสอบหน่วย: Jest
- ทดสอบการผสานระบบ: Supertest / Postman
- ทดสอบครบวงจร: Playwright

- สภาพแวดล้อม	URL
- พัฒนา (Development)	localhost:3000
- ทดสอบ (Staging)	localhost:3000
- ใช้งานจริง (Production)	issue.buu.ac.th
- Test Database: MySQL (phpMyAdmin) — university_issue_test

5. ตัวชี้วัดการทดสอบ (Test Metrics)
- ความครอบคลุมโค้ด: >= 80%
- อัตราการผ่านการทดสอบ: 100% (ทุกกรณีต้องผ่าน)
- จำนวนข้อผิดพลาดระดับวิกฤตที่ยอมรับได้: 0
- เวลาในการรันการทดสอบทั้งหมด: < 2 นาที
