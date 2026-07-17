"""Authentication and authorisation endpoints.

Provides user registration, login (OAuth2 password flow), JWT refresh,
and role-based access control dependency injection for protected routes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.security import (
    verify_password, get_password_hash,
    create_access_token, create_refresh_token, decode_token,
)
from app.core.config import settings
from app.models.models import User
from app.schemas.schemas import UserCreate, UserResponse, Token

router = APIRouter(prefix="/auth", tags=["Authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    """Extract and validate the current user from the JWT access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    username: str = payload.get("sub")
    token_type: str = payload.get("type")

    if username is None or token_type != "access":
        raise credentials_exception

    user = db.query(User).filter(User.username == username).first()
    if user is None:
        raise credentials_exception
    return user


def require_role(allowed_roles: List[str]):
    """Return a FastAPI dependency that restricts access to the given roles."""
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Action requires role permissions: {allowed_roles}",
            )
        return user
    return dependency


@router.post("/register", response_model=UserResponse)
def register(user_in: UserCreate, db: Session = Depends(get_db)) -> User:
    """Register a new user account with a hashed password."""
    existing = db.query(User).filter(
        (User.username == user_in.username) | (User.email == user_in.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or email already registered",
        )
    hashed = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed,
        role=user_in.role,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> dict:
    """Authenticate user and return JWT access + refresh token pair."""
    user = db.query(User).filter(User.username == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )

    access = create_access_token(user.username)
    refresh = create_refresh_token(user.username)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
    }


@router.post("/refresh", response_model=Token)
def refresh_token(refresh_jwt: str, db: Session = Depends(get_db)) -> dict:
    """Issue a new access token using a valid refresh token."""
    payload = decode_token(refresh_jwt)
    username: str = payload.get("sub")
    token_type: str = payload.get("type")

    if username is None or token_type != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access = create_access_token(user.username)
    refresh = create_refresh_token(user.username)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "role": user.role,
        "username": user.username,
    }


@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: User = Depends(get_current_user)) -> User:
    """Return the profile of the currently authenticated user."""
    return current_user
