\echo 'Delete and recreate biztime db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE IF EXISTS biztime;
CREATE DATABASE biztime;
\connect biztime;


CREATE TABLE companies (
  code TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
  amt NUMERIC(10, 2) NOT NULL CHECK (amt >= 0),
  paid BOOLEAN DEFAULT FALSE NOT NULL,
  add_date  DATE DEFAULT CURRENT_DATE NOT NULL,
  paid_date DATE
);

INSERT INTO companies
VALUES ('apple', 'Apple Computer', 'Maker of OSX.'),
       ('ibm', 'IBM', 'Big blue.');

INSERT INTO invoices (comp_code, amt, paid, paid_date)
VALUES ('apple', 100, FALSE, NULL),
       ('apple', 200, FALSE, NULL),
       ('apple', 300, TRUE, '2018-01-01'),
       ('ibm', 400, FALSE, NULL);


\echo 'Delete and recreate biztime_test db?'
\prompt 'Return for yes or control-C to cancel > ' foo

DROP DATABASE IF EXISTS biztime_test;
CREATE DATABASE biztime_test;
\connect biztime_test;

CREATE TABLE companies (
  code TEXT PRIMARY KEY,
  name  TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL
);

CREATE TABLE invoices (
  id SERIAL PRIMARY KEY,
  comp_code TEXT NOT NULL REFERENCES companies ON DELETE CASCADE,
  amt NUMERIC(10, 2) NOT NULL CHECK (amt >= 0),
  paid BOOLEAN DEFAULT FALSE NOT NULL,
  add_date  DATE DEFAULT CURRENT_DATE NOT NULL,
  paid_date DATE
);