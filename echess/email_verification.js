const crypto = require("crypto");
const nodemailer = require("nodemailer");
const JsonService = require("./json_service");

const verification_keys = new Map();

function SendVerificationEmail(user) {
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
                verification_keys.set(verification_key, user.email);
            }
        })
    }).catch(console.error);
}

function GetEmail(key) {
    return verification_keys.get(key);
}

function VerifyEmail(key) {
    const email = verification_keys.get(key);
    const verified = true;
    verification_keys.delete(key);

    // const svc = new JsonService(JsonService.USERDATA_FILEPATH);
    // return svc.Update({email}, {verified}).catch(console.error);
}

function EmailBody(user, host, key) {
    const link = `${host}/user/verify/${key}`;
    let html = 
        `<p>Hello ${user.username},</p>` +
        `<p>Please click the following link to verify your email address:</p>` +
        `<p><a href="${link}" target="_blank">${link}</a></p>`;
    return html;
}

module.exports = {
    SendVerificationEmail,
    GetEmail,
    VerifyEmail
}