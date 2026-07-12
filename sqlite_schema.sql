-- =====================================================================
-- TransitOps — MySQL Schema
-- Run via: mysql -u <user> -p <db> < transitops_schema.sql
-- Order matters: parents created before children (FK dependency order)
-- =====================================================================




-- ---------------------------------------------------------------------
-- 1. ROLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS role (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        VARCHAR(50) NOT NULL UNIQUE   -- Admin, Fleet Manager, Driver, Safety Officer, Finance
);

INSERT INTO role (name) VALUES
    ('Admin'), ('Fleet Manager'), ('Driver'), ('Safety Officer'), ('Finance');

-- ---------------------------------------------------------------------
-- 2. USER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    name           VARCHAR(120) NOT NULL,
    email          VARCHAR(150) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role_id        INT NOT NULL,
    status         TEXT NOT NULL DEFAULT 'ACTIVE',
    created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_user_role ON user(role_id);

-- ---------------------------------------------------------------------
-- 3. VEHICLE CATEGORY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_category (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  VARCHAR(50) NOT NULL UNIQUE     -- Truck, Mini Truck, Van, Bike, Container
);

INSERT INTO vehicle_category (name) VALUES
    ('Truck'), ('Mini Truck'), ('Van'), ('Bike'), ('Container');

-- ---------------------------------------------------------------------
-- 4. VEHICLE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    vehicle_name        VARCHAR(100) NOT NULL,
    category_id         INT NOT NULL,
    manufacturer        VARCHAR(100),
    model               VARCHAR(100),
    year                INTEGER,
    capacity            REAL NOT NULL,       -- max load, kg
    odometer            REAL NOT NULL DEFAULT 0,
    fuel_type           TEXT NOT NULL DEFAULT 'DIESEL',
    purchase_cost       REAL NOT NULL DEFAULT 0,
    status              TEXT NOT NULL DEFAULT 'AVAILABLE',
    current_location    VARCHAR(150),
    insurance_expiry    DATE,
    pollution_expiry    DATE,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_vehicle_category FOREIGN KEY (category_id) REFERENCES vehicle_category(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_vehicle_status ON vehicle(status);
CREATE INDEX idx_vehicle_category ON vehicle(category_id);

-- ---------------------------------------------------------------------
-- 5. DRIVER
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id         INT NOT NULL UNIQUE,
    employee_code   VARCHAR(30) NOT NULL UNIQUE,
    license_number  VARCHAR(50) NOT NULL UNIQUE,
    license_type    VARCHAR(20) NOT NULL,           -- e.g. LMV, HMV
    license_expiry  DATE NOT NULL,
    phone           VARCHAR(20),
    joining_date    DATE,
    status          TEXT NOT NULL DEFAULT 'AVAILABLE',
    safety_score    REAL NOT NULL DEFAULT 100.00,
    CONSTRAINT fk_driver_user FOREIGN KEY (user_id) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_driver_status ON driver(status);
CREATE INDEX idx_driver_license_expiry ON driver(license_expiry);

-- ---------------------------------------------------------------------
-- 6. DRIVER LICENSE (history of licenses, separate from driver's "current" one)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS driver_license (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    driver_id       INT NOT NULL,
    license_number  VARCHAR(50) NOT NULL,
    issue_date      DATE NOT NULL,
    expiry_date     DATE NOT NULL,
    category        VARCHAR(20) NOT NULL,
    document_url    VARCHAR(500),
    CONSTRAINT fk_dl_driver FOREIGN KEY (driver_id) REFERENCES driver(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_dl_driver ON driver_license(driver_id);

-- ---------------------------------------------------------------------
-- 7. ROUTE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS route (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    source              VARCHAR(150) NOT NULL,
    destination         VARCHAR(150) NOT NULL,
    estimated_distance  REAL,   -- km
    estimated_time      INT              -- minutes
);

-- ---------------------------------------------------------------------
-- 8. TRIP
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_number       VARCHAR(30) NOT NULL UNIQUE,
    vehicle_id        INT NOT NULL,
    driver_id         INT NOT NULL,
    source            VARCHAR(150) NOT NULL,
    destination       VARCHAR(150) NOT NULL,
    cargo_weight      REAL NOT NULL,
    planned_distance  REAL,
    actual_distance   REAL,
    planned_start     DATETIME,
    planned_end       DATETIME,
    actual_start      DATETIME,
    actual_end        DATETIME,
    status            TEXT NOT NULL DEFAULT 'DRAFT',
    revenue           REAL DEFAULT 0,
    remarks           VARCHAR(500),
    created_by        INT NOT NULL,
    created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_trip_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trip_driver FOREIGN KEY (driver_id) REFERENCES driver(id)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_trip_created_by FOREIGN KEY (created_by) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_trip_status ON trip(status);
CREATE INDEX idx_trip_vehicle ON trip(vehicle_id);
CREATE INDEX idx_trip_driver ON trip(driver_id);

-- ---------------------------------------------------------------------
-- 9. TRIP STATUS HISTORY
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS trip_status_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    trip_id     INT NOT NULL,
    status      TEXT NOT NULL,
    changed_by  INT NOT NULL,
    changed_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_tsh_trip FOREIGN KEY (trip_id) REFERENCES trip(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_tsh_user FOREIGN KEY (changed_by) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_tsh_trip ON trip_status_history(trip_id);

-- ---------------------------------------------------------------------
-- 10. MAINTENANCE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS maintenance (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      INT NOT NULL,
    maintenance_type VARCHAR(100) NOT NULL,   -- Oil Change, Engine Repair, Tyre Replace...
    description     VARCHAR(500),
    priority        TEXT NOT NULL DEFAULT 'MEDIUM',
    cost            REAL NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'ACTIVE',
    scheduled_date  DATE,
    completed_date  DATE,
    created_by      INT NOT NULL,
    CONSTRAINT fk_maint_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_maint_user FOREIGN KEY (created_by) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE RESTRICT
);

CREATE INDEX idx_maint_vehicle ON maintenance(vehicle_id);
CREATE INDEX idx_maint_status ON maintenance(status);

-- ---------------------------------------------------------------------
-- 11. FUEL LOG
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fuel_log (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id      INT NOT NULL,
    trip_id         INT,                       -- nullable: fuel not always tied to a trip
    liters          REAL NOT NULL,
    price_per_liter REAL NOT NULL,
    total_cost      REAL GENERATED ALWAYS AS (liters * price_per_liter) STORED,
    odometer        REAL,
    date            DATE NOT NULL,
    CONSTRAINT fk_fuel_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_fuel_trip FOREIGN KEY (trip_id) REFERENCES trip(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_fuel_vehicle ON fuel_log(vehicle_id);
CREATE INDEX idx_fuel_trip ON fuel_log(trip_id);

-- ---------------------------------------------------------------------
-- 12. EXPENSE
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expense (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id  INT NOT NULL,
    trip_id     INT,                            -- nullable
    type        TEXT NOT NULL,
    amount      REAL NOT NULL,
    remarks     VARCHAR(300),
    date        DATE NOT NULL,
    CONSTRAINT fk_expense_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_expense_trip FOREIGN KEY (trip_id) REFERENCES trip(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_expense_vehicle ON expense(vehicle_id);
CREATE INDEX idx_expense_type ON expense(type);

-- ---------------------------------------------------------------------
-- 13. VEHICLE DOCUMENT
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS vehicle_document (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    vehicle_id     INT NOT NULL,
    document_type  VARCHAR(50) NOT NULL,   -- Insurance, RC, Pollution, Permit...
    document_url   VARCHAR(500) NOT NULL,
    expiry_date    DATE,
    verified       BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_vdoc_vehicle FOREIGN KEY (vehicle_id) REFERENCES vehicle(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_vdoc_vehicle ON vehicle_document(vehicle_id);

-- ---------------------------------------------------------------------
-- 14. NOTIFICATION
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notification (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INT NOT NULL,
    title       VARCHAR(150) NOT NULL,
    message     VARCHAR(1000) NOT NULL,
    type        TEXT NOT NULL DEFAULT 'INFO',
    `read`      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_notif_user ON notification(user_id);

-- ---------------------------------------------------------------------
-- 15. AI CHAT HISTORY (Chat)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS chat (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INT NOT NULL,
    question    TEXT NOT NULL,
    response    TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_chat_user FOREIGN KEY (user_id) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE CASCADE
);

CREATE INDEX idx_chat_user ON chat(user_id);

-- ---------------------------------------------------------------------
-- 16. AUDIT LOG
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INT,                       -- nullable: system-triggered changes
    module      VARCHAR(50) NOT NULL,      -- 'Vehicle', 'Trip', 'Maintenance', etc.
    action      VARCHAR(50) NOT NULL,      -- 'CREATE','UPDATE','DELETE','STATUS_CHANGE'
    old_data    TEXT,
    new_data    TEXT,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES user(id)
        ON UPDATE CASCADE ON DELETE SET NULL
);

CREATE INDEX idx_audit_module ON audit_log(module);
CREATE INDEX idx_audit_user ON audit_log(user_id);

-- ---------------------------------------------------------------------
-- 17. DASHBOARD METRICS (cache table)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS dashboard_metrics (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    date                DATE NOT NULL UNIQUE,
    active_trips        INT NOT NULL DEFAULT 0,
    available_vehicle   INT NOT NULL DEFAULT 0,
    maintenance_vehicle INT NOT NULL DEFAULT 0,
    fuel_cost           REAL NOT NULL DEFAULT 0,
    revenue             REAL NOT NULL DEFAULT 0,
    utilization         REAL NOT NULL DEFAULT 0   -- percentage
);


