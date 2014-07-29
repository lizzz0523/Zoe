// 定时器
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

var _ = require('underscore');


var win = window,

    settings = {
        USE_RAF : true,
        INTERVAL : 1000 / 60
    },

    hook = '_tick' + _.uniqueId(),

    tickers = [],
    tickId = 1,

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


module.exports = {
    enter : function(context, callback) {
        // 如果该回调已经注册过，就不要重复注册了
        if (callback[hook]) return;

        callback[hook] = tickId++;
        tickers.push({
            context : context || window,
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
            if (!callback[hook]) return;

            while (++i < len) {
                ticker = tickers[i];
                if (callback[hook] === ticker.callback[hook]) {
                    callback = ticker.callback;
                    delete callback[hook];

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

});