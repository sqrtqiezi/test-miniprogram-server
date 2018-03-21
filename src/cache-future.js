const config = require('./config/config');
const { getWeather, getForecast } = require('./util/weather');

const promises = [];
for (let city of config.CACHE_LIST) {
    promises.push(getForecast(city));
}

Promise.all(promises)
    .then(() => console.log('cache future all done'))
    .catch(err => console.error(err));