from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from ..utils import connections

router = APIRouter()


@router.websocket("/ws/updates")
async def websocket_updates(websocket: WebSocket):
    await websocket.accept()
    connections.add(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        connections.discard(websocket)
