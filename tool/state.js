// 有限状态机系统
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

var cache = require('tool/cache'),
    event = require('tool/event'),
    queue = require('tool/queue'),
    _ = require('underscore');


var settings = {
        STATES : 'states',
        MAPSET : 'mapset',
        ASYN_QUEUEU : 'transit'
    };
    

function State(context, initial) {
    // 缓存状态
    cache.set(this, settings.STATES, {length : 0});
    // 一个状态到另个状态的映射
    cache.set(this, settings.MAPSET, {});

    // 事件系统，用于触发事件
    this._event = event(context);
    // 队列系统，用于保持状态同步
    this._queue = queue(this);

    this._isSync = true;

    // 在状态机内部，我们使用index标记状态的名字
    this._index = this._cacheState(initial || 'none');
}

State.prototype = {
    version : 'zoe-state 0.0.1',

    _cacheState : function(state) {
        var states = cache.get(this, settings.STATES),
            index;

        if (_.isUndefined(states[state])) {
            index = states.length++;

            // 双向引用
            states[state] = index;
            states[index] = state;
        } else {
            index = states[state];
        }

        return index;
    },

    _getState : function(index) {
        var states = cache.get(this, settings.STATES);
        return states[_.isUndefined(index) ? this._index : index];
    }
};

_.extend(State.prototype, {
    add : function(action, prev, next) {
        var mapset = cache.get(this, settings.MAPSET),
            map;

        if (arguments.lenght < 3) {
            next = prev;
            prev = void 0;
        }

        prev = this._cacheState(prev || 'none');
        next = this._cacheState(next);

        map = mapset[action] || (mapset[action] = []);
        map[prev] = next;
    },

    on : function(event, callback) {
        return this._event.on(event, callback);
    },

    off : function(event, callback) {
        return this._event.off(event, callback);
    },

    fire : function(action, asyn) {
        var mapset = cache.get(this, settings.MAPSET),
            map = mapset[action],

            prev = {
                index : this._index,
                state : this._getState(),
            },
            next = {};

        // 如果没有同步，则忽略这次调用
        if (!this._isSync) return;

        next.index = map[prev.index];
        next.state = this.getState(next.index);

        // 如果该动作没有使状态发生变化
        // 则触发silent事件
        if (_.isUndefined(next.index)) {
            this._event.emit('silent:' + prev.state, action);
            return;
        }

        this._queue.add(settings.ASYN_QUEUEU, function() {
            this._event.emit('leave:' + prev.state, action);

            this._isSync = false;
            if (asyn) return
                
            this._queue.next(settings.ASYN_QUEUEU);
        });

        this._queue.add(settings.ASYN_QUEUEU, function() {
            this.event.emit('enter:' + next.state, action);

            this._index = next.index;
            this._isSync = true;

            this._queue.next(settings.ASYN_QUEUEU);
        });

        this._queue.next(settings.ASYN_QUEUEU);
    },

    sync : function() {
        if (this._isSync) return;
        this._queue.next(settings.ASYN_QUEUEU);
    }
});

// 对外接口
State.create = function(context, options) {
    var machine;

    options = _.extend({}, options);
    machine = new State(context, options.initial);

    _.each(options.transits, function(transit) {
        machine.add(transit.action, transit.prev, transit.next);
    });

    _.each(options.events, function(event) {
        machine.on(event.name, event.callback);
    });

    return machine;
};

// 全局有限状态机系统
State.global = new State(window);

_.each('add on off fire sync'.split(' '), function(value) {
    State.create[value] = function() {
        State.global[value].apply(State.global, arguments);
    };
});


module.exports = State.create;

});