-- =========================
-- 1) MASTER TABLES
-- =========================

CREATE TABLE app_user (
  user_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  student_id     VARCHAR(50),
  employee_code  VARCHAR(50),
  firstname      VARCHAR(100) NOT NULL,
  lastname       VARCHAR(100) NOT NULL,
  email          VARCHAR(255) NOT NULL UNIQUE,
  role           VARCHAR(30)  NOT NULL,   -- e.g. 'student','employee','admin'
  phone          VARCHAR(30),

  -- บังคับไม่ให้ student_id/employee_code ซ้ำ
  CONSTRAINT uq_app_user_student_id UNIQUE (student_id),
  CONSTRAINT uq_app_user_employee_code UNIQUE (employee_code),

  -- กติกาพื้นฐาน: role เป็น student ต้องมี student_id, role เป็น employee ต้องมี employee_code
  CONSTRAINT ck_app_user_role_ids
  CHECK (
    (role <> 'student') OR (student_id IS NOT NULL)
  ),
  CONSTRAINT ck_app_user_role_ids2
  CHECK (
    (role <> 'employee') OR (employee_code IS NOT NULL)
  )
);

CREATE TABLE category (
  category_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  category_name  VARCHAR(100) NOT NULL UNIQUE,
  description    TEXT
);

CREATE TABLE location (
  location_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  building       VARCHAR(100) NOT NULL,
  floor          VARCHAR(30),
  room           VARCHAR(50),
  -- กันข้อมูลซ้ำแบบ obvious
  CONSTRAINT uq_location UNIQUE (building, floor, room)
);

CREATE TABLE department (
  department_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  department_name  VARCHAR(150) NOT NULL UNIQUE
);

-- =========================
-- 2) CORE TABLES
-- =========================

CREATE TABLE issue_report (
  issue_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       BIGINT NOT NULL,
  category_id   BIGINT NOT NULL,
  location_id   BIGINT NOT NULL,

  title         VARCHAR(200) NOT NULL,
  status        VARCHAR(30)  NOT NULL,   -- e.g. 'open','in_progress','resolved','closed'
  priority      VARCHAR(30),             -- e.g. 'low','medium','high'
  description   TEXT,

  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_issue_user
    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_issue_category
    FOREIGN KEY (category_id) REFERENCES category(category_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_issue_location
    FOREIGN KEY (location_id) REFERENCES location(location_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE emergency_alert (
  alert_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_by   BIGINT NOT NULL,

  title        VARCHAR(200) NOT NULL,
  message      TEXT NOT NULL,
  severity     VARCHAR(30) NOT NULL,   -- e.g. 'info','warning','critical'
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_alert_user
    FOREIGN KEY (created_by) REFERENCES app_user(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE TABLE assignment (
  assignment_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  issue_id       BIGINT NOT NULL,
  department_id  BIGINT NOT NULL,
  assigned_by    BIGINT NOT NULL,
  assigned_to    BIGINT NOT NULL,
  assigned_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_assignment_issue
    FOREIGN KEY (issue_id) REFERENCES issue_report(issue_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_assignment_department
    FOREIGN KEY (department_id) REFERENCES department(department_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_assignment_assigned_by
    FOREIGN KEY (assigned_by) REFERENCES app_user(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk_assignment_assigned_to
    FOREIGN KEY (assigned_to) REFERENCES app_user(user_id)
    ON UPDATE CASCADE ON DELETE RESTRICT,

  -- กัน assigned_by = assigned_to (ถ้าไม่ต้องการให้มอบหมายให้ตัวเอง)
  CONSTRAINT ck_assignment_not_self
    CHECK (assigned_by <> assigned_to)
);

CREATE TABLE notification (
  notification_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id          BIGINT NOT NULL,

  issue_id         BIGINT,
  alert_id         BIGINT,

  message          TEXT NOT NULL,
  channel          VARCHAR(30) NOT NULL,     -- e.g. 'email','sms','app'
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk_notification_user
    FOREIGN KEY (user_id) REFERENCES app_user(user_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_notification_issue
    FOREIGN KEY (issue_id) REFERENCES issue_report(issue_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk_notification_alert
    FOREIGN KEY (alert_id) REFERENCES emergency_alert(alert_id)
    ON UPDATE CASCADE ON DELETE CASCADE,

  -- กติกาสำคัญ: ต้องผูก "อย่างใดอย่างหนึ่ง" เท่านั้น (issue หรือ alert)
  CONSTRAINT ck_notification_target
    CHECK (
      (issue_id IS NOT NULL AND alert_id IS NULL) OR
      (issue_id IS NULL AND alert_id IS NOT NULL)
    )
);

-- =========================
-- 3) INDEXES (PERFORMANCE)
-- =========================

-- FK indexes
CREATE INDEX idx_issue_user       ON issue_report(user_id);
CREATE INDEX idx_issue_category   ON issue_report(category_id);
CREATE INDEX idx_issue_location   ON issue_report(location_id);

CREATE INDEX idx_alert_created_by ON emergency_alert(created_by);

CREATE INDEX idx_assign_issue     ON assignment(issue_id);
CREATE INDEX idx_assign_dept      ON assignment(department_id);
CREATE INDEX idx_assign_by        ON assignment(assigned_by);
CREATE INDEX idx_assign_to        ON assignment(assigned_to);

CREATE INDEX idx_notif_user       ON notification(user_id);
CREATE INDEX idx_notif_issue      ON notification(issue_id);
CREATE INDEX idx_notif_alert      ON notification(alert_id);

-- Common query filters
CREATE INDEX idx_issue_status     ON issue_report(status);
CREATE INDEX idx_issue_created_at ON issue_report(created_at);
CREATE INDEX idx_alert_severity   ON emergency_alert(severity);
CREATE INDEX idx_notif_channel    ON notification(channel);
