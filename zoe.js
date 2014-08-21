define(function(require, exports, module) {

var utils = require('tool/utils'),
    event = require('tool/event'),

    $ = require('jquery'),
    _ = require('underscore');

    
function zoe(selector) {
    if (_.isFunction(selector)) {
        // 如果参数为回调，则加入到ready事件列队
        return zoe.on('ready', selector);
    } else {
        // 否则当成选择器，调用zoe.find方法
        return zoe.find(String(selector));
    }
}


_.extend(zoe, {
    version : 'zoe 0.0.1',

    log : console && console.log
    ? function() {
        console.log.apply(console, arguments);
    }
    : function() {
        // do nothing
    }
});


_.extend(zoe, {
    _views : {},

    _zuid : 1,

    find : function(viewId) {
        if (zoe._views[viewId]) {
            return zoe._views[viewId];
        } else {
            return null;
        }
    },

    push : function(viewId, view) {
        if (!zoe._views[viewId]) {
            zoe._views[viewId] = view;
        }
    }
});


_.extend(zoe, {
    _event : event(zoe)
});

_.each('on one off emit'.split(' '), function(method) {
    zoe[method] = function() {
        zoe._event[method].apply(zoe._event, arguments);
    };
});


_.extend(zoe, {
    _tpath : 'module/{s}/index.js',

    use : function(plugins, callback) {
        var args = [],
            len;

        plugins = _.isArray(plugins) ? plugins : [plugins];
        len = plugins.length;
        
        _.each(plugins, function(plugin, index) {
            require.async(zoe._tpath.replace(/\{s\}/g, plugin.toLowerCase()), function(View) {
                args[index] = View;

                if (--len == 0) {
                    callback.apply(zoe, args);
                }
            });
        });
    }
});


var inited,
    ready = 0,
    
    readyCheck = function() {
        // 只有当zoe初始化的扫描执行完毕
        // 并且，所有组件都初始化后，才会触发bind和ready事件
        if (!inited || ready != 0) return;

        _.defer(function() {
            zoe.emit('bind');
            zoe.emit('ready');
        });
    },

    rdata = /^([^\[]+)(\[[\w\s\-$,=\[\]]*\])?(?:[^\]]*)$/,

    parseData = function(str) {
        var data = String(str).match(rdata);

        if (data) {
            return {
                plugin : data[1] || '',
                params : data[2] || '[]'
            }
        }

        return false;
    },

    parseParam = function(params) {
        var key = '',
            hash = {},

            phase = 2,
            first,
            index,

            stack = [],
            last = params,

            // 设置global标致，是为了使用lastIndex
            rterm = /[^=\,\[\]]*/g,
            rsign =/^(?:=|,)$/;

        function parseValue(value) {
            value = utils.trim(value);

            if (value.length != 0) {
                // 内部转换字符串到对应的值
                if (_.isFinite(value)) {
                    // number
                    value = +value;
                } else {
                    // boolean & string
                    value = value.match(/^(?:true|false)$/) ? value == 'true' : value;
                }
            } else {
                // 如果字符串为空，默认转换成true
                value = true;
            }

            return value;
        }

        function parseKey(key) {
            key = utils.trim(key);

            // 将key中的非法字符去掉
            if (key = utils.escape(key)
                .replace(/[^\w$-]/g, '-')
                .replace('_', '-')
            ) {
                return utils.camelCase(key);   
            } else {
                return  '';
            }
        }

        function pushStack() {
            var temp = {hash : hash, key : key};

            stack.push(temp);

            hash = {};
            key = '';
        }

        function popStack() {
            var temp = stack.pop();

            temp.hash[temp.key] = hash;

            hash = temp.hash;
            key = '';
        }

        while (params) {
            first = params.charAt(0);

            if (first.match(rsign)) {
                params = params.slice(1);
                phase = first == ',' ? 0 : 1;

                continue;
            } else if (params.charAt(0) == '[') {
                pushStack();

                params = params.slice(1);
                phase = 0;

                continue;
            } else if (params.charAt(0) == ']') {
                popStack();

                params = params.slice(1);
                phase = 2;

                continue;
            }

            rterm.lastIndex = 0;

            switch (phase) {
                case 0 :
                    // 找key值
                    index = rterm.exec(params) ? rterm.lastIndex : -1;

                    key = parseKey(index < 0 ? params : params.slice(0, index));
                    hash[key] = true;

                    params = params.slice(index);
                    phase = 2;

                    break;

                case 1 :
                    // 找value值
                    index = rterm.exec(params) ? rterm.lastIndex : -1;

                    hash[key] = parseValue(index < 0 ? params : params.slice(0, index));
                    key = '';

                    params = params.slice(index);
                    phase = 2;

                    break;

                default :
                    params = params.slice(1);
                    phase = 2;

                    break;
            }
        }

        while (stack.length) popStack();

        return hash[key];
    };

inited = false;

$('[data-zoe]').each(function(index, elem) {
    var $elem = $(elem),
        
        viewId = $elem.data('id'),
        viewBind = $elem.data('for'), 
        viewData = $elem.data('zoe'),
        view,

        options;

    if (!viewId) {
        $elem.data('id', viewId = 'z_view-' + zoe._zuid++);
    }
      
    if (!zoe.find(viewId)) {
        viewData = parseData(viewData);

        if (viewData) {
            options = parseParam(viewData.params);
            options.el = $elem[0];

            ready++;
            zoe.use(viewData.plugin, function(View) {
                zoe.push(viewId,  (view = new View(options)).render());

                if (viewBind) {
                    zoe.one('bind', function() {
                        try {
                            zoe.find(viewBind).binding(view);
                        } catch(e) {
                            zoe.log('View Binding Error:' + viewId + '-->' + viewBind);
                        }
                    });
                }

                ready--;
                readyCheck();
            });
        }
    }
});

inited = true;

readyCheck();


module.exports = zoe;

});