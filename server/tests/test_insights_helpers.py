import sys
import os
from datetime import date

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from routers.insights import (
    _goal_direction,
    _kcal_signal,
    _weekly_weight_trend,
    _suggest_kcal_target,
    _bodyweight_on,
)


# --- _goal_direction ---

def test_direction_from_mode():
    assert _goal_direction("bulk") == "surplus"
    assert _goal_direction("deff") == "deficit"
    assert _goal_direction("maintain") == "maintain"


def test_direction_unset_or_unknown_is_none():
    assert _goal_direction(None) == "none"
    assert _goal_direction("") == "none"
    assert _goal_direction("cut") == "none"


# --- _kcal_signal ---

def test_signal_none_direction_matches_legacy():
    # No mode set: at/under target is always good — never well_under.
    assert _kcal_signal(2200, 2200) == "good"
    assert _kcal_signal(1000, 2200) == "good"
    assert _kcal_signal(2400, 2200) == "slightly_over"   # +9%
    assert _kcal_signal(2500, 2200) == "over"            # +14%
    assert _kcal_signal(0, 2200) == "none"
    assert _kcal_signal(2000, 0) == "none"


def test_signal_deficit_bands():
    assert _kcal_signal(2200, 2200, "deficit") == "good"
    assert _kcal_signal(1800, 2200, "deficit") == "good"        # 82%
    assert _kcal_signal(1500, 2200, "deficit") == "well_under"  # 68%
    assert _kcal_signal(2400, 2200, "deficit") == "slightly_over"
    assert _kcal_signal(2500, 2200, "deficit") == "over"


def test_signal_surplus_bands():
    assert _kcal_signal(2900, 2200, "surplus") == "over"            # +32%
    assert _kcal_signal(2400, 2200, "surplus") == "good"            # +9%
    assert _kcal_signal(2200, 2200, "surplus") == "good"
    assert _kcal_signal(2100, 2200, "surplus") == "slightly_under"  # -5%
    assert _kcal_signal(1800, 2200, "surplus") == "under"           # -18%


def test_signal_maintain_bands():
    assert _kcal_signal(2200, 2200, "maintain") == "good"
    assert _kcal_signal(2300, 2200, "maintain") == "good"            # +4.5%
    assert _kcal_signal(2100, 2200, "maintain") == "good"            # -4.5%
    assert _kcal_signal(2400, 2200, "maintain") == "slightly_over"   # +9%
    assert _kcal_signal(2000, 2200, "maintain") == "slightly_under"  # -9%
    assert _kcal_signal(2500, 2200, "maintain") == "over"            # +14%
    assert _kcal_signal(1900, 2200, "maintain") == "under"           # -14%


# --- _weekly_weight_trend ---

def test_trend_insufficient_entries():
    assert _weekly_weight_trend([]) is None
    assert _weekly_weight_trend([(date(2026, 7, 1), 80.0)]) is None


def test_trend_span_too_short():
    entries = [(date(2026, 7, 1), 80.0), (date(2026, 7, 10), 80.5)]
    assert _weekly_weight_trend(entries) is None  # 9 days < 14


def test_trend_linear_gain():
    # +0.1 kg/day over 3 weeks => 0.7 kg/week exactly.
    entries = [(date(2026, 7, 1), 80.0), (date(2026, 7, 8), 80.7),
               (date(2026, 7, 15), 81.4), (date(2026, 7, 22), 82.1)]
    trend = _weekly_weight_trend(entries)
    assert abs(trend - 0.7) < 1e-9


def test_trend_linear_loss():
    entries = [(date(2026, 7, 1), 80.0), (date(2026, 7, 15), 79.0)]
    trend = _weekly_weight_trend(entries)
    assert abs(trend - (-0.5)) < 1e-9


# --- _suggest_kcal_target ---

def test_suggest_none_direction():
    r = _suggest_kcal_target("none", 2600, 30, 0.1, 2800)
    assert r["basis"] == "none"
    assert r["suggested_kcal"] is None


def test_suggest_direction_only_without_trend():
    r = _suggest_kcal_target("surplus", 2600, 30, None, 2800)
    assert r["basis"] == "direction_only"
    assert r["suggested_kcal"] is None
    assert r["reasoning"]  # explains what to log


def test_suggest_direction_only_with_few_logged_days():
    r = _suggest_kcal_target("surplus", 2600, 5, 0.1, 2800)
    assert r["basis"] == "direction_only"


def test_suggest_direction_only_with_implausible_trend():
    r = _suggest_kcal_target("deficit", 2600, 30, -2.0, 2200)
    assert r["basis"] == "direction_only"


def test_suggest_surplus_math():
    # maintenance = 2600 - 0.1*7700/7 = 2490; surplus = 2490 + 0.25*7700/7 = 2765 -> 2750
    r = _suggest_kcal_target("surplus", 2600, 30, 0.1, 2800)
    assert r["basis"] == "trend"
    assert r["est_maintenance"] == 2490
    assert r["suggested_kcal"] == 2750


def test_suggest_maintain_is_maintenance():
    # maintenance = 2600 - 0.1*7700/7 = 2490 -> rounds to 2500
    r = _suggest_kcal_target("maintain", 2600, 30, 0.1, 2500)
    assert r["basis"] == "trend"
    assert r["suggested_kcal"] == 2500
    assert "rätt för din takt" in r["reasoning"]


def test_suggest_deficit_math():
    # maintenance = 2600 - 0*7700/7 = 2600; deficit = 2600 - 0.5*7700/7 = 2050
    r = _suggest_kcal_target("deficit", 2600, 30, 0.0, 2200)
    assert r["suggested_kcal"] == 2050


def test_suggest_step_cap():
    # Raw suggestion 2050 is capped to current_target - 300.
    r = _suggest_kcal_target("deficit", 2600, 30, 0.0, 2600)
    assert r["suggested_kcal"] == 2300


def test_suggest_rounds_to_50():
    r = _suggest_kcal_target("surplus", 2613, 30, 0.1, 2900)
    assert r["suggested_kcal"] % 50 == 0


# --- _bodyweight_on ---

_BW = [(date(2026, 6, 1), 78.0), (date(2026, 6, 15), 79.0), (date(2026, 7, 1), 80.0)]


def test_bodyweight_on_exact_and_between():
    assert _bodyweight_on(_BW, date(2026, 6, 15)) == 79.0
    assert _bodyweight_on(_BW, date(2026, 6, 20)) == 79.0
    assert _bodyweight_on(_BW, date(2026, 7, 10)) == 80.0


def test_bodyweight_on_before_first_falls_back_to_earliest():
    assert _bodyweight_on(_BW, date(2026, 5, 1)) == 78.0


def test_bodyweight_on_empty():
    assert _bodyweight_on([], date(2026, 7, 1)) is None
