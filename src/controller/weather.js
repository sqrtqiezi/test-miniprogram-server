'use strict'

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

const weatherArr = ['sunny', 'cloudy', 'overcast', 'lightrain', 'heavyrain', 'snow'];
function randomWeather() {
    return weatherArr[random(0, 6)]
}

async function getNow(ctx, next) {
    let forecast = [];
    for (let i = 0; i < 8; i++) {
        forecast.push({
            temp: random(-10, 20),
            weather: randomWeather(),
        });
    }

    ctx.result = {
        now: {
            temp: forecast[0].temp,
            weather: forecast[0].weather,
        },
        forecast
    };
}

async function getFuture(ctx, next) {
    let future = [];
    for (let i = 0; i < 7; i++) {
        let temp1 = random(-10, 20);
        let temp2 = random(-10, 20);

        if (temp1 === temp2) temp2 += 3;

        future.push({
            minTemp: Math.min(temp1, temp2),
            maxTemp: Math.max(temp1, temp2),
            weather: randomWeather(),
        });
    }

    ctx.result = future;
}

module.exports = {
    getNow,
    getFuture,
};
