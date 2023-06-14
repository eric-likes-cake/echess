const User = require("../echess/user")
const {SendVerificationEmail} = require("../echess/email_verification");
const RedisService = require("../echess/redis_service");

const crypto = require("crypto");
const express = require("express");
const router = express.Router();


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

    // redis database client
    const client = RedisService.GetClient("echess");

    User.LoadUserFromRedis({username: form.username}, client).then(user => {
        return user.ComparePassword(form.password);
    })
    .then(matches => {
        if (!matches) {
            return Promise.reject(new Error("Password was invalid."));
        }
        request.session.username = user.username;
        response.redirect("/");
    })
    .catch(error => {
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

    // redis database client
    const client = RedisService.GetClient("echess");

    client.EXISTS(`echess:userid:${form.username}`).then(result => {
        console.log(result);

        if (result) {
            context.errors.push("This username already exists.");
        }
    })
    .then(() => {
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
    
        return Promise.resolve();
    })
    .then(() => User.CreateHash(form.password))
    .then(hash => {
        const user = new User.User(crypto.randomUUID(), form.username, form.email, hash)
        return User.SaveUserToRedis(user, client).then(() => user);
    })
    .then(user => {
        request.session.username = user.username;
        // I'm going to just disable this for now, because I don't have an email address set up
        // specifically for this website.
        // SendVerificationEmail(user);
        response.redirect("/");
    }).catch(error => {
        console.log(error.message);
        response.render("register", context)
    });
});

module.exports = router;