\-- \=========================  
\-- 1\) MASTER TABLES  
\-- \=========================

CREATE TABLE app\_user (  
  user\_id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  student\_id     VARCHAR(50),  
  employee\_code  VARCHAR(50),  
  firstname      VARCHAR(100) NOT NULL,  
  lastname       VARCHAR(100) NOT NULL,  
  email          VARCHAR(255) NOT NULL UNIQUE,  
  role           VARCHAR(30)  NOT NULL,   \-- e.g. 'student','employee','admin'  
  phone          VARCHAR(30),

  \-- บังคับไม่ให้ student\_id/employee\_code ซ้ำ  
  CONSTRAINT uq\_app\_user\_student\_id UNIQUE (student\_id),  
  CONSTRAINT uq\_app\_user\_employee\_code UNIQUE (employee\_code),

  \-- กติกาพื้นฐาน: role เป็น student ต้องมี student\_id, role เป็น employee ต้องมี employee\_code  
  CONSTRAINT ck\_app\_user\_role\_ids  
  CHECK (  
    (role \<\> 'student') OR (student\_id IS NOT NULL)  
  ),  
  CONSTRAINT ck\_app\_user\_role\_ids2  
  CHECK (  
    (role \<\> 'employee') OR (employee\_code IS NOT NULL)  
  )  
);

CREATE TABLE category (  
  category\_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  category\_name  VARCHAR(100) NOT NULL UNIQUE,  
  description    TEXT  
);

CREATE TABLE location (  
  location\_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  building       VARCHAR(100) NOT NULL,  
  floor          VARCHAR(30),  
  room           VARCHAR(50),  
  \-- กันข้อมูลซ้ำแบบ obvious  
  CONSTRAINT uq\_location UNIQUE (building, floor, room)  
);

CREATE TABLE department (  
  department\_id    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  department\_name  VARCHAR(150) NOT NULL UNIQUE  
);

\-- \=========================  
\-- 2\) CORE TABLES  
\-- \=========================

CREATE TABLE issue\_report (  
  issue\_id      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  user\_id       BIGINT NOT NULL,  
  category\_id   BIGINT NOT NULL,  
  location\_id   BIGINT NOT NULL,

  title         VARCHAR(200) NOT NULL,  
  status        VARCHAR(30)  NOT NULL,   \-- e.g. 'open','in\_progress','resolved','closed'  
  priority      VARCHAR(30),             \-- e.g. 'low','medium','high'  
  description   TEXT,

  created\_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),  
  updated\_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk\_issue\_user  
    FOREIGN KEY (user\_id) REFERENCES app\_user(user\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk\_issue\_category  
    FOREIGN KEY (category\_id) REFERENCES category(category\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk\_issue\_location  
    FOREIGN KEY (location\_id) REFERENCES location(location\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT  
);

CREATE TABLE emergency\_alert (  
  alert\_id     BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  created\_by   BIGINT NOT NULL,

  title        VARCHAR(200) NOT NULL,  
  message      TEXT NOT NULL,  
  severity     VARCHAR(30) NOT NULL,   \-- e.g. 'info','warning','critical'  
  created\_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk\_alert\_user  
    FOREIGN KEY (created\_by) REFERENCES app\_user(user\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT  
);

CREATE TABLE assignment (  
  assignment\_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  issue\_id       BIGINT NOT NULL,  
  department\_id  BIGINT NOT NULL,  
  assigned\_by    BIGINT NOT NULL,  
  assigned\_to    BIGINT NOT NULL,  
  assigned\_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk\_assignment\_issue  
    FOREIGN KEY (issue\_id) REFERENCES issue\_report(issue\_id)  
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk\_assignment\_department  
    FOREIGN KEY (department\_id) REFERENCES department(department\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk\_assignment\_assigned\_by  
    FOREIGN KEY (assigned\_by) REFERENCES app\_user(user\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT,

  CONSTRAINT fk\_assignment\_assigned\_to  
    FOREIGN KEY (assigned\_to) REFERENCES app\_user(user\_id)  
    ON UPDATE CASCADE ON DELETE RESTRICT,

  \-- กัน assigned\_by \= assigned\_to (ถ้าไม่ต้องการให้มอบหมายให้ตัวเอง)  
  CONSTRAINT ck\_assignment\_not\_self  
    CHECK (assigned\_by \<\> assigned\_to)  
);

CREATE TABLE notification (  
  notification\_id  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,  
  user\_id          BIGINT NOT NULL,

  issue\_id         BIGINT,  
  alert\_id         BIGINT,

  message          TEXT NOT NULL,  
  channel          VARCHAR(30) NOT NULL,     \-- e.g. 'email','sms','app'  
  created\_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT fk\_notification\_user  
    FOREIGN KEY (user\_id) REFERENCES app\_user(user\_id)  
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk\_notification\_issue  
    FOREIGN KEY (issue\_id) REFERENCES issue\_report(issue\_id)  
    ON UPDATE CASCADE ON DELETE CASCADE,

  CONSTRAINT fk\_notification\_alert  
    FOREIGN KEY (alert\_id) REFERENCES emergency\_alert(alert\_id)  
    ON UPDATE CASCADE ON DELETE CASCADE,

  \-- กติกาสำคัญ: ต้องผูก "อย่างใดอย่างหนึ่ง" เท่านั้น (issue หรือ alert)  
  CONSTRAINT ck\_notification\_target  
    CHECK (  
      (issue\_id IS NOT NULL AND alert\_id IS NULL) OR  
      (issue\_id IS NULL AND alert\_id IS NOT NULL)  
    )  
);

\-- \=========================  
\-- 3\) INDEXES (PERFORMANCE)  
\-- \=========================

\-- FK indexes  
CREATE INDEX idx\_issue\_user       ON issue\_report(user\_id);  
CREATE INDEX idx\_issue\_category   ON issue\_report(category\_id);  
CREATE INDEX idx\_issue\_location   ON issue\_report(location\_id);

CREATE INDEX idx\_alert\_created\_by ON emergency\_alert(created\_by);

CREATE INDEX idx\_assign\_issue     ON assignment(issue\_id);  
CREATE INDEX idx\_assign\_dept      ON assignment(department\_id);  
CREATE INDEX idx\_assign\_by        ON assignment(assigned\_by);  
CREATE INDEX idx\_assign\_to        ON assignment(assigned\_to);

CREATE INDEX idx\_notif\_user       ON notification(user\_id);  
CREATE INDEX idx\_notif\_issue      ON notification(issue\_id);  
CREATE INDEX idx\_notif\_alert      ON notification(alert\_id);

\-- Common query filters  
CREATE INDEX idx\_issue\_status     ON issue\_report(status);  
CREATE INDEX idx\_issue\_created\_at ON issue\_report(created\_at);  
CREATE INDEX idx\_alert\_severity   ON emergency\_alert(severity);  
CREATE INDEX idx\_notif\_channel    ON notification(channel);

