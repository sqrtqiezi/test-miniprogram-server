const _ = require('../util/api');
const request = require('request');
const { APP_ID } = require('../config/config');
const utils = require('../util/api');

function formatForecastData(data) {
    const today = utils.format(new Date(), 'yyyy-MM-dd');
    const map = new Map();

    data.list.forEach(forecast => {
        const key = forecast.dt_txt.substr(0, 10);
        
        if (!map.has(key)) {
            map.set(key, {
                temps   : [forecast.main.temp],
                weathers: [forecast.weather[0].description],
                maxTemp : forecast.main.temp_max,
                minTemp : forecast.main.temp_min
            });
        } else {
            const item = map.get(key);

            item.temps.push(forecast.main.temp);
            item.weathers.push(forecast.weather[0].description);
            item.maxTemp = Math.max(item.maxTemp, forecast.main.temp_max);
            item.minTemp = Math.min(item.minTemp, forecast.main.temp_min);
        }
    });
    
    const forecast = [];
    const keys = Array.from(map.keys()).sort();
    for(let i = 0; i < keys.length; i++) {
        const item = map.get(keys[i]);

        const temp = item.temps.reduce((sum, temp) => {
            return sum + temp;
        }, 0) / item.temps.length;

        forecast.push({
            id: i,
            weather: item.weathers[0],
            temp: Math.round(temp),
            maxTemp: Math.round(item.maxTemp),
            minTemp: Math.round(item.minTemp)
        });
    }
    return forecast;
}

function formatWeatherData(data) {
    return {
        temp: data.main.temp,
        weather: data.weather[0].description
    }
}

async function getForecast(city) {
    return new Promise((resolve, reject) => {
        request({
            url: `http://api.openweathermap.org/data/2.5/forecast?q=${city},cn&mode=json&units=metric&appid=${APP_ID}`
        }, (err, response, body) => {
            if (err) {
                reject(err);
            } else {
                const data = JSON.parse(body.toString());
                const result = formatForecastData(data);
                resolve(result);
            }
        })
    });
}

async function getWeather(city) {
    return new Promise((resolve, reject) => {
        request({
            url: `http://api.openweathermap.org/data/2.5/weather?q=${city},cn&mode=json&units=metric&appid=${APP_ID}`
        }, (err, response, body) => {
            if (err) {
                reject(err);
            } else {
                const data = JSON.parse(body.toString());
                const result = formatWeatherData(data);
                resolve(result);
            }
        })
    });
}

async function getNow(ctx, next) {
    let { city } = _.validate(ctx.query, {
        city: { required: true }
    });
    try {
        const weatherPromise = getWeather(city);
        const forecastPromise = getForecast(city);

        const now = await weatherPromise;
        const forecast = await forecastPromise;

        ctx.result = {
            now,
            today: {
                minTemp: forecast[0].minTemp,
                maxTemp: forecast[0].maxTemp
            },
            forecast: forecast.map(({ weather, temp, id}) => ({
                weather, temp, id
            }))
        }
    } catch (err) {
        console.error(err);
        //TODO:此处应该返回错误信息
    }
}

async function getFuture(ctx, next) {
    let { city } = _.validate(ctx.query, {
        city: { required: true }
    });
    try {
        const forecast = await getForecast(city);
        ctx.result = forecast.map(({ weather, maxTemp, minTemp, id }) => ({
            weather, maxTemp, minTemp, id
        }));
    } catch (err) {
        console.error(err);
        //TODO:此处应该返回错误信息
    }
}

module.exports = {
    getNow,
    getFuture,
};
