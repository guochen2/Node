var log4js = require('log4js');

log4js.configure({
    appenders: {
        default: {
            type: 'console'
        },
        info: {
            type: 'dateFile',
            filename: 'logs/info/info',
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        error: {
            type: 'dateFile',
            filename: 'logs/error/error',
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        },
        visit: {
            type: 'dateFile',
            filename: 'logs/visit/visit',
            pattern: '-yyyy-MM-dd.log',
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ['default'], level: 'all' },
        info: { appenders: ['info'], level: 'info' },
        error: { appenders: ['error'], level: 'error' },
        visit: { appenders: ['visit'], level: 'all' }
    }
});
var errLogger = log4js.getLogger('error', "error");
var infoLogger = log4js.getLogger('info', "info");
var visitLogger = log4js.getLogger('visit', "info");

exports.logger = {
    error: function (t) {
        errLogger.error(t);
        console.log("err", t);
    }, info: function (t) {
        infoLogger.info(t);
        console.log("info", t);
    }, visit: function (t) {
        visitLogger.info(t);
        console.log("visit", t);
    }
};