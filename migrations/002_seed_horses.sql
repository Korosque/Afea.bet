INSERT OR IGNORE INTO horses (name, display_order) VALUES ('Maezio', 0);
INSERT OR IGNORE INTO horses (name, display_order) VALUES ('Jorge', 1);
INSERT OR IGNORE INTO horses (name, display_order) VALUES ('Hugo', 2);
INSERT OR IGNORE INTO horses (name, display_order) VALUES ('Vinicius', 3);
INSERT OR IGNORE INTO horses (name, display_order) VALUES ('Rômulo', 4);
INSERT OR IGNORE INTO horses (name, display_order) VALUES ('Darlan', 5);

INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
SELECT id, 0 FROM horses WHERE name = 'Maezio';
INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
SELECT id, 0 FROM horses WHERE name = 'Jorge';
INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
SELECT id, 0 FROM horses WHERE name = 'Hugo';
INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
SELECT id, 0 FROM horses WHERE name = 'Vinicius';
INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
SELECT id, 0 FROM horses WHERE name = 'Rômulo';
INSERT OR IGNORE INTO horse_streaks (horse_id, streak)
SELECT id, 0 FROM horses WHERE name = 'Darlan';
