const Readable = require('stream').Readable;
const fs = require('fs');
const path = require('path');

const request = require('request');
const FeedParser = require('feedparser');
const iconv = require('iconv-lite');
const cheerio = require('cheerio');

const _ = require('./api');

let newsTypeArray = ['gn', 'gj', 'cj', 'yl', 'js', 'ty', 'other'];
const newsTypeMap = {
    // 国内
    gn: {
        url: 'http://news.qq.com/newsgn/rss_newsgn.xml',
        encoding: 'GBK'
    },
    // 国际
    gj: {
        url: 'http://news.qq.com/newsgj/rss_newswj.xml',
        encoding: 'utf8'
    },
    // 财经
    cj: {
        url: 'http://finance.qq.com/financenews/breaknews/rss_finance.xml',
        encoding: 'GBK'
    },
    // 娱乐
    yl: {
        url: 'http://ent.qq.com/movie/rss_movie.xml',
        encoding: 'utf8'
    },
    // 军事
    js: {
        url: 'http://news.qq.com/milite/rss_milit.xml',
        encoding: 'utf8'
    },
    // 体育
    ty: {
        url: 'http://sports.qq.com/rss_newssports.xml',
        encoding: 'utf8'
    },
    // 其他
    other: {
        url: 'http://news.qq.com/newssh/rss_newssh.xml',
        encoding: 'utf8'
    },
};

/**
 * 解析新闻内容
 */
function fetchContent($, contentNode) {
    let list = [];
    contentNode.children('p').each((index, p) => {
        p = $(p);

        let img = p.children('img');
        let strong = p.children('strong');
        let children = p.children();

        if (img.length === 1) {
            // 图片节点
            let src = img.attr('src');

            if (src) list.push({ type: 'image', src });
        } else if (strong.length === 1) {
            // 加粗
            let text = strong.text().trim();

            if (text) list.push({ type: 'strong', text });
        } else if (!children.length) {
            // 纯文本
            let text = p.text().trim();
            if (text) list.push({ type: 'p', text });
        }
    });

    return list;
}

/**
 * 拉取并解析新闻详情
 */
function fetchDetail(url) {
    return new Promise((resolve, reject) => {
        request({
            url,
            encoding: null
        }, (err, response, body) => {
            if (err) {
                reject(err);
            } else {
                let $ = cheerio.load(iconv.decode(body, 'GBK'));

                let source = $('.qq_content .qq_article .qq_bar .a_source').text() || $('.titBar .info .infoCol .where').text();

                let contentNode = $('#Cnt-Main-Article-QQ');
                let firstImage = contentNode.find('img').attr('src');
                let content = fetchContent($, contentNode);

                resolve({ source, firstImage, content });
            }
        });
    })
}

/**
 * 拉取并解析rss
 */
function fetchRss(url, encoding) {
    return new Promise((resolve, reject) => {
        try {
            let list = [];
            let feedparser = new FeedParser();

            request({
                url,
                encoding: null
            }, (err, response, body) => {
                if (err) throw err;

                let stream = new Readable();
                stream.push(iconv.decode(body, encoding));
                stream.push(null);

                stream.pipe(feedparser);
            });

            feedparser.on('error', err => {
                throw err;
            });
            feedparser.on('readable', function() {
                let item;
                while (item = this.read()) {
                    list.push(item);
                }
            });
            feedparser.on('end', () => {
                resolve(list)
            });
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * 写入文件缓存
 */
function saveToCache(type, news) {
    let cacheDir = path.join(__dirname, '../news-cache');

    // 创建文件缓存目录
    try {
        fs.accessSync(cacheDir);
    } catch (err) {
        fs.mkdirSync(cacheDir);
    }

    let cacheFile = path.join(__dirname, `../news-cache/${type}.js`);
    let lastCacheFile = path.join(__dirname, `../news-cache/${type}-last.js`);

    let cacheFileContent;
    try {
        cacheFileContent = fs.readFileSync(cacheFile, 'utf8');
    } catch (err) {
        cacheFileContent = 'module.exports = [];';
    }

    fs.writeFileSync(cacheFile, `module.exports = ${JSON.stringify(news)};`, 'utf8');
    fs.writeFileSync(lastCacheFile, cacheFileContent, 'utf8');
}

/**
 * 读出文件缓存
 */
function readFromCache(type) {
    let news;
    let lastNews;

    try {
        news = require(`../news-cache/${type}.js`);
    } catch (err) {
        news = [];
    }

    try {
        lastNews = require(`../news-cache/${type}-last.js`);
    } catch (err) {
        lastNews = [];
    }

    return { news, lastNews };
}

let lastUpdateTime = +new Date();
let newsMap = {};
let HOURS_6 = 1000 * 60 * 60 * 6; // 12小时
async function fetchNews(type) {
    let news = [];
    let { url, encoding } = newsTypeMap[type];

    let list = await fetchRss(url, encoding);
    for (let { title, date, link } of list) {
        let { source = '腾讯网', firstImage, content } = await fetchDetail(link);

        if (firstImage && content.length) {
            news.push({ id: _.getId(), title, date, source, firstImage, content });
        }
    }

    if (news && news.length) {
        saveToCache(type, news);
        newsMap[type] = news;
    }
}
async function getNews(type) {
    let now = +new Date();
    if (now - lastUpdateTime >= HOURS_6 || !newsMap[type]) {
        // 超过12小时，更新新闻列表
        for (let item of newsTypeArray) {
            fetchNews(item).then(res => {
                // ignore
            });
        }
    }

    return newsMap[type];
}

module.exports = {
    async getList(type) {
        let news = await getNews(type);

        if (!news || !news.length) {
            // 拉取不到时，从文件缓存读取
            let cache = readFromCache(type);
            news = cache.news.length ? cache.news : cache.lastNews.length ? cache.lastNews : [];
        }

        return news;
    },

    async get(id) {
        for (let type of newsTypeArray) {
            let news = newsMap[type] || [];
            
            // 尝试读文件缓存
            let cache = readFromCache(type);
            news = news.concat(cache.news, cache.lastNews);

            for (let item of news) {
                if (item.id === id) return item;
            }
        }

        return null;
    }
};
