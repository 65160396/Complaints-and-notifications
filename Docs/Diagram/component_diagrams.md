# System Architecture (MVC)

## Overview
This system follows the MVC (Model-View-Controller) architecture:
- View (Presentation Layer)
- Controller (Business Layer)
- Model (Data Layer)
- Database (MySQL / PostgreSQL)

---

## Diagram

```mermaid
graph TD

%% User
User --> LoginPage

%% View Layer
subgraph View [View (Presentation Layer)]
LoginPage
StudentDashboard
SamoDashboard
AdminPanel
ComplaintForm
end

%% Controller Layer
subgraph Controller [Controller (Business Layer)]
AuthController
UserController
AdminController
NotificationController
ComplaintController
end

%% Model Layer
subgraph Model [Model (Data Layer)]
UserModel
Role
Notification
Complaint
Category
Location
end

%% Database
Database[(Database\n(MySQL / PostgreSQL))]

%% View -> Controller
LoginPage --> AuthController
StudentDashboard --> UserController
SamoDashboard --> UserController
SamoDashboard --> AdminController
AdminPanel --> AdminController
ComplaintForm --> ComplaintController

%% Controller -> Model
AuthController --> UserModel
UserController --> UserModel
AdminController --> Role
NotificationController --> Notification
ComplaintController --> Complaint

%% Model -> Database
UserModel --> Database
Role --> Database
Notification --> Database
Complaint --> Database
Category --> Database
Location --> Database