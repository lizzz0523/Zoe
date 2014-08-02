/*
    by lizzz(https://github.com/lizzz0523)
*/

var Zoe = (function(root) {

"use strict";

var _,

    _rchar = {
        encode     : /[&<>"']/g,

        decode     : /&(?:amp|lt|gt|quot|#39);/g,

        escape     : /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,

        trim       : /^\s+|\s+$/g,

        camelCase  : /-([\da-z])/gi,

        query      : /^[^?]*\?(.+)$/,

        param      : /^[^\[]*\[([^\]]+)\]/,

        jsonclear  : /[\u0000\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,

        jsonchars  : /^[\],:{}\s]*$/,

        jsonescape : /\\(?:["\\\/bfnrt]|u[0-9a-fA-F]{4})/g,

        jsontokens : /"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,

        jsonbraces : /(?:^|:|,)(?:\s*\[)+/g
    },

    _mChar = {
        encode : {
            '<'  : '&lt;',
            '>'  : '&gt;',
            '&'  : '&amp;',
            '"'  : '&quot;',
            '\'' : '&#39;'
        },

        decode : {
            '&lt;'   : '<',
            '&gt;'   : '>',
            '&amp;'  : '&',
            '&quot;' : '"',
            '&#39;'  : '\''
        },

        escape : {
            '\b' : '\\b',
            '\t' : '\\t',
            '\n' : '\\n',
            '\f' : '\\f',
            '\r' : '\\r',
            '"'  : '\\"',
            '\\' : '\\\\'
        }
    };

var _slice = function(arr, start, end) {
        return end != void 0
        ? [].slice.call(arr, start, end)
        : [].slice.call(arr, start);
    },

    _push = function(obj, key, value) {
        // if more than one part match the key
        // we should push them in an array
        
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

        return String(str).replace(_rchar.trim, '');
    },

    _encode  = function(str) {
        if(str == null) return '';

        return String(str).replace(_rchar.encode, function(match) {
            return mChar.encode[match];
        });
    },

    _decode = function(str) {
        if (str == null) return '';

        return String(str).replace(_rchar.decode, function(match) {
            return mChar.decode[match];
        });
    },

    _escape = function(str) {
        if (str == null) return '';

        return String(str).replace(_rchar.escape, function(match) {
            return _mChar.escape[match] || '\\u' + ('0000' + match.charCodeAt(0).toString(16)).slice(-4);
        });
    };


if ((_ = root._) == void 0) throw Error('Underscore Not Found!');


var Z = function() {};

_.extend(Z, {

    version : '0.0.1',

    guid : function() {
        var d = new Date().getTime(), r;

        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);

            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    },

    parseParam : function(str, separator) {
        var param = String(str).match(_rchar.param),
            key, value;

        if (param == null) return {};
        param = param.pop();

        separator = separator || ',';

        return _.reduce(param.split(separator), function(hash, pair) {
            pair = _escape(pair).split('=');

            key = pair.shift();
            key = _trim(key);

            value = pair.join('=');
            value = _trim(value);

            if (value.length != 0) {
                // exchange the value to suitable format
                if (_.isFinite(value)) {
                    value = +value;
                } else {
                    value = value.match(/^true$|^false$/) ? value == 'true' : value;
                }
            } else {
                // default value is true
                value = true;
            }

            return _push(hash, key, value);
        }, {});
    },

    parseQuery : function(str, separator) {
        var query = String(str).match(_rchar.query),
            key, value;

        if (query == null) return {};
        query = query.pop();

        separator = separator || '&';

        return _.reduce(query.split(separator), function(hash, pair) {
            if (pair.indexOf('=') == -1) return hash;

            pair = decodeURIComponent(pair).split('=');

            key = pair.shift();
            // in case, the value of this part include a equal sign
            // we should join them again
            value = pair.join('=');

            if (value != void 0) {
                value = value.replace('+', ' ');
            }

            return _push(hash, key, value);
        }, {});
    },

    parseJSON : (function() {

        // reference: http://json.org/json2.js

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

            // add the native support
            if (JSON && _.isFunction(JSON.parse)) {
                return JSON.parse(str);
            }

            // clear string
            str = _trim(String(str).replace(_rchar.jsonclear, function(a) {
                return '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
            }));

            if (_rchar.jsonchars.test(str
                .replace(_rchar.jsonescape, '@')
                .replace(_rchar.jsontokens, ']')
                .replace(_rchar.jsonbraces, '')
            )) {
                res = (new Function('return ' + str))();

                return _.isFunction(reviver)
                ? walk('', {'': res}, reviver)
                : res;
            }

            return [];
        }

    })()
});

// global cache data system
_.extend(Z, {
    data : (function() {

        var hook = 'data-' + Z.guid(),

            cache = {},
            // self increment
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

_.extend(Z, {
    Ticker : (function(settings) {

        var win = window,

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
                // if the callback function has registered, skip it
                if (callback.tickId) return;

                callback.tickId = 'tick-' + Z.guid();
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
                    i = 0,
                    len = tickers.length;

                if (!callback) {
                    // clear ticker queue
                    tickers.length = 0;
                } else {
                    if (!callback.tickId) return;

                    for (; i < len; i++) {
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

    })({
        USE_RAF : true,
        INTERVAL : 1000 / 60
    }),

    Event : (function(settings) {

        function Event(context) {
            Z.data(this, settings.CACHE, {});
            this.context = context;
        }

        Event.prototype = {
            on : function(name, callback) {
                var events = Z.data(this, settings.CACHE),
                    handlers = events[name] || (events[name] = []);

                if (callback.eventId) return;

                callback.eventId = 'event-' + Z.guid();
                handlers.push({
                    context : this.context || this,
                    callback : callback
                });

                return callback;
            },

            off : function(name, callback) {
                var events = Z.data(this, settings.CACHE),
                    handlers = events[name],
                    handler, 
                    i = -1,
                    len;

                if (!handlers) return;
                len = handlers.length;

                if (!callback) {
                    handlers.length = 0;
                    delete events[name];
                } else {
                    if (!callback.eventId) return;

                    while (++i < len) {
                        handler = handlers[i];
                        if (callback.eventId === handler.callback.eventId) {
                            callback = handler.callback;
                            delete callback.tickId;

                            handlers.splice(i, 1);
                            
                            break;
                        }
                    }
                }

                return callback;
            },

            emit : function(name) {
                var events = Z.data(this, settings.CACHE),
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

        Event.global = new Event(Z);

        _.each('on off emit'.split(' '), function(value) {
            Event.create[value] = function() {
                Event.global[value].apply(Event.global, arguments);
            };
        });

        return Event.create;

    })({
        CACHE : 'events'
    }),

    Queue : (function(settings) {

        function Queue(context) {
            Z.data(this, settings.CACHE, {});
            this.context = context;
        }

        Queue.prototype = {
            add : function(name, callback) {
                var queues = Z.data(this, settings.CACHE),
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
                var queues = Z.data(this, settings.CACHE),
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
                var queues = Z.data(this, settings.CACHE),
                    players = queues[name];

                players && (delete queues[name]);
            },

            size : function(name) {
                var queues = Z.data(this, settings.CACHE),
                    players = queues[name];

                return players ? players.length : 0;
            }
        };

        Queue.create = function(context) {
            return new Queue(context);
        };

        Queue.global = new Queue(Z);

        _.each('add next clear size'.split(' '), function(value) {
            Queue.create[value] = function() {
                Queue.global[value].apply(Queue.global, arguments);
            };
        });

        return Queue.create;

    })({
        CACHE : 'queues'
    })
});

_.extend(Z, {
    Fsm : (function(settings) {

        function Fsm(initial, context) {
            // cache the state
            this.cache = {length : 0};
            // map of one state to another state
            this.map = {};

            this.event = Z.Event(context);
            this.queue = Z.Queue(this);

            this.sync = true;

            // we use index instead of state inside of the fsm
            this.index = this.cacheState(initial || 'none');
        }

        Fsm.prototype = {
            mapState : function(action, transit) {
                var from = this.cacheState(transit.from || 'none'),
                    to = this.cacheState(transit.to);

                action = this.map[action] || (this.map[action] = []);
                action[from] = to;
            },

            cacheState : function(state) {
                var cache = this.cache,
                    index;

                if (_.isUndefined(cache[state])) {
                    index = cache.length++;

                    // bi-directional references
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

            bindEvent : function(name, callback) {
                return this.event.on(name, callback);
            },

            unbindEvent : function(name, callback) {
                return this.event.off(name, callback);
            },

            doAction : function(name, asyn) {
                var action = this.map[name],
                    state, next = {};

                if (!this.sync) return;

                state = this.getState();

                next.index = action[this.index];
                next.state = this.getState(next.index);

                if (_.isUndefined(next.index)) {
                    this.event.emit('error', 'State Transition Error!');
                    return;
                }

                this.queue.add(settings.ASYN_QUEUEU, function() {
                    this.event.emit('leave:' + state, name);

                    this.sync = false;
                    if (asyn) return
                        
                    this.queue.next(settings.ASYN_QUEUEU);
                });

                this.queue.add(settings.ASYN_QUEUEU, function() {
                    this.event.emit('enter:' + next.state, name);
                    this.index = next.index;

                    this.sync = true;

                    this.queue.next(settings.ASYN_QUEUEU);
                });

                this.queue.next(settings.ASYN_QUEUEU);
            },

            syncState : function() {
                if (this.sync) return;
                this.queue.next('transit');
            }
        };

        Fsm.create = function(options, context) {
            var machine = new Fsm(options.initial, context);

            _each(options.transits, function(transit) {
                machine.mapState(transit.action, transit);
            });

            _each(options.events, function(event) {
                machine.bindEvent(event.name, event.callback);
            });

            return {
                add : function(action, transit) {
                    machine.mapState(action, transit);
                },

                fire : function(action, asyn) {
                    machine.doAction(action, asyn);
                },

                sync : function() {
                    machine.syncState();
                },

                on : function(event, callback) {
                    machine.bindEvent(event, callback);
                },

                off : function(event, callback) {
                    machines.unbindEvent(event, callback);
                }
            };
        };

        return Fsm.create;

    })({
        ASYN_QUEUEU : 'transit'
    })
});

_.extend(Z, {
    View : {}
});

return Z;

})(window);