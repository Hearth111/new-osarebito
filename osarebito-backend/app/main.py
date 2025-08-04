from fastapi import FastAPI
from .config import init_logging
from .routes import users, posts, misc, ws

init_logging()
app = FastAPI()

app.include_router(users.router)
app.include_router(posts.router)
app.include_router(misc.router)
app.include_router(ws.router)
