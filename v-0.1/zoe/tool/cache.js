// 数据缓存系统
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

var _ = require('underscore');


var hook = '_cache' + _.uniqueId(),
    // 自增
    cacheId = 1,
    
    cache = [];
    
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