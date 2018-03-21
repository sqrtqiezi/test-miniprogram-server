const config = require('./config/config');
const { getWeather, getForecast } = require('./util/weather');

const promises = [];
for (let city of config.CACHE_LIST) {
    promises.push(getWeather(city));
}

Promise.all(promises)
    .then(() => console.log('cache current weather all done'))
    .catch(err => console.error(err));