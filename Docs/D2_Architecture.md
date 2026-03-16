# **Architecture Overview (MVC)**

ระบบนี้ใช้ MVC (Model–View–Controller) Architecture เพื่อแยกหน้าที่ของระบบออกเป็นส่วน ๆ อย่างชัดเจน ทำให้ระบบดูแลรักษาง่าย และรองรับผู้ใช้งานหลายบทบาท

## **1.MVC Layers**

### **1.1 Model**

หน้าที่

* จัดการข้อมูลและ Business Logic  
* ติดต่อฐานข้อมูล

ตัวอย่าง

* User  
* Role  
* Complaint  
* Notification  
* Category  
* Location

### **1.2 View**

หน้าที่

* แสดงผลให้ผู้ใช้  
* รับข้อมูลจากผู้ใช้

ตัวอย่าง

* Login Page  
* Student Dashboard  
* Samo Dashboard  
* Admin Panel  
* Complaint Form

### **1.3 Controller**

หน้าที่

* รับ Request จาก View  
* เรียกใช้งาน Model  
* ส่งผลลัพธ์กลับไปที่ View

ตัวอย่าง

* AuthController  
* UserController  
* ComplaintController  
* NotificationController  
* AdminController

## **2.Components & Relationships**

User

 ↓

View

 ↓

Controller

 ↓

Model

 ↓

Database 

## **3.Technology Stack Selection (MVC-based)**

View

* HTML / CSS / JavaScript

Controller

* Node.js (Express)

Model

* ORM  
* MySQL หรือ PostgreSQL