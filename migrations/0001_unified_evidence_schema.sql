-- Beacontra Unified Evidence Foundation: D1 Migration 0001
-- Tables separating ProductIdentity, MarketplaceListing, MerchantIdentity,
-- VisualEvidence, CommercialEvidence, SearchObservation, DerivedInference,
-- InvestigationCase, and HistoricalScanSnapshot.

CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    brand_id TEXT NOT NULL,
    canonical_name TEXT NOT NULL,
    model_number TEXT,
    category TEXT,
    canonical_image_urls TEXT NOT NULL, -- JSON array
    mrp REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    price_min REAL,
    price_max REAL,
    authorized_sellers TEXT NOT NULL, -- JSON array
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sku_variants (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    sku TEXT NOT NULL,
    variant_name TEXT NOT NULL,
    color TEXT,
    storage TEXT,
    hardware_tier TEXT,
    generation TEXT,
    mrp REAL NOT NULL,
    expected_price_min REAL,
    expected_price_max REAL,
    image_url TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_corrections (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    listing_title TEXT NOT NULL,
    correction_type TEXT NOT NULL,
    mapped_sku_id TEXT,
    reason TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS merchants (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    normalized_name TEXT NOT NULL,
    platform TEXT NOT NULL,
    storefront_url TEXT,
    business_registration_id TEXT,
    verification_status TEXT NOT NULL DEFAULT 'unverified',
    first_observed_at TEXT NOT NULL,
    last_observed_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS listings (
    id TEXT PRIMARY KEY,
    source TEXT NOT NULL,
    marketplace TEXT NOT NULL,
    external_id TEXT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    clean_url TEXT NOT NULL,
    extracted_price REAL NOT NULL,
    original_price_text TEXT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    seller_name TEXT NOT NULL,
    merchant_id TEXT,
    image_url TEXT NOT NULL,
    rating REAL,
    review_count INTEGER,
    availability_status TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(merchant_id) REFERENCES merchants(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS visual_evidence (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    image_url TEXT NOT NULL,
    image_sha256 TEXT, -- Cryptographic integrity digest, not legal certification
    lens_engine TEXT NOT NULL DEFAULT 'google_lens',
    lens_status TEXT NOT NULL,
    matched_pages TEXT NOT NULL, -- JSON array of matches
    confidence_score REAL NOT NULL,
    retrieval_timestamp TEXT NOT NULL,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS commercial_evidence (
    id TEXT PRIMARY KEY,
    listing_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    observed_price REAL NOT NULL,
    baseline_mrp REAL NOT NULL,
    variance_percent REAL NOT NULL,
    anomaly_type TEXT NOT NULL,
    discount_legitimacy_score REAL NOT NULL,
    seller_reputation TEXT NOT NULL,
    retrieval_timestamp TEXT NOT NULL,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS search_observations (
    id TEXT PRIMARY KEY,
    scan_id TEXT NOT NULL,
    engine TEXT NOT NULL,
    query_parameters TEXT NOT NULL, -- JSON object
    retrieval_timestamp TEXT NOT NULL,
    data_source TEXT NOT NULL, -- 'live' | 'fixture' | 'cache'
    raw_item_count INTEGER NOT NULL,
    request_cost_credits INTEGER NOT NULL,
    provenance_hash TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS derived_inferences (
    id TEXT PRIMARY KEY,
    target_entity_id TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- 'listing' | 'merchant' | 'brand'
    signal_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    supporting_observation_ids TEXT NOT NULL, -- JSON array
    missing_evidence TEXT NOT NULL, -- JSON array
    reasoning TEXT NOT NULL,
    uncertainty_disclaimer TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS cases (
    id TEXT PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    product_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active' | 'under_review' | 'escalated' | 'resolved' | 'archived'
    priority TEXT NOT NULL, -- 'high' | 'medium' | 'low'
    findings_summary TEXT NOT NULL,
    legal_disclaimer TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS case_listings (
    case_id TEXT NOT NULL,
    listing_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (case_id, listing_id),
    FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY(listing_id) REFERENCES listings(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS case_notes (
    id TEXT PRIMARY KEY,
    case_id TEXT NOT NULL,
    author TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL,
    FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS scan_snapshots (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    scan_id TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    listing_count INTEGER NOT NULL,
    anomalous_count INTEGER NOT NULL,
    lowest_observed_price REAL NOT NULL,
    average_comparable_price REAL NOT NULL,
    listing_ids TEXT NOT NULL, -- JSON array
    summary TEXT NOT NULL,
    FOREIGN KEY(product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Indexing for fast investigation and graph joins
CREATE INDEX IF NOT EXISTS idx_listings_merchant ON listings(merchant_id);
CREATE INDEX IF NOT EXISTS idx_listings_clean_url ON listings(clean_url);
CREATE INDEX IF NOT EXISTS idx_visual_listing ON visual_evidence(listing_id);
CREATE INDEX IF NOT EXISTS idx_commercial_listing ON commercial_evidence(listing_id);
CREATE INDEX IF NOT EXISTS idx_commercial_product ON commercial_evidence(product_id);
CREATE INDEX IF NOT EXISTS idx_cases_product ON cases(product_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_product ON scan_snapshots(product_id);
