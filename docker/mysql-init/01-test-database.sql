-- Runs once, when the container's data volume is first created.
CREATE DATABASE IF NOT EXISTS mileagemaster_test;
GRANT ALL PRIVILEGES ON mileagemaster_test.* TO 'mileagemaster'@'%';
FLUSH PRIVILEGES;
