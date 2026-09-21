-- Demo farmer so the app has something to show on first run.
-- Password for +919000000000 is "demo1234" (bcrypt hash below).
INSERT INTO users (phone, password_hash, name, language, state, district, land_area_ha, experience_years)
VALUES ('+919000000000',
        '$2b$12$e3Z2y1mB0xq3z1sYyQ8Q9uJm7eE9y1a4rWc0bZ7lJ9N4qk1o2Xr1K',
        'Demo Farmer', 'hi', 'Uttar Pradesh', 'Ghaziabad', 1.6, 12)
ON CONFLICT (phone) DO NOTHING;

INSERT INTO farms (user_id, name, latitude, longitude, area_ha, soil_type)
SELECT id, 'My Farm', 28.669, 77.453, 1.6, 'Sandy loam' FROM users WHERE phone='+919000000000'
ON CONFLICT DO NOTHING;

INSERT INTO crop_cycles (farm_id, crop, variety, sowing_date, growth_stage)
SELECT id, 'tomato', 'Arka Rakshak', '2026-07-02', 'Flowering' FROM farms WHERE name='My Farm'
ON CONFLICT DO NOTHING;

INSERT INTO soil_records (farm_id, tested_on, source, soil_type, ph, ec, organic_carbon,
                          nitrogen, phosphorus, potassium, sulphur, zinc, iron, manganese, boron)
SELECT id, '2026-08-12', 'soil_health_card', 'Sandy loam', 6.4, 0.42, 0.51,
       186, 14, 212, 9, 0.42, 4.1, 3.2, 0.31
FROM farms WHERE name='My Farm'
ON CONFLICT DO NOTHING;

INSERT INTO monitoring_events (crop_cycle_id, happened_on, status, note)
SELECT c.id, d.happened_on, d.status, d.note FROM crop_cycles c,
(VALUES ('2026-09-08'::date,'ok','Healthy canopy, no visible lesions'),
        ('2026-09-12'::date,'watch','Slight yellowing on lower leaves'),
        ('2026-09-15'::date,'risk','Brown spots with rings, 2 field zones flagged by satellite'),
        ('2026-09-17'::date,'watch','Infected lower leaves removed and destroyed'),
        ('2026-09-19'::date,'ok','No new lesions on upper leaves')) AS d(happened_on,status,note)
WHERE c.crop='tomato';
