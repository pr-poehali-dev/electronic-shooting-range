CREATE TABLE IF NOT EXISTS shooting_results (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    study_group VARCHAR(50) NOT NULL,
    score INTEGER NOT NULL,
    total_shots INTEGER NOT NULL,
    hits INTEGER NOT NULL,
    misses INTEGER NOT NULL,
    accuracy INTEGER NOT NULL,
    game_duration INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shooting_results_score ON shooting_results(score DESC);
CREATE INDEX idx_shooting_results_created_at ON shooting_results(created_at DESC);
CREATE INDEX idx_shooting_results_group ON shooting_results(study_group);