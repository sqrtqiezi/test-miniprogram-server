'use strict'

const _ = require('../util/api');
const validate = _.validate;

async function getNow(ctx, next) {
    // 判断格式
    let query = validate(ctx.query, {
        latitude: { required: true, isNumber: true }, // 纬度
        longitude: { required: true, isNumber: true }, // 经度
    });

    ctx.result = [];
}

async function getFuture(ctx, next) {
    // 判断格式
    let query = validate(ctx.query, {
        latitude: { required: true, isNumber: true }, // 纬度
        longitude: { required: true, isNumber: true }, // 经度
    });

    ctx.result = [];
}

module.exports = {
    getNow,
    getFuture,
};
