const fs = require('fs');
const { APP_ID } = require('../config/config');
const utils = require('./api');
const request = require('request');

function getToken(isForecast = true) {
    const now = new Date();
    const today = utils.format(now, 'yyyyMMdd');
    if (isForecast) {
        return today;
    }
    const hours = now.getHours();
    return `${today}${hours - (hours % 3)}`;
}

async function cache(key, callback) {
    let result;

    try {
        if (!fs.existsSync(`./data`) || !fs.statSync(`./data`).isDirectory()) {
            fs.mkdirSync(`./data`);
        }
        const realPath = `./data/${key}.json`;
        if (fs.existsSync(realPath)) {
            console.debug(`cache ${key} hitted`);
            result = JSON.parse(fs.readFileSync(realPath, 'utf8'));
        } else {
            console.debug(`cache ${key} missed`);
            result = await callback();
            fs.writeFileSync(realPath, JSON.stringify(result));
        }
    } catch (err) {
        console.error(err);
    }
    return result;
}

function formatForecastData(data) {
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
            maxTemp: Math.round(item.maxTemp),
            minTemp: Math.round(item.minTemp)
        });
    }
    return forecast;
}

function formatWeatherData(data) {
    const now = new Date();
    const today = utils.format(now, 'yyyy-MM-dd');
    const hours = now.getHours();
    const key = `${today} ${hours - (hours % 3)}:00:00`;

    const start = data.list.findIndex(item => {
        return item.dt_txt === key;
    });

    const forecast = [];
    for(let i = start; i < start + 8; i++) {
        const item = data.list[i];
        forecast.push({
            temp: Math.round(item.main.temp),
            weather: item.weather[0].description,
            id: i - start
        })
    }

    const weather = data.list[start];
    return {
        now: {
            temp: Math.round(weather.main.temp),
            weather: weather.weather[0].description
        },
        today: {
            minTemp: Math.round(weather.main.temp_min),
            maxTemp: Math.round(weather.main.temp_max)
        },
        forecast
    };
}

async function getData(key, url, format) {
    return cache(key, async () => {
        return new Promise((resolve, reject) => {
            console.debug('send request: ', url);
            request({ url, timeout: 1500 }, (err, response, body) => {
                if (err) {
                    console.error('request error!', err);
                    reject(err);
                } else {
                    const data = JSON.parse(body.toString());
                    const result = format(data);
                    resolve(result);
                }
            })
        });
    });
}

module.exports = {
    getForecast: async city => {
        const url = `http://api.openweathermap.org/data/2.5/forecast?q=${city},cn&mode=json&units=metric&appid=${APP_ID}`;
        const key = `${getToken()}.forecast.${city}`;
        return await getData(key, url, formatForecastData);
    }, 
    getWeather: async city => {
        const url = `http://api.openweathermap.org/data/2.5/forecast?q=${city},cn&mode=json&units=metric&appid=${APP_ID}`;
        const key = `${getToken(false)}.weather.${city}`;
        return await getData(key, url, formatWeatherData);
    }
}