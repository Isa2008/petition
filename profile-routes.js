const express = require("express");
const router = (exports.router = express.Router());

router.get("/register", (req, res) => {
    // res.render("register");
    res.sendStatus(200);
});

router.get("/profile", (req, res) => {
    // res.render("profile");
    res.sendStatus(200);
});

router.get("/login", (req, res) => {
    // res.render("login");
    res.sendStatus(200);
});
