DROP TABLE IF EXISTS users_profiles CASCADE;

CREATE TABLE users_profiles (
    id SERIAL PRIMARY KEY,
    age INT,
    city VARCHAR(100),
    url VARCHAR(300),
    user_id INT REFERENCES users(id) NOT NULL UNIQUE
);
