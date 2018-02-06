const _ = require('../util/api');
const rss = require('../util/rss');

async function getList(ctx, next) {
    let { type } = _.validate(ctx.query, {
        type: { required: true, value: /^(gn|gj|cj|yl|js|ty|other)$/g }
    });

    let news = await rss.getList(type);
    news = news.map(item => {
        let { id, title, date, source, firstImage } = item;

        return { id, title, date, source, firstImage };
    });

    ctx.result = news;
}

async function get(ctx, next) {
    let { id } = _.validate(ctx.query, {
        id: { required: true, isNumber: true }
    });

    let news = await rss.get(id);
    if (!news) {
        throw new Error('news not found');
    } else {
        ctx.result = news;
    }
}

module.exports = {
    getList,
    get,
};