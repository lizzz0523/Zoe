/*
    by lizzz(https://github.com/lizzz0523)
*/

(function(Z, _, B, window) {

"use strict";

var tmpl = [

        '<div class="slider_view">',
            '<div class="slider_wraper">',
                '<% for(var i = 0; i < items.length; i++) { %>',
                '<div class="slider_item">',
                    '<%= items[i].html %>',
                '</div>',
                '<% } %>',
            '</div>',
        '</div>',

        '<div class="slider_nav slider_prev">',
            '<a href="#prev">&lt;</a>',
        '</div>',
        '<div class="slider_nav slider_next">',
            '<a href="#next">&gt;</a>',
        '</div>',

        '<div class="slider_page">',
            '<% for(var i = 0; i < items.length; i++) { %>',
            '<a href="#<%= i %>"><%= i + 1 %></a>',
            '<% } %>',
        '</div>'

    ].join(''),

    defaults = {
        'nav'      : false,
        'page'     : false,
        'auto'     : true,
        'loop'     : true,
        'hover'    : true,
        'vertical' : false,
        'speed'    : 500,
        'interval' : 5000
    },

    getHTML = function(elem) {
        return elem.outerHTML;
    },

    getHash = function(link) {
        // 提取href中的hash部分
        // 因为动态生成的anchor标签（通过innerHTML）
        // 其hash属性为空

        var hash = link.href;

        if(hash.indexOf('#') == -1) return '';
        hash = hash.split('#').pop();

        return hash;
    };


var Slider = Z.View.Slider = B.View.extend({

    template : _.template(tmpl),
    
    events : {
        'click .slider_nav a' : 'activePage',
        'click .slider_page a' : 'activePage',
        'mouseenter .slider_page a' : 'activePage',

        'mouseenter' : 'hoverIn',
        'mouseleave' : 'hoverOut'
    },

    initialize : function(options) {
        this.isLoop = options.isLoop;
        this.isVertical = options.isVertical;
        this.speed = options.speed;
        this.interval = options.interval;

        // 建立控件标签，绑定事件
        this.build(options.hasPage, options.hasNav);
        this.resize();
        this.cacheIndex();
        this.bindEvent(options.hasPage, options.isHover);

        
        // 这里的队列是用于处理slide的触发
        // 以免出现漏帧
        this.queue = Z.Queue(this);
        this.curPage = -1;
        this.minPage = 0;
        this.maxPage = this.size() - 1;

        this.slideToPage(options.current || 0);


        this.fxFade = false;
        this.fxAuto = false;
        
        if (options.hasNav && options.isHover) {
            this.fxFade = {
                timeId : setTimeout(_.bind(this.active, this, false), 2000)
            }
        }

        if (options.isAuto) {
            this.fxAuto = {
                timeId : setInterval(_.bind(this.play, this), this.interval),
                locked : false
            }
        }
    },

    // build 方法
    // 用于改造标签结构，以提供动画所用
    build : function(hasPage, hasNav) {
        this.$el.html(this.template({
            items : this.$el.children().map(function(k) {
                return {
                    html : getHTML(this)
                };
            }).get()
        }));

        // 提交控件对应的class，链接css
        this.$el.addClass('zoe-slider');


        // 缓存dom结构，方便后期使用
        this.$view = this.$('.slider_view');
        this.$slider = this.$('.slider_wraper');
        this.$items = this.$('.slider_item');
        this.$page = this.$('.slider_page');
        this.$nav = this.$('.slider_nav');


        this.$items.hide();
        this.$page.toggle(hasPage);
        this.$nav.toggle(hasNav);
    },

    resize : function() {
        var $view = this.$view,
            $slider = this.$slider,
            $items = this.$items,
            viewLength;


        if (this.isVertical) {
            viewLength = $view.height();

            $slider.height(2 * viewLength);
            $items.height(viewLength);
        } else {
            viewLength = $view.width();

            $slider.width(2 * viewLength);
            $items.width(viewLength);
        }

        this.viewLength = viewLength;
    },

    cacheIndex : function() {
        var $items = this.$items,
            cache = {};

        // 用于保存slider内部zoe-index与
        // 元素index对应起来
        $items.each(function(i) {
            var index = $(this).children().data('index');
            if (index) cache[index] = i;
        });

        this.cache = cache;
    },

    bindEvent : function(hasPage, isHover) {
        this.on('resize', this.resize);

        if (hasPage) {
            this.on('change', this.highlight);
        }

        if (isHover) {
            this.on('hover', this.active);
        }
    },

    hoverIn : function(event) {
        event && event.preventDefault();
        this.trigger('hover', true);
    },

    hoverOut : function(event) {
        event && event.preventDefault();
        this.trigger('hover', false);
    },

    activePage : function(event) {
        var page = getHash(event.currentTarget),
            strict = Slider.STRICT[page];

        event && event.preventDefault();

        if (!page.length) return;
        page = this.validPage(page);

        this.slideBuffer(page, strict);
    },

    validPage : function(page) {
        var isLoop = this.isLoop,
            minPage = this.minPage,
            maxPage = this.maxPage;

        if (page === 'next') {
            page = this.curPage + 1;
        }

        if (page === 'prev') {
            page = this.curPage - 1;
        }

        if(_.isFinite(page)) {
            page = +page;

            if (page > maxPage) {
                page = isLoop ? minPage : maxPage;
            }

            if (page < minPage) {
                page = isLoop ? maxPage: minPage;
            }
        } else {
            page = 0;
        }

        return page;
    },

    slideBuffer : function(page, strict) {
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
            this.slideToPage(page, strict, function() {
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

    slideToPage : function(page, strict, callback) {
        var $slider = this.$slider,
            $items = this.$items,
            isVertical = this.isVertical,
            prev = this.curPage,
            dir;

        if (prev == page) return;

        if (_.isBoolean(strict) ? strict : prev > page) {
            $items.eq(page).show().prependTo($slider);
            dir = isVertical ? Slider.DIR_TOP : Slider.DIR_LEFT;
        } else {
            $items.eq(page).show().appendTo($slider);
            dir = isVertical ? Slider.DIR_BOTTOM : Slider.DIR_RIGHT;
        }

        if (prev != -1) {
            if (_.isFunction(callback)) {
                callback = _.wrap(callback, function(callback) {
                    this.$items.eq(prev).hide();
                    this.animated = false;
                    callback.call(this);
                });
            } else {
                callback = function() {
                    this.$items.eq(prev).hide();
                    this.animated = false;
                }
            }

            this.animated = true;
            this.transit(dir, _.bind(callback, this));
        } else {
            if (_.isFunction(callback)) {
                callback.call(this);
            }
        }

        this.curPage = page;
        this.trigger('change', this.curPage);
    },

    transit : function(dir, callback) {
        var $slider = this.$slider,

            init = {},
            dest = {};

        switch (dir) {
            case Slider.DIR_TOP :
                init.top = -this.viewLength;
                dest.top = 0;

                break;

            case Slider.DIR_BOTTOM :
                init.top = 0;
                dest.top = -this.viewLength;

                break;

            case Slider.DIR_LEFT :
                init.left = -this.viewLength;
                dest.left = 0;

                break;

            case Slider.DIR_RIGHT :
                init.left = 0;
                dest.left = -this.viewLength;

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

    highlight : function(page) {
        var $pages = this.$page.find('a');
        
        $pages.removeClass('active');
        $pages.eq(page).addClass('active');
    },

    active : function(toggle) {
        if (this.fxAuto) {
            this.fxAuto.locked = !!toggle;
        }

        if (this.fxFade) {
            clearTimeout(this.fxFade.timeId);
            this.$nav[toggle ? 'fadeIn' : 'fadeOut'](200);
        }
    },

    play : function() {
        if (!this.fxAuto || this.fxAuto.locked) return;
        this.next(); 
    },

    index : function(index) {
        var cache = this.cache,
            page = cache[index];

        if (_.isUndefined(page)) return;
        page = this.validPage(page);

        this.slideBuffer(page, false);
    },

    page : function(page) {
        if (!_.isFinite(page)) return;
        page = this.validPage(page);

        this.slideBuffer(page, false);
    },

    next : function() {
        var page = this.validPage('next'),
            strict = Slider.STRICT['next'];

        this.slideBuffer(page, strict);
    },

    prev : function() {
        var page = this.validIndex('prev'),
            strict = Slider.STRICT['prev'];

        this.slideBuffer(page, strict);
    },

    size : function() {
        return this.$items.length;
    }
    
}, {
    DIR_TOP : 1,
    DIR_BOTTOM : 2,
    DIR_LEFT : 4,
    DIR_RIGHT : 8,
    STRICT : {
        next : false,
        prev : true
    }
});


B.$('[data-zoe^=slider]').each(function() {

    var $elem = B.$(this),

        opts = $elem.data('zoe'),
        id = $elem.data('id'),

        views = Z.data(window, 'zoe');

    opts = Z.parseParam(opts);
    opts = _.defaults(opts, defaults);

    if (!id) {
        id = 'zoe-' + Z.guid();
        $elem.data('id', id);
    }

    if (!views) {
        views = {};
    }

    if (!views[id]) {
        views[id] = new Slider({
            el         : this,

            hasNav     : opts.nav,
            hasPage    : opts.page,
            isAuto     : opts.auto,
            isLoop     : opts.loop,
            isVertical : opts.vertical,
            isHover    : opts.hover,
            speed      : opts.speed,
            interval   : opts.interval
        });
    }

    Z.data(window, 'zoe', views);
});

})(Zoe, _, Backbone, this);