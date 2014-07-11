define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View,
        
        Panel = require('plugin/panel/index'),
        Menu = require('plugin/menu/index'),
        Page = require('plugin/page/index');


    var defaults = {
            'nav'      : false,
            'page'     : false,
            'auto'     : false,
            'loop'     : true,
            'hover'    : true,
            'vertical' : false,
            'interval' : 5000,

            'speed'    : 300,
            'current'  : 0
        };


    var SliderItem = View.extend({

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

        Slider = Panel.extend({

            template : [

                '<div class="z_slider_view">',
                    '<div class="z_slider_wraper"></div>',
                '</div>'
            
            ].join(''),

            events : {
                'mouseenter' : 'hoverIn',
                'mouseleave' : 'hoverOut'
            },

            initialize : function(options) {
                options = _.defaults(options, defaults);

                Panel.prototype.initialize.call(this, options);

                if (options.nav) {
                    this.nav = {
                        remote   : [],
                        template : _.template('<a href="#nav:<%= target %>"><%= text %></a>'),
                        pattern  : /^nav:([\d\w][\d\w\s\-]*)$/,
                        repeat   : true
                    };

                    this.navNext = new Menu(_.extend(this.nav, {
                        remote : [{
                            target : 'next',
                            text : '&gt;'
                        }]
                    }));
                    this.navNext.$el.addClass('z_slider_nav z_slider_next');
                    this.addControl(this.navNext, true);

                    this.navPrev = new Menu(_.extend(this.nav, {
                        remote : [{
                            target : 'prev',
                            text : '&lt;'
                        }]
                    }));
                    this.navPrev.$el.addClass('z_slider_nav z_slider_prev');
                    this.addControl(this.navPrev, true);
                }

                if (options.page) {
                    this.page = new Page({
                        total : this.size(),
                        current : options.current
                    });
                    this.page.$el.addClass('z_slider_page');
                    this.addControl(this.page, true);
                }
                
                this.fxFade = false;
                this.fxAuto = false;

                if (options.nav && options.hover) {
                    this.fxActive = {
                        timeId : setTimeout(_.bind(this.active, this, false), 2000)
                    }
                }

                if (options.auto) {
                    this.fxPlay = {
                        timeId : setInterval(_.bind(this.play, this), options.interval),
                        locked : false
                    }
                }
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children(),
                    $view,
                    $slider,

                    options = this.options,
                    vertical = options.vertical;

                $items.detach();

                $elem.html(this.template);
                $elem.addClass('z_slider');

                $view = this.$('.z_slider_view');
                $slider = this.$('.z_slider_wraper');

                if (vertical) {
                    $elem.addClass('z_slider-v');
                } else {
                    $elem.addClass('z_slider-h');
                }

                this.$items = $items;
                this.$inner = $slider;

                this.$view = $view;
                this.$slider = $slider;
            },

            reset : function() {
                var $items = this.$items,

                    items = this.items,

                    options = this.options,
                    current = options.current,
                    remote = options.remote,
                    template = options.template;

                if (remote && template && _.isFunction(template)) {
                    // 如果数据来源外部
                    // 则需要根据模板重新渲染
                    if (_.isArray(remove)) {
                        _.each(remote, function(data) {
                            var itemId = data.id || void 0,
                                item;

                            item = new SliderItem({
                                itemId : itemId
                            });
                            item.$el.html(template(data));

                            this.addItem(item);
                        }, this)
                    } else {
                        remote.each(function(model) {
                            var itemId = model.id || model.cid,
                                item;

                            item = new SliderItem({
                                itemId : itemId
                            });
                            item.$el.html(template(model.toJSON()));

                            this.addItem(item);
                        }, this);
                    }
                } else {
                    _.each($items, function(elem) {
                        var itemId = elem.id || void 0,
                            item;

                        item = new SliderItem({
                            itemId : itemId
                        });
                        item.$el.html(elem);

                        this.addItem(item);
                    }, this);
                }

                this.cache();
                this.show(current);
            },

            validIndex : function(index) {
                var options = this.options,
                    loop = options.loop,

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
                        index = loop ? minIndex : maxIndex;
                    }

                    if (index < minIndex) {
                        index = loop ? maxIndex : minIndex;
                    }
                } else {
                    index = minIndex;
                }

                return index;
            },

            slideBuffer : function(index, next) {
                var items = this.items,
                    curIndex = this.curIndex,

                    animated = this.animated,
                    queue = this.queue,
                    size = queue.size('slide');

                queue.clear('slide');

                if (curIndex == -1) {
                    queue.add('slide', function(){
                        _.defer(function(){
                            queue.next('slide');
                        });
                    });

                    queue.add('slide', function() {
                        // curIndex == -1
                        // 说明控件仍未初始化
                        _.each(items, function(item) {
                            item.hide();
                        });
                        items[index].show();

                        this.update(index);

                        queue.next('slide');
                    });
                } else {
                    queue.add('slide', function(){
                        // 加一个160毫秒的delay
                        // 可以减缓响应速度
                        // 感觉更真实
                        _.delay(function(){
                            queue.next('slide');
                        }, 160);
                    });

                    queue.add('slide', function() {
                        this.animated = true;
                        this.slideTo(index, next, function() {
                            this.animated = false;
                            queue.next('slide');
                        });
                        
                        this.update(index);
                    });
                }

                if (!size && !animated) {
                    queue.next('slide');
                }

                // 这里不使用debounce的来完成响应延迟的主要原因是
                // debounce会影响event当前的状态，例如currentTarget的值
                // 由于事件冒泡，currentTarget会变为其父元素
            },

            slideTo : function(index, next, callback) {
                var $slider = this.$slider,

                    curIndex = this.curIndex,
                    items = this.items,
                    type;

                items[index].show();

                if (_.isBoolean(next) ? next : index > curIndex) {
                    type = Slider.TYPE_NEXT;
                    items[index].$el.appendTo($slider);
                } else {
                    type = Slider.TYPE_PREV;
                    items[index].$el.prependTo($slider);
                }

                if (_.isFunction(callback)) {
                    callback = _.wrap(callback, function(callback) {
                        this.items[curIndex].hide();
                        callback.call(this);
                    });
                } else {
                    callback = function() {
                        this.items[prevIndex].hide();
                    }
                }

                this.slide(type, callback);
            },

            slide : function(type, callback) {
                var $slider = this.$slider,

                    options = this.options,
                    vertical = options.vertical,

                    init = {},
                    dest = {};

                switch (type) {
                    case Slider.TYPE_PREV :
                        if (vertical) {
                            init.top = '-100%';
                            dest.top = '0';
                        } else {
                            init.left = '-100%';
                            dest.left = '0';
                        }

                        break;

                    case Slider.TYPE_NEXT :
                        if (vertical) {
                            init.top = '0';
                            dest.top = '-100%';
                        } else {
                            init.left = '0';
                            dest.left = '-100%';
                        }

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

            show : function(index) {
                var items = this.items,
                    curIndex = this.curIndex,
                    next;

                if (!this.visible) {
                    this.$el.show();
                    this.visible = true;

                    if (curIndex != -1) {
                        items[curIndex].show();
                    }
                }

                if (index == void 0) return;

                if (_.isString(index) && index.match(/^next|prev$/)) {
                    next = index == 'next';
                }

                index = this.validIndex(index);
                if (curIndex == index) return;

                this.slideBuffer(index, next);
            },

            update : function(index) {
                Panel.prototype.update.call(this, index);

                if (this.page) {
                    this.page.active(this.curIndex);
                }
            },

            next : function() {
                this.show('next');
            },

            prev : function() {
                this.show('prev');
            },

            active : function(toggle) {
                this.fxPlay && (this.fxPlay.locked = !!toggle);

                if (this.fxActive) {
                    clearTimeout(this.fxActive.timeId);
                    this.$el.toggleClass('inactive', !toggle);
                }
            },

            play : function() {
                if (this.fxPlay && !this.fxPlay.locked) {
                    this.next();
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
            TYPE_PREV : 1,
            TYPE_NEXT : 2
        });


    module.exports = Slider;

});