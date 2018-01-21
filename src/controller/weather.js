'use strict'

function random(min, max) {
    return parseInt(Math.random() * (max - min) + min, 10);
}

async function getNow(ctx, next) {
    let forecast = []
    for (let i = 0; i < 24; i++) {
        forecast.push({
            temp: random(0, 30),
            weather: 'sunny',
        });
    }

    ctx.result = {
        now: {
            temp: random(0, 30),
            weather: 'sunny',
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
