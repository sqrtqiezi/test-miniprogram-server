const _ = require('../util/api');
const { getWeather, getForecast } = require('../util/weather');

async function getNow(ctx, next) {
    let { city } = _.validate(ctx.query, {
        city: { required: true }
    });
    const weather = await getWeather(city);
    ctx.result = weather;
}

async function getFuture(ctx, next) {
    let { city } = _.validate(ctx.query, {
        city: { required: true }
    });
    const forecast = await getForecast(city);
    ctx.result = forecast;
}

module.exports = {
    getNow,
    getFuture,
};
