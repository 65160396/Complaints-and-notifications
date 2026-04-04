## **Design Patterns**

### **1.MVC Pattern**

เหตุผล  
•	โครงสร้างชัดเจน  
•	แยกหน้าที่ชัด  
•	เหมาะกับ Web Application

### **2.Repository Pattern**

ใช้กับ  
•	Model Layer  
เหตุผล  
•	แยกการเข้าฐานข้อมูลออกจาก Controller  
•	โค้ดเป็นระเบียบและดูแลง่าย  
Controller → Service → Repository → Database

### **3.Observer Pattern**

ใช้กับ  
•	ระบบแจ้งเตือน  
เหตุผล  
•	เมื่อสถานะคำร้องเปลี่ยน ต้องแจ้งหลายฝ่าย  
•	ลดการเขียนโค้ดผูกกันโดยตรง

### **4.Strategy Pattern**

ใช้กับ  
•	การกำหนดสิทธิ์ตามบทบาท (Role)  
เหตุผล  
•	Student, Samo, Officer, Admin มีสิทธิ์ต่างกัน  
•	เพิ่มบทบาทใหม่ได้ง่าย