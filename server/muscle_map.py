"""Server-side port of client/lib/muscle-map.ts.

Maps free-typed exercise names to the muscle groups they train. Kept in sync
with the client keyword dictionary so the Coach volume analysis and the
statistics muscle heatmap agree on which muscles an exercise hits. The slugs
here MUST match the Muscle union in client/lib/muscle-map.ts and VALID_MUSCLES
in routers/muscles.py.

If you add or change a rule here, mirror it in client/lib/muscle-map.ts.
"""

# Swedish labels for each muscle slug (mirrors MUSCLE_LABELS on the client).
MUSCLE_LABELS: dict[str, str] = {
    "chest": "Bröst",
    "frontDelts": "Främre axel",
    "backDelts": "Bakre axel",
    "biceps": "Biceps",
    "triceps": "Triceps",
    "forearms": "Underarm",
    "abs": "Mage",
    "obliques": "Sneda magmuskler",
    "traps": "Kappmuskel",
    "lats": "Övre rygg",
    "lowerBack": "Nedre rygg",
    "quads": "Framsida lår",
    "hamstrings": "Baksida lår",
    "glutes": "Rumpa/glutes",
    "calves": "Vader",
}

# A rule fires when the lowercased exercise name contains any `kw` substring and
# none of the optional `not_kw` substrings. All firing rules are unioned.
# Order and contents mirror MUSCLE_RULES in client/lib/muscle-map.ts.
_RULES: list[dict] = [
    # Chest press
    {"kw": ["bänkpress", "bench", "dumbbellpress", "hantelpress", "bröstpress", "chest press", "chestpress", "incline", "lutande"], "muscles": ["chest", "frontDelts", "triceps"]},
    {"kw": ["armhävning", "push-up", "pushup", "push up"], "muscles": ["chest", "triceps", "frontDelts"]},
    # Chest isolation
    {"kw": ["pec", "fly", "flye", "flyes", "flys", "kabelcross", "cable cross", "crossover", "cross över"], "muscles": ["chest"], "not_kw": ["rear", "reverse", "omvänd", "bakre"]},
    {"kw": ["dips", "dip "], "muscles": ["chest", "triceps"]},
    # Triceps
    {"kw": ["tricep", "triceps", "pushdown", "pressdown", "skull", "french press", "frenchpress", "kickback"], "muscles": ["triceps"]},
    # Biceps (guard against leg curls)
    {"kw": ["bicep", "biceps", "hammercurl", "hammer curl", "hantelcurl", "preacher", "scott", "concentration", "spider", "curl"], "muscles": ["biceps"], "not_kw": ["lår", "leg curl", "legcurl", "ben curl", "bencurl", "nordic", "hamstring"]},
    # Forearms
    {"kw": ["forearm", "underarm", "wrist", "handled", "grip", "farmer", "gårdsgång"], "muscles": ["forearms"]},
    # Shoulders
    {"kw": ["front raise", "frontraise", "framåtlyft"], "muscles": ["frontDelts"]},
    {"kw": ["axelpress", "axel press", "shoulder press", "shoulderpress", "militärpress", "military", "overhead press", "overheadpress", "ohp", "arnold"], "muscles": ["frontDelts", "triceps", "traps"]},
    {"kw": ["lateral", "sidolyft", "side raise", "laterals"], "muscles": ["frontDelts", "backDelts"]},
    {"kw": ["rear delt", "reardelt", "rear-delt", "rear fly", "face pull", "facepull", "omvänd fly", "reverse fly", "reverse pec"], "muscles": ["backDelts", "traps"]},
    {"kw": ["shrug", "axelryck", "trapez"], "muscles": ["traps"]},
    # Back
    {"kw": ["row", "rodd", "t-bar", "tbar", "seal row"], "muscles": ["lats", "traps", "biceps"]},
    {"kw": ["latsdrag", "lat pulldown", "lat pull", "pulldown", "pull down", "chins", "chin-up", "chinup", "pullup", "pull-up", "pull up"], "muscles": ["lats", "biceps"]},
    # Posterior chain
    {"kw": ["marklyft", "mark", "deadlift", "rdl", "rumänsk", "romanian", "stiff leg"], "muscles": ["lowerBack", "glutes", "hamstrings", "traps"]},
    {"kw": ["ryggresning", "back extension", "hyperextension", "hyperext"], "muscles": ["lowerBack"]},
    # Legs
    {"kw": ["knäböj", "squat", "böj", "hack squat", "benböj", "pistol"], "muscles": ["quads", "glutes"], "not_kw": ["sido"]},
    {"kw": ["benpress", "leg press", "legpress"], "muscles": ["quads", "glutes"]},
    {"kw": ["utfall", "lunge", "split squat", "bulgar", "step up", "stepup", "uppsteg"], "muscles": ["quads", "glutes"]},
    {"kw": ["lårcurl", "leg curl", "legcurl", "ben curl", "bencurl", "hamstring", "nordic"], "muscles": ["hamstrings"]},
    {"kw": ["benspark", "leg extension", "legextension", "benextension"], "muscles": ["quads"]},
    {"kw": ["höftlyft", "hip thrust", "hipthrust", "glute", "hip bridge", "bäckenlyft"], "muscles": ["glutes", "hamstrings"]},
    {"kw": ["vad", "calf", "calves", "tåhäv"], "muscles": ["calves"]},
    # Core
    {"kw": ["mage", "crunch", "planka", "plank", "sit-up", "situp", "sit up", "benlyft", "leg raise", "hanging leg", "toes to bar", "ab wheel", "magrulle"], "muscles": ["abs"]},
    {"kw": ["oblique", "sneda", "sidoböj", "side bend", "russian twist", "rysk", "wood chop", "vedhugg", "side plank", "sidoplanka"], "muscles": ["obliques"]},
]


def muscles_for_exercise(name: str) -> list[str]:
    """Keyword-match an exercise name to its muscle slugs (union of all rules)."""
    n = name.lower()
    found: list[str] = []
    for rule in _RULES:
        if "not_kw" in rule and any(x in n for x in rule["not_kw"]):
            continue
        if any(k in n for k in rule["kw"]):
            for m in rule["muscles"]:
                if m not in found:
                    found.append(m)
    return found


def muscles_for_exercise_with_overrides(name: str, overrides: dict[str, list[str]]) -> list[str]:
    """A user override (keyed by trimmed-lowercased name) fully replaces the
    keyword result for that exact exercise name."""
    key = name.strip().lower()
    o = overrides.get(key)
    if o:
        return o
    return muscles_for_exercise(name)
