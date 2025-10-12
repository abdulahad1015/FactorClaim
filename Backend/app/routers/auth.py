from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from ..models.user import UserLogin, UserResponse
from ..models.auth import AuthResponse, Token
from ..utils.crud_user import user_crud
from ..utils.auth import auth_utils


router = APIRouter()


class SimpleLoginRequest(BaseModel):
    """Simple login request model"""
    name: str
    type: str


@router.post("/login", response_model=AuthResponse)
async def login(user_credentials: UserLogin):
    """User authentication endpoint"""
    user = await user_crud.authenticate(
        email=user_credentials.email,
        password=user_credentials.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    token_data = auth_utils.create_token_for_user(user)
    
    # Remove password hash from user data
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    user_response["id"] = str(user_response.pop("_id"))
    
    return AuthResponse(
        user=user_response,
        token=Token(**token_data),
        message="Login successful"
    )


@router.post("/simple-login")
async def simple_login(name: str, type: str):
    """Simple login endpoint for development - finds or creates user by name and type"""
    try:
        from ..models.user import UserType
        from ..core.database import get_database
        
        # Validate user type
        valid_types = [UserType.ADMIN.value, UserType.REP.value, UserType.FACTORY.value]
        if type not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid user type. Must be one of: {valid_types}"
            )
        
        db = get_database()
        
        # Find user by name and type
        user = await db.users.find_one({"name": name, "type": type})
        
        if not user:
            # Create new user for development
            # Create simple email from name (limit length for bcrypt)
            email_name = name.lower().replace(' ', '')[:20]
            new_user = {
                "name": name,
                "type": type,
                "contact_no": "0000000000",
                "email": f"{email_name}@fc.com",
                "password_hash": auth_utils.get_password_hash("pass123"),
                "is_active": True,
                "created_at": datetime.utcnow(),
                "updated_at": datetime.utcnow()
            }
            result = await db.users.insert_one(new_user)
            new_user["_id"] = result.inserted_id
            user = new_user
        
        # Create access token
        token_data = auth_utils.create_token_for_user(user)
        
        # Remove password hash from user data
        user_response = {k: v for k, v in user.items() if k != "password_hash"}
        user_response["id"] = str(user_response.pop("_id"))
        
        return {
            "user": user_response,
            "access_token": token_data["access_token"],
            "token_type": token_data["token_type"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/token", response_model=Token)
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    """OAuth2 compatible token endpoint"""
    user = await user_crud.authenticate(
        email=form_data.username,  # OAuth2 uses username field
        password=form_data.password
    )
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token_data = auth_utils.create_token_for_user(user)
    return Token(**token_data)