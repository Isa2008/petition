const spicedPg = require("spiced-pg");

let db;
if (process.env.DATABASE_URL) {
    db = spicedPg(process.env.DATABASE_URL);
} else {
    const { dbuser, dbpass } = require("../secrets.json");
    db = spicedPg(`postgres:${dbuser}:${dbpass}@localhost:5432/petition`);
}

exports.addSigner = function(firstname, lastname, signature) {
    return db
        .query(
            `INSERT INTO signatures (firstname, lastname, signature)
        VALUES ($1, $2, $3)
        RETURNING id`,
            [firstname, lastname, signature]
        )
        .then(({ rows }) => {
            return rows[0].id;
        });
};

exports.getSigners = function() {
    return db
        .query(
            `SELECT users.firstname, users.lastname, users_profiles.age, users_profiles.city, users_profiles.url
            FROM users
            JOIN signatures
            ON signatures.user_id = users.id
            JOIN users_profiles
            ON users.id = users_profiles.user_id`
        )
        .then(({ rows }) => {
            return rows;
        });
};

exports.addProfile = function(age, city, url, user_id) {
    return db
        .query(
            `INSERT INTO users_profiles (age, city, url, user_id)
        VALUES ($1, $2, $3, $4)`,
            [age || null, city || null, url || null, user_id]
        )
        .then(({ rows }) => {
            return rows;
        });
};

exports.getProfilesCity = function(city) {
    return db
        .query(
            `SELECT users.firstname, users.lastname, users_profiles.age, users_profiles.url FROM signatures JOIN users ON signatures.user_id = users.id JOIN users_profiles ON users.id = users_profiles.user_id WHERE LOWER(users_profiles.city)=LOWER($1)`,
            [city]
        )
        .then(({ rows }) => {
            return rows;
        });
};

exports.addSignature = function(signature, user_id) {
    return db
        .query(
            `INSERT INTO signatures (signature, user_id)
        VALUES ($1, $2)
        RETURNING id`,
            [signature, user_id]
        )
        .then(({ rows }) => {
            return rows[0].id;
        });
};

exports.getSignature = function(user_id) {
    return db
        .query(`SELECT signature, user_id FROM signatures WHERE user_id=$1`, [
            user_id
        ])
        .then(({ rows }) => {
            return rows;
        });
};

exports.getHashed = function(email) {
    return (
        db
            .query(
                `SELECT users.password, users.id, signatures.user_id
                FROM users
                LEFT JOIN signatures
                ON signatures.user_id = users.id
                WHERE email=$1`,
                [email]
            )
            .then(({ rows }) => {
                return rows;
            })
    );
};

exports.addRegister = function(firstname, lastname, email, password) {
    return db
        .query(
            `INSERT INTO users (firstname,lastname, email, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id`,
            [firstname, lastname, email, password]
        )
        .then(({ rows }) => {
            return rows[0].id;
        });
};

exports.getRegister = function() {
    return db
        .query(`SELECT firstname, lastname FROM users`)
        .then(({ rows }) => {
            return rows;
        });
};

exports.getLogin = function() {
    return db.query(`SELECT email, password FROM users`).then(({ rows }) => {
        return rows;
    });
};

exports.getEdit = function(user) {
    return db
        .query(
            `SELECT users.firstname, users.lastname, users.email, users_profiles.age, users_profiles.city, users_profiles.url
        FROM users
        JOIN users_profiles
        ON users.id = users_profiles.user_id
        WHERE users.id = $1`,
            [user]
        )
        .then(({ rows }) => {
            return rows;
        });
};

exports.updateUsers = function(user, firstname, lastname, email) {
    return db.query(
        `UPDATE users
            SET firstname = $2, lastname = $3, email = $4 WHERE users.id = $1`,
        [user, firstname, lastname, email]
    );
};

exports.updateUsersHash = function(user, firstname, lastname, email, hash) {
    return db.query(
        `UPDATE users
            SET firstname = $2, lastname = $3, email = $4, password = $5 WHERE users.id = $1`,
        [user, firstname, lastname, email, hash]
    );
};

exports.updateUsersProfiles = function(user, age, city, url) {
    return db.query(
        `INSERT INTO users_profiles (user_id, age, city, url)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (user_id)
            DO UPDATE SET age = $2, city = $3, url = $4`,
        [user, age, city, url]
    );
};

exports.deleteSignature = function(user) {
    return db.query(`DELETE FROM signatures WHERE user_id = $1`, [user]);
};
