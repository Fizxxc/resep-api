-- ================================================
-- KOGRAPH APIs — Supabase Schema
-- Run this entire file in Supabase SQL Editor
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  full_name   TEXT,
  avatar_url  TEXT,
  role        TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_own_profile"  ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own"   ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "admins_all_profiles" ON public.profiles FOR ALL USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- API KEYS
CREATE TABLE IF NOT EXISTS public.api_keys (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  key_hash         TEXT UNIQUE NOT NULL,
  key_prefix       TEXT NOT NULL,
  is_active        BOOLEAN DEFAULT TRUE,
  last_used_at     TIMESTAMPTZ,
  usage_count      INTEGER DEFAULT 0,
  monthly_usage    INTEGER DEFAULT 0,
  monthly_reset_at TIMESTAMPTZ DEFAULT DATE_TRUNC('month', NOW()) + INTERVAL '1 month',
  rate_limit       INTEGER DEFAULT 10000,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "keys_owner"      ON public.api_keys FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "keys_admin_all"  ON public.api_keys FOR ALL    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "service_insert"  ON public.api_keys FOR INSERT WITH CHECK (TRUE);

-- API USAGE LOGS
CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key_id       UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  endpoint         TEXT NOT NULL,
  method           TEXT DEFAULT 'GET',
  status_code      INTEGER,
  response_time_ms INTEGER,
  ip_address       INET,
  user_agent       TEXT,
  query_params     JSONB,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "logs_owner"      ON public.api_usage_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "logs_insert_all" ON public.api_usage_logs FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "logs_admin_all"  ON public.api_usage_logs FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- WEBHOOKS
CREATE TABLE IF NOT EXISTS public.webhooks (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id          UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name             TEXT NOT NULL,
  url              TEXT NOT NULL,
  secret           TEXT NOT NULL,
  events           TEXT[] DEFAULT ARRAY['api.call','rate_limit.reached','key.created','key.deleted'],
  is_active        BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  failure_count    INTEGER DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_owner" ON public.webhooks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "webhooks_admin" ON public.webhooks FOR SELECT USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- WEBHOOK DELIVERIES
CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id              UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  webhook_id      UUID REFERENCES public.webhooks(id) ON DELETE CASCADE NOT NULL,
  event           TEXT NOT NULL,
  payload         JSONB,
  response_status INTEGER,
  response_body   TEXT,
  duration_ms     INTEGER,
  success         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deliveries_owner" ON public.webhook_deliveries FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.webhooks WHERE id = webhook_id AND user_id = auth.uid())
);

-- RECIPES
CREATE TABLE IF NOT EXISTS public.recipes (
  id                    UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  slug                  TEXT UNIQUE NOT NULL,
  name                  TEXT NOT NULL,
  name_local            TEXT,
  description           TEXT,
  region                TEXT NOT NULL,
  province              TEXT,
  category              TEXT NOT NULL CHECK (category IN ('makanan','minuman','snack','dessert')),
  subcategory           TEXT,
  image_url             TEXT NOT NULL,
  thumbnail_url         TEXT,
  ingredients           JSONB NOT NULL,
  steps                 JSONB NOT NULL,
  cooking_time_minutes  INTEGER,
  serving_size          INTEGER,
  difficulty            TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  calories              INTEGER,
  tags                  TEXT[],
  is_halal              BOOLEAN DEFAULT TRUE,
  is_vegan              BOOLEAN DEFAULT FALSE,
  is_published          BOOLEAN DEFAULT TRUE,
  view_count            INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "recipes_public"  ON public.recipes FOR SELECT USING (is_published = TRUE);
CREATE POLICY "recipes_admin"   ON public.recipes FOR ALL    USING ((SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin');

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_api_keys_user      ON public.api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash      ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_logs_user          ON public.api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_logs_key           ON public.api_usage_logs(api_key_id);
CREATE INDEX IF NOT EXISTS idx_logs_created       ON public.api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_category   ON public.recipes(category);
CREATE INDEX IF NOT EXISTS idx_recipes_region     ON public.recipes(region);
CREATE INDEX IF NOT EXISTS idx_recipes_slug       ON public.recipes(slug);
CREATE INDEX IF NOT EXISTS idx_webhooks_user      ON public.webhooks(user_id);

-- AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- INCREMENT API USAGE (atomic, handles monthly reset)
CREATE OR REPLACE FUNCTION public.increment_api_usage(p_key_hash TEXT)
RETURNS TABLE(allowed BOOLEAN, monthly_usage INTEGER, rate_limit INTEGER, user_id UUID) AS $$
DECLARE v_key public.api_keys%ROWTYPE;
BEGIN
  SELECT * INTO v_key FROM public.api_keys WHERE key_hash = p_key_hash AND is_active = TRUE FOR UPDATE;
  IF NOT FOUND THEN RETURN QUERY SELECT FALSE, 0, 0, NULL::UUID; RETURN; END IF;

  IF v_key.monthly_reset_at <= NOW() THEN
    UPDATE public.api_keys SET monthly_usage=1, usage_count=v_key.usage_count+1,
      monthly_reset_at=DATE_TRUNC('month',NOW())+INTERVAL '1 month', last_used_at=NOW()
    WHERE id=v_key.id;
    RETURN QUERY SELECT TRUE, 1, v_key.rate_limit, v_key.user_id; RETURN;
  END IF;

  IF v_key.monthly_usage >= v_key.rate_limit THEN
    RETURN QUERY SELECT FALSE, v_key.monthly_usage, v_key.rate_limit, v_key.user_id; RETURN;
  END IF;

  UPDATE public.api_keys SET monthly_usage=monthly_usage+1, usage_count=usage_count+1, last_used_at=NOW() WHERE id=v_key.id;
  RETURN QUERY SELECT TRUE, v_key.monthly_usage+1, v_key.rate_limit, v_key.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- SEED RECIPES
INSERT INTO public.recipes (slug,name,name_local,description,region,province,category,image_url,thumbnail_url,ingredients,steps,cooking_time_minutes,serving_size,difficulty,calories,tags,is_halal,is_vegan) VALUES

('rendang-sapi','Rendang Sapi','Randang','Masakan daging sapi yang dimasak dengan rempah-rempah khas Minangkabau hingga kering. Dikenal sebagai salah satu makanan terlezat di dunia.','Sumatera','Sumatera Barat','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rendang_Minangkabau.jpg/1200px-Rendang_Minangkabau.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Rendang_Minangkabau.jpg/400px-Rendang_Minangkabau.jpg',
'[{"name":"Daging sapi","amount":"1 kg","unit":""},{"name":"Santan kelapa","amount":"1 liter","unit":""},{"name":"Serai","amount":"3","unit":"batang"},{"name":"Daun jeruk","amount":"5","unit":"lembar"},{"name":"Cabai merah","amount":"15","unit":"buah"},{"name":"Bawang merah","amount":"8","unit":"siung"},{"name":"Bawang putih","amount":"5","unit":"siung"},{"name":"Jahe","amount":"2 cm","unit":""},{"name":"Kunyit","amount":"2 cm","unit":""},{"name":"Garam","amount":"secukupnya","unit":""}]',
'[{"step":1,"description":"Haluskan semua bumbu: cabai, bawang merah, bawang putih, jahe, kunyit."},{"step":2,"description":"Masukkan daging ke dalam wajan besar bersama santan dan bumbu halus."},{"step":3,"description":"Tambahkan serai yang sudah dimemarkan, daun jeruk."},{"step":4,"description":"Masak dengan api sedang sambil sesekali diaduk hingga santan mendidih."},{"step":5,"description":"Kecilkan api dan terus masak hingga santan mengering dan daging berwarna kecoklatan sekitar 4 jam."},{"step":6,"description":"Koreksi rasa dengan garam. Rendang siap disajikan."}]',
240,4,'hard',450,ARRAY['rendang','minang','sumatera','daging','rempah'],TRUE,FALSE),

('nasi-goreng-spesial','Nasi Goreng Spesial','Sego Goreng','Nasi goreng khas Indonesia dengan bumbu rempah pilihan, telur mata sapi, dan pelengkap kerupuk.','Jawa','DKI Jakarta','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nasi_goreng_special.jpg/1200px-Nasi_goreng_special.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Nasi_goreng_special.jpg/400px-Nasi_goreng_special.jpg',
'[{"name":"Nasi putih","amount":"2","unit":"piring"},{"name":"Telur","amount":"2","unit":"butir"},{"name":"Bawang merah","amount":"3","unit":"siung"},{"name":"Bawang putih","amount":"2","unit":"siung"},{"name":"Cabai merah","amount":"2","unit":"buah"},{"name":"Kecap manis","amount":"2 sdm","unit":""},{"name":"Saus tiram","amount":"1 sdm","unit":""},{"name":"Garam","amount":"secukupnya","unit":""},{"name":"Minyak goreng","amount":"3 sdm","unit":""},{"name":"Daun bawang","amount":"2","unit":"batang"}]',
'[{"step":1,"description":"Iris tipis bawang merah, bawang putih, dan cabai merah."},{"step":2,"description":"Panaskan minyak, tumis bumbu hingga harum."},{"step":3,"description":"Masukkan telur, orak-arik hingga setengah matang."},{"step":4,"description":"Masukkan nasi, aduk rata bersama bumbu."},{"step":5,"description":"Tambahkan kecap manis, saus tiram, dan garam."},{"step":6,"description":"Taburi daun bawang. Sajikan dengan kerupuk."}]',
20,2,'easy',380,ARRAY['nasi-goreng','jawa','populer','sarapan'],TRUE,FALSE),

('soto-ayam-lamongan','Soto Ayam Lamongan','Soto Lamongan','Soto ayam khas Lamongan dengan kuah kuning gurih, dilengkapi koya yang menjadi ciri khasnya.','Jawa','Jawa Timur','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Soto_ayam_lamongan.jpg/1200px-Soto_ayam_lamongan.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Soto_ayam_lamongan.jpg/400px-Soto_ayam_lamongan.jpg',
'[{"name":"Ayam kampung","amount":"1","unit":"ekor"},{"name":"Kunyit","amount":"3 cm","unit":""},{"name":"Jahe","amount":"2 cm","unit":""},{"name":"Bawang merah","amount":"6","unit":"siung"},{"name":"Bawang putih","amount":"4","unit":"siung"},{"name":"Serai","amount":"2","unit":"batang"},{"name":"Telur rebus","amount":"4","unit":"butir"},{"name":"Tauge","amount":"100 gr","unit":""},{"name":"Koya","amount":"secukupnya","unit":""},{"name":"Jeruk nipis","amount":"2","unit":"buah"}]',
'[{"step":1,"description":"Rebus ayam dengan serai, daun salam hingga matang. Suwir-suwir dagingnya."},{"step":2,"description":"Haluskan kunyit, jahe, bawang merah, bawang putih."},{"step":3,"description":"Tumis bumbu halus hingga harum, masukkan ke dalam kaldu."},{"step":4,"description":"Masak hingga mendidih dan bumbu meresap."},{"step":5,"description":"Siapkan mangkuk dengan mie soun, tauge, dan telur rebus."},{"step":6,"description":"Tuang kuah panas, taburi koya. Sajikan dengan jeruk nipis."}]',
60,4,'medium',320,ARRAY['soto','lamongan','jatim','ayam'],TRUE,FALSE),

('gado-gado','Gado-Gado','Gado-Gado','Salad sayuran rebus khas Betawi dengan saus kacang yang kaya rempah.','Jawa','DKI Jakarta','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Gado-gado_Betawi.jpg/1200px-Gado-gado_Betawi.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/Gado-gado_Betawi.jpg/400px-Gado-gado_Betawi.jpg',
'[{"name":"Kangkung","amount":"100 gr","unit":""},{"name":"Bayam","amount":"100 gr","unit":""},{"name":"Tauge","amount":"100 gr","unit":""},{"name":"Kentang","amount":"2","unit":"buah"},{"name":"Tahu","amount":"2","unit":"potong"},{"name":"Tempe","amount":"2","unit":"potong"},{"name":"Telur rebus","amount":"2","unit":"butir"},{"name":"Kacang tanah goreng","amount":"200 gr","unit":""},{"name":"Cabai merah","amount":"3","unit":"buah"},{"name":"Kecap manis","amount":"2 sdm","unit":""},{"name":"Gula merah","amount":"1 sdm","unit":""}]',
'[{"step":1,"description":"Rebus semua sayuran secara terpisah. Goreng tahu dan tempe."},{"step":2,"description":"Buat saus kacang: haluskan kacang tanah, cabai, bawang, kencur."},{"step":3,"description":"Masak saus dengan air, kecap manis, gula merah, dan garam."},{"step":4,"description":"Tata sayuran, tahu, tempe, dan telur di piring."},{"step":5,"description":"Siram dengan saus kacang hangat. Sajikan dengan kerupuk."}]',
45,2,'medium',380,ARRAY['gado-gado','betawi','vegetarian','kacang'],TRUE,TRUE),

('pempek-palembang','Pempek Palembang','Mpek-Mpek','Makanan khas Palembang terbuat dari daging ikan dan sagu, disajikan dengan kuah cuka asam manis pedas.','Sumatera','Sumatera Selatan','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Pempek_lenggang.jpg/1200px-Pempek_lenggang.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Pempek_lenggang.jpg/400px-Pempek_lenggang.jpg',
'[{"name":"Daging ikan tenggiri","amount":"500 gr","unit":""},{"name":"Tepung sagu","amount":"250 gr","unit":""},{"name":"Telur","amount":"2","unit":"butir"},{"name":"Bawang putih","amount":"3","unit":"siung"},{"name":"Garam","amount":"1 sdt","unit":""},{"name":"Cuka aren","amount":"500 ml","unit":""},{"name":"Gula merah","amount":"100 gr","unit":""},{"name":"Cabai rawit","amount":"10","unit":"buah"},{"name":"Ebi","amount":"3 sdm","unit":""}]',
'[{"step":1,"description":"Haluskan daging ikan, campur dengan bawang putih, garam, dan telur."},{"step":2,"description":"Tambahkan tepung sagu sedikit demi sedikit sambil diuleni hingga kalis."},{"step":3,"description":"Bentuk adonan, rebus hingga mengapung."},{"step":4,"description":"Goreng hingga berwarna keemasan."},{"step":5,"description":"Buat kuah cuka: campurkan cuka aren, gula merah, ebi, dan cabai."},{"step":6,"description":"Sajikan pempek dengan kuah cuka dan mie kuning."}]',
90,6,'medium',280,ARRAY['pempek','palembang','ikan','sumatera'],TRUE,FALSE),

('papeda','Papeda','Papeda','Makanan pokok masyarakat Papua dan Maluku berupa bubur sagu yang kenyal, biasanya disajikan dengan ikan kuah kuning.','Papua','Papua','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Papeda.JPG/1200px-Papeda.JPG',
'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Papeda.JPG/400px-Papeda.JPG',
'[{"name":"Sagu","amount":"500 gr","unit":""},{"name":"Air mendidih","amount":"1 liter","unit":""},{"name":"Garam","amount":"1 sdt","unit":""},{"name":"Ikan tongkol","amount":"500 gr","unit":""},{"name":"Kunyit","amount":"3 cm","unit":""},{"name":"Jahe","amount":"2 cm","unit":""},{"name":"Serai","amount":"2","unit":"batang"},{"name":"Tomat","amount":"2","unit":"buah"},{"name":"Jeruk nipis","amount":"2","unit":"buah"}]',
'[{"step":1,"description":"Larutkan sagu dengan sedikit air dingin hingga tidak bergerindil."},{"step":2,"description":"Tuangkan air mendidih perlahan ke larutan sagu sambil diaduk cepat."},{"step":3,"description":"Aduk terus hingga papeda matang, kenyal, dan transparan."},{"step":4,"description":"Untuk kuah ikan: tumis bumbu, masukkan tomat dan serai."},{"step":5,"description":"Masukkan ikan, tambahkan air, masak hingga matang. Beri perasan jeruk nipis."},{"step":6,"description":"Sajikan papeda dengan kuah ikan di mangkuk terpisah."}]',
50,4,'medium',280,ARRAY['papeda','papua','maluku','sagu','ikan'],TRUE,FALSE),

('coto-makassar','Coto Makassar','Coto Mangkasara','Sup daging dan jeroan sapi khas Makassar yang kaya rempah dengan kuah hitam pekat.','Sulawesi','Sulawesi Selatan','makanan',
'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Coto_Makassar.jpg/1200px-Coto_Makassar.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Coto_Makassar.jpg/400px-Coto_Makassar.jpg',
'[{"name":"Daging sapi","amount":"500 gr","unit":""},{"name":"Jeroan sapi","amount":"300 gr","unit":""},{"name":"Kacang tanah sangrai","amount":"100 gr","unit":""},{"name":"Bawang merah","amount":"8","unit":"siung"},{"name":"Ketumbar","amount":"2 sdt","unit":""},{"name":"Air cucian beras","amount":"2 liter","unit":""},{"name":"Serai","amount":"3","unit":"batang"}]',
'[{"step":1,"description":"Rebus daging dan jeroan dengan air cucian beras hingga empuk."},{"step":2,"description":"Haluskan kacang tanah, tumis bersama bumbu."},{"step":3,"description":"Masukkan bumbu ke dalam kaldu, tambahkan pasta kacang."},{"step":4,"description":"Masukkan daging, masak 30 menit dengan api kecil."},{"step":5,"description":"Sajikan dengan ketupat dan sambal tauco."}]',
120,6,'hard',420,ARRAY['coto','makassar','sulawesi','daging'],TRUE,FALSE),

('es-teh-manis','Es Teh Manis','Es Teh','Minuman teh manis dingin paling ikonik Indonesia yang segar dan menyegarkan.','Jawa','Jawa Tengah','minuman',
'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Iced_Tea_with_lemon.jpg/800px-Iced_Tea_with_lemon.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Iced_Tea_with_lemon.jpg/400px-Iced_Tea_with_lemon.jpg',
'[{"name":"Teh celup","amount":"2","unit":"sachet"},{"name":"Air mendidih","amount":"500 ml","unit":""},{"name":"Gula pasir","amount":"4 sdm","unit":""},{"name":"Es batu","amount":"secukupnya","unit":""}]',
'[{"step":1,"description":"Seduh teh dengan air mendidih, diamkan 5 menit."},{"step":2,"description":"Larutkan gula ke dalam teh panas."},{"step":3,"description":"Dinginkan, lalu sajikan dengan es batu."}]',
10,2,'easy',80,ARRAY['es-teh','minuman','populer','segar'],TRUE,TRUE),

('es-cendol','Es Cendol','Es Dawet','Minuman tradisional segar khas Jawa dengan cendol hijau pandan, santan, dan gula jawa.','Jawa','Jawa Barat','minuman',
'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Cendol.jpg/1200px-Cendol.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Cendol.jpg/400px-Cendol.jpg',
'[{"name":"Tepung beras","amount":"100 gr","unit":""},{"name":"Tepung sagu","amount":"50 gr","unit":""},{"name":"Air daun pandan","amount":"200 ml","unit":""},{"name":"Santan","amount":"500 ml","unit":""},{"name":"Gula merah","amount":"150 gr","unit":""},{"name":"Garam","amount":"sejumput","unit":""},{"name":"Es batu","amount":"secukupnya","unit":""}]',
'[{"step":1,"description":"Campurkan tepung beras, tepung sagu, dan air pandan. Masak hingga kental."},{"step":2,"description":"Cetak cendol dengan cetakan ke dalam air es."},{"step":3,"description":"Masak gula merah jadi syrup kental."},{"step":4,"description":"Panaskan santan dengan pandan dan garam."},{"step":5,"description":"Sajikan: isi es batu, tambahkan cendol, siram santan dan gula merah."}]',
60,4,'medium',220,ARRAY['cendol','dawet','jawa','pandan','segar'],TRUE,TRUE),

('bajigur','Bajigur','Bajigur','Minuman hangat tradisional Sunda dari santan, gula aren, dan jahe yang menghangatkan.','Jawa','Jawa Barat','minuman',
'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Bajigur.jpg/800px-Bajigur.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Bajigur.jpg/400px-Bajigur.jpg',
'[{"name":"Santan","amount":"500 ml","unit":""},{"name":"Gula aren","amount":"100 gr","unit":""},{"name":"Jahe","amount":"3 cm","unit":""},{"name":"Daun pandan","amount":"2","unit":"lembar"},{"name":"Kayu manis","amount":"1","unit":"batang"},{"name":"Kolang-kaling","amount":"100 gr","unit":""}]',
'[{"step":1,"description":"Parut jahe, rebus dengan air hingga harum."},{"step":2,"description":"Masukkan santan, gula aren, pandan, dan kayu manis."},{"step":3,"description":"Masak dengan api kecil sambil diaduk terus."},{"step":4,"description":"Tambahkan kolang-kaling. Koreksi rasa."},{"step":5,"description":"Sajikan hangat."}]',
25,4,'easy',180,ARRAY['bajigur','sunda','jahe','hangat','tradisional'],TRUE,TRUE),

('klepon','Klepon','Klepon','Kue tradisional bola hijau dari tepung ketan isi gula merah, dibalut kelapa parut.','Jawa','DI Yogyakarta','dessert',
'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Klepon.jpg/1200px-Klepon.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/Klepon.jpg/400px-Klepon.jpg',
'[{"name":"Tepung ketan","amount":"200 gr","unit":""},{"name":"Air daun pandan","amount":"150 ml","unit":""},{"name":"Gula merah","amount":"100 gr","unit":""},{"name":"Kelapa parut","amount":"100 gr","unit":""},{"name":"Garam","amount":"sejumput","unit":""}]',
'[{"step":1,"description":"Campurkan tepung ketan dengan air pandan, uleni hingga kalis."},{"step":2,"description":"Ambil adonan, pipihkan, isi dengan gula merah."},{"step":3,"description":"Bulatkan hingga tertutup rapat."},{"step":4,"description":"Rebus dalam air mendidih hingga mengapung."},{"step":5,"description":"Gulingkan dalam kelapa parut. Sajikan dalam daun pisang."}]',
40,4,'easy',160,ARRAY['klepon','ketan','jawa','pandan','tradisional'],TRUE,TRUE),

('martabak-manis','Martabak Manis','Terang Bulan','Kue tebal dan fluffy dengan berbagai topping manis. Jajanan malam paling populer Indonesia.','Sumatera','Sumatera Barat','snack',
'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Martabak_manis_%28Indonesian_sweet_thick_pancake%29.jpg/1200px-Martabak_manis_%28Indonesian_sweet_thick_pancake%29.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Martabak_manis_%28Indonesian_sweet_thick_pancake%29.jpg/400px-Martabak_manis_%28Indonesian_sweet_thick_pancake%29.jpg',
'[{"name":"Tepung terigu","amount":"200 gr","unit":""},{"name":"Ragi instan","amount":"1 sdt","unit":""},{"name":"Gula pasir","amount":"50 gr","unit":""},{"name":"Telur","amount":"2","unit":"butir"},{"name":"Susu cair","amount":"250 ml","unit":""},{"name":"Soda kue","amount":"0.5 sdt","unit":""},{"name":"Margarin","amount":"2 sdm","unit":""},{"name":"Meises cokelat","amount":"4 sdm","unit":""},{"name":"Keju parut","amount":"4 sdm","unit":""}]',
'[{"step":1,"description":"Campur tepung, gula, ragi. Tambahkan telur dan susu, aduk rata."},{"step":2,"description":"Diamkan 30 menit. Tambahkan soda kue sebelum dimasak."},{"step":3,"description":"Panaskan loyang martabak, olesi margarin."},{"step":4,"description":"Tuang adonan, tutup dan masak hingga muncul pori-pori."},{"step":5,"description":"Taburi meises dan keju."},{"step":6,"description":"Angkat, olesi margarin, lipat dua. Sajikan panas."}]',
45,4,'medium',350,ARRAY['martabak','manis','jajanan','populer'],TRUE,FALSE),

('dadar-gulung','Dadar Gulung','Dadar Gulung','Crepe hijau pandan berisi unti kelapa masak gula merah. Jajanan pasar tradisional yang legit.','Jawa','Jawa Tengah','dessert',
'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Dadar_gulung.jpg/1200px-Dadar_gulung.jpg',
'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Dadar_gulung.jpg/400px-Dadar_gulung.jpg',
'[{"name":"Tepung terigu","amount":"150 gr","unit":""},{"name":"Telur","amount":"2","unit":"butir"},{"name":"Santan","amount":"300 ml","unit":""},{"name":"Pasta pandan","amount":"1 sdt","unit":""},{"name":"Garam","amount":"sejumput","unit":""},{"name":"Kelapa parut","amount":"200 gr","unit":""},{"name":"Gula merah","amount":"100 gr","unit":""},{"name":"Daun pandan","amount":"2","unit":"lembar"}]',
'[{"step":1,"description":"Buat unti: masak kelapa parut dengan gula merah dan pandan hingga kering."},{"step":2,"description":"Buat adonan kulit: campur tepung, telur, santan, pasta pandan, garam."},{"step":3,"description":"Buat crepe tipis di teflon, masak satu sisi saja."},{"step":4,"description":"Isi dengan unti, lipat dan gulung."},{"step":5,"description":"Sajikan dalam daun pisang."}]',
50,10,'easy',140,ARRAY['dadar-gulung','pandan','kelapa','jawa','kue'],TRUE,TRUE)

ON CONFLICT (slug) DO NOTHING;