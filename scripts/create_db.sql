-- Create the database
CREATE DATABASE <db_name>;

-- Create a new user and grant privileges
CREATE USER <db_user>@'localhost' IDENTIFIED BY '<password>';
GRANT ALL PRIVILEGES ON <db_name>.* TO <db_user>@'localhost';

-- Flush privileges
FLUSH PRIVILEGES;
