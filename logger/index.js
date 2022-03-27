import winston from "winston";

let logger =  winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp({
            format: 'YYYY-MM-DD HH:mm:ss'
        }),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.File({filename: process.cwd() + '/logs/debug.log', level: 'debug'}),
        new winston.transports.File({filename: process.cwd() + '/logs/error.log', level: 'error'}),
        new winston.transports.File({filename: process.cwd() + '/logs/combined.log'}),
    ],
});

export default logger;
