// 事件系统
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

var cache = require('tool/cache'),
    _ = require('underscore');


var requestAnimFrame = window.requestAnimationFrame,
    cancelAnimFrame = window.cancelAnimationFrame || window.cancelRequestAnimationFrame,

    requestId;

(function() {

    var vendors = ' ms moz webkit o'.split(' '),
        i = 0,
        len = vendors.length;

    for (; i < len && !requestAnimFrame; i++) {
        requestAnimFrame = window[vendors[i] + 'RequestAnimationFrame'];
        cancelAnimFrame = window[vendors[i] + 'CancelAnimationFrame'] || window[vendors[i] + 'CancelRequestAnimationFrame'];
    }

    requestAnimFrame || (requestAnimFrame = function(callback) {
        return window.setTimeout(callback, 1000 / 60);
    });

    cancelAnimFrame || (cancelAnimFrame = function(requestId) {
        return window.clearTimeout(requestId);
    });

})();

function start() {
    requestId = requestAnimFrame(arguments.callee);
    Event.ticker.tick();
}

function stop() {
    cancelAnimFrame(requestId);
    requestId = void 0;
}


var settings = {
        CACHE : 'events'
    },

    hook = '_event' + _.uniqueId(),
    // 自增
    eventId = 1,

    trigger = function(context, callback, args) {
        var arg1 = args[0],
            arg2 = args[1],
            arg3 = args[2];

        switch (args.length) {
            case 0 :
                callback.call(context); return;
            case 1 :
                callback.call(context, arg1); return;
            case 2 : 
                callback.call(context, arg1, arg2); return;
            case 3 :
                callback.call(context, arg1, arg2, arg3); return;
            default :
                callback.apply(context, args); return;
        }
    };


function Event(context) {
    cache.set(this, settings.CACHE, {});
    this.context = context || this;
}

Event.prototype = {
    version : 'zoe-event 0.0.1'
};

_.extend(Event.prototype, {
    on : function(name, callback) {
        var events = cache.get(this, settings.CACHE),
            handlers = events[name] || (events[name] = []);

        if (!callback[hook]) {
            callback[hook] = eventId++;
        }

        handlers.push({
            context : this.context,
            callback : callback
        });

        if (name == 'tick' && handlers.length == 1) {
            Event.ticker.join(this);
        } 

        return callback;
    },

    one : function(name, callback) {
        var self = this,
            once = _.once(function() {
                self.off(name, once);
                callback.apply(this, arguments);
            });

        this.on(name, once);
        callback[hook] = once[hook];

        return callback;
    },

    off : function(name, callback) {
        var events = cache.get(this, settings.CACHE),
            handlers = events[name],
            handler,
            i = -1,
            len;

        if (!handlers) return;
        handlers = _.clone(handlers);
        len = handlers.length;

        if (!callback) {
            handlers.length = 0;
        } else {
            if (!callback[hook]) return;

            while (++i < len) {
                handler = handlers[i];

                if (callback[hook] === handler.callback[hook]) {
                    callback = handler.callback;
                    handlers.splice(i, 1);
                    
                    break;
                }
            }
        }

        if (handlers.length == 0) {
            delete events[name];
        } else {
            events[name] = handlers;
        }

        if (name == 'tick' && handlers.length == 0) {
            Event.ticker.drop(this);
        }

        return callback;
    },

    emit : function(name) {
        var events = cache.get(this, settings.CACHE),
            handlers = events[name],
            handler,
            i = -1,
            len,
            args = [].slice.call(arguments, 1);

        if (!handlers) return;
        len = handlers.length;

        while (++i < len) {
            handler = handlers[i];
            trigger(handler.context, handler.callback, arguments);
        }
    }
});

// 对外接口
Event.create = function(context) {
    return new Event(context);
};

// 全局事件收发
Event.global = new Event(window);

_.each('on one off emit'.split(' '), function(value) {
    Event.create[value] = function() {
        Event.global[value].apply(Event.global, arguments);
    };
});

// 计时器
Event.ticker = [];

_.extend(Event.ticker, {
    join : function(runner) {
        var i = -1;
            len = this.length;

        while (++i < len && this[i] !== runner);

        if (i == len) {
            this.splice(len, 0, runner);

            if (this.length == 1) {
                start();
            }
        }

        return this;
    },

    drop : function(runner) {
        var i = -1;
            len = this.length;

        while (++i < len && this[i] !== runner);

        if (i < len) {
            this.splice(i, 1);

            if (this.length == 0) {
                stop();
            }
        }

        return this;
    },

    tick : function() {
        var runner,
            i = -1,
            len = this.length;
            
        while(++i < len) {
            runner = this[i];
            runner.emit('tick');
        }
    }
});


module.exports = Event.create;

});