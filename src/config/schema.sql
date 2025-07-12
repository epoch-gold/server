CREATE TABLE IF NOT EXISTS items (
    id INTEGER PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS scans (
    id SERIAL PRIMARY KEY,
    timestamp BIGINT NOT NULL,
    quantity INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS auctions (
    item INTEGER NOT NULL,
    index INTEGER NOT NULL,
    scan INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    price BIGINT NOT NULL,
    PRIMARY KEY (item, index),
    FOREIGN KEY (item) REFERENCES items (id) ON DELETE CASCADE,
    FOREIGN KEY (scan) REFERENCES scans (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS market_data (
    id SERIAL PRIMARY KEY,
    item INTEGER NOT NULL,
    scan INTEGER NOT NULL,
    market_price BIGINT NOT NULL,
    quantity INTEGER NOT NULL,
    FOREIGN KEY (item) REFERENCES items (id) ON DELETE CASCADE,
    FOREIGN KEY (scan) REFERENCES scans (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_auctions_scan ON auctions (scan);
CREATE INDEX IF NOT EXISTS idx_market_data_item ON market_data (item);
CREATE INDEX IF NOT EXISTS idx_market_data_scan ON market_data (scan);