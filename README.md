# Travel_Tracker
- Create the world DB with the tables on postgresql
- Import the countries.csv into a new table in world DB
- Modify the first user to add inside index.js
- Initialize npm
- Install node modules
- Run the web server using index.js

# Necessary tables
CREATE TABLE users(
id SERIAL PRIMARY KEY,
name VARCHAR(15) UNIQUE NOT NULL,
color VARCHAR(15)
);

CREATE TABLE visited_countries(
id SERIAL PRIMARY KEY,
country_code CHAR(2) NOT NULL,
user_id INTEGER REFERENCES users(id)
UNIQUE (user_id, country_code)
);