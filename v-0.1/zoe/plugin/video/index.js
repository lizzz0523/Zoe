define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),
        
        swf = require('tool/swf');


    var defaults = {
            'vendor' : 'letv'
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
                rvideo : /\/([^\/]+).html$/gi
            },

            'bita' : {
                player : 'http://img4.bitautoimg.com/video/js/flvPlayer-end.swf',
                vars : function(id) {
                    return {
                        file : 'http://v.bitauto.com/vbase/LocalPlayer/GetPlayVideoInfo?id=' + id
                    }
                },
                rvideo : /\/([^\/]+).html$/gi
            },

            'youku' : {
                player : function(id) {
                    return 'http://player.youku.com/player.php/sid/{id}/v.swf'.replace(/\{id\}/gi, id);
                },
                vars : {
                    isAutoPlay : false,
                    noCookie : 0
                },
                rvideo : /\/id_([^\/]+).html$/gi
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
                rvideo : /\/([^\/]+).html$/gi
            }
        };


    var VideoTape = B.View.extend({

            tagName : 'div',

            className : 'z_video_tape',

            initialize : function(options) {
                this.tapeId = options.tapeId;
                this.video = options.video;
                this.vendor = options.vendor;

                this.render();
            },

            render : function() {
                var $elem = this.$el,

                    video = this.video,
                    placeHolder;

                placeHolder = document.createElement('div');
                placeHolder.id = VideoTape.ID_PREFIX + video;

                $elem.append(placeHolder);
            },

            reset : function() {
                var $elem = this.$el,

                    video = this.video,
                    vendor = this.vendor,
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

                swf.embedSWF(player, VideoTape.ID_PREFIX + video, width, height, '9.0.0', 'swf/expressInstall.swf', flashvars, params, {});
            },

            show : function() {
                this.$el.fadeIn(500);
            },

            hide : function() {
                this.$el.hide();
            }

        }, {
            ID_PREFIX : 'z_video_'
        }),

        Video = B.View.extend({

            template : [

                '<div class="z_video_view"></div>'

            ].join(''),

            initialize : function(options) {
                options = _.defaults(options, defaults);

                if (_.isString(options.vendor)) {
                    options.vendor = special[options.vendor] || special[defaults.vendor];
                }

                this.render();

                this.$view = this.$('.z_video_view');

                this.tapes = (function($items) {

                    var tapes = [];

                    $items.each(function() {
                        var $item = $(this),
                            $link = this.nodeNode.toLowerCase() == 'a' ? $item : $item.find('a'),

                            vendor = $item.data('vendor') || options.vendor,
                            video = $item.data('video'),

                            tapeId = $item.attr('id') || void 0,
                            tape;

                        if (_.isString(vendor)) {
                            vendor = special[vendor] || special[defaults.vendor];
                        }

                        if (!video) {
                            video = $link.attr('href');
                            video = video
                            ? video.replace(vendor.rvideo, function(all, video){
                                return video;
                            })
                            : options.video;
                        }

                        tape = new VideoTape({
                            vendor : vendor,
                            video : video,
                            tapeId : tapeId
                        });

                        tapes.push(tape);
                    });

                    if (!tapes.length) {
                        tapes.push(new VideoTape({
                            vendor : options.vendor,
                            video : options.video
                        }));
                    }

                    return tapes;

                })(this.$items);

                this.curIndex = -1;
                this.minIndex = 0;
                this.maxIndex = this.size() - 1;

                this.reset();
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children();

                $items.detach();

                $elem.html(this.template);
                $elem.addClass('z_video');

                this.$items = $items;

                return this;
            },

            reset : function(initIndex) {
                var $view = this.$view,
                    tapes = this.tapes;

                _.each(tapes, function(tape) {
                    tape.$el.appendTo($view);
                    tape.reset();
                });

                this.playTo(this.validIndex(initIndex || this.minIndex));
            },

            playTo : function(index) {
                var tapes = this.tapes;

                _.each(tapes, function(tape) {
                    tape.hide();
                });

                tapes[index].show();
            },

            validIndex : function(index) {
                var minIndex = this.minIndex,
                    maxIndex = this.maxIndex;

                if (index === 'next') {
                    index = this.curIndex + 1;
                }

                if (index === 'prev') {
                    index = this.curIndex - 1;
                }

                if (_.isString(index)) {
                    index = this.id2Index[index];
                }

                if (_.isFinite(index)) {
                    index = +index;

                    if (index > maxIndex) {
                        index = minIndex;
                    }

                    if (index < minIndex) {
                        index = maxIndex;
                    }
                } else {
                    index = minIndex;
                }

                return index;
            },

            size : function() {
                return this.tapes.length;
            }

        });
        

    module.exports = Video;

});