-- Inno Sphere — PostgreSQL schema
-- Run manually when using a PostgreSQL database.
-- SQLAlchemy models in backend/app/models.py mirror this; keep them in step.

CREATE EXTENSION IF NOT EXISTS postgis;
-- CREATE EXTENSION IF NOT EXISTS vector;   -- enable when you add pgvector RAG

CREATE TABLE IF NOT EXISTS users (
    id              SERIAL PRIMARY KEY,
    phone           VARCHAR(20) UNIQUE NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(120) DEFAULT 'Farmer',
    language        VARCHAR(8)  DEFAULT 'hi',
    voice_language  VARCHAR(8)  DEFAULT 'hi',
    state           VARCHAR(80),
    district        VARCHAR(80),
    village         VARCHAR(120),
    land_area_ha    REAL,
    experience_years INTEGER,
    prefers_voice   BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS farms (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    name            VARCHAR(120) NOT NULL,
    latitude        REAL,
    longitude       REAL,
    area_ha         REAL,
    boundary_geojson JSONB,
    -- PostGIS geometry for real spatial queries:
    boundary        GEOMETRY(Polygon, 4326),
    soil_type       VARCHAR(80),
    created_at      TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS farms_boundary_gix ON farms USING GIST (boundary);

CREATE TABLE IF NOT EXISTS crop_cycles (
    id           SERIAL PRIMARY KEY,
    farm_id      INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    crop         VARCHAR(60) NOT NULL,
    variety      VARCHAR(80),
    sowing_date  DATE,
    growth_stage VARCHAR(60),
    active       BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS soil_records (
    id             SERIAL PRIMARY KEY,
    farm_id        INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    tested_on      DATE,
    source         VARCHAR(80) DEFAULT 'farmer_entry',
    soil_type      VARCHAR(60),
    ph             REAL, ec REAL, organic_carbon REAL,
    nitrogen       REAL, phosphorus REAL, potassium REAL, sulphur REAL,
    zinc REAL, iron REAL, manganese REAL, boron REAL
);

CREATE TABLE IF NOT EXISTS crop_images (
    id             SERIAL PRIMARY KEY,
    crop_cycle_id  INTEGER REFERENCES crop_cycles(id) ON DELETE CASCADE,
    view_type      VARCHAR(30) NOT NULL,
    file_path      VARCHAR(400) NOT NULL,
    quality_score  INTEGER,
    quality_issues JSONB,
    features       JSONB,
    captured_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS diagnoses (
    id             SERIAL PRIMARY KEY,
    crop_cycle_id  INTEGER REFERENCES crop_cycles(id) ON DELETE CASCADE,
    primary_label  VARCHAR(160) NOT NULL,
    differential   JSONB NOT NULL,
    confidence     VARCHAR(10) NOT NULL,
    severity       VARCHAR(10) NOT NULL,
    evidence       JSONB NOT NULL,
    actions        JSONB NOT NULL,
    knowledge_refs JSONB,
    image_ids      JSONB,
    created_at     TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
    id           SERIAL PRIMARY KEY,
    farm_id      INTEGER REFERENCES farms(id) ON DELETE CASCADE,
    kind         VARCHAR(40),
    level        VARCHAR(10),
    title        VARCHAR(200),
    reason       TEXT,
    action       VARCHAR(200),
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at   TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role       VARCHAR(10) NOT NULL,
    text       TEXT NOT NULL,
    route      VARCHAR(30),
    sources    JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS monitoring_events (
    id            SERIAL PRIMARY KEY,
    crop_cycle_id INTEGER REFERENCES crop_cycles(id) ON DELETE CASCADE,
    happened_on   DATE NOT NULL,
    status        VARCHAR(10) NOT NULL,
    note          TEXT
);

-- Knowledge storage. The curated JSON in backend/app/data ships with the app;
-- these tables are for documents you ingest later.
CREATE TABLE IF NOT EXISTS knowledge_sources (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(120) NOT NULL,
    url        VARCHAR(400),
    published  DATE,
    trust_tier VARCHAR(20) DEFAULT 'verified'
);

CREATE TABLE IF NOT EXISTS knowledge_documents (
    id        SERIAL PRIMARY KEY,
    source_id INTEGER REFERENCES knowledge_sources(id),
    title     VARCHAR(300),
    crop      VARCHAR(60),
    language  VARCHAR(8) DEFAULT 'en',
    body      TEXT,
    version   VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
    id          SERIAL PRIMARY KEY,
    document_id INTEGER REFERENCES knowledge_documents(id) ON DELETE CASCADE,
    chunk_index INTEGER,
    text        TEXT NOT NULL,
    metadata    JSONB
    -- embedding vector(384)   -- add with pgvector, then:
    -- CREATE INDEX ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);
);

CREATE TABLE IF NOT EXISTS farmer_glossary (
    id            SERIAL PRIMARY KEY,
    concept       VARCHAR(120),
    language      VARCHAR(20),
    region        VARCHAR(80),
    local_term    VARCHAR(160),
    standard_term VARCHAR(160),
    meaning       TEXT,
    status        VARCHAR(20) DEFAULT 'needs review',
    source        VARCHAR(160)
);
