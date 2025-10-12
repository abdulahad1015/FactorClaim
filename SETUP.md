# FactorClaim Development Setup

## Backend Setup

1. **Navigate to Backend directory:**
   ```cmd
   cd Backend
   ```

2. **Create virtual environment:**
   ```cmd
   python -m venv venv
   ```

3. **Activate virtual environment:**
   ```cmd
   venv\Scripts\activate
   ```

4. **Install dependencies:**
   ```cmd
   pip install -r requirements.txt
   ```

5. **Set up environment variables:**
   ```cmd
   copy .env.example .env
   ```
   Edit the `.env` file with your MongoDB connection string and secret key.

6. **Start the backend server:**
   ```cmd
   python main.py
   ```
   
   Or using uvicorn directly:
   ```cmd
   uvicorn main:app --reload --host 0.0.0.0 --port 8000
   ```

## DesktopApp Setup

1. **Prerequisites:**
   - Node.js 16.x or higher
   - npm or yarn package manager

2. **Navigate to DesktopApp directory:**
   ```cmd
   cd DesktopApp
   ```

3. **Install dependencies:**
   ```cmd
   npm install
   ```

4. **Set up environment variables:**
   ```cmd
   copy .env.example .env
   ```
   Edit the `.env` file with your backend API URL.

5. **Run the desktop application (Development):**
   ```cmd
   npm run electron-dev
   ```
   
   Or run separately:
   ```cmd
   npm start
   ```
   Then in another terminal:
   ```cmd
   npm run electron
   ```

6. **Build for production:**
   ```cmd
   npm run electron-build-win
   ```

## MongoDB Setup

1. **Install MongoDB Community Server** from https://www.mongodb.com/try/download/community

2. **Start MongoDB service:**
   ```cmd
   net start MongoDB
   ```

3. **Create database indexes (optional - will be created automatically):**
   Connect to MongoDB and run:
   ```javascript
   use factorclaim
   db.users.createIndex({ "email": 1 }, { unique: true })
   db.items.createIndex({ "name": 1, "model": 1, "batch": 1 })
   db.claims.createIndex({ "rep_id": 1, "verified": 1 })
   ```

## API Documentation

Once the backend is running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Default Admin User

To create a default admin user, you can use the `/api/users/` endpoint or MongoDB directly:

```javascript
// MongoDB shell command
use factorclaim
db.users.insertOne({
  "name": "Admin User",
  "type": "Admin",
  "contact_no": "1234567890",
  "email": "admin@factorclaim.com",
  "password_hash": "$2b$12$...", // Use bcrypt to hash "admin123"
  "is_active": true,
  "created_at": new Date(),
  "updated_at": new Date()
})
```

## Project Structure

```
FactorClaim/
├── Backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py
│   │   │   └── database.py
│   │   ├── models/
│   │   │   ├── item.py
│   │   │   ├── user.py
│   │   │   ├── merchant.py
│   │   │   ├── claim.py
│   │   │   └── auth.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── items.py
│   │   │   ├── merchants.py
│   │   │   └── claims.py
│   │   └── utils/
│   │       ├── crud_base.py
│   │       ├── crud_*.py
│   │       ├── auth.py
│   │       └── dependencies.py
│   ├── main.py
│   ├── requirements.txt
│   └── .env.example
└── DesktopApp/
    ├── src/
    │   ├── ui/
    │   │   └── main_window.py
    │   ├── services/
    │   ├── models/
    │   ├── utils/
    │   └── config.py
    ├── main.py
    ├── requirements.txt
    └── .env.example
```

## Next Steps

1. **Test API endpoints** using the Swagger UI
2. **Create sample data** through the API
3. **Develop desktop application UI** for different user roles
4. **Implement real-time features** with WebSockets
5. **Add comprehensive testing**
6. **Set up deployment configurations**