import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from utils import calculate_xp, xp_to_level


class FakeEx:
    def __init__(self, name, weight=0, difficulty="medium"):
        self.name = name
        self.weight = weight
        self.difficulty = difficulty


class FakeLog:
    def __init__(self, date, exercises):
        self.date = date
        self.exercises = exercises


# --- calculate_xp ---

def test_empty_logs():
    assert calculate_xp([]) == 0


def test_base_xp_per_log():
    log = FakeLog("2024-01-01", [FakeEx("Squat")])
    assert calculate_xp([log]) == 50


def test_hard_exercise_bonus():
    log = FakeLog("2024-01-01", [FakeEx("Deadlift", difficulty="hard")])
    assert calculate_xp([log]) == 75


def test_pr_weight_bonus():
    log = FakeLog("2024-01-01", [FakeEx("Bench", weight=100)])
    assert calculate_xp([log]) == 100


def test_hard_and_pr_bonus():
    log = FakeLog("2024-01-01", [FakeEx("Deadlift", weight=150, difficulty="hard")])
    assert calculate_xp([log]) == 125


def test_pr_bonus_only_on_first_occurrence():
    log1 = FakeLog("2024-01-01", [FakeEx("Squat", weight=80)])
    log2 = FakeLog("2024-01-08", [FakeEx("Squat", weight=80)])
    xp = calculate_xp([log1, log2])
    assert xp == 100 + 50  # first log gets PR bonus, second does not


def test_pr_bonus_on_new_record():
    log1 = FakeLog("2024-01-01", [FakeEx("Squat", weight=80)])
    log2 = FakeLog("2024-01-08", [FakeEx("Squat", weight=90)])
    xp = calculate_xp([log1, log2])
    assert xp == 100 + 100  # both logs get PR bonus


def test_multiple_logs_accumulate():
    logs = [FakeLog(f"2024-01-0{i+1}", [FakeEx("Run")]) for i in range(5)]
    assert calculate_xp(logs) == 250


# --- xp_to_level ---

def test_zero_xp_is_level_1():
    result = xp_to_level(0)
    assert result["level"] == 1
    assert result["title"] == "Nybörjare"
    assert result["progress_pct"] == 0.0


def test_just_below_level_2():
    result = xp_to_level(249)
    assert result["level"] == 1
    assert result["progress_pct"] < 100.0


def test_exactly_level_2():
    result = xp_to_level(250)
    assert result["level"] == 2
    assert result["title"] == "Motionär"
    assert result["progress_pct"] == 0.0


def test_exactly_level_3():
    result = xp_to_level(1000)
    assert result["level"] == 3
    assert result["title"] == "Atlet"


def test_max_level():
    result = xp_to_level(12500)
    assert result["level"] == 6
    assert result["title"] == "Mästare"
    assert result["next_threshold"] is None
    assert result["progress_pct"] == 100.0


def test_progress_pct_midpoint():
    result = xp_to_level(625)
    assert result["level"] == 2
    assert result["progress_pct"] == 50.0
