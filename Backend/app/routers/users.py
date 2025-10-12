from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from ..models.user import UserCreate, UserUpdate, UserResponse, UserType
from ..utils.crud_user import user_crud
from ..utils.dependencies import require_admin, get_current_active_user


router = APIRouter()


@router.post("/", response_model=dict, dependencies=[Depends(require_admin)])
async def create_user(user: UserCreate):
    """Create a new user (Admin only)"""
    # Check if user already exists
    existing_user = await user_crud.get_user_by_email(user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    return await user_crud.create_user(user)


@router.get("/", response_model=List[dict], dependencies=[Depends(require_admin)])
async def read_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_type: Optional[UserType] = Query(None),
    is_active: Optional[bool] = Query(None)
):
    """Get users with optional filters (Admin only)"""
    return await user_crud.get_users(
        skip=skip,
        limit=limit,
        user_type=user_type,
        is_active=is_active
    )


@router.get("/me", response_model=dict)
async def read_user_me(current_user: dict = Depends(get_current_active_user)):
    """Get current user info"""
    user_response = {k: v for k, v in current_user.items() if k != "password_hash"}
    user_response["id"] = str(user_response.pop("_id"))
    return user_response


@router.get("/{user_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def read_user(user_id: str):
    """Get user by ID (Admin only)"""
    user = await user_crud.get_user(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    # Remove password hash
    user_response = {k: v for k, v in user.items() if k != "password_hash"}
    return user_response


@router.put("/{user_id}", response_model=dict, dependencies=[Depends(require_admin)])
async def update_user(user_id: str, user: UserUpdate):
    """Update user (Admin only)"""
    updated_user = await user_crud.update_user(user_id, user)
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    # Remove password hash
    user_response = {k: v for k, v in updated_user.items() if k != "password_hash"}
    return user_response


@router.delete("/{user_id}", dependencies=[Depends(require_admin)])
async def delete_user(user_id: str):
    """Delete user (Admin only)"""
    deleted = await user_crud.delete_user(user_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return {"message": "User deleted successfully"}


@router.put("/{user_id}/deactivate", response_model=dict, dependencies=[Depends(require_admin)])
async def deactivate_user(user_id: str):
    """Deactivate user (Admin only)"""
    updated_user = await user_crud.deactivate_user(user_id)
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user_response = {k: v for k, v in updated_user.items() if k != "password_hash"}
    return user_response


@router.put("/{user_id}/activate", response_model=dict, dependencies=[Depends(require_admin)])
async def activate_user(user_id: str):
    """Activate user (Admin only)"""
    updated_user = await user_crud.activate_user(user_id)
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    user_response = {k: v for k, v in updated_user.items() if k != "password_hash"}
    return user_response