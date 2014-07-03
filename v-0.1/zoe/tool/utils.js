define(function(require, exports, module) {

var _ = require('underscore');

var _rencode = /[&<>"']/g,
    _rdecode = /&(?:amp|lt|gt|quot|#39);/g,
    _rescape = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    _rtrim = /^\s+|\s+$/g,
    _rcamelCase = /-([\da-z])/gi,
    _rquery = /^[^?]*\?(.+)$/,
    _rparam = /^[^\[]*\[([^\]]+)\]/,
    _rjsonclear = /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    _rjsonchars = /^[\],:{}\s]*$/,
    _rjsonescape = /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,
    _rjsontokens = /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,
    _rjsonbraces = /(?:^|:|,)(?:\s*\[)+/g,

    _mencode = {
        '<'  : '&lt;',
        '>'  : '&gt;',
        '&'  : '&amp;',
        '"'  : '&quot;',
        '\'' : '&#39;'
    },

    _mdecode = {
        '&lt;'   : '<',
        '&gt;'   : '>',
        '&amp;'  : '&',
        '&quot;' : '"',
        '&#39;'  : '\''
    },

    _mescape = {
        '\b' : '\\b',
        '\t' : '\\t',
        '\n' : '\\n',
        '\f' : '\\f',
        '\r' : '\\r',
        '"'  : '\\"',
        '\\' : '\\\\'
    };

var _slice = function(arr, start, end) {
        return end != void 0
        ? [].slice.call(arr, start, end)
        : [].slice.call(arr, start);
    },

    _push = function(obj, key, value) {
        // 如果push到某一key值的value不至一个
        // 那么我们应该把他push到一个数组当中
        
        if (key in obj) {
            obj[key].length == +obj[key].length || (obj[key] = [obj[key]]);
            obj[key].push(value);
        } else {
            obj[key] = value;
        }

        return obj;
    },

    _trim = function(str) {
        if(str == null) return '';

        return String(str).replace(_rtrim, '');
    },

    _encode  = function(str) {
        if(str == null) return '';

        return String(str).replace(_rencode, function(match) {
            return _mencode[match];
        });
    },

    _decode = function(str) {
        if (str == null) return '';

        return String(str).replace(_rdecode, function(match) {
            return _mdecode[match];
        });
    },

    _escape = function(str) {
        if (str == null) return '';

        return String(str).replace(_rescape, function(match) {
            return _mescape[match] || '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
        });
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


_.extend(utils, {
    parseParam : function(str, separator) {
        var param = String(str).match(_rparam),
            key,
            value;

        if (param == null) return {};

        param = param.pop();
        separator = separator || ',';

        return _.reduce(param.split(separator), function(hash, pair) {
            if (pair.length == 0) return hash;

            pair = _escape(pair).split('=');

            key = pair.shift();
            key = _trim(key);

            value = pair.join('=');
            value = _trim(value);

            if (value.length != 0) {
                // 内部转换字符串到对应的值
                if (_.isFinite(value)) {
                    value = +value;
                } else {
                    value = value.match(/^true$|^false$/) ? value == 'true' : value;
                }
            } else {
                // 如果字符串为空，默认转换成true
                value = true;
            }

            return _push(hash, key, value);
        }, {});
    },

    parseQuery : function(str, separator) {
        var query = String(str).match(_rquery),
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

            return _push(hash, key, value);
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

            // 清洗字符串
            str = _trim(String(str).replace(_rjsonclear, function(a) {
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }));

            if (_rjsonchars.test(str
                .replace(_rjsonescape, '@')
                .replace(_rjsontokens, ']')
                .replace(_rjsonbraces, '')
            )) {
                res = (new Function('return ' + str))();

                return _.isFunction(reviver)
                ? walk('', {'': res}, reviver)
                : res;
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


// 定时器
_.extend(utils, {
    ticker : (function() {

        var win = window,

            settings = {
                USE_RAF : true,
                INTERVAL : 1000 / 60
            },

            tickers = [],

            requestAnimFrame,
            cancelAnimFrame,

            requestId;
        
        (function() {

            var vendors = ' ms moz webkit o'.split(' '),
                i = 0,
                len = vendors.length;

            if (settings.USE_RAF) {
                for (; i < len && !requestAnimFrame; i++) {
                    requestAnimFrame = win[vendors[i] + 'RequestAnimationFrame'];
                    cancelAnimFrame = win[vendors[i] + 'CancelAnimationFrame'] || win[vendors[i] + 'CancelRequestAnimationFrame'];
                }
            }

            requestAnimFrame || (requestAnimFrame = function(callback) {
                return win.setTimeout(callback, settings.INTERVAL);
            });

            cancelAnimFrame || (cancelAnimFrame = function(requestId) {
                return win.clearTimeout(requestId);
            });

        })();
        
        function tick() {
            var ticker,
                i = -1,
                len = tickers.length;
                
            while(++i < len) {
                ticker = tickers[i];
                ticker.callback.call(ticker.context);
            }
        }

        function start() {
            requestId = requestAnimFrame(arguments.callee);
            tick();
        }
        
        function stop() {
            cancelAnimFrame(requestId);
            requestId = void 0;
        }

        return {
            enter : function(callback, context) {
                // 如果该回调已经注册过，就不要重复注册了
                if (callback.tickId) return;

                callback.tickId = 'tick-' + utils.guid();
                tickers.push({
                    context : context || this,
                    callback : callback
                });

                if (tickers.length == 1) {
                    start();
                }

                return callback;
            },

            leave : function(callback) {
                var ticker,
                    i = -1,
                    len = tickers.length;

                if (!callback) {
                    // 清除ticker列队
                    tickers.length = 0;
                } else {
                    if (!callback.tickId) return;

                    while (++i < len) {
                        ticker = tickers[i];
                        if (callback.tickId === ticker.callback.tickId) {
                            callback = ticker.callback;
                            delete callback.tickId;

                            tickers.splice(i, 1);
                            
                            break;
                        }
                    }
                }
                
                if (!tickers.length) {
                    stop();
                }

                return callback;
            }
        };

    })()
});


// 数据缓存系统
_.extend(utils, {
    data : (function() {

        var hook = 'data-' + utils.guid(),

            cache = {},

            // 自增
            cacheId = 1;
            
        function cacheData(name, data) {
            var id = this[hook],
                cacheData,
                res;

            if (!id) {
                this[hook] = id = cacheId++;
            }

            if (!cache[id]) {
                cache[id] = {};
            }

            cacheData = cache[id];

            if (!_.isUndefined(data)) {
                cacheData[name] = data;
            }

            if (name) {
                res = cacheData[name];
            } else {
                res = cacheData;
            }

            return res;
        }

        function removeData(name) {
            var id = this[hook],
                cacheData,
                res;

            if (!id || !cache[id]) {
                return;
            }

            if (name) {
                cacheData = cache[id];

                if (cacheData && name in cacheData) {
                    delete cacheData[name];
                }

                if (!_.size(cacheData)) {
                    delete cache[id];
                }
            } else {
                delete cache[id];
            }
        }

        return function() {
            var context = arguments[0],
                remove = false,
                i = 1,
                args;

            if (_.isBoolean(context)) {
                remove = !context;
                context = arguments[1];
                i = 2;
            }

            args = _slice(arguments, i);

            if (!remove) {
                return cacheData.apply(context, args);
            } else {
                return removeData.apply(context, args);
            }
        }

    })()
});


// 事件系统
_.extend(utils, {
    Event : (function() {

        var settings = {
                CACHE : 'events'
            };

        function Event(context) {
            utils.data(this, settings.CACHE, {});
            this.context = context;
        }

        Event.prototype = {
            on : function(name, callback) {
                var events = utils.data(this, settings.CACHE),
                    handlers = events[name] || (events[name] = []);

                if (callback.eventId) return;

                callback.eventId = 'event-' + utils.guid();
                handlers.push({
                    context : this.context || this,
                    callback : callback
                });

                return callback;
            },

            off : function(name, callback) {
                var events = utils.data(this, settings.CACHE),
                    handlers = events[name],
                    handler, 
                    i = -1,
                    len;

                if (!handlers) return;
                len = handlers.length;

                if (!callback) {
                    handlers.length = 0;
                } else {
                    if (!callback.eventId) return;

                    while (++i < len) {
                        handler = handlers[i];

                        if (callback.eventId === handler.callback.eventId) {
                            callback = handler.callback;
                            delete callback.eventId;

                            handlers.splice(i, 1);
                            
                            break;
                        }
                    }
                }

                if (handlers.length == 0) {
                    delete events[name];
                }

                return callback;
            },

            emit : function(name) {
                var events = utils.data(this, settings.CACHE),
                    handlers = events[name],
                    handler,
                    i = -1,
                    len,
                    args = _slice(arguments, 1);

                if (!handlers) return;
                len = handlers.length;

                while (++i < len) {
                    handler = handlers[i];
                    handler.callback.apply(handler.context, args);
                }
            }
        };

        Event.create = function(context) {
            return new Event(context);
        };

        Event.global = new Event(utils);

        _.each('on off emit'.split(' '), function(value) {
            Event.create[value] = function() {
                Event.global[value].apply(Event.global, arguments);
            };
        });

        return Event.create;

    })()
});


// 列队系统
_.extend(utils, {
    Queue : (function() {

        var settings = {
                CACHE : 'queues'
            };

        function Queue(context) {
            utils.data(this, settings.CACHE, {});
            this.context = context;
        }

        Queue.prototype = {
            add : function(name, callback) {
                var queues = utils.data(this, settings.CACHE),
                    players = queues[name] || (queues[name] = []);

                if (_.isArray(callback)) {
                    queues[name] = _.clone(callback);
                } else {
                    players.push({
                        context : this.context || this,
                        callback : callback
                    });
                }
            },

            next : function(name) {
                var queues = utils.data(this, settings.CACHE),
                    players = queues[name],
                    player;

                if (!players) return;
                player = players.shift();

                if (player) {
                    player.callback.call(player.context);
                }

                if (!players.length) {
                    delete queues[name];
                }
            },

            clear : function(name) {
                var queues = utils.data(this, settings.CACHE),
                    players = queues[name];

                players && (delete queues[name]);
            },

            size : function(name) {
                var queues = utils.data(this, settings.CACHE),
                    players = queues[name];

                return players ? players.length : 0;
            }
        };

        Queue.create = function(context) {
            return new Queue(context);
        };

        Queue.global = new Queue(utils);

        _.each('add next clear size'.split(' '), function(value) {
            Queue.create[value] = function() {
                Queue.global[value].apply(Queue.global, arguments);
            };
        });

        return Queue.create;

    })()
});


// 有限状态机系统
_.extend(utils, {
    Fsm : (function(settings) {

        var settings = {
                ASYN_QUEUEU : 'transit'
            };

        function Fsm(initial, context) {
            // 缓存状态
            this.cache = {length : 0};

            // 一个状态到另个状态的映射
            this.map = {};

            this.event = Z.Event(context);
            this.queue = Z.Queue(this);

            this.isSync = true;

            // 在状态机内部，我们使用index标记状态的名字
            this.index = this.cacheState(initial || 'none');
        }

        Fsm.prototype = {
            cacheState : function(state) {
                var cache = this.cache,
                    index;

                if (_.isUndefined(cache[state])) {
                    index = cache.length++;

                    // 双向引用
                    cache[state] = index;
                    cache[index] = state;
                } else {
                    index = cache[state];
                }

                return index;
            },

            getState : function(index) {
                return this.cache[_.isUndefined(index) ? this.index : index];
            },

            add : function(action, transit) {
                var prev = this.cacheState(transit.prev || 'none'),
                    next = this.cacheState(transit.next),
                    map;

                map = this.map[action] || (this.map[action] = []);
                map[prev] = next;
            },

            on : function(event, callback) {
                return this.event.on(event, callback);
            },

            off : function(event, callback) {
                return this.event.off(event, callback);
            },

            fire : function(action, asyn) {
                var map = this.map[action],
                    next = {},
                    state;

                // 如果没有同步，则忽略这次调用
                if (!this.isSync) return;

                state = this.getState();

                next.index = map[this.index];
                next.state = this.getState(next.index);

                if (_.isUndefined(next.index)) {
                    this.event.emit('error', 'State Transition Error!');
                    return;
                }

                this.queue.add(settings.ASYN_QUEUEU, function() {
                    this.event.emit('leave:' + state, action);

                    this.isSync = false;
                    if (asyn) return
                        
                    this.queue.next(settings.ASYN_QUEUEU);
                });

                this.queue.add(settings.ASYN_QUEUEU, function() {
                    this.event.emit('enter:' + next.state, action);

                    this.index = next.index;
                    this.isSync = true;

                    this.queue.next(settings.ASYN_QUEUEU);
                });

                this.queue.next(settings.ASYN_QUEUEU);
            },

            sync : function() {
                if (this.isSync) return;
                this.queue.next(settings.ASYN_QUEUEU);
            }
        };

        Fsm.create = function(options, context) {
            var machine = new Fsm(options.initial, context);

            _each(options.transits, function(transit) {
                machine.add(transit.action, transit);
            });

            _each(options.events, function(event) {
                machine.on(event.name, event.callback);
            });

            return machine;
        };

        return Fsm.create;

    })()
});


module.exports = utils;

});