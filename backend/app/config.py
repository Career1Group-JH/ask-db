from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    llm_model: str = "gemini/gemini-3.1-pro-preview"
    llm_api_key: str = ""

    db_host: str = "db"
    db_port: int = 3306
    db_user: str = "root"
    db_password: str = "askdb"
    db_name: str = "co_production"


@lru_cache
def get_settings() -> Settings:
    return Settings()
