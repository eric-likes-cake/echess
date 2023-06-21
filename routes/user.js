const User = require("../echess/user")
const {SendVerificationEmail} = require("../echess/email_verification");

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

    let context = {
        title: "Log in",
        form: form,
        error: "",
    };

    // reference object for the promises
    const ref = {
        user: new User.User()
    };

    const svc = new User.RedisService(request.app.locals.client);

    svc.LoadUser({username: form.username}).then(user => {
        ref.user = user;
        return user.ComparePassword(form.password)
    })
    .then(matches => {
        if (!matches) {
            return Promise.reject(new Error("Password was invalid."));
        }
        request.session.username = ref.user.username;
        request.session.user_id = ref.user.id;
        return svc.IsAdmin(ref.user.id);
    })
    .then(admin => {
        console.log(admin);
        request.session.admin = admin
        response.redirect("/");
    })
    .catch(error => {
        console.log(error.message);
        context.error = error.message;
        response.render("login", context)
    })
});

router.param("id", (request, response, next, id) => {
    request.id = id
    next();
});

router.get("/user/:id", function(request, response, next) {

    if (!request.session.admin) {
        response.status(401).send("401: You are not authorized to make this request.")
        return;
    }

    const svc = new User.RedisService(request.app.locals.client);

    svc.LoadUser({id: request.id})
        .then(user => response.json(user))
        .catch(error => response.send(error.message));
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

    let context = {
        title: "Register",
        form: form,
        errors: []
    };

    const svc = new User.RedisService(request.app.locals.client);

    svc.UsernameExists(form.username).then(result => {
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
        return svc.SaveUser(user).then(() => user);
    })
    .then(user => {
        request.session.username = user.username;
        // I'm going to just disable this for now, because I don't have an email address set up
        // specifically for this website.
        // SendVerificationEmail(user, request.app.locals.client);
        response.redirect("/");
    }).catch(error => {
        console.log(error.message);
        response.render("register", context)
    });
});

module.exports = router;
