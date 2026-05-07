import Mailgen from 'mailgen';
import nodemailer from 'nodemailer';

/**
 * mailGenContent
 * email
 * subject
 */
const sendMail = async (options) => {
    const mailGenerator = new Mailgen({
        theme: 'default',
        product: {
            name: 'Task Manager',
            link: 'http://taskmanagerlink.com',
        },
    });

    const emailTextual = mailGenerator.generatePlaintext(
        options.mailGenContent
    );

    const emailHtml = mailGenerator.generate(options.mailGenContent);

    const transporter = nodemailer.createTransport({
        host: process.env.MAIL_SMTP_HOST,
        port: process.env.MAIL_SMTP_PORT,
        auth: {
            user: process.env.MAIL_SMTP_USERNAME,
            pass: process.env.MAIL_SMTP_PASSWORD,
        },
    });

    const email = {
        from: 'mail.taskmanager@example.com',
        to: options.email,
        subject: options.subject,
        text: emailTextual,
        html: emailHtml,
    };

    try {
        await transporter.sendMail(email);
    } catch (error) {
        console.log(
            'Email service failed silently.Check whether you provided the correct credentials in env file'
        );
        console.log('Error while sending mail : ', error);
    }
};

const emailVerificationMailgenContent = (username, emailVerificationUrl) => {
    return {
        body: {
            name: username,
            intro: "Welcome to Project Management! We're excited to have you on board.",
            action: {
                instructions:
                    'To verify your email please click on the following button.',
                button: {
                    color: '#22BC66',
                    text: 'Verify your email',
                    link: emailVerificationUrl,
                },
            },
            outro: "Need help? or have any queries ? please reply to this email we'd love to help.",
        },
    };
};

const forgotPasswordResetMailgenContent = (username, passwordResetUrl) => {
    return {
        body: {
            name: username,
            intro: 'We have received a password reset request of your account.',
            action: {
                instructions:
                    'To reset your password please click the following button.',
                button: {
                    color: '#22BC66',
                    text: 'Reset Password',
                    link: passwordResetUrl,
                },
            },
            outro: "Need help? or have any queries ? please reply to this email we'd love to help.",
        },
    };
};

export {
    forgotPasswordResetMailgenContent,
    emailVerificationMailgenContent,
    sendMail,
};
