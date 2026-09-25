from datetime import datetime, timedelta, timezone
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import User
from ..schemas import RegisterIn, LoginIn, Token, FarmerOut, FarmerUpdate

router = APIRouter(prefix="/auth", tags=["auth"])
# Keep bcrypt verification for legacy accounts, but use PBKDF2 for new users.
pwd = CryptContext(schemes=["pbkdf2_sha256", "bcrypt"], deprecated="auto")
oauth2 = OAuth2PasswordBearer(tokenUrl="/auth/login")


def make_token(user_id: int) -> str:
    payload = {"sub": str(user_id),
               "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes)}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> User:
    cred_error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Could not validate token")
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = int(payload["sub"])
    except (JWTError, KeyError, ValueError):
        raise cred_error
    user = db.get(User, user_id)
    if not user:
        raise cred_error
    return user


@router.post("/register", response_model=Token)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    name = body.name.strip()
    if len(name) < 2:
        raise HTTPException(400, "Please enter your name.")
    if db.query(User).filter(User.name.ilike(name)).first():
        raise HTTPException(400, "This name is already registered. Please sign in.")
    # The existing database keeps phone as a required legacy identifier. New
    # accounts authenticate by name and receive an internal unique value here.
    user = User(phone=f"acct-{uuid4().hex[:15]}", password_hash=pwd.hash(body.password),
                name=body.name, language=body.language, voice_language=body.language)
    try:
        db.add(user)
        db.commit()
    except Exception as exc:
        db.rollback()
        raise HTTPException(503, "Account storage is temporarily unavailable. Please try again.") from exc
    return Token(access_token=make_token(user.id))


@router.post("/login", response_model=Token)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = None
    if body.name:
        user = db.query(User).filter(User.name.ilike(body.name.strip())).first()
    if not user and body.phone:
        user = db.query(User).filter_by(phone=body.phone).first()
    if not user or not pwd.verify(body.password, user.password_hash):
        raise HTTPException(401, "Name or password is incorrect.")
    return Token(access_token=make_token(user.id))


@router.get("/me", response_model=FarmerOut)
def me(user: User = Depends(current_user)):
    return user


@router.put("/me", response_model=FarmerOut)
def update_me(body: FarmerUpdate, db: Session = Depends(get_db),
              user: User = Depends(current_user)):
    for key, value in body.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    db.commit()
    return user
