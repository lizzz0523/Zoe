define(function(require, exports, module) {

    var $ = require('jquery'),

        utils = require('tool/utils');


    var _rdata = /^([^\[]+)(\[[^\]]*\])$/,
        _path = 'plugin/{s}/index.js',

        views = utils.data(window, 'zoe');


    if (!views) {
        views = {};
    }

    $('[data-zoe]').each(function(index, elem) {
        var $elem = $(elem),
            
            id = $elem.data('id'),
            data,
            opts;

        if (!id) {
            $elem.data('id', id = 'zoe-' + utils.guid());
        }
          
        if (!views[id]) {
            data = $elem.data('zoe').match(_rdata);

            if (data) {
                opts = utils.parseParam(data[2]);
                opts.el = elem;

                require.async(_path.replace(/\{s\}/g, data[1]), function(View) {
                    views[id] = new View(opts);
                });
            }
        }
    });

    utils.data(window, 'zoe', views);

});