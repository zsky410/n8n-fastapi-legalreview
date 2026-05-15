from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import create_access_token, verify_password
from app.db.session import get_db
from app.models.user import User
from app.models.user_profile import UserProfile
from app.schemas.auth import LoginRequest, Token
from app.schemas.user import UserProfileRead, UserProfileUpdate, UserRead
from app.api.v1.dependencies import get_current_user
from app.services.audit import create_audit_log

router = APIRouter()


@router.post("/login", response_model=Token)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> Token:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    return Token(
        access_token=create_access_token(subject=str(user.id)),
        token_type="bearer",
        user=UserRead.model_validate(user),
    )


@router.get("/me", response_model=UserRead)
def read_me(current_user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(current_user)


@router.get("/me/profile", response_model=UserProfileRead)
def read_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfileRead:
    profile = _get_or_create_profile(db, current_user)
    return UserProfileRead.model_validate(profile)


@router.put("/me/profile", response_model=UserProfileRead)
def update_my_profile(
    payload: UserProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> UserProfileRead:
    profile = _get_or_create_profile(db, current_user)
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, _clean_profile_value(value))

    create_audit_log(
        db,
        action="user.profile.updated",
        target_type="user_profile",
        target_id=profile.id,
        actor_id=current_user.id,
        payload={
            "filled_fields": sorted(
                key
                for key in UserProfileUpdate.model_fields
                if bool((getattr(profile, key) or "").strip())
            ),
        },
    )
    db.commit()
    db.refresh(profile)
    return UserProfileRead.model_validate(profile)


def _get_or_create_profile(db: Session, user: User) -> UserProfile:
    profile = db.scalar(select(UserProfile).where(UserProfile.user_id == user.id))
    if profile is not None:
        return profile
    profile = UserProfile(user_id=user.id, preferred_language="Tiếng Việt")
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


def _clean_profile_value(value: str | None) -> str | None:
    if value is None:
        return None
    normalized = value.strip()
    return normalized or None
