'use strict'

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

const weatherArr = ['sunny', 'cloudy', 'overcast', 'lightrain', 'heavyrain', 'snow']
function randomWeather() {
    return weatherArr[random(0, 6)]
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
