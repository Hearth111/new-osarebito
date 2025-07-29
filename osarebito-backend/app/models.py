from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict

class User(BaseModel):
    email: EmailStr
    user_id: str
    username: str
    password: str
    role: str

class LoginInput(BaseModel):
    user_id: str
    password: str

class Profile(BaseModel):
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    activity: Optional[str] = None
    sns_links: Optional[Dict] = None
    visibility: str = "public"

class ProfileUpdate(BaseModel):
    profile_image: Optional[str] = None
    bio: Optional[str] = None
    activity: Optional[str] = None
    sns_links: Optional[Dict] = None
    visibility: Optional[str] = None

class CollabProfile(BaseModel):
    interests: Optional[str] = None
    looking_for: Optional[str] = None
    availability: Optional[str] = None
    visibility: str = "private"

class CollabProfileUpdate(BaseModel):
    interests: Optional[str] = None
    looking_for: Optional[str] = None
    availability: Optional[str] = None
    visibility: Optional[str] = None

class Post(BaseModel):
    id: int
    author_id: str
    content: str
    tags: List[str] = []
    category: Optional[str] = None
    anonymous: bool = False
    best_answer_id: Optional[int] = None
    likes: List[str] = []
    retweets: List[str] = []
    created_at: str

class PostCreate(BaseModel):
    author_id: str
    content: str
    tags: Optional[List[str]] = None
    category: Optional[str] = None
    anonymous: bool = False

class Comment(BaseModel):
    id: int
    post_id: int
    author_id: str
    content: str
    created_at: str

class CommentCreate(BaseModel):
    author_id: str
    content: str

class Message(BaseModel):
    id: int
    sender_id: str
    receiver_id: str
    content: str
    created_at: str

class MessageCreate(BaseModel):
    sender_id: str
    receiver_id: str
    content: str

class ReportCreate(BaseModel):
    reporter_id: str
    reason: Optional[str] = None

class JobPost(BaseModel):
    id: int
    author_id: str
    title: str
    description: str
    reward: Optional[str] = None
    deadline: Optional[str] = None
    created_at: str

class JobPostCreate(BaseModel):
    author_id: str
    title: str
    description: str
    reward: Optional[str] = None
    deadline: Optional[str] = None

class Group(BaseModel):
    id: int
    name: str
    members: List[str]

class GroupCreate(BaseModel):
    name: str
    members: List[str]

class GroupMessage(BaseModel):
    id: int
    group_id: int
    sender_id: str
    content: str
    created_at: str

class GroupMessageCreate(BaseModel):
    group_id: int
    sender_id: str
    content: str

class FanPost(BaseModel):
    id: int
    author_id: str
    content: str
    created_at: str

class FanPostCreate(BaseModel):
    author_id: str
    content: str

class Appeal(BaseModel):
    id: int
    user_id: str
    message: str
    status: str
    created_at: str

class AppealCreate(BaseModel):
    user_id: str
    message: str

class FollowRequest(BaseModel):
    follower_id: str

class InterestRequest(BaseModel):
    user_id: str

class BlockRequest(BaseModel):
    user_id: str

class LikeRequest(BaseModel):
    user_id: str

class RetweetRequest(BaseModel):
    user_id: str

class BookmarkRequest(BaseModel):
    user_id: str

class BestAnswerRequest(BaseModel):
    comment_id: int
    user_id: str

class Poll(BaseModel):
    id: int
    author_id: str
    question: str
    options: List[str]
    votes: List[List[str]]
    created_at: str

class PollCreate(BaseModel):
    author_id: str
    question: str
    options: List[str]

class PollVoteRequest(BaseModel):
    user_id: str
    option: int

class AppealResolveRequest(BaseModel):
    action: str
    resolver_id: str


class Material(BaseModel):
    id: int
    uploader_id: str
    title: str
    description: str
    category: str
    url: str
    created_at: str


class MaterialCreate(BaseModel):
    uploader_id: str
    title: str
    description: str
    category: str
    url: str


class MaterialBoxRequest(BaseModel):
    user_id: str
