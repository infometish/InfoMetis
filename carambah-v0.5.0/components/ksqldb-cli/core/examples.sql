-- ksqlDB CLI Usage Examples
-- SQL commands for stream processing with ksqlDB
-- Execute these commands in the ksqlDB CLI

-- =========================
-- BASIC OPERATIONS
-- =========================

-- Show all streams
SHOW STREAMS;

-- Show all tables
SHOW TABLES;

-- Show all Kafka topics
SHOW TOPICS;

-- Show connectors
SHOW CONNECTORS;

-- Show server properties
SHOW PROPERTIES;

-- =========================
-- STREAM CREATION
-- =========================

-- Create a simple stream from a Kafka topic
CREATE STREAM users (
    id INT,
    name STRING,
    email STRING,
    created_at BIGINT
) WITH (
    kafka_topic='users',
    value_format='JSON'
);

-- Create a stream with additional options
CREATE STREAM transactions (
    transaction_id STRING,
    user_id INT,
    amount DECIMAL(10,2),
    transaction_time BIGINT,
    merchant STRING
) WITH (
    kafka_topic='transactions',
    value_format='JSON',
    timestamp='transaction_time'
);

-- Create a stream from another stream (filtered)
CREATE STREAM high_value_transactions AS
SELECT 
    transaction_id,
    user_id,
    amount,
    merchant
FROM transactions
WHERE amount > 100.0;

-- =========================
-- TABLE CREATION
-- =========================

-- Create a table by aggregating a stream
CREATE TABLE user_transaction_counts AS
SELECT 
    user_id,
    COUNT(*) as transaction_count,
    SUM(amount) as total_amount
FROM transactions
GROUP BY user_id;

-- Create a table with windowing
CREATE TABLE hourly_transaction_volumes AS
SELECT 
    TIMESTAMPTOSTRING(WINDOWSTART, 'yyyy-MM-dd HH:mm:ss') as window_start,
    COUNT(*) as transaction_count,
    SUM(amount) as total_volume
FROM transactions
WINDOW TUMBLING (SIZE 1 HOUR)
GROUP BY 1;

-- =========================
-- QUERIES
-- =========================

-- Simple select (streaming query)
SELECT * FROM users EMIT CHANGES;

-- Select with conditions
SELECT user_id, amount, merchant 
FROM transactions 
WHERE amount > 50.0 
EMIT CHANGES;

-- Join streams
CREATE STREAM user_transactions AS
SELECT 
    u.name,
    u.email,
    t.amount,
    t.merchant,
    t.transaction_time
FROM transactions t
JOIN users u ON t.user_id = u.id;

-- Windowed aggregation
SELECT 
    user_id,
    COUNT(*) as txn_count,
    SUM(amount) as total_amount
FROM transactions
WINDOW TUMBLING (SIZE 5 MINUTES)
GROUP BY user_id
EMIT CHANGES;

-- =========================
-- ADVANCED OPERATIONS
-- =========================

-- Create a stream with Avro format (requires Schema Registry)
CREATE STREAM avro_events (
    event_id STRING,
    event_type STRING,
    payload MAP<STRING, STRING>
) WITH (
    kafka_topic='avro_events',
    value_format='AVRO'
);

-- Create a table with compacted topic
CREATE TABLE user_profiles (
    user_id INT PRIMARY KEY,
    name STRING,
    email STRING,
    last_updated BIGINT
) WITH (
    kafka_topic='user_profiles',
    value_format='JSON'
);

-- Stream-Table join
CREATE STREAM enriched_transactions AS
SELECT 
    t.transaction_id,
    t.amount,
    t.merchant,
    up.name as user_name,
    up.email as user_email
FROM transactions t
LEFT JOIN user_profiles up ON t.user_id = up.user_id;

-- =========================
-- UTILITY COMMANDS
-- =========================

-- Describe a stream or table
DESCRIBE users;
DESCRIBE EXTENDED transactions;

-- Show running queries
SHOW QUERIES;

-- Terminate a running query
TERMINATE query_id;

-- Drop a stream or table
DROP STREAM IF EXISTS stream_name;
DROP TABLE IF EXISTS table_name;

-- =========================
-- MONITORING COMMANDS
-- =========================

-- Check stream/table status
EXPLAIN SELECT * FROM users;

-- Show query execution plan
EXPLAIN (FORMAT JSON) SELECT user_id, COUNT(*) FROM transactions GROUP BY user_id;

-- =========================
-- EXAMPLE WORKFLOW
-- =========================

-- 1. Create base streams
CREATE STREAM raw_events (
    event_id STRING,
    user_id INT,
    event_type STRING,
    timestamp BIGINT,
    data MAP<STRING, STRING>
) WITH (
    kafka_topic='raw_events',
    value_format='JSON',
    timestamp='timestamp'
);

-- 2. Filter events by type
CREATE STREAM login_events AS
SELECT 
    event_id,
    user_id,
    timestamp,
    data['ip_address'] as ip_address,
    data['user_agent'] as user_agent
FROM raw_events
WHERE event_type = 'login';

-- 3. Aggregate login events
CREATE TABLE login_stats AS
SELECT 
    user_id,
    COUNT(*) as login_count,
    LATEST_BY_OFFSET(data['ip_address']) as last_ip
FROM login_events
GROUP BY user_id;

-- 4. Monitor real-time logins
SELECT 
    user_id,
    ip_address,
    TIMESTAMPTOSTRING(timestamp, 'yyyy-MM-dd HH:mm:ss') as login_time
FROM login_events
EMIT CHANGES;

-- =========================
-- NOTES
-- =========================

-- To execute these commands:
-- 1. Connect to ksqlDB CLI: kubectl exec -it -n infometis deployment/ksqldb-cli -- ksql http://ksqldb-server-service:8088
-- 2. Paste and execute the SQL commands
-- 3. Use CTRL+C to stop streaming queries
-- 4. Use 'exit' or CTRL+D to exit the CLI