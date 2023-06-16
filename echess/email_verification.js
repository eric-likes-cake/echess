const crypto = require("crypto");
const nodemailer = require("nodemailer");
const JsonService = require("./json_service");


function SendVerificationEmail(user, client) {
    if (!user.email.length) {
        return;
    }

    // load the configuration from json
    JsonService.LoadJsonFromDisk(JsonService.NODEMAILER_CONFIG_FILEPATH).then(config_options => {

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
                const svc = new RedisService(client);
                svc.SetVerificationToken(verification_key, user.email);
            }
        })
    }).catch(console.error);
}

function EmailBody(user, host, key) {
    const link = `${host}/user/verify/${key}`;
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