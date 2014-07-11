define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var utils = require('tool/utils'),
        swf = require('tool/swf'),

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View,
        
        Panel = require('plugin/panel/index');


    var defaults = {
            'vendor'  : 'letv',

            'speed'   : 300,
            'current' : 0
        },

        special = {
            'letv' : {
                player : 'http://img1.bitautoimg.com/video/player/letv_yiche140611.swf',
                vars : function(id) {
                    return {
                        file : 'http://v.bitauto.com/vbase/LocalPlayer/GetPlayInfo?videoid=' + id,
                        pver : 'website'
                    };
                },
                rvideo : /^http:\/\/\S+\/([^\/]+).html$/gi
            },

            'bita' : {
                player : 'http://img4.bitautoimg.com/video/js/flvPlayer-end.swf',
                vars : function(id) {
                    return {
                        file : 'http://v.bitauto.com/vbase/LocalPlayer/GetPlayVideoInfo?id=' + id
                    }
                },
                rvideo : /^http:\/\/\S+\/([^\/]+).html$/gi
            },

            'youku' : {
                player : function(id) {
                    return 'http://player.youku.com/player.php/sid/{id}/v.swf'.replace(/\{id\}/gi, id);
                },
                vars : {
                    isAutoPlay : false,
                    noCookie : 0
                },
                rvideo : /^http:\/\/\S+\/id_([^\/]+).html$/gi
            },

            'tudou' : {
                player : function(id) {
                    return 'http://www.tudou.com/v/{id}/&icode={id}/v.swf'.replace(/\{id\}/gi, id);
                },
                vars : {
                    auto : 0,
                    widthAD : false,
                    noCookie : 0
                },
                rvideo : /^http:\/\/\S+\/([^\/]+).html$/gi
            }
        };


    var VideoTape = View.extend({

            className : 'z_video_tape',

            template : _.template([

                '<object id="<%= place %>"></object>'

            ].join('')),

            initialize : function(options) {
                this.itemId = options.itemId;
                this.speed = options.speed;
                this.video = options.video;
                this.vendor = options.vendor;

                this.parse();
                this.render();
            },

            parse : function() {
                var video = this.video,
                    vendor = this.vendor;

                if (_.isString(vendor)) {
                    vendor = special[vendor] || special[defaults.vendor];
                }

                if (_.isString(video) && video.match(vendor.rvideo)) {
                    video = video.replace(vendor.rvideo, function(all, video) {
                        return video;
                    });
                }

                this.video = video;
                this.vendor = vendor;
            },

            render : function() {
                var $elem = this.$el,

                    video = this.video,
                    place = VideoTape.ID_PREFIX + video;

                $elem.html(this.template({
                    place : place
                }));
            },

            reset : function() {
                var $elem = this.$el,

                    vendor = this.vendor,
                    video = this.video,
                    place = VideoTape.ID_PREFIX + video,

                    width = $elem.width(),
                    height = $elem.height(),

                    params = {
                        quality : 'high',
                        menu : false,
                        wmode : 'opaque',
                        bgcolor : '#000000',
                        allowFullScreen : true,
                        allowScriptAccess : 'always'
                    },
                    flashvars,
                    player;

                if (_.isFunction(vendor.player)) {
                    player = vendor.player(video);
                } else {
                    player = vendor.player;
                }

                if (_.isFunction(vendor.vars)) {
                    flashvars = vendor.vars(video);
                } else {
                    flashvars = vendor.vars;
                }

                swf.embedSWF(player, place, width, height, '9.0.0', 'swf/expressInstall.swf', flashvars, params, {});
            },

            show : function() {
                this.$el.fadeIn(this.speed);
            },

            hide : function() {
                this.$el.hide();
            }

        }, {
            ID_PREFIX : 'z_video_'
        }),

        Video = Panel.extend({

            template : [

                '<div class="z_video_view"></div>'

            ].join(''),

            initialize : function(options) {
                options = _.defaults(options, defaults);

                Panel.prototype.initialize.call(this, options);
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children(),
                    $view;

                $items.detach();

                $elem.html(this.template);
                $elem.addClass('z_video');

                $view = this.$('.z_video_view');

                this.$items = $items;
                this.$inner = $view;

                this.$view = $view;

                return this;
            },

            reset : function() {
                var $items = this.$items,

                    items = this.items,

                    options = this.options,
                    current = options.current,
                    remote = options.remote,
                    template = options.template,
                    speed = options.speed,
                    video = options.video,
                    vendor = options.vendor;

                if (remote && template && _.isFunction(template)) {
                    if (_.isArray(remote)) {
                        _.each(remote, function(data) {
                            var itemId = data.id || void 0,
                                item;
                            
                            this.addItem(item = new VideoTape({
                                itemId : itemId,
                                speed : data.speed || speed,
                                video : data.video || video,
                                vendor : data.vendor || vendor
                            }), true);

                            item.reset();
                        }, this);
                    } else {
                        remote.each(function(model) {
                            var data = model.toJSON(),
                                itemId = data.id || void 0,
                                item;
                            
                            this.addItem(item = new VideoTape({
                                itemId : itemId,
                                speed : data.speed || speed,
                                video : data.video || video,
                                vendor : data.vendor || vendor
                            }), true);

                            item.reset();
                        }, this);
                    }
                } else {
                    _.each($items, function(elem) {
                        var $elem = $(elem),
                            $link = elem.nodeName.match(/a/i) ? $elem : $elem.find('a'),
                            
                            speed = $elem.data('speed'),
                            video = $elem.data('video'),
                            vendor = $elem.data('vendor'),

                            itemId = elem.id || void 0,
                            item;

                        if (!video && $link.length) {
                            video = $link.attr('href');
                        }

                        this.addItem(item = new VideoTape({
                            itemId : itemId,
                            speed : speed || options.speed,
                            video : video || options.video,
                            vendor : vendor || options.vendor
                        }), true);

                        item.reset();
                    }, this);
                }

                if (!this.size()) {
                    this.addItem(item = new VideoTape({
                        speed : options.speed,
                        vendor : options.vendor,
                        video : options.video
                    }));

                    item.reset();
                }

                this.cache();
                this.show(current);
            }

        });
        

    module.exports = Video;

});