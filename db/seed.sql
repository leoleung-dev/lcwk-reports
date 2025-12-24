INSERT INTO services (name)
VALUES
  ('治喪費'),
  ('治喪後加花牌'),
  ('執骨費'),
  ('回魂速遞套餐'),
  ('冶喪費'),
  ('花牌'),
  ('灰盅'),
  ('pink Rose')
ON CONFLICT (name) DO NOTHING;

INSERT INTO allowed_emails (email, added_by)
VALUES ('leo.lcwk@gmail.com', 'seed')
ON CONFLICT (email) DO NOTHING;
