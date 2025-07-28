from fastapi import FastAPI
from .routes import users, posts, misc, ws

app = FastAPI()

app.include_router(users.router)
app.include_router(posts.router)
app.include_router(misc.router)
app.include_router(ws.router)
