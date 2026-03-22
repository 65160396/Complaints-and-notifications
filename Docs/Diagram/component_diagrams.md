```mermaid
graph TD

%% User
User --> LoginPage

%% View Layer
subgraph View_Presentation_Layer
LoginPage
StudentDashboard
SamoDashboard
AdminPanel
ComplaintForm
end

%% Controller Layer
subgraph Controller_Business_Layer
AuthController
UserController
AdminController
NotificationController
ComplaintController
end

%% Model Layer
subgraph Model_Data_Layer
UserModel
Role
Notification
Complaint
Category
Location
end

%% Database
Database[(Database - MySQL / PostgreSQL)]

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
