define(function(require, exports, module) {

var _ = require('underscore');


var slice = function(arr, start, end) {
        return end != void 0
        ? [].slice.call(arr, start, end)
        : [].slice.call(arr, start);
    },

    push = function(obj, key, value) {
        // 如果push到某一key值的value不至一个
        // 那么我们应该把他push到一个数组当中
        
        if (key in obj) {
            obj[key].length == +obj[key].length || (obj[key] = [obj[key]]);
            obj[key].push(value);
        } else {
            obj[key] = value;
        }

        return obj;
    };


var utils = {
    version : '0.0.1',

    guid : function() {
        var d = new Date().getTime(), r;

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);

            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    }
};


var rtrim = /^\s+|\s+$/g,
    rencode = /[&<>"']/g,
    rdecode = /&(?:amp|lt|gt|quot|#39);/g,
    rescape = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    rcamelCase = /-([\da-z])/gi,

    mencode = {
        '<'  : '&lt;',
        '>'  : '&gt;',
        '&'  : '&amp;',
        '"'  : '&quot;',
        '\'' : '&#39;'
    },

    mdecode = {
        '&lt;'   : '<',
        '&gt;'   : '>',
        '&amp;'  : '&',
        '&quot;' : '"',
        '&#39;'  : '\''
    },

    mescape = {
        '\b' : '\\b',
        '\t' : '\\t',
        '\n' : '\\n',
        '\f' : '\\f',
        '\r' : '\\r',
        '"'  : '\\"',
        '\\' : '\\\\'
    };

_.extend(utils, {
    trim : function(str) {
        if(str == null) return '';

        return String(str).replace(rtrim, '');
    },

    encode : function(str) {
        if(str == null) return '';

        return String(str).replace(rencode, function(match) {
            return mencode[match];
        });
    },

    decode : function(str) {
        if (str == null) return '';

        return String(str).replace(rdecode, function(match) {
            return mdecode[match];
        });
    },

    escape : function(str) {
        if (str == null) return '';

        return String(str).replace(rescape, function(match) {
            return mescape[match] || '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
        });
    }
});


var rquery = /^[^?]*\?(.+)$/,
    rjsonclear = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    rjsonchars = /^[\],:{}\s]*$/,
    rjsonescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    rjsontokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    rjsonbraces = /(?:^|:|,)(?:\s*\[)+/g;

_.extend(utils, {
    parseQuery : function(str, separator) {
        var query = String(str).match(rquery),
            key,
            value;

        if (query == null) return {};

        query = query.pop();
        separator = separator || '&';

        return _.reduce(query.split(separator), function(hash, pair) {
            if (pair.indexOf('=') == -1) return hash;

            pair = decodeURIComponent(pair).split('=');

            key = pair.shift();

            // 如果query中某个变量值包含等号
            // 我们应该重新组合起来
            value = pair.join('=');

            if (value != void 0) {
                value = value.replace('+', ' ');
            }

            return push(hash, key, value);
        }, {});
    },

    parseJSON : (function() {

        // 参考: http://json.org/json2.js

        function walk(key, list, reviver){
            var value = list[key];

            if (value && _.isObject(value)) {
                _.each(value, function(k, v, value) {
                    v = walk(k, value, reviver);
                    if (v != void 0) {
                        value[k] = v;
                    } else {
                        delete value[k];
                    }
                })
            }

            return reviver.call(list, key, value);
        }

        return function(str, reviver) {
            var res;

            // 如果浏览器支持JSON对象
            // 那么应该直接调用
            if (JSON && _.isFunction(JSON.parse)) {
                return JSON.parse(str);
            }

            if (str != null) {
                // 清洗字符串
                str = String(str).replace(rjsonclear, function(a) {
                    return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                }).replace(rtrim, '');

                if (rjsonchars.test(str
                    .replace(rjsonescape, '@')
                    .replace(rjsontokens, ']')
                    .replace(rjsonbraces, '')
                )) {
                    res = (new Function('return ' + str))();

                    return _.isFunction(reviver)
                    ? walk('', {'': res}, reviver)
                    : res;
                }
            }

            return [];
        }

    })(),

    parseHash : function(href) {
        // 提取href中的hash部分
        // 因为动态生成的anchor标签（通过innerHTML）
        // 其hash属性为空

        var hash = href;

        if(!hash || hash.indexOf('#') == -1) return '';
        hash = hash.split('#').pop();

        return hash;
    }
});


module.exports = utils;

});