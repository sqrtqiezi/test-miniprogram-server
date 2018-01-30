'use strict'

function random(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function randomTemp(weather, minA, minB, maxA, maxB) {
    let temp1 = random(minA, minB);
    let temp2 = random(maxA, maxB);
    if (temp1 === temp2) temp2 += 3;

    let minTemp = Math.min(temp1, temp2);
    let maxTemp = Math.max(temp1, temp2);
    return {
        weather,
        temp: random(minTemp, maxTemp + 1),
        minTemp,
        maxTemp, 
    };
}

function randomWeather() {
    let r = random(0, 100); // 0 - 99

    if (r >= 0 && r < 30) {
        return randomTemp('sunny', 0, 10, 10, 25); // 30%
    } else if (r >= 30 && r < 55) {
        return randomTemp('cloudy', -5, 10, 5, 20); // 25%
    } else if (r >= 55 && r < 75) {
        return randomTemp('overcast', -5, 10, 5, 20); // 20%
    } else if (r >= 75 && r < 90) {
        return randomTemp('lightrain', -5, 5, 5, 15); // 15%
    } else if (r >= 90 && r < 95) {
        return randomTemp('heavyrain', -10, 5, 5, 10); // 5%
    } else if (r >= 95 && r < 100) {
        return randomTemp('snow', -20, 0, -10, 5); // 5%
    }
}

let lastUpdateTodayTime = +new Date();
let today = randomWeather();
function getTodayWeather() {
    let now = +new Date();
    if (now - lastUpdateTodayTime >= 180000) {
        // 超过3min需要更新
        lastUpdateTodayTime = now;
        today = randomWeather();
    }

    return today;
}

let lastUpdateForecastTime = +new Date();
let forecast = generateForecastWeather();
function generateForecastWeather() {
    let forecast = [];
    for (let i = 1; i < 8; i++) {
        let { weather, temp } = randomWeather()

        forecast.push({ weather, temp });
    }
    return forecast;
}
function getForecastWeather() {
    let now = +new Date();
    if (now - lastUpdateForecastTime >= 60000) {
        // 超过1min需要更新
        lastUpdateForecastTime = now;
        forecast = generateForecastWeather();
    }

    return [].concat(forecast);
}

let lastUpdateFutureTime = +new Date();
let future = generateFutureWeather();
function generateFutureWeather() {
    let future = [];
    for (let i = 1; i < 7; i++) {
        let { weather, minTemp, maxTemp } = randomWeather()

        future.push({ weather, minTemp, maxTemp });
    }
    return future;
}
function getFutureWeather() {
    let now = +new Date();
    if (now - lastUpdateFutureTime >= 60000) {
        // 超过1min需要更新
        lastUpdateFutureTime = now;
        future = generateFutureWeather();
    }

    return [].concat(future);
}

async function getNow(ctx, next) {
    // 今天
    let { weather, temp, minTemp, maxTemp } = getTodayWeather();

    // 未来24小时
    let forecast = getForecastWeather();
    forecast.unshift({ weather, temp });

    ctx.result = {
        now: {
            temp,
            weather,
        },
        today: {
            minTemp,
            maxTemp,
        },
        forecast
    };
}

async function getFuture(ctx, next) {
    // 今天
    let { weather, temp, minTemp, maxTemp } = getTodayWeather();

    let future = generateFutureWeather();
    future.unshift({ weather, minTemp, maxTemp });

    ctx.result = future;
}

module.exports = {
    getNow,
    getFuture,
};
