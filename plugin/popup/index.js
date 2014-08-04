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

        transform = client.support('csstransforms') && client.prefixed('transform'),

        $root = $('html'),
        $body = $('body');


    var ZPopBase = ZView.extend({
            ztype : 'pop-base',

            terminal : true,

            visible : false,

            template : _.template([

                '<div class="z_pbase_layer">',
                    '<div class="z_pbase_fake"></div>',
                '</div>',

                '<div class="z_pbase_layer z_pbase_stage">',
                    '<div class="z_pbase_overlay"></div>',
                    '<div class="z_pbase_view"></div>',
                '</div>'

            ].join('')),

            initialize : function(options) {
                this.queue = queue(this);

                ZView.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $view,
                    $fake,
                    $overlay,
                    $layer;

                ZView.prototype.reset.call(this);

                $view = this.$('.z_pbase_view');
                $fake = this.$('.z_pbase_fake');
                $overlay = this.$('.z_pbase_overlay');
                $layer = this.$('.z_pbase_layer');

                // 模拟出body的外围环境
                $fake.css({
                    'margin'     : $body.css('margin'),
                    'padding'    : $body.css('padding'),
                    'border'     : $body.css('border'),
                    'background' : $body.css('background'),
                    'color'      : $body.css('color'),
                    'font'       : $body.css('font'),
                });

                $view.hide();

                this.$inner = $view;
                this.$view = $view;
                this.$fake = $fake;
                this.$overlay = $overlay;
                this.$layer = $layer;

                return this;
            },

            wrap : function() {
                var $elem = this.$el,
                    $fake = this.$fake,
                    $scripts = $body.find('script'),

                    // 获取当前body的滚动条状态
                    scroll = $body.scrollTop();

                // 使页面的script标签失效
                // 以免调用$.fn.prepend方法时，重新执行
                $scripts.each(function() {
                    var $script = $(this);

                    $script.data('type', $script.attr('type'));
                    $script.attr('type', 'text/disabled');
                });

                // 在页面中嵌入pop-base
                $fake.prepend($body.children());
                $body.prepend($elem);

                // 重新恢复script标签
                $scripts.each(function() {
                    var $script = $(this);

                    $script.attr('type', $script.data('type'));
                    $script.removeData('type');
                });

                $root.addClass('z_html-popup');
                $body.addClass('z_body-popup');

                $fake.parent().scrollTop(scroll);
            },

            unwrap : function() {
                var $elem = this.$el,
                    $fake = this.$fake,
                    $scripts = $fake.find('script'),

                    // 获取当前body的滚动条状态
                    scroll = $fake.parent().scrollTop();

                // 使页面的script标签失效
                // 以免调用$.fn.prepend方法时，重新执行
                $scripts.each(function() {
                    var $script = $(this);

                    $script.data('type', $script.attr('type'));
                    $script.attr('type', 'text/disabled');
                });

                // 在页面中抽出pop-base
                $body.prepend($fake.children());
                $elem.detach();

                // 重新恢复script标签
                $body.find('script').each(function() {
                    var $script = $(this);

                    $script.attr('type', $script.data('type'));
                    $script.removeData('type');
                });

                $root.removeClass('z_html-popup');
                $body.removeClass('z_body-popup');

                $body.scrollTop(scroll);
            },

            show : function() {
                var $elem = this.$el,
                    $layer = this.$layer,
                    $overlay = this.$overlay,

                    queue = this.queue,
                    qname = 'show',

                    visible = this.visible;

                if (!visible) {
                    queue.add(qname, function() {
                        this.wrap();

                        // 等待浏览器渲染
                        _.defer(function() {
                            queue.next(qname);
                        });
                    });

                    if (transform) {
                        // 如果浏览器支持transform
                        // 则使用css3执行动画
                        queue.add(qname, function() {
                            var top = $layer.length - 1,
                                deep,
                                scale,
                                opacity
                                style = {};

                            $layer.each(function(index) {
                                deep = top - index;
                                scale = 1 - deep * 0.05;
                                opacity = (index == top) ? 1 : 1 / top;

                                style[transform] = 'scale(' + scale + ')';
                                style['opacity'] = opacity;

                                $(this).css(style);
                            });

                            $overlay.css('opacity', 1);

                            _.delay(function() {
                                queue.next(qname);
                            }, 300);
                        });
                    } else {
                        // 如果浏览器不支持transform
                        // 则降级为jquery的动画
                        queue.add(qname, function() {
                            $overlay.fadeTo(1, 300, function() {
                                queue.next(qname);
                            });
                        });
                    }

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
                    qname = 'hide',

                    visible = this.visible;

                if (visible) {
                    if (transform) {
                        queue.add(qname, function() {
                            var style = {};

                            style[transform] = 'scale(1)';
                            style['opacity'] = 1;

                            $layer.each(function(index) {
                                $(this).css(style);
                            });

                            $overlay.css('opacity', 0);

                            _.delay(function() {
                                queue.next(qname);
                            }, 300);
                        });
                    } else {
                        queue.add(qname, function() {
                            $overlay.fadeTo(0, 300, function() {
                                queue.next(qname);
                            });
                        });
                    }

                    queue.add(qname, function() {
                        this.unwrap();

                        // 等待浏览器渲染
                        _.defer(function() {
                            queue.next(qname);
                        });
                    });

                    queue.next(qname);
                }

                this.visible = false;

                return this;
            },

            pop : function(popWin) {
                var queue = this.queue,
                    qname = 'pop';

                this.append(popWin.el);

                if (transform) {
                    
                }
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