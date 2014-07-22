define(function(require, exports, module) {

var utils = require('tool/utils'),
    event = require('tool/event'),

    $ = require('jquery'),
    _ = require('underscore');


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

    tpath = 'plugin/{s}/index.js',

    rparam = /^[^\[]*\[([^\]]+)\]/,
    rdata = /^([^\[]+)(\[[^\]]*\])?$/,

    getData = function(str) {
        var data = String(str).match(rdata);

        if (data) {
            return {
                plugin : data[1] || '',
                params : data[2]
            }
        }

        return false;
    },

    getParam = function(str, separator) {
        var param = String(str).match(rparam),
            key,
            value;

        if (param == null) return {};
        param = param.pop();
        separator = separator || ',';

        return _.reduce(param.split(separator), function(hash, pair) {
            if (pair.length == 0) return hash;

            pair = utils.escape(pair).split('=');

            key = pair.shift();
            key = utils.trim(key);

            value = pair.join('=');
            value = utils.trim(value);

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

            if (key in hash) {
                if (!_.isArray(hash[key])) {
                    hash[key] = [hash[key]];
                }
                hash[key].push(value);
            } else {
                hash[key] = value;
            }

            return hash;
        }, {});
    };

    
function zoe(selector) {
    if (typeof selector == 'string') {
        return zoe.find(selector);
    } else {
        return zoe.on('ready', selector);
    }
}

_.extend(zoe, {
    event : event(zoe),

    views : {},

    zuid : 1,

    find : function(viewId) {
        if (zoe.views[viewId]) {
            return zoe.views[viewId];
        } else {
            return null;
        }
    }
});

_.each('on one off emit'.split(' '), function(method) {
    zoe[method] = function() {
        zoe.event[method].apply(zoe.event, arguments);
    };
});


inited = false;

$('[data-zoe]').each(function(index, elem) {
    var $elem = $(elem),
        
        viewId = $elem.data('id'),
        viewBind = $elem.data('for'), 
        viewData,
        view,

        options;

    if (!viewId) {
        $elem.data('id', viewId = 'z_view-' + zoe.zuid++);
    }
      
    if (!zoe.views[viewId]) {
        viewData = getData($elem.data('zoe'));

        if (viewData) {
            options = getParam(viewData.params);
            options.el = $elem[0];

            ready++;
            require.async(tpath.replace(/\{s\}/g, viewData.plugin), function(View) {
                view = new View(options);
                zoe.views[viewId] = view.render();

                if (viewBind) {
                    zoe.one('bind', function() {
                        try {
                            zoe.find(viewBind).binding(view);
                        } catch(e) {
                            // do nothing
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