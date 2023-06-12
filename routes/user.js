const crypto = require("crypto");

const JsonService = require("../echess/json_service");
const User = require("../echess/user")

const express = require("express");
const router = express.Router();

const nodemailer = require("nodemailer");

router.get("/login", function(request, response, next) {
    let context = {
        title: "Log in",
        form: {
            username: "",
            password: "",
        },
        error: ""
    };
    if (request.session.username?.length) {
        response.redirect("/");
    }
    else {
        response.render("login", context);
    }
});

router.post("/login", function(request, response, next) {

    const form = request.body;
    form.username = form.username.toLowerCase();

    let context = {
        title: "Log in",
        form: form,
        error: ""
    };

    const users = new JsonService(JsonService.USERDATA_FILEPATH);

    users.Find({username: form.username}).then(results => {
        if (results.length === 0) {
            return Promise.reject(new Error("Username not found."))
        }

        const user = User.FromObject(results[0]);

        return user.ComparePassword(form.password).then(matches => {
            if (!matches) {
                return Promise.reject(new Error("Password was invalid."));
            }
            request.session.username = user.username;
            users.Update({username: form.username}, {session_id: request.session.id}).catch(error => console.log(error));
            response.redirect("/");
        });
    }).catch(error => {
        console.log(error.message);
        context.error = error.message;
        response.render("login", context)
    })
});

router.get("/logout", function(request, response, next) {
    request.session.username = "";
    request.session.destroy(err => {
        if (err) {
            console.log(err)
        }
        response.redirect("/");
    })
});

router.get("/register", function(request, response, next) {
    let context = {
        title: "Register",
        form: {
            username: request.query.username || "",
            email: "",
            password: "",
            confirm_password: "",
        },
        errors: []
    };
    if (request.session.username?.length) {
        response.redirect("/");
    }
    else {
        response.render("register", context);
    }
});

router.post("/register", function(request, response, next) {

    const form = request.body;
    form.username = form.username.toLowerCase();

    let context = {
        title: "Register",
        form: form,
        errors: []
    };

    const user_svc = new JsonService(JsonService.USERDATA_FILEPATH);

    user_svc.Read().then((users => {
        if (users.findIndex(user => user.username === form.username) >= 0) {
            context.errors.push("This username already exists.");
        }

        if (form.password !== form.confirm_password) {
            context.errors.push("Password and confirmation do not match.");
        }

        if (form.username.length === 0) {
            context.errors.push("Username is required.")
        }

        if (form.password.length === 0) {
            context.errors.push("Password is required.");
        }

        if (form.confirm_password.length === 0) {
            context.errors.push("Password confirmation is required.");
        }

        if (context.errors.length) {
            return Promise.reject(new Error(`${context.errors.length} validation errors occurred.`));
        }

        return User.CreateHash(form.password).then(hash => {
            const user = new User(form.username, form.email, false, hash, request.session.id);

            return user_svc.Create(user).then(_ => {
                
                // I'm going to just disable this for now, because I don't have an email address set up
                // specifically for this website.
                // SendVerificationEmail(user);
                response.redirect("/");
            })
        })
    })).catch(error => {
        console.log(error.message);
        response.render("register", context)
    });
});

// should probably store this somewhere but this is good enough for now.
const verification_keys = new Map();

function SendVerificationEmail(user) {
    if (!user.email.length) {
        return;
    }

    // load the configuration from json
    const svc = new JsonService(JsonService.NODEMAILER_CONFIG_FILEPATH);

    svc.Read().then(results => {
        // json service is a lazy solution to store stuff, so it only supports lists..
        // i will switch to a better storage solution eventually.
        const config_options = results[0];

        // create a verification key
        const verification_key = crypto.randomUUID();

        // create the email message
        const transporter = nodemailer.createTransport(config_options);
        const mail_options = {
            from: config_options.auth.user,
            to: user.email,
            subject: `Hello ${user.username}`,
            html: EmailBody(user, "http://localhost:3000", verification_key)
        }
        
        // send the email
        transporter.sendMail(mail_options, function(error, info) {
            if (error) {
                console.log(error);
            }
            else {
                console.log(`Email sent: ${info.response}`);
            }
        })
    }).catch(console.error);
}

function EmailBody(user, host, verification_key) {
    const link = `${host}/user/verify/${verification_key}`;
    let html = 
        `<p>Hello ${user.username},</p>` +
        `<p>Please click the following link to verify your email address:</p>` +
        `<p><a href="${link}" target="_blank">${link}</a></p>`;
    return html;
}

module.exports = router;