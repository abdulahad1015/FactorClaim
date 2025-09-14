# FactorClaim

A comprehensive claim management system built with MongoDB, FastAPI, and PyQt for managing item claims across different user roles.

## Project Overview

FactorClaim is a multi-tier application designed to streamline the claim process from item creation to factory verification. The system supports different user roles with specific workflows and permissions.

### Technology Stack
- **Backend**: FastAPI + MongoDB
- **Frontend**: PyQt Desktop Application
- **Database**: MongoDB
- **Authentication**: JWT-based authentication

## System Architecture

The application consists of two main components:
- **Backend**: RESTful API services with MongoDB integration
- **DesktopApp**: PyQt-based desktop application for different user interfaces

## User Roles & Workflow

### Workflow Process
1. **Admin** creates items and manages users (representatives and factory users)
2. **Representative** adds merchants to the system
3. **Representative** creates claim orders for specific merchants with item quantities
4. **Factory User** receives, unpacks, and verifies orders before marking as verified
5. **Admin** monitors statistics and performance of all orders

### User Types
- **Admin**: System administration, item management, user management, statistics monitoring
- **Representative**: Merchant management, claim order creation
- **Factory User**: Order verification and processing
- **Merchant**: External entities for whom claims are created

## Database Schema

### Item
```
- ID: ObjectId
- name: String
- model: String
- batch: String
- production_date: Date
- wattage: Number
- supplier: String
- contractor: String
- notes: String
```

### User
```
- ID: ObjectId
- name: String
- type: String (Admin/Rep/Factory)
- contact_no: String
```

### Rep
```
- ID: ObjectId
- name: String
- contact: String
```

### Merchant
```
- ID: ObjectId
- address: String
- contact: String
```

### Claim
```
- rep_id: ObjectId
- merchant_id: ObjectId
- date: Date
- items: Array of Objects
- verified: Boolean
```

## Development Plan

### Phase 1: Project Setup & Architecture
- Set up project structure with Backend and DesktopApp folders
- Create virtual environments and install dependencies
- Establish basic architecture and configuration management

### Phase 2: Database Design & Models
- Create MongoDB collections and Pydantic models
- Set up database connection and basic CRUD operations
- Implement data validation and relationships

### Phase 3: Backend API Development
- Build RESTful API endpoints for all entities
- Implement authentication and authorization middleware
- Create role-based access control system

### Phase 4: Admin Desktop Interface
- Item management (CRUD operations)
- User management system
- Statistics dashboard and monitoring tools

### Phase 5: Rep Desktop Interface
- Merchant management functionality
- Claim order creation with item selection
- Order tracking and status monitoring

### Phase 6: Factory User Interface
- Incoming order viewing system
- Order verification interface
- Verification history and reporting

### Phase 7: Authentication & Security
- JWT token implementation
- Password hashing and security measures
- Secure API communication protocols

### Phase 8: Testing & Validation
- Unit tests for API endpoints
- Integration testing for complete workflows
- Performance and security testing

### Phase 9: Documentation & Deployment
- API documentation with OpenAPI/Swagger
- User manuals for different roles
- Deployment configurations and guides

## Key Features

### For Admins
- Complete item lifecycle management
- User creation and role assignment
- Comprehensive statistics and reporting
- System configuration and monitoring

### For Representatives
- Merchant registration and management
- Claim order creation with multiple items
- Order status tracking
- Personal performance metrics

### For Factory Users
- Order verification workflow
- Item unpacking and inspection interface
- Verification status management
- Processing history and reports

## Technical Considerations

1. **Database Relationships**: MongoDB ObjectIds for referencing between collections
2. **Real-time Updates**: WebSocket integration for live order status updates
3. **Data Validation**: Both client-side (PyQt) and server-side (FastAPI) validation
4. **Error Handling**: Robust error handling with user-friendly messages
5. **Scalability**: Designed for future growth and expansion

## Getting Started

### Prerequisites
- Python 3.8+
- MongoDB 4.4+
- PyQt6
- FastAPI
- Motor (async MongoDB driver)

### Installation
```bash
# Clone the repository
git clone https://github.com/abdulahad1015/FactorClaim.git
cd FactorClaim

# Set up Backend
cd Backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt

# Set up Desktop App
cd ../DesktopApp
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Configuration
1. Set up MongoDB connection string in `Backend/config.py`
2. Configure JWT secret key for authentication
3. Set up environment variables for different deployment stages

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

Project Owner: Abdul Ahad
Repository: [FactorClaim](https://github.com/abdulahad1015/FactorClaim)

---

*Last updated: September 12, 2025*