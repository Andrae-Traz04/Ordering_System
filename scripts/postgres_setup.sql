-- Run as postgres superuser:
-- sudo -u postgres psql -f scripts/postgres_setup.sql

CREATE DATABASE mydb;
CREATE USER myuser WITH PASSWORD 'strongpassword';
GRANT ALL PRIVILEGES ON DATABASE mydb TO myuser;

\c mydb

GRANT ALL ON SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO myuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO myuser;
ALTER SCHEMA public OWNER TO myuser;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO myuser;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO myuser;
