from __future__ import annotations

from dotenv import load_dotenv

load_dotenv()  

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.auth import init_firebase
from api.routes import router
from api.telemetry import start_processor

app = FastAPI(title="Hunter Wumpus API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

init_firebase()
start_processor()
