define(function(require, exports, module) {

var utils = require('tool/utils'),
    event = require('tool/event'),

    $ = require('jquery'),
    _ = require('underscore');


var ready = 0,

    rparam = /^[^\[]*\[([^\]]+)\]/,
    rdata = /^([^\[]+)(\[[^\]]*\])?$/,

    tpath = 'plugin/{s}/index.js',

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

    
function zoe(callback) {
    zoe.on('ready', callback);
}

_.extend(zoe, {
    event : event(zoe),

    on : function(name, callback) {
        zoe.event.on(name, callback);
    },

    off : function(name, callback) {
        zoe.event.off(name, callback);
    },

    emit : function(name) {
        zoe.event.emit(name);
    }
});

_.extend(zoe, {
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
                zoe.views[viewId] = view;

                if (viewBind) {
                    zoe.on('bind', function() {
                        try {
                            zoe.find(viewBind).addControl(view);
                        } catch(e) {
                            // do nothing
                        }
                    });
                }

                if (--ready == 0) {
                    zoe.emit('bind');
                    zoe.emit('ready');
                }
            });
        }
    }
});

if (ready == 0) {
    _.defer(function() {
        zoe.emit('ready');
    });
}


module.exports = zoe;

});