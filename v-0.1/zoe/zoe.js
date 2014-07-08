define(function(require, exports, module) {

    var $ = require('jquery'),

        utils = require('tool/utils');


    var _rdata = /^([^\[]+)(\[[^\]]*\])$/,
        _path = 'plugin/{s}/index.js',

        ready = 0,
        zoe = function(callback) {
            zoe.on('ready', callback);
        };

        
    $.extend(zoe, {
        event : utils.Event(zoe),

        views : {},

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
            $elem.data('id', viewId = 'zoe-' + utils.guid());
        }
          
        if (!zoe.views[viewId]) {
            viewData = $elem.data('zoe').match(_rdata);

            if (viewData) {
                options = utils.parseParam(viewData[2]);
                options.el = elem;

                ready++;
                require.async(_path.replace(/\{s\}/g, viewData[1]), function(View) {
                    zoe.views[viewId] = new View(options);

                    if (--ready == 0) {
                        zoe.emit('ready');
                    }
                });

                if (ready == 0) {
                    zoe.emit('ready');
                }
            }
        }
    });


    module.exports = zoe;

});