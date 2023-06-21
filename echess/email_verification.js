const crypto = require("crypto");
const nodemailer = require("nodemailer");

function SendVerificationEmail(user, client, config) {
    if (!user.email.length) {
        return;
    }

    if (config.email_enabled) {
        console.log("Email enabled")
    }
    else {
        console.log("Email disabled");
        return;
    }

    // create a verification key
    const verification_key = crypto.randomUUID();

    // create the email message
    const transporter = nodemailer.createTransport(config.nodemailer_config);
    const mail_options = {
        from: config.nodemailer_config.auth.user,
        to: user.email,
        subject: `Hello ${user.username}`,
        html: EmailBody(user, config.website_url, verification_key)
    }

    // send the email
    transporter.sendMail(mail_options, function(error, info) {
        if (error) {
            console.log(error);
        }
        else {
            console.log(`Email sent: ${info.response}`);
            const svc = new RedisService(client);
            svc.SetVerificationToken(verification_key, user.email);
        }
    })
}

function EmailBody(user, origin, key) {
    const link = `${origin}/user/verify/${key}`;
    let html = 
        `<p>Hello ${user.username},</p>` +
        `<p>Please click the following link to verify your email address:</p>` +
        `<p><a href="${link}" target="_blank">${link}</a></p>`;
    return html;
}

class RedisService {
    constructor(client) {
        this.client = client;
    }

    SetVerificationToken(token, email) {
        return this.client.SET(`echess:email_token:${token}`, email);
    }

    GetEmailFromToken(token) {
        return this.client.GET(`echess:email_token:${token}`);
    }

    VerifyEmail(email) {
        return this.client.SADD("echess:verified_email", email);
    }

    RemoveEmail(email) {
        return this.client.SREM("echess:verified_email", email);
    }

    EmailVerified(email) {
        return this.client.SISMEMBER("echess:verified_email", email);
    }
}

module.exports = {
    SendVerificationEmail,
    RedisService
}