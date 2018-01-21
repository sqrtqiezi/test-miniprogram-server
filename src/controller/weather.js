'use strict'

function random(min, max) {
    return Math.random() * (max - min) + min;
}

async function getNow(ctx, next) {
    let forecast = []
    for (let i = 0; i < 24; i++) {
        forecast.push({
            temp: random(0, 30),
            weaher: 'sunny',
        });
    }

    ctx.result = {
        now: {
            temp: random(0, 30),
            weaher: 'sunny',
        },
        forecast
    };
}

async function getFuture(ctx, next) {
    ctx.result = [];
}

module.exports = {
    getNow,
    getFuture,
};
