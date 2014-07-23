define(function(require, exports, module) {

var utils = require('tool/utils'),
    event = require('tool/event'),

    $ = require('jquery'),
    _ = require('underscore');

    
function zoe(selector) {
    if (typeof selector == 'string') {
        return zoe.find(selector);
    } else {
        return zoe.on('ready', selector);
    }
}


_.extend(zoe, {
    version : 'zoe-0.0.1',

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

    zuid : 1,

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
    _tpath : 'plugin/{s}/index.js',

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
    rparam = /^[^\[]*\[([\w\s\-$,=\[\]]+)\][^\]]*$/,

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

    parseParam = function(str, separator) {
        var params = String(str).match(rparam),
            key,
            value;

        if (params == null) return {};

        params = utils.escape(params[1]);
        separator = separator || ',';

        return _.reduce(params.split(separator), function(hash, param) {
            if (param.length == 0) return hash;

            param = param.split('=');

            key = utils.trim(param.shift());
            value = utils.trim(param.join('='));

            if (value.length != 0) {
                // 内部转换字符串到对应的值
                if (_.isFinite(value)) {
                    // number
                    value = +value;
                } else {
                    // boolean & string
                    value = value.match(/^true$|^false$/) ? value == 'true' : value;
                }

                if (_.isString(value) && value.charAt(0) == '[') {
                    // 递归获取参数
                    value = getParam(value, separator);
                }
            } else {
                // 如果字符串为空，默认转换成true
                value = true;
            }

            hash[key] = value;

            return hash;
        }, {});
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
        $elem.data('id', viewId = 'z_view-' + zoe.zuid++);
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
                            zoe.log('View Binding Error:' + e);
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