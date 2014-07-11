define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore');


    var zoe = function(callback) {
            zoe.on('ready', callback);
        },

        ready = 0,

        rparam = /^[^\[]*\[([^\]]+)\]/,
        rdata = /^([^\[]+)(\[[^\]]*\])?$/,

        tpath = 'plugin/{s}/index.js',

        parseData = function(str) {
            var data = String(str).match(rdata);

            if (data) {
                return {
                    plugin : data[1] || '',
                    params : data[2]
                }
            }

            return false;
        },

        parseParam = function(str, separator) {
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

        
    _.extend(zoe, {
        views : {},

        zuid : 1,

        event : utils.event(zoe),

        on : function(name, callback) {
            zoe.event.on(name, callback);
        },

        off : function(name, callback) {
            zoe.event.off(name, callback);
        },

        emit : function(name) {
            zoe.event.emit(name);
        },

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
            viewData,

            options;

        if (!viewId) {
            $elem.data('id', viewId = 'z_view-' + zoe.zuid++);
        }
          
        if (!zoe.views[viewId]) {
            viewData = parseData($elem.data('zoe'));

            if (viewData) {
                options = parseParam(viewData.params);
                options.el = $elem[0];

                ready++;
                require.async(tpath.replace(/\{s\}/g, viewData.plugin), function(View) {
                    zoe.views[viewId] = new View(options);

                    if (--ready == 0) {
                        zoe.emit('ready');
                    }
                });
            }
        }
    });

    if (ready == 0) {
        setTimeout(function() {
            zoe.emit('ready');
        }, 0);
    }


    module.exports = zoe;

});