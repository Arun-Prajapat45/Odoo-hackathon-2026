SET FOREIGN_KEY_CHECKS = 0;
SET NAMES utf8mb4;

-- =====================================================================
-- TransitOps — Seed Data
-- =====================================================================

-- Clean existing data to avoid conflicts
DELETE FROM dashboard_metrics;
DELETE FROM audit_log;
DELETE FROM chat;
DELETE FROM notification;
DELETE FROM vehicle_document;
DELETE FROM expense;
DELETE FROM fuel_log;
DELETE FROM maintenance;
DELETE FROM trip_status_history;
DELETE FROM trip;
DELETE FROM route;
DELETE FROM driver_license;
DELETE FROM driver;
DELETE FROM vehicle;
DELETE FROM user;
DELETE FROM vehicle_category;
DELETE FROM role;

-- ---------------------------------------------------------------------
-- 1. ROLE
-- ---------------------------------------------------------------------
INSERT INTO role (id, name) VALUES
(1, 'Admin'), 
(2, 'Fleet Manager'), 
(3, 'Driver'), 
(4, 'Safety Officer'), 
(5, 'Finance');

-- ---------------------------------------------------------------------
-- 2. USER
-- (Password hash is for 'password123' using bcrypt)
-- ---------------------------------------------------------------------
INSERT INTO user (id, name, email, password_hash, role_id, status) VALUES
(1, 'Alice Admin', 'admin@transitops.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'ACTIVE'),
(2, 'Bob Manager', 'manager@transitops.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 2, 'ACTIVE'),
(3, 'Charlie Driver', 'charlie@transitops.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'ACTIVE'),
(4, 'Dave Driver', 'dave@transitops.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'ACTIVE'),
(5, 'Eve Driver', 'eve@transitops.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'ACTIVE'),
(6, 'Frank Driver', 'frank@transitops.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 3, 'ACTIVE');

-- ---------------------------------------------------------------------
-- 3. VEHICLE CATEGORY
-- ---------------------------------------------------------------------
INSERT INTO vehicle_category (id, name) VALUES
(1, 'Truck'), 
(2, 'Mini Truck'), 
(3, 'Van'), 
(4, 'Bike'), 
(5, 'Container');

-- ---------------------------------------------------------------------
-- 4. VEHICLE
-- ---------------------------------------------------------------------
INSERT INTO vehicle (id, registration_number, vehicle_name, category_id, manufacturer, model, year, capacity, odometer, fuel_type, purchase_cost, status, current_location, insurance_expiry, pollution_expiry) VALUES
(1, 'MH-01-AB-1234', 'Alpha Truck One', 1, 'Tata', 'Prima', 2020, 10000.00, 150000, 'DIESEL', 2500000.00, 'AVAILABLE', 'Mumbai Depot', '2027-01-15', '2026-10-10'),
(2, 'MH-02-CD-5678', 'Beta Mini Truck', 2, 'Mahindra', 'Bolero Pik-Up', 2021, 1500.00, 85000, 'DIESEL', 800000.00, 'ON_TRIP', 'En route Pune', '2026-12-01', '2026-09-01'),
(3, 'DL-01-XY-9999', 'Gamma Van', 3, 'Maruti Suzuki', 'Eeco', 2022, 600.00, 45000, 'CNG', 500000.00, 'IN_SHOP', 'Delhi Garage', '2026-11-20', '2026-08-15'),
(4, 'KA-05-MN-4321', 'Delta Container', 5, 'Ashok Leyland', 'Captain', 2019, 15000.00, 220000, 'DIESEL', 3500000.00, 'AVAILABLE', 'Bangalore Hub', '2027-03-10', '2026-12-05'),
(5, 'TN-09-PQ-8765', 'Epsilon Van', 3, 'Tata', 'Winger', 2023, 1200.00, 15000, 'EV', 1500000.00, 'ON_TRIP', 'Chennai City', '2027-05-01', '2027-05-01');

-- ---------------------------------------------------------------------
-- 5. DRIVER
-- ---------------------------------------------------------------------
INSERT INTO driver (id, user_id, employee_code, license_number, license_type, license_expiry, phone, joining_date, status, safety_score) VALUES
(1, 3, 'EMP-101', 'DL-MH-2010-001', 'HMV', '2028-05-10', '9876543210', '2020-01-15', 'AVAILABLE', 98.50),
(2, 4, 'EMP-102', 'DL-MH-2015-002', 'LMV', '2026-11-20', '9876543211', '2021-03-10', 'ON_TRIP', 95.00),
(3, 5, 'EMP-103', 'DL-DL-2018-003', 'LMV', '2027-02-14', '9876543212', '2022-06-05', 'OFF_DUTY', 90.00),
(4, 6, 'EMP-104', 'DL-KA-2012-004', 'HMV', '2029-08-01', '9876543213', '2019-11-22', 'ON_TRIP', 99.00);

-- ---------------------------------------------------------------------
-- 8. TRIP
-- ---------------------------------------------------------------------
INSERT INTO trip (id, trip_number, vehicle_id, driver_id, source, destination, cargo_weight, planned_distance, actual_distance, planned_start, planned_end, actual_start, actual_end, status, revenue, remarks, created_by, created_at) VALUES
(1, 'TRP-2024-001', 1, 1, 'Mumbai Depot', 'Pune Hub', 8000.00, 150.00, 152.00, '2026-07-10 08:00:00', '2026-07-10 12:00:00', '2026-07-10 08:15:00', '2026-07-10 12:30:00', 'COMPLETED', 15000.00, 'Smooth delivery.', 2, '2026-07-09 10:00:00'),
(2, 'TRP-2024-002', 2, 2, 'Mumbai Depot', 'Nashik Hub', 1000.00, 165.00, NULL, '2026-07-12 10:00:00', '2026-07-12 15:00:00', '2026-07-12 10:10:00', NULL, 'DISPATCHED', 8000.00, 'Currently on route.', 2, '2026-07-11 14:00:00'),
(3, 'TRP-2024-003', 4, 4, 'Bangalore Hub', 'Mysore Hub', 12000.00, 145.00, NULL, '2026-07-12 11:00:00', '2026-07-12 14:30:00', '2026-07-12 11:05:00', NULL, 'DISPATCHED', 25000.00, 'Urgent delivery.', 1, '2026-07-11 16:30:00'),
(4, 'TRP-2024-004', 1, 1, 'Pune Hub', 'Solapur', 8500.00, 250.00, NULL, '2026-07-14 06:00:00', '2026-07-14 12:00:00', NULL, NULL, 'DRAFT', 20000.00, 'Pending loading confirmation.', 2, '2026-07-12 09:00:00'),
(5, 'TRP-2024-005', 3, 3, 'Delhi Garage', 'Gurgaon', 500.00, 45.00, 0.00, '2026-07-11 09:00:00', '2026-07-11 11:00:00', NULL, NULL, 'CANCELLED', 0.00, 'Vehicle broke down before start.', 2, '2026-07-10 18:00:00');

SET FOREIGN_KEY_CHECKS = 1;
