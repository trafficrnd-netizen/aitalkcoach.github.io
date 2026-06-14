-- 019_aesthetic_products_seed.sql
-- 에스테틱 버티컬 카탈로그 샘플 제품 데이터 (자동완성/검색용)
-- 실제 운영 시 어드민에서 추가/수정 가능.

INSERT INTO aesthetic_products (category, name, brand, spec, is_device, active) VALUES

-- ── 미용기기 소모품: 카트리지 ──────────────────────────────────────────────
('device.cartridge', 'HIFU 1.5mm 카트리지',     NULL, '{"depth_mm":1.5,"shots":10000,"unit":"ea"}',  true, true),
('device.cartridge', 'HIFU 3.0mm 카트리지',     NULL, '{"depth_mm":3.0,"shots":10000,"unit":"ea"}',  true, true),
('device.cartridge', 'HIFU 4.5mm 카트리지',     NULL, '{"depth_mm":4.5,"shots":10000,"unit":"ea"}',  true, true),
('device.cartridge', 'RF 리프팅 카트리지',       NULL, '{"unit":"ea"}',                               true, true),
('device.cartridge', 'HIFU 라인 카트리지 (눈가)', NULL, '{"depth_mm":1.5,"shots":5000,"unit":"ea"}',  true, true),

-- ── 미용기기 소모품: 팁·핸드피스 ─────────────────────────────────────────
('device.tip',       '초음파 스킨 스크러버 팁',  NULL, '{"unit":"ea"}',                               true, true),
('device.tip',       'LED 광선 치료 헤드',        NULL, '{"wavelength_nm":630,"unit":"ea"}',           true, true),

-- ── 미용기기 소모품: 젤·쿨링 ─────────────────────────────────────────────
('device.gel',       '초음파 전도 젤 (1L)',       NULL, '{"volume_ml":1000,"unit":"ea"}',              true, true),
('device.gel',       '쿨링젤 패드 (50매)',        NULL, '{"qty":50,"unit":"box"}',                     true, true),

-- ── 시술 부자재: 니들 ────────────────────────────────────────────────────
('supply.needle',    '마이크로니들 0.5mm (50매)', NULL, '{"length_mm":0.5,"qty":50,"unit":"box"}',     true, true),
('supply.needle',    '마이크로니들 1.0mm (50매)', NULL, '{"length_mm":1.0,"qty":50,"unit":"box"}',     true, true),
('supply.needle',    '32G×4mm 주사침 (100ea)',    NULL, '{"gauge":32,"length_mm":4,"unit":"box"}',     true, true),

-- ── 시술 부자재: 드레싱 ──────────────────────────────────────────────────
('supply.dressing',  '하이드로콜로이드 드레싱 (10매)', NULL, '{"qty":10,"unit":"box"}',               false, true),
('supply.dressing',  '니트릴 글러브 M (100ea)',   NULL, '{"size":"M","qty":100,"unit":"box"}',         false, true),

-- ── 관리실 화장품: 마스크 ────────────────────────────────────────────────
('cosmetic.mask',    '진정 마스크팩 (30매)',       NULL, '{"qty":30,"unit":"box"}',                    false, true),
('cosmetic.mask',    '수분 모델링팩 1kg',          NULL, '{"weight_g":1000,"unit":"ea"}',              false, true),

-- ── 관리실 화장품: 앰플 ──────────────────────────────────────────────────
('cosmetic.ampoule', 'EGF 앰플 (30mL)',           NULL, '{"volume_ml":30,"unit":"ea"}',               false, true),
('cosmetic.ampoule', '비타민C 앰플 세럼 (50mL)',  NULL, '{"volume_ml":50,"unit":"ea"}',               false, true),
('cosmetic.skincare','알로에 진정 크림 (200mL)',   NULL, '{"volume_ml":200,"unit":"ea"}',              false, true)

ON CONFLICT DO NOTHING;
