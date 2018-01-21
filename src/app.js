'use strict';

const path = require('path');

const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const router = require('koa-router')()

const controllerConfig = require('./config/controller');

let app = new Koa();
app.proxy = true;

// bodyParser
app.use(bodyParser());

// merge parameter
app.use(async (ctx, next) => {
    Object.assign(ctx.query, ctx.request.body, ctx.request.files, ctx.request.fields);

    await next();
});

// xhr or view error
app.use(async (ctx, next) => {
    try {
        await next();

        if (ctx.result) {
            // 组装正确返回结果
            ctx.body = {
                code: 200,
                message: ctx.msg || 'success',
                result: ctx.result || {}
            };
        }
    } catch (err) {
        console.error(err.stack);

        ctx.body = {
            code: err.statusCode || err.status || 500,
            message: err.message || err.name || 'unknown error'
        };
    }
});

// cors
app.use(async (ctx, next) => {
    ctx.set('Access-Control-Allow-Origin', '*');
    await next();
});

// controller
let controllerPath = path.join(__dirname, './controller');

Object.keys(controllerConfig).forEach(key => {
    let actions = controllerConfig[key];
    actions = Array.isArray(actions) ? actions : [actions];

    key = key.split(' ');
    let method = key[0].toLowerCase();
    let url = key[1];

    let dirPath = controllerPath;

    actions.forEach(action => {
        if (typeof action === 'string') {
            action = action.split('.');
            action = require(path.join(dirPath, action[0]))[action[1]];
        }

        router[method](url, action);
    })
});
app.use(router.routes());

// error handle
app.on('error', (err, ctx) => {
    console.error(err.stack);
});

app.listen(3000);
console.log('running on port:' + 3000);

module.exports = app;
