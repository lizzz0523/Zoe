// 视频组件，使用了swfobject.js
// 暂时支持，易车视频（原版，乐视版）、优酷视频、土豆视频
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var // 引入swfobject，已经过cmd封装
        swf = require('tool/swf'),

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index'),
        ZPanel = require('plugin/panel/index');


    var defaults = {
            'vendor' : 'letv',
            'video'  : 0
        },

        special = {
            defaults : {
                vars   : { },
                rpath : /^http:\/\/\S+\/([^\/]+).html$/gi
            }
        };


    var ZTape = ZView.extend({
            terminal : true,

            template : _.template([

                '<object id="<%= place %>"></object>'

            ].join('')),

            initialize : function(options) {
                _.extend(this, _.pick(options, ['speed', 'video', 'vendor']));

                this.parseVendor();
                this.parseVideo();

                ZView.prototype.initialize.call(this, options);
            },

            parseVendor : function() {
                var vendor = this.vendor;

                // 获取视频网站播放器的设置
                if (_.isString(vendor)) {
                    vendor = special[vendor] || special[defaults.vendor];
                }

                this.vendor = vendor;
            },

            parseVideo : function() {
                var vendor = this.vendor,
                    video = this.video;

                if (_.isString(video) && video.match(vendor.rpath)) {
                    video = video.replace(vendor.rpath, function(all, video) {
                        return video;
                    });
                }

                this.video = video;
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children(),

                    vendor = this.vendor,
                    video = this.video,
                    place = [ZTape.ID_PREFIX, vendor.name, video].join('_');

                $data.detach();

                $elem.html(this.template({
                    place : place
                }));
                $elem.addClass('z_video_tape');

                this.$data = $data;
                this.$inner = $elem;

                return this;
            },

            initPlayer : function() {
                var $elem = this.$el,

                    width = $elem.width(),
                    height = $elem.height(),

                    vendor = this.vendor,
                    video = this.video,
                    place = [ZTape.ID_PREFIX, vendor.name, video].join('_'),

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

            show : function(silent) {
                var $elem = this.$el,

                    visible = this.visible,
                    speed = !silent && this.speed;

                if (!visible) {
                    if (!speed) {
                        this.$el.show();
                    } else {
                        this.$el.fadeIn(speed);
                    }
                }

                this.visible = true;

                return this;
            }
        }, {
            ID_PREFIX : 'z_video'
        }),

        ZVideo = ZPanel.extend({
            template : [

                '<div class="z_video_view"></div>'

            ].join(''),

            initialize : function(options) {
                _.extend(this, _.pick(options = _.defaults(options, defaults), _.keys(defaults)));

                ZPanel.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children(),

                    $view;

                $data.detach();

                $elem.html(this.template);
                $elem.addClass('z_video');

                $view = this.$('.z_video_view');

                this.$data = $data;
                this.$inner = $view;

                this.$view = $view;

                return this;
            },

            render : function() {
                var $data = this.$data,

                    data = this.data,
                    tmpl = this.tmpl,

                    speed = this.speed,
                    vendor = this.vendor,
                    video = this.video,
                    init = this.init;

                if (data) {
                    data.each(function(model) {
                        var item = new ZTape({
                                zid    : model.id || model.cid,
                                speed  : speed,
                                vendor : model.get('vendor') || vendor,
                                video  : model.get('video') || video,

                                data   : model.toJSON(),
                                tmpl   : tmpl
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }, this);
                } else {
                    _.each($data, function(elem) {
                        var $elem = $(elem),
                            $link = elem.nodeName.match(/a/i) ? $elem : $elem.find('a'),

                            item = new ZTape({
                                zid    : elem.id || void 0,
                                speed  : speed,
                                vendor : $elem.data('vendor') || vendor,
                                video  : $elem.data('video') || $link.attr('href') || video
                            });

                        this.append(item.stack(elem).render().el);
                        this.addItem(item);
                    }, this);

                    // 如果没有任何配置元素
                    // 则尝试使用全局配置参数
                    if (!this.size()) {
                        var item = new ZTape({
                                speed  : speed,
                                vendor : vendor,
                                video  : video
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }
                }

                this.cache();
                this.start(init);

                return this;
            },

            start : function(init) {
                this.eachItem(function(item) {
                    item.initPlayer();
                });

                this.show(init);
            }
        }, {
            register : function(vendor, options) {
                if (!options.player) return;
                special[vendor] = _.defaults(options, special.defaults);
            }
        });


    ZVideo.register('bita', {
        name   : 'bita',
        player : 'http://img4.bitautoimg.com/video/js/flvPlayer-end.swf',
        vars   : function(id) {
            return {
                file : 'http://v.bitauto.com/vbase/LocalPlayer/GetPlayVideoInfo?id=' + id
            }
        }
    });

    ZVideo.register('letv', {
        name   : 'letv',
        player : 'http://img1.bitautoimg.com/video/player/letv_yiche140611.swf',
        vars   : function(id) {
            return {
                file : 'http://v.bitauto.com/vbase/LocalPlayer/GetPlayInfo?videoid=' + id,
                pver : 'website'
            };
        }
    });

    ZVideo.register('youku', {
        name   : 'youku',
        player : function(id) {
            return 'http://player.youku.com/player.php/sid/{id}/v.swf'.replace(/\{id\}/gi, id);
        },
        vars   : {
            isAutoPlay : false,
            noCookie : 0
        },
        rpath  : /^http:\/\/\S+\/id_([^\/]+).html$/gi
    });

    ZVideo.register('tudou', {
        name   : 'tudou',
        player : function(id) {
            return 'http://www.tudou.com/v/{id}/&icode={id}/v.swf'.replace(/\{id\}/gi, id);
        },
        vars   : {
            auto : 0,
            withAD : false,
            noCookie : 0
        }
    });
        

    module.exports = ZVideo;

});