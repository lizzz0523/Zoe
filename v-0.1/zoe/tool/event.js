// 事件系统
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

var cache = require('tool/cache'),
    _ = require('underscore');


var settings = {
        CACHE : 'events'
    };
    

function Event(context) {
    cache.set(this, settings.CACHE, {});
    this.context = context;
}

Event.create = function(context) {
    return new Event(context);
};

Event.prototype = {
    on : function(name, callback) {
        var events = cache.get(this, settings.CACHE),
            handlers = events[name] || (events[name] = []);

        if (callback.eventId) return;

        callback.eventId = 'event-' + _.uniqueId();
        handlers.push({
            context : this.context || this,
            callback : callback
        });

        return callback;
    },

    one : function(name, callback) {
        var self = this,
            once = _.once(function() {
                self.off(name, once);
                callback.apply(this, arguments);
            });

        this.on(name, once);
        callback.eventId = once.eventId;

        return callback;
    },

    off : function(name, callback) {
        var events = cache.get(this, settings.CACHE),
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
        var events = cache.get(this, settings.CACHE),
            handlers = events[name],
            handler,
            i = -1,
            len,
            args = [].slice.call(arguments, 1);

        if (!handlers) return;
        handlers = _.clone(handlers);
        len = handlers.length;

        while (++i < len) {
            handler = handlers[i];
            handler.callback.apply(handler.context, args);
        }
    }
};

Event.global = new Event(window);

_.each('on one off emit'.split(' '), function(value) {
    Event.create[value] = function() {
        Event.global[value].apply(Event.global, arguments);
    };
});


module.exports = Event.create;

});