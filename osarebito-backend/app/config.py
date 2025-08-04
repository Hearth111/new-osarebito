import os
import logging


class Settings:
    def __init__(self) -> None:
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///osarebito.db")
        self.log_level = os.getenv("LOG_LEVEL", "INFO")


settings = Settings()


def init_logging() -> None:
    level = getattr(logging, settings.log_level.upper(), logging.INFO)
    logging.basicConfig(level=level)
