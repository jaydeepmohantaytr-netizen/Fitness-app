"""The gamification engine: EXP, levels, streaks, and the streak multiplier.

Rules (configurable in settings):
- Completing a task awards `base_exp_per_task`, scaled by a priority weight and
  the user's current streak multiplier.
- The first task completed on a new calendar day advances the streak. Completing
  more tasks the same day keeps the streak; skipping a day resets it.
- After `streak_days_to_double` consecutive days (default 7) the multiplier
  doubles to 2x, then keeps stepping up every 7 days (3x, 4x...) up to a cap.
- Levels follow a gentle quadratic curve so each level needs a bit more EXP.
"""
from datetime import date

from app.core.config import settings
from app.models.user import UserStats

PRIORITY_WEIGHTS = {"low": 0.8, "medium": 1.0, "high": 1.4}


def multiplier_for_streak(streak: int) -> float:
    """1x below the threshold, then +1x for every full threshold period, capped."""
    if streak < settings.streak_days_to_double:
        return 1.0
    steps = streak // settings.streak_days_to_double  # 7d -> 1, 14d -> 2 ...
    return float(min(1 + steps, settings.multiplier_cap))


def cumulative_exp_for_level(level: int) -> int:
    """Total EXP required to *reach* the start of `level` (level 1 starts at 0)."""
    n = level - 1
    return 50 * n * (n + 1)  # L1=0, L2=100, L3=300, L4=600, L5=1000 ...


def level_from_exp(total_exp: int) -> int:
    level = 1
    while cumulative_exp_for_level(level + 1) <= total_exp:
        level += 1
    return level


def level_progress(total_exp: int) -> dict:
    level = level_from_exp(total_exp)
    floor_exp = cumulative_exp_for_level(level)
    next_exp = cumulative_exp_for_level(level + 1)
    return {
        "level": level,
        "exp_into_level": total_exp - floor_exp,
        "exp_for_next_level": next_exp - floor_exp,
        "total_exp": total_exp,
    }


def _advance_streak(stats: UserStats, today: date) -> None:
    last = stats.last_completion_date
    if last == today:
        return  # already counted a completion today
    if last is not None and (today - last).days == 1:
        stats.current_streak += 1
    else:
        stats.current_streak = 1
    stats.last_completion_date = today
    stats.longest_streak = max(stats.longest_streak, stats.current_streak)


def award_for_completion(
    stats: UserStats, priority: str, today: date
) -> int:
    """Mutates `stats` for a task completion and returns the EXP awarded."""
    _advance_streak(stats, today)
    stats.multiplier = multiplier_for_streak(stats.current_streak)
    weight = PRIORITY_WEIGHTS.get(priority, 1.0)
    awarded = round(settings.base_exp_per_task * weight * stats.multiplier)
    stats.total_exp += awarded
    stats.level = level_from_exp(stats.total_exp)
    return awarded


def award_amount(stats: UserStats, base_amount: int, today: date) -> int:
    """Award a flat base amount (scaled by streak multiplier). Used by workouts
    and other completions that aren't priority-weighted to-dos."""
    _advance_streak(stats, today)
    stats.multiplier = multiplier_for_streak(stats.current_streak)
    awarded = round(base_amount * stats.multiplier)
    stats.total_exp += awarded
    stats.level = level_from_exp(stats.total_exp)
    return awarded


def revoke_exp(stats: UserStats, amount: int) -> None:
    """Reverse an award when something is un-completed (streak is left intact)."""
    stats.total_exp = max(0, stats.total_exp - amount)
    stats.level = level_from_exp(stats.total_exp)
