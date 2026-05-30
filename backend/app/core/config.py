"""Application configuration loaded from environment / .env file."""
from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7  # 7 days
    algorithm: str = "HS256"

    database_url: str = "sqlite:///./data/fittrack.db"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2:latest"

    cors_origins: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Gameplay tuning for the EXP engine
    base_exp_per_task: int = 10
    base_exp_per_workout: int = 25
    base_exp_per_meal_log: int = 5
    streak_days_to_double: int = 7
    multiplier_cap: int = 5

    # Default daily nutrition targets (used until the user sets their own).
    default_calorie_goal: int = 2000
    default_protein_goal: float = 150
    default_carbs_goal: float = 220
    default_fat_goal: float = 65

    ollama_timeout_seconds: float = 180.0

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
