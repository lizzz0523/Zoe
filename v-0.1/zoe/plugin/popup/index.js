// 弹窗组件，用于弹出报名框，或者活动介绍等
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var queue = require('tool/queue'),
        client = require('tool/client'),

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index'),
        ZPanel = require('plugin/panel/index');


    var defaults = {
            'speed'  : 200,
            'width'  : 400,
            'height' : 300
        },

        $root = $('html'),
        $body = $('body'),

        support = client.support('csstransforms'),
        transform = client.prefixed('transform');


    var ZPopBase = ZView.extend({
            terminal : true,

            visible : false,

            template : [

                '<div class="z_pbase_layer">',
                    '<div class="z_pbase_fake"></div>',
                '</div>',

                '<div class="z_pbase_layer z_pbase_stage">',
                    '<div class="z_pbase_overlay"></div>',
                    '<div class="z_pbase_view"></div>',
                '</div>'

            ].join(''),

            initialize : function(options) {
                _.extend(this, _.pick(options, ['speed']));

                this.queue = queue(this);

                ZView.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children(),

                    $view,
                    $fake,
                    $overlay,
                    $layer;

                $data.detach();

                $elem.html(this.template);
                $elem.addClass('z_pop-base');

                $view = this.$('.z_pbase_view');
                $fake = this.$('.z_pbase_fake');
                $overlay = this.$('.z_pbase_overlay');
                $layer = this.$('.z_pbase_layer');

                this.$data = $data;
                this.$inner = $view;

                this.$view = $view;
                this.$fake = $fake;
                this.$overlay = $overlay;
                this.$layer = $layer;

                return this;
            },

            wrap : function() {
                var $elem = this.$el,
                    $fake = this.$fake;

                $fake.css({
                    'margin'  : $body.css('margin'),
                    'padding' : $body.css('padding')
                });

                $body.find('script').each(function() {
                    var $script = $(this);

                    $script.data('type', $script.attr('type'));
                    $script.attr('type', 'text/disabled');
                });

                $fake.prepend($body.children());
                $body.prepend($elem);

                $root.addClass('z_html-popup');
                $body.addClass('z_body-popup');
            },

            unwrap : function() {
                var $elem = this.$el,
                    $fake = this.$fake;

                $fake.css({
                    'margin'  : 0,
                    'padding' : 0
                });

                $body.prepend($fake.children());
                $elem.detach();

                $body.find('script').each(function() {
                    var $script = $(this);

                    $script.attr('type', $script.data('type'));
                    $script.removeData('type');
                });

                $root.removeClass('z_html-popup');
                $body.removeClass('z_body-popup');
            },

            show : function() {
                var $elem = this.$el,
                    $layer = this.$layer,
                    $overlay = this.$overlay,

                    queue = this.queue,
                    qname = 'popup',

                    visible = this.visible;

                if (!visible) {
                    queue.add(qname, function() {
                        this.wrap();
                        queue.next(qname);
                    });

                    if (support) {
                        queue.add(qname, function() {
                            _.defer(function() {
                                queue.next(qname);
                            });
                        });

                        queue.add(qname, function() {
                            var total = $layer.length - 1,
                                deep,
                                scale;

                            $layer.each(function(index) {
                                deep = total - index;
                                scale = 1 - deep * 0.05;

                                $(this).css(transform, 'scale(' + scale + ')');
                            });

                            queue.next(qname);
                        });
                    }

                    queue.add(qname, function() {
                        $overlay.css('opacity', 1);
                        queue.next(qname);
                    });

                    queue.next(qname);
                }

                this.visible = true;

                return this;
            },

            hide : function() {
                var $elem = this.$el,
                    $layer = this.$layer,
                    $overlay = this.$overlay,

                    queue = this.queue,
                    qname = 'popup',

                    visible = this.visible;

                if (visible) {
                    queue.add(qname, function() {
                        $overlay.css('opacity', 0);
                        queue.next(qname);
                    });

                    if (support) {
                        queue.add(qname, function() {
                            $layer.each(function(index) {
                                $(this).css(transform, 'scale(1)');
                            });
                            $overlay.css('opacity', 0);

                            queue.next(qname);
                        });

                        queue.add(qname, function() {
                            _.delay(function() {
                                queue.next(qname);
                            }, 300);
                        });
                    }

                    queue.add(qname, function() {
                        this.unwrap();
                        queue.next(qname);
                    });

                    queue.next(qname);
                }

                this.visible = false;

                return this;
            },

            pop : function(view) {
                
            }
        }, {
            instance : null,

            create : function() {
                if (!ZPopBase.instance) {
                    ZPopBase.instance = new ZPopBase();
                }

                return ZPopBase.instance;
            }
        });


    var ZFrame = ZView.extend({

        }),

        ZPopWin = ZPanel.extend({
            
        });


    module.exports = ZPopBase;

});