from typing import Any, Dict, List, Optional
from bson import ObjectId
from passlib.context import CryptContext
from ..utils.crud_base import CRUDBase
from ..models.user import User, UserCreate, UserUpdate, UserType


class CRUDUser(CRUDBase):
    """CRUD operations for User"""
    
    def __init__(self):
        super().__init__("users")
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def get_password_hash(self, password: str) -> str:
        """Hash password - truncate to 72 bytes for bcrypt compatibility"""
        # Bcrypt has a 72-byte limit, so we truncate if necessary
        if isinstance(password, str):
            password_bytes = password.encode('utf-8')[:72]
            password = password_bytes.decode('utf-8', errors='ignore')
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password - truncate to 72 bytes for bcrypt compatibility"""
        # Bcrypt has a 72-byte limit, so we truncate if necessary
        if isinstance(plain_password, str):
            password_bytes = plain_password.encode('utf-8')[:72]
            plain_password = password_bytes.decode('utf-8', errors='ignore')
        return self.pwd_context.verify(plain_password, hashed_password)
    
    async def create_user(self, user_in: UserCreate) -> Dict[str, Any]:
        """Create a new user"""
        user_data = user_in.dict()
        user_data["password_hash"] = self.get_password_hash(user_data.pop("password"))
        user_data["is_active"] = True  # Set default active status
        return await self.create(user_data)
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Get user by ID"""
        return await self.get(user_id)
    
    async def get_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Get user by email"""
        return await self.collection.find_one({"email": email})
    
    async def get_users(
        self,
        skip: int = 0,
        limit: int = 100,
        user_type: Optional[UserType] = None,
        is_active: Optional[bool] = None
    ) -> List[Dict[str, Any]]:
        """Get users with optional filters"""
        filter_dict = {}
        
        if user_type:
            filter_dict["type"] = user_type.value
        if is_active is not None:
            filter_dict["is_active"] = is_active
        
        return await self.get_multi(skip=skip, limit=limit, filter_dict=filter_dict)
    
    async def update_user(
        self, 
        user_id: str, 
        user_in: UserUpdate
    ) -> Optional[Dict[str, Any]]:
        """Update user"""
        user_data = user_in.dict(exclude_unset=True)
        # If password provided and not empty, hash and store as password_hash
        if "password" in user_data:
            password = user_data.pop("password")
            if password and password.strip():  # Only hash non-empty passwords
                user_data["password_hash"] = self.get_password_hash(password)
        return await self.update(user_id, user_data)
    
    async def delete_user(self, user_id: str) -> bool:
        """Delete user"""
        return await self.delete(user_id)
    
    async def authenticate(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user"""
        user = await self.get_user_by_email(email)
        if not user:
            return None
        if not self.verify_password(password, user["password_hash"]):
            return None
        if not user.get("is_active", True):
            return None
        return user
    
    async def deactivate_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Deactivate user"""
        return await self.update(user_id, {"is_active": False})
    
    async def activate_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """Activate user"""
        return await self.update(user_id, {"is_active": True})


# Create instance
user_crud = CRUDUser()