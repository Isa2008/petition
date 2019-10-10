const db = require("./utils/db.js");
const { hash, compare } = require("./utils/bc");
const express = require("express");
const app = (exports.app = express());
const hb = require("express-handlebars");
const cookieSession = require("cookie-session");
const csurf = require("csurf");

//// COOKIE SESSION
app.use(
    cookieSession({
        secret: `I'm always here.`,
        maxAge: 1000 * 60 * 60 * 24 * 14
    })
);

//// HANDLEBARS
app.engine("handlebars", hb());
app.set("view engine", "handlebars");

//// EXPRESS
app.use(express.static("./public"));

//// INFORMATION THAT USERS/SIGNERS SUBMIT
app.use(
    express.urlencoded({
        extended: false
    })
);

//// CSURF SECURITY
app.use(csurf());

app.use(function(req, res, next) {
    res.setHeader("X-Frame-Options", "DENY");
    res.locals.csrfToken = req.csrfToken();
    next();
});

//// FAVICON
app.use("/favicon.ico", (req, res) => {
    res.sendStatus(404);
});

//// LOCALHOST 8080 "/" TAKES REGISTER
app.get("/", (req, res) => {
    res.redirect("/register");
});

//// REGISTER
app.get("/register", (req, res) => {
    res.render("register");
});

//// POST REGISTER
app.post("/register", (req, res) => {
    if (req.body.password == "") {
        res.render("register", {
            error: "error"
        });
    } else {
        hash(req.body.password)
            .then(hashed => {
                // console.log("hash: ", hash);
                db.addRegister(
                    req.body.firstname,
                    req.body.lastname,
                    req.body.email,
                    hashed
                )
                    .then(id => {
                        //// STORE THE COOKIE
                        req.session.userId = id;
                        req.session.loggedIn = true;
                        res.redirect("/profile");
                    })
                    .catch(err => {
                        res.render("register", {
                            error: "error"
                        });
                    });
            })
            .catch(e => console.log(e));
    }
});

//// MANIFESTO
app.get("/manifesto", (req, res) => {
    res.render("manifesto");
});

//// PROFILE
app.get("/profile", (req, res) => {
    res.render("profile");
});

//// POST PROFILE
app.post("/profile", (req, res) => {
    let requrl;
    if (
        !req.body.homepage.startsWith("http://") ||
        !req.body.homepage.startsWith("https://")
    ) {
        requrl = "http://" + req.body.homepage;
    }
    if (requrl == "http://" || requrl == "https://") {
        requrl = null;
    }
    db.addProfile(req.body.age, req.body.city, requrl, req.session.userId).then(
        () => {
            res.redirect("/petition");
        }
    );
});

//// PETITION
app.get("/petition", (req, res) => {
    if (req.session.loggedIn) {
        if (req.session.signatureId) {
            res.redirect("/thanks");
        } else {
            res.render("petition", {
                layout: "main"
            });
        }
    } else {
        res.redirect("register");
    }
});

//// EDIT PROFILE
app.get("/edit", (req, res) => {
    db.getEdit(req.session.userId)
        .then(result => {
            res.render("edit", {
                firstname: result[0].firstname,
                lastname: result[0].lastname,
                email: result[0].email,
                age: result[0].age,
                city: result[0].city,
                url: result[0].url
            });
        })
        .catch(err => {
            res.redirect("/profile");
        });
});

//// POST EDIT PROFILE
app.post("/edit", (req, res) => {
    let requrl = req.body.homepage;
    let requrlNew;
    if (requrl === "") {
        requrlNew = requrl;
    } else {
        if (requrl.startsWith("http://") || requrl.startsWith("https://")) {
            requrlNew = requrl;
        } else {
            requrl = "http://" + requrl;
            requrlNew = requrl;
        }
    }
    if (req.body.age == "") {
        req.body.age = null;
    }
    if (!req.body.password) {
        Promise.all([
            db.updateUsers(
                req.session.userId,
                req.body.firstname,
                req.body.lastname,
                req.body.email
            ),
            db.updateUsersProfiles(
                req.session.userId,
                req.body.age,
                req.body.city,
                requrlNew
            )
        ])
            .then(() => {
                res.redirect("/petition");
            })
            .catch(error => {
                db.getEdit(req.session.userId).then(result => {
                    res.render("edit", {
                        firstname: result[0].firstname,
                        lastname: result[0].lastname,
                        email: result[0].email,
                        age: result[0].age,
                        city: result[0].city,
                        url: result[0].url,
                        error: "error"
                    });
                });
            });
    } else {
        hash(req.body.password).then(hash => {
            Promise.all([
                db.updateUsersHash(
                    req.session.userId,
                    req.body.firstname,
                    req.body.lastname,
                    req.body.email,
                    hash
                ),
                db.updateUsersProfiles(
                    req.session.userId,
                    req.body.age,
                    req.body.city,
                    requrlNew
                )
            ])
                .then(() => {
                    res.redirect("/petition");
                })
                .catch(error => {
                    db.getEdit(req.session.userId).then(result => {
                        res.render("edit", {
                            firstname: result[0].firstname,
                            lastname: result[0].lastname,
                            email: result[0].email,
                            age: result[0].age,
                            city: result[0].city,
                            url: result[0].url,
                            error: "error"
                        });
                    });
                });
        });
    }
});

//// POST PETITION
app.post("/petition", (req, res) => {
    db.addSignature(req.body.signature, req.session.userId)
        .then(id => {
            req.session.signatureId = id;
            res.redirect("/thanks");
        })
        .catch(err => {
            res.render("petition", {
                error: "error"
            });
        });
});

//// LOGIN
app.get("/login", (req, res) => {
    res.render("login");
});

//// POST LOGIN
app.post("/login", (req, res) => {
    db.getHashed(req.body.email)
        .then(result => {
            compare(req.body.password, result[0].password)
                .then(match => {
                    if (match) {
                        req.session.loggedIn = true;
                        req.session.userId = result[0].id;
                        req.session.signatureId = result[0].user_id;
                        if (req.session.signatureId) {
                            res.redirect("/thanks");
                        } else {
                            res.redirect("/petition");
                        }
                    } else {
                        res.render("login", {
                            error1: "error"
                        });
                    }
                })
                .catch(e => {
                    res.render("login", {
                        error: "error"
                    });
                });
        })
        .catch(e => {
            res.render("login", {
                error: "error"
            });
        });
});

//// THANKS
app.get("/thanks", (req, res) => {
    db.getSignature(req.session.userId)
        .then(signature => {
            res.render("thanks", {
                signature: signature[0].signature,
                layout: "main"
            });
        })
        .catch(err => {
            res.redirect("/petition");
        });
});

//// POST THANKS
app.post("/thanks", (req, res) => {
    db.deleteSignature(req.session.userId);
    req.session.signatureId = null;
    res.redirect("/petition");
});

//// SIGNERS
app.get("/signers", (req, res) => {
    let signers = [];
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        if (req.session.userId) {
            db.getSigners()
                .then(result => {
                    for (let i = 0; i < result.length; i++) {
                        signers.push({
                            firstname: result[i].firstname,
                            lastname: result[i].lastname,
                            age: result[i].age,
                            city: result[i].city,
                            url: result[i].url
                        });
                    }
                    return signers;
                })
                .then(signers => {
                    res.render("signers", {
                        layout: "main",
                        signers: signers,
                        firstname: signers.firstname,
                        lastname: signers.lastname
                    });
                });
        } else {
            res.redirect("/petition");
        }
    }
});

//// SIGNERS + CITY
app.get("/signers/:city", (req, res) => {
    let profilesCity = [];
    if (!req.session.signatureId) {
        res.redirect("/petition");
    } else {
        db.getProfilesCity(req.params.city)
            .then(result => {
                for (let i = 0; i < result.length; i++) {
                    profilesCity.push({
                        firstname: result[i].firstname,
                        lastname: result[i].lastname,
                        age: result[i].age,
                        url: result[i].url
                    });
                }
                return profilesCity;
            })
            .then(profilesCity => {
                res.render("city", {
                    layout: "main",
                    signers: profilesCity,
                    firstname: profilesCity.firstname,
                    lastname: profilesCity.lastname,
                    age: profilesCity.age,
                    url: profilesCity.url,
                    city: req.params.city
                });
            });
    }
});

//// LOGOUT
app.get("/logout", (req, res) => {
    req.session = null;
    res.redirect("/register");
});

//// LOCALHOST 8080
if (require.main === module) {
    app.listen(process.env.PORT || 8080, () =>
        console.log("My express class server is running!")
    );
}
