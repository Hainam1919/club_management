"""
Pydantic schemas cho validation dữ liệu
"""
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from typing import Optional, List
from datetime import datetime


# ============ USER SCHEMAS ============
class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: str
    student_id: Optional[str] = None
    phone: Optional[str] = None
    faculty: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    faculty: Optional[str] = None
    class_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    interests: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    social_github: Optional[str] = None
    is_public: Optional[bool] = None
    avatar: Optional[str] = None


class UserOut(UserBase):
    id: int
    role: str
    avatar: str
    class_name: Optional[str] = None
    bio: Optional[str] = None
    skills: Optional[str] = None
    interests: Optional[str] = None
    social_facebook: Optional[str] = None
    social_instagram: Optional[str] = None
    social_github: Optional[str] = None
    is_active: bool
    is_public: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ============ CLUB SCHEMAS ============
class ClubBase(BaseModel):
    name: str = Field(..., max_length=150)
    description: str
    category: str
    email: Optional[EmailStr] = None
    facebook: Optional[str] = None
    meeting_room: Optional[str] = None


class ClubCreate(ClubBase):
    logo: Optional[str] = None
    banner: Optional[str] = None


class ClubUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    email: Optional[EmailStr] = None
    facebook: Optional[str] = None
    meeting_room: Optional[str] = None
    logo: Optional[str] = None
    banner: Optional[str] = None


class ClubOut(ClubBase):
    id: int
    slug: str
    logo: str
    banner: str
    founded_date: datetime
    member_count: int
    is_active: bool
    is_public: bool = True
    mission: Optional[str] = None
    vision: Optional[str] = None
    achievements: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_tags: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ EVENT SCHEMAS ============
class EventBase(BaseModel):
    title: str
    description: str
    location: str
    start_time: datetime
    end_time: Optional[datetime] = None
    max_participants: int = 0


class EventCreate(EventBase):
    club_id: int
    cover_image: Optional[str] = None


class EventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    max_participants: Optional[int] = None
    status: Optional[str] = None


class EventOut(EventBase):
    id: int
    club_id: int
    cover_image: str
    current_participants: int
    status: str
    ai_sentiment: Optional[str] = None
    ai_success_score: Optional[float] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class EventRegistrationOut(BaseModel):
    id: int
    event_id: int
    user_id: int
    attended: bool
    feedback: Optional[str] = None
    rating: Optional[int] = None
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ POST SCHEMAS ============
class PostBase(BaseModel):
    title: str
    content: str
    post_type: str = "news"


class PostCreate(PostBase):
    club_id: int
    cover_image: Optional[str] = None


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    post_type: Optional[str] = None
    cover_image: Optional[str] = None
    is_pinned: Optional[bool] = None


class PostOut(PostBase):
    id: int
    club_id: int
    author_id: int
    cover_image: str
    views: int
    likes: int
    is_pinned: bool
    ai_category: Optional[str] = None
    ai_keyword: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ NOTIFICATION SCHEMAS ============
class NotificationBase(BaseModel):
    type: str
    title: str
    message: Optional[str] = None
    icon: Optional[str] = None
    link: Optional[str] = None

class NotificationCreate(NotificationBase):
    user_id: int

class NotificationOut(NotificationBase):
    id: int
    user_id: int
    is_read: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


# ============ AI SCHEMAS ============
class AIChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None
    context: Optional[str] = "general"

class AIChatResponse(BaseModel):
    reply: str
    session_id: str
    suggestions: Optional[List[str]] = None


class AIClubAnalysisRequest(BaseModel):
    description: str
    name: str


class AIClubAnalysisResponse(BaseModel):
    summary: str
    tags: List[str]
    category_suggestion: str


class AIRecommendationResponse(BaseModel):
    user_id: int
    clubs: List[dict]
    events: List[dict]


class AIEventFeedbackRequest(BaseModel):
    event_id: int
    feedback: str
    rating: int
