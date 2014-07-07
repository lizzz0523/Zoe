define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),
        
        utils = require('tool/utils');
        Pagination = require('plugin/pagination/index');


    var defaults = {
            'nav'      : false,
            'page'     : false,
            'auto'     : true,
            'loop'     : true,
            'hover'    : true,
            'vertical' : false,
            'speed'    : 300,
            'interval' : 5000
        };


    var SliderItem = B.View.extend({

            tagName : 'div',

            className : 'z_slider_item',

            initialize : function(options) {
                this.itemId = options.itemId;
            },

            show : function() {
                this.$el.show();
            },

            hide : function() {
                this.$el.hide();
            }

        }),

        Slider = B.View.extend({

            template : [

                '<div class="z_slider_view">',
                    '<div class="z_slider_wraper"></div>',
                '</div>',

                '<div class="z_slider_nav z_slider_prev">',
                    '<a href="#nav:prev">&lt</a>',
                '</div>',
                
                '<div class="z_slider_nav z_slider_next">',
                    '<a href="#nav:next">&gt</a>',
                '</div>'

            ].join(''),
            
            events : {
                'click .z_slider_nav a' : 'clickNav',

                'mouseenter' : 'hoverIn',
                'mouseleave' : 'hoverOut'
            },

            initialize : function(options) {
                options = _.defaults(options, defaults);
                
                this.isLoop = options.loop;
                this.isVertical = options.vertical;
                this.speed = options.speed;
                this.interval = options.interval;
                
                // 这里的队列是用于处理slide的触发
                // 以免出现漏帧
                this.queue = utils.Queue(this);

                // 重组整个控件的dom结构
                this.render();

                // 提取出控件中的dom成员
                this.$view = this.$('.z_slider_view');
                this.$slider = this.$('.z_slider_wraper');
                this.$nav = this.$('.z_slider_nav');

                if (!options.nav) {
                    this.$nav.hide();
                }

                // 初始化slider item
                this.items = this.$items.map(function() {
                    var $elem = $(this),

                        itemId = $elem.attr('id') || void 0,
                        item;

                    item = new SliderItem({
                        itemId : itemId
                    });

                    item.$el.append(this);
                    item.hide();

                    return item;
                }).get();

                this.curIndex = -1;
                this.minIndex = 0;
                this.maxIndex = this.size() - 1;

                this.id2Index = _.reduce(this.items, function(hash, item, index) {
                    var itemId = item.itemId;

                    if (itemId != void 0) {
                        hash[itemId] = index;
                    }

                    return hash;
                }, {});

                // 初始化slider page
                this.page = new Pagination({
                    default : true,
                    total : this.size(),
                    current : options.current && (options.current + 1)
                });

                this.$el.append(this.page.$el);

                this.listenTo(this.page, 'update', function(page) {
                    this.goto(page);
                });

                this.page.listenTo(this, 'update', function(index) {
                    this.goto(index);
                });
                
                if (!options.page) {
                    this.page.hide();
                }

                this.reset(options.current);

                this.fxFade = false;
                this.fxAuto = false;
                
                if (options.nav && options.hover) {
                    this.fxFade = {
                        timeId : setTimeout(_.bind(this.active, this, false), 2000)
                    }
                }

                if (options.auto) {
                    this.fxAuto = {
                        timeId : setInterval(_.bind(this.play, this), this.interval),
                        locked : false
                    }
                }
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children();

                // 首先从dom中提取出内容
                $items.detach();

                // 并重新写入结构
                $elem.html(this.template);
                $elem.addClass('z_slider');

                this.$items = $items;

                return this;
            },

            reset : function(initIndex) {
                var $view = this.$view,
                    $slider = this.$slider,

                    items = this.items;

                if (this.isVertical) {
                    $slider.height('200%');
                    _.each(items, function(item) {
                        $slider.append(item.$el.height('50%'));
                    });
                } else {
                    $slider.width('200%');
                    _.each(items, function(item) {
                        $slider.append(item.$el.width('50%'));
                    });
                }

                this.slideTo(this.validIndex(initIndex || this.minIndex));
            },

            slideTo : function(index, strict, callback) {
                var $slider = this.$slider,

                    isVertical = this.isVertical,
                    prevIndex = this.curIndex,
                    items = this.items,
                    item,
                    type;

                if (prevIndex == index) return;
                item = items[index];
                item.show();

                if (_.isBoolean(strict) ? strict : prevIndex > index) {
                    item.$el.prependTo($slider);
                    type = isVertical ? Slider.FROM_TOP : Slider.FROM_LEFT;
                } else {
                    item.$el.appendTo($slider);
                    type = isVertical ? Slider.FROM_BOTTOM : Slider.FROM_RIGHT;
                }

                if (prevIndex != -1) {
                    if (_.isFunction(callback)) {
                        callback = _.wrap(callback, function(callback) {
                            this.items[prevIndex].hide();
                            this.animated = false;

                            callback.call(this);
                        });
                    } else {
                        callback = function() {
                            this.items[prevIndex].hide();
                            this.animated = false;
                        }
                    }

                    this.animated = true;
                    this.slide(type, callback);
                } else {
                    if (_.isFunction(callback)) {
                        callback.call(this);
                    }
                }

                this.curIndex = index;
                this.trigger('update', this.curIndex);
            },

            slide : function(type, callback) {
                var $slider = this.$slider,

                    init = {},
                    dest = {};

                switch (type) {
                    case Slider.FROM_TOP :
                        init.top = '-100%';
                        dest.top = '0';

                        break;

                    case Slider.FROM_BOTTOM :
                        init.top = '0';
                        dest.top = '-100%';

                        break;

                    case Slider.FROM_LEFT :
                        init.left = '-100%';
                        dest.left = '0';

                        break;

                    case Slider.FROM_RIGHT :
                        init.left = '0';
                        dest.left = '-100%';

                        break;
                }

                if (_.isFunction(callback)) {
                    callback = _.wrap(callback, function(callback) {
                        this.$slider.css({left : 0, top : 0});
                        callback.call(this);
                    });
                } else {
                    callback = function() {
                        this.$slider.css({left : 0, top : 0});
                    }
                }

                $slider.css(init).animate(dest, this.speed, _.bind(callback, this));
            },

            validIndex : function(index) {
                var isLoop = this.isLoop,
                    minIndex = this.minIndex,
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
                        index = isLoop ? minIndex : maxIndex;
                    }

                    if (index < minIndex) {
                        index = isLoop ? maxIndex : minIndex;
                    }
                } else {
                    index = minIndex;
                }

                return index;
            },

            slideBuffer : function(index, strict) {
                var queue = this.queue,
                    isEmpty = !queue.size('slide');

                queue.clear('slide');

                queue.add('slide', function(){
                    // 加一个160毫秒的delay
                    // 可以减缓响应速度
                    // 感觉更真实
                    _.delay(function(){
                        queue.next('slide');
                    }, 100);
                });

                queue.add('slide', function() {
                    this.slideTo(index, strict, function() {
                        queue.next('slide');
                    });
                });
              
                if (isEmpty && !this.animated) {
                    queue.next('slide');
                }

                // 这里不使用debounce的来完成响应延迟的主要原因是
                // debounce会影响event当前的状态，例如currentTarget的值
                // 由于事件冒泡，currentTarget会变为其父元素
            },

            goto : function(index) {
                index = this.validIndex(index);
                this.slideBuffer(index);
            },

            next : function() {
                var index = this.validIndex('next');
                this.slideBuffer(index, false);
            },

            prev : function() {
                var index = this.validIndex('prev');
                this.slideBuffer(index, true);
            },

            show : function() {
                this.$el.show();
            },

            hide : function() {
                this.$el.hide();
            },

            active : function(toggle) {
                if (this.fxAuto) {
                    this.fxAuto.locked = !!toggle;
                }

                if (this.fxFade) {
                    clearTimeout(this.fxFade.timeId);
                    this.$el.toggleClass('inactive', !toggle);
                }
            },

            play : function() {
                if (!this.fxAuto || this.fxAuto.locked) return;
                this.next(); 
            },

            size : function() {
                return this.items.length;
            },

            clickNav : function(event) {
                var target = event.currentTarget,
                    hash = utils.parseHash(target.href);

                event && event.preventDefault();

                if (hash = hash.match(/^nav:([\d\w][\d\w\s]*)$/)) {
                    switch (hash[1]) {
                        case 'prev' :
                            this.prev();
                            break;

                        case 'next' :
                            this.next();
                            break;

                        default :
                            this.goto(hash[1]);
                            break;
                    }
                }
            },

            hoverIn : function(event) {
                event && event.preventDefault();
                this.active(true);
            },

            hoverOut : function(event) {
                event && event.preventDefault();
                this.active(false);
            }
            
        }, {
            FROM_TOP : 1,
            FROM_BOTTOM : 2,
            FROM_LEFT : 4,
            FROM_RIGHT : 8
        });


    module.exports = Slider;

});