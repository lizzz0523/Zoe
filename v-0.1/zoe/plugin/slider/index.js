// Slider组件，属于MultiView组件的一类（基础了Panel）
// 主要用于图片切换和焦点图效果
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var queue = require('tool/queue'),

        $ = require('jquery'),
        _ = require('underscore'),

        ZView = require('plugin/view/index'),
        ZPanel = require('plugin/panel/index'),
        ZMenu = require('plugin/menu/index'),
        ZPage = require('plugin/page/index');


    var defaults = {
            'nav'      : false,
            'page'     : false,
            'auto'     : true,
            'interval' : 5000,
            'hover'    : true,
            'loop'     : true,
            'vertical' : false,
            
            // 由于slider是空间上的变换，需要比panel更长的变换时间
            'speed'    : 500
        };


    var ZBlock = ZView.extend({
            terminal : true,

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children();

                $data.detach();

                $elem.html(this.template({}));
                $elem.addClass('z_slider_block');

                this.$data = $data;
                this.$inner = $elem;

                return this;
            }
        }),

        ZSlider = ZPanel.extend({
            template : _.template([

                '<div class="z_slider_mask">',
                    '<div class="z_slider_view <% if(vertical){ %>z_slider_view-v<% }else{ %>z_slider_view-h<% } %>"></div>',
                '</div>'
            
            ].join('')),

            events : {
                'mouseenter' : 'hoverIn',
                'mouseleave' : 'hoverOut'
            },

            initialize : function(options) {
                _.extend(this, _.pick(options = _.defaults(options, defaults), _.keys(defaults)));

                // 这里的队列是用于处理效果的触发
                // 以免出现漏帧
                this.queue = queue(this);
                
                this.fxFade = false;
                this.fxAuto = false;

                ZPanel.prototype.initialize.call(this, options);
            },

            reset : function() {
                var $elem = this.$el,
                    $data = $elem.children(),
                    
                    $view,
                    $mask,

                    vertical = this.vertical;

                $data.detach();

                $elem.html(this.template({
                    vertical : vertical
                }));
                $elem.addClass('z_slider');

                $view = this.$('.z_slider_view');
                $mask = this.$('.z_slider_mask');

                this.$data = $data;
                this.$inner = $view;

                this.$view = $view;
                this.$mask = $mask;

                return this;
            },

            render : function() {
                var $data = this.$data,

                    data = this.data,
                    tmpl = this.tmpl,

                    init = this.init;

                if (data) {
                    data.each(function(model) {
                        var item = new ZBlock({
                                zid  : model.id || model.cid,

                                data : model.toJSON(),
                                tmpl : tmpl
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }, this);
                } else {
                    _.each($data, function(elem) {
                        var item = new ZBlock({
                                zid : elem.id || void 0
                            });

                        this.append(item.stack(elem).render().el);
                        this.addItem(item);
                    }, this);
                }

                this.cache();
                this.start(init);

                return this;
            },

            start : function(init) {
                if (this.nav) {
                    this.nav = {
                        tmpl    : _.template('<a href="#nav/<%= target %>"><%= text %></a>'),
                        pattern : /^nav\/([\d\w][\d\w\s\-]*)$/,
                        repeat  : true
                    };

                    this.navNext = new ZMenu(_.extend(this.nav, {
                        data : {
                            target : 'next',
                            text : '&gt;'
                        }
                    }));
                    this.navNext.$el.addClass('z_slider_nav z_slider_next');

                    this.append(this.navNext.render().el, true);
                    this.addControl(this.navNext);

                    this.navPrev = new ZMenu(_.extend(this.nav, {
                        data : {
                            target : 'prev',
                            text : '&lt;'
                        }
                    }));
                    this.navPrev.$el.addClass('z_slider_nav z_slider_prev');

                    this.append(this.navPrev.render().el, true);
                    this.addControl(this.navPrev);
                }

                if (this.page) {
                    this.page = {
                        data : new Array(this.size()),
                        init  : init
                    };

                    this.pageBtn = new ZPage(this.page);
                    this.pageBtn.$el.addClass('z_slider_page');

                    this.append(this.pageBtn.render().el, true);
                    this.addControl(this.pageBtn);
                }

                if (this.nav && this.hover) {
                    this.fxActive = {
                        timeId : setTimeout(_.bind(this.active, this, true), 2000)
                    }
                }

                if (this.auto) {
                    this.fxPlay = {
                        timeId : setInterval(_.bind(this.play, this), this.interval),
                        locked : false
                    }
                }

                this.show(init);
            },

            validIndex : function(index) {
                var loop = this.loop,

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

            updateIndex : function(index) {
                ZPanel.prototype.updateIndex.call(this, index);

                if (this.pageBtn) {
                    this.pageBtn.active(this.curIndex);
                }
            },

            show : function(index) {
                var $elem = this.$el,

                    items = this.items,
                    curIndex = this.curIndex,
                    
                    next,

                    visible = this.visible;

                if (!visible) {
                    $elem.show();
                }

                if (index != void 0) {
                    // 判断传入的index是否next或者prev
                    next = String(index).match(/^next|prev$/)
                    ? index == 'next'
                    : void 0;

                    index = this.validIndex(index);
                    
                    if (curIndex != index) {
                        this.slideBuffer(index, next);
                    }
                }

                this.visible = true;

                return this;
            },

            slideBuffer : function(index, next) {
                var items = this.items,
                    curIndex = this.curIndex,
                    animated = this.animated,

                    queue = this.queue,
                    qname = 'slide',
                    qsize = queue.size(qname);

                queue.clear(qname);

                // curIndex == -1
                // 说明控件仍未初始化
                if (curIndex == -1) {
                    queue.add(qname, function(){
                        _.defer(function(){
                            queue.next(qname);
                        });
                    });

                    queue.add(qname, function() {
                        _.invoke(items, 'hide');
                        items[index].show();

                        this.updateIndex(index);

                        queue.next(qname);
                    });
                } else {
                    queue.add(qname, function(){
                        // 加一个160毫秒的delay
                        // 可以减缓响应速度
                        // 感觉更真实
                        _.delay(function(){
                            queue.next(qname);
                        }, 160);
                    });

                    queue.add(qname, function() {
                        this.animated = true;
                        this.slideTo(index, next, function() {
                            this.animated = false;
                            queue.next(qname);
                        });
                        
                        this.updateIndex(index);
                    });
                }

                if (!qsize && !animated) {
                    queue.next(qname);
                }

                // 这里不使用debounce的来完成响应延迟的主要原因是
                // debounce会影响event当前的状态，例如currentTarget的值
                // 由于事件冒泡，currentTarget会变为其父元素
            },

            slideTo : function(index, next, callback) {
                var items = this.items,
                    curIndex = this.curIndex,
                    type;

                if (_.isBoolean(next) ? next : index > curIndex) {
                    type = ZSlider.TYPE_NEXT;
                    this.append(items[index].el);
                } else {
                    type = ZSlider.TYPE_PREV;
                    this.prepend(items[index].el);
                }

                items[index].show();

                if (_.isFunction(callback)) {
                    callback = _.wrap(callback, function(callback) {
                        items[curIndex].hide();
                        callback.call(this);
                    });
                } else {
                    callback = function() {
                        items[curIndex].hide();
                    }
                }

                this.slide(type, callback);
            },

            slide : function(type, callback) {
                var $slider = this.$view,

                    vertical = this.vertical,

                    init = {},
                    dest = {};

                switch (type) {
                    case ZSlider.TYPE_PREV :
                        if (vertical) {
                            init.top = '-100%';
                            dest.top = '0';
                        } else {
                            init.left = '-100%';
                            dest.left = '0';
                        }

                        break;

                    case ZSlider.TYPE_NEXT :
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
                        $slider.css({left : 0, top : 0});
                        callback.call(this);
                    });
                } else {
                    callback = function() {
                        $slider.css({left : 0, top : 0});
                    }
                }

                $slider.css(init).animate(dest, this.speed, _.bind(callback, this));
            },

            next : function() {
                this.show('next');
            },

            prev : function() {
                this.show('prev');
            },

            active : function(toggle) {
                this.fxPlay && (this.fxPlay.locked = !toggle);

                if (this.fxActive) {
                    clearTimeout(this.fxActive.timeId);
                    this.$el.toggleClass('inactive', !!toggle);
                }
            },

            play : function() {
                if (this.fxPlay && !this.fxPlay.locked) {
                    this.next();
                }
            },

            hoverIn : function(event) {
                event && event.preventDefault();
                this.active(false);
            },

            hoverOut : function(event) {
                event && event.preventDefault();
                this.active(true);
            }
        }, {
            TYPE_PREV : 1,
            TYPE_NEXT : 2
        });


    module.exports = ZSlider;

});