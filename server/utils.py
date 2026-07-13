LEVELS = [
    (0, 1, "Nybörjare"),
    (250, 2, "Motionär"),
    (1000, 3, "Atlet"),
    (2500, 4, "Veteran"),
    (5000, 5, "Elit"),
    (12500, 6, "Mästare"),
]


def calculate_xp(logs) -> int:
    # Deliberately uses raw extra-kg, NOT bodyweight-adjusted effective load:
    # XP is recomputed from scratch on every request, so factoring in body
    # weight would retroactively rewrite historical XP whenever a weight entry
    # is added — and "PR because I gained 2 kg body weight" isn't a progression.
    sorted_logs = sorted(logs, key=lambda log: log.date)
    prev_max: dict[str, float] = {}
    total_xp = 0
    for log in sorted_logs:
        xp = 50
        if any(ex.difficulty == "hard" for ex in log.exercises):
            xp += 25
        for ex in log.exercises:
            if ex.weight and ex.weight > 0 and ex.weight > prev_max.get(ex.name, 0):
                xp += 50
                break
        for ex in log.exercises:
            if ex.weight and ex.weight > 0:
                prev_max[ex.name] = max(prev_max.get(ex.name, 0), ex.weight)
        total_xp += xp
    return total_xp


def xp_to_level(xp: int) -> dict:
    current = LEVELS[0]
    next_lvl: tuple | None = LEVELS[1]
    for i, entry in enumerate(LEVELS):
        if xp >= entry[0]:
            current = entry
            next_lvl = LEVELS[i + 1] if i + 1 < len(LEVELS) else None

    curr_threshold, level_num, title = current
    next_threshold = next_lvl[0] if next_lvl else None
    next_title = next_lvl[2] if next_lvl else None

    if next_threshold:
        span = next_threshold - curr_threshold
        progress_pct = round(min(100.0, (xp - curr_threshold) / span * 100), 1)
    else:
        progress_pct = 100.0

    return {
        "xp": xp,
        "level": level_num,
        "title": title,
        "current_threshold": curr_threshold,
        "next_threshold": next_threshold,
        "next_title": next_title,
        "progress_pct": progress_pct,
    }
