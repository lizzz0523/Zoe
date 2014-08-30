// 数据缓存系统
// by lizzz (http://lizzz0523.github.io/)

/*
 * todo list
 *
 * 1、添加数据堆栈，已经数据量阈值，一旦数据量过多导致堆栈溢出，先删去那些不常用的数据
 * 2、数据补偿，数据被溢出的时候，当数据再次被访问的时候，给出补偿方案
 * 3、内存泄露主要来自于dom上绑定的数据，在dom废弃时无法释放，而对于一般的对象不用刻意把数据保存在cache系统中
 *
 */

define(function(require, exports, module) {

var _ = require('underscore');


var hook = '_cache' + _.uniqueId(),
    
    cache = [],
    // 自增
    cacheId = 1;
    
function cacheData(key, value) {
    var id = this[hook],
        cacheData;

    if (!id) {
        this[hook] = id = cacheId++;
    }

    if (!cache[id]) {
        cache[id] = {};
    }

    cacheData = cache[id];

    if (!_.isUndefined(value)) {
        cacheData[key] = value;
    }

    if (key) {
        value = cacheData[key];
    } else {
        value = cacheData;
    }

    return value;
}

function removeData(key) {
    var id = this[hook],
        cacheData;

    if (!id || !cache[id]) {
        return;
    }

    if (key) {
        cacheData = cache[id];

        if (cacheData && key in cacheData) {
            delete cacheData[key];
        }

        if (!_.size(cacheData)) {
            delete cache[id];
        }
    } else {
        delete cache[id];
    }
}


module.exports = {
    get : function(context, key) {
        return cacheData.call(context, key);
    },

    set : function(context, key, value) {
        return cacheData.call(context, key, value);
    },

    remove : function(context, key) {
        removeData.call(context, key);
    }
};

});