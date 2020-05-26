CREATE TABLE users (
    Phone varchar(255) primary key,
    Name varchar(255)
);

CREATE TABLE locations (
    City varchar(255),
    Phone varchar(255),
    FOREIGN KEY(Phone) REFERENCES users(Phone)
);
