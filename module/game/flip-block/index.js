// Flip Block，翻牌游戏
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var client = require('tool/client'),
        queue = require('tool/queue'),

        $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),

        View = B.View,
        Data = B.Collection;


    require('plugin/transit')($);


    var defaults = {
            gap   : 0,
            row   : 3,
            col   : 3,
            step  : 4,
            front : false, 
            back  : false
        },

        styles = {
            cache : {},

            template : _.template([

                '<style type="text/css">',

                    '.zg_flip-block .zg_fb_view-<%= index %> .zg_fb_row {',
                        'height: <%= height + gap %>px;',
                    '}',

                    '.zg_flip-block .zg_fb_view-<%= index %> .zg_fb_col {',
                        'width: <%= width + gap %>px;',
                    '}',

                    '.zg_flip-block .zg_fb_view-<%= index %> .zg_fb_cell {',
                        'padding: <%= gap / 2 %>px;',
                        'width: <%= width %>px;',
                        'height: <%= height %>px;',
                    '}',

                    '<% for(var i = 0, j = row * col; i < j; i++){ %>',
                    '.zg_flip-block .zg_fb_view-<%= index %> .zg_fb_i<%= i %>,',
                    '.zg_flip-block .zg_fb_view-<%= index %> .zg_fb_a<%= i %> {',
                        'background-position: -<%= Math.floor(i % col) * width %>px -<%= Math.floor(i / col) * height %>px;',
                    '}',
                    '<% } %>',

                '</style>'

            ].join('')),

            index : (function() {
                var index = '{row}x{col}-{width}x{height}x{gap}';

                return function(options) {
                    options = options || {};

                    return index.replace(/\{(\w+)\}/g, function(all, name) {
                        return options[name] || '';
                    });
                }
            })()
        },

        support3d = client.support('csstransforms3d') && !client.agent.msie,

        $root = $('html'),
        $head = $('head');


    var Block = View.extend({
            events : {
                'click' : 'clickBlock'
            },

            template : _.template([

                '<div class="zg_fb_spindle">',

                    '<span class="zg_fb_back"></span>',
                    '<span class="zg_fb_front"></span>',

                '</div>',

            ].join('')),

            initialize : function(options) {
                _.extend(this, _.pick(options, ['front', 'back', 'width', 'height']));

                this.reset();
            },

            reset : function() {
                var $elem = this.$el,
                    $spindle,
                    $front,
                    $back,

                    front = this.front,
                    back = this.back,

                    width = this.width,
                    height = this.height,
                    deep = height / 2;

                $elem.html(this.template({}));
                $elem.addClass('zg_fb_block');

                $spindle = this.$('.zg_fb_spindle');
                $front = this.$('.zg_fb_front');
                $back = this.$('.zg_fb_back');

                if (front) {
                    $front.css('background-image', 'url(' + front + ')');
                }

                if (back) {
                    $back.css('background-image', 'url(' + back + ')');
                }

                if (support3d) {
                    $elem.css({'transform': 'translateZ(-' + deep + 'px)'});
                    $front.css({'transform': 'translateZ(' + deep + 'px)'});
                    $back.css({'transform': 'rotateX(-90deg) translateZ(' + deep + 'px)'});
                }

                this.$spindle = $spindle;
                this.$front = $front;
                this.$back = $back;

                return this;
            },

            render : function() {
                return this;
            },

            // 这里做了css兼容
            // 由于IE等不支持css3 transform3d的
            // 需要改为修改opacity
            _show : support3d
            ? function(silent, callback) {
                var $spindle = this.$spindle;

                if (silent) {
                    $spindle.css({rotateX : '90deg'}).each(_.bind(callback, this));
                } else {
                    $spindle.transit({rotateX : '90deg'}, 300, _.bind(callback, this));
                }
            }
            : function(silent, callback) {
                var $front = this.$front;

                if (silent) {
                    $front.hide().each(_.bind(callback, this));
                } else {
                    $front.fadeOut(300, _.bind(callback, this));
                }
            },

            // 这里做了css兼容
            // 由于IE等不支持css3 transform3d的
            // 需要改为修改opacity
            _hide : support3d
            ? function(silent, callback) {
                var $spindle = this.$spindle;

                if (silent) {
                    $spindle.css({rotateX : '0deg'}).each(_.bind(callback, this));
                } else {
                    $spindle.transit({rotateX: '0deg'}, 300, _.bind(callback, this));
                }
            }
            : function(silent, callback) {
                var $front = this.$front;

                if (silent) {
                    $front.show().each(_.bind(callback, this));
                } else {
                    $front.fadeIn(300, _.bind(callback, this));
                }
            },

            show : function(callback, silent) {
                if (_.isBoolean(callback)) {
                    silent = callback;
                    callback = null;
                }

                this._show(!!silent, callback || function() {});

                return this;
            },

            hide : function(callback, silent) {
                if (_.isBoolean(callback)) {
                    silent = callback;
                    callback = null;
                }

                this._hide(!!silent, callback || function() {});

                return this;
            },

            index : function() {
                var prefix = 'zg_fb_i';

                if (arguments.length) {
                    if (this._index !== void 0) {
                        this.$front.removeClass(prefix + this._index);
                    }

                    this._index = arguments[0];
                    this.$front.addClass(prefix + this._index);
                }

                return this._index;
            },

            answer : function() {
                var prefix = 'zg_fb_a';

                if (arguments.length) {
                    if (this._answer !== void 0) {
                        this.$back.removeClass(prefix + this._answer);
                    }

                    this._answer = arguments[0];
                    this.$back.addClass(prefix + this._answer);
                }

                return this._answer;
            },

            clickBlock : function(event) {
                event && event.preventDefault();
                this.trigger('click', this._answer);
            }
        }),

        Fliper = View.extend({

            template : _.template([

                '<div class="zg_fb_view">',

                    '<% for(var i = 0; i < row; i++){ %>',
                    '<div class="zg_fb_row">',

                        '<% for(var j = 0; j < col; j++){ %>',
                        '<div class="zg_fb_col">',

                            '<div class="zg_fb_cell"></div>',

                        '</div>',
                        '<% } %>',

                    '</div>',
                    '<% } %>',

                '</div>'

            ].join('')),

            initialize : function(options) {
                _.extend(this, _.pick((options = _.defaults(options, defaults)), _.keys(defaults)));

                this.blocks = [];

                this.queue = queue(this);
                this.animated = false;

                // this.state 为 -1，即游戏尚未开始
                this.state = -1;

                this.reset();
            },

            reset : function() {
                var $elem = this.$el,
                    $view,
                    $cells,

                    width = this.width,
                    height = this.height,
                    gap = this.gap,
                    row = this.row,
                    col = this.col,

                    styleIndex;

                $elem.html(this.template({
                    row : row,
                    col : col
                }));
                $elem.addClass('zg_flip-block');

                $view = this.$('.zg_fb_view');
                $cells = this.$('.zg_fb_cell');

                if (!width) {
                    width = this.width = Math.floor($elem.width() / col) - gap;
                }

                if (!height) {
                    height = this.height = Math.floor($elem.height() / row) - gap;
                }

                styleIndex = styles.index({
                    row    : row,
                    col    : col,
                    width  : width,
                    height : height,
                    gap    : gap
                });

                if (!styles.cache[styleIndex]) {
                    styles[styleIndex] = $(styles.template({
                        index  : styleIndex,
                        
                        row    : row,
                        col    : col,
                        width  : width,
                        height : height,
                        gap    : gap
                    }));

                    $head.append(styles[styleIndex]);
                    $view.addClass('zg_fb_view-' + styleIndex);
                }

                this.$view = $view;
                this.$cells = $cells;

                return this;
            },

            render : function(init) {
                var front = this.front,
                    back = this.back,
                    width = this.width,
                    height = this.height,

                    block,
                    i = -1,
                    row = this.row,
                    col = this.col,
                    len = row * col;

                while (++i < len) {
                    block = new Block({
                        front  : front,
                        back   : back,
                        width  : width,
                        height : height
                    });

                    block.index(i);

                    this.append(block.render().el, i);
                    this.addItem(block);
                }

                this.random(init || _.range(0, len), true);

                return this;
            },

            append : function(child, index) {
                var $cells = this.$cells;

                if (_.isNumber(index)) {
                    $cells.eq(index).append(child);
                } else {
                    $cells.each(function() {
                        var $cell = $(this);

                        if (!$cell.children().length) {
                            $cell.append(child);
                            return false;
                        }
                    });
                }

                return this;
            },

            addItem : function(block) {
                this.blocks.push(block);
                this.listenTo(block, 'click', function(answer) {
                    // 游戏还没有开始
                    if (this.state < 0) return;

                    this.check(answer);
                });

                return this;
            },

            random : function(seed, show) {
                var blocks = this.blocks,
                    step = this.step,

                    answer;

                _.each(blocks, function(block, index) {
                    answer = seed[index];

                    block.answer(answer);
                    if (show && answer >= 0 && answer < step) {
                        block.show(true);
                    }
                });
            },

            check: function(answer) {
                var blocks = this.blocks,
                    step = this.step,

                    count = 0,
                    len = blocks.length,

                    queue = this.queue,
                    qname = 'rotate';

                if (this.animated) return;
                this.animated = true;

                queue.add(qname, function() {
                    _.each(blocks, function(block) {
                        if (answer == block.answer()) {
                            block.show(function() {
                                queue.next(qname);
                            });
                            return false;
                        }
                    });
                });

                if (this.state == answer) {
                    queue.add(qname, function() {
                        this.state++;

                        if (this.state >= step) {
                            this.state = -1;
                            this.trigger('complete');
                        }

                        queue.next(qname);
                    });
                } else {
                    queue.add(qname, function() {
                        this.state = 0;

                        _.delay(function() {
                            queue.next(qname);
                        }, 100);
                    });

                    queue.add(qname, function() {
                        _.invoke(blocks, 'hide', function() {
                            if (++count >= len) {
                                queue.next(qname);
                            }
                        });
                    });
                }

                queue.add(qname, function() {
                    this.animated = false;
                    queue.next(qname);
                });

                queue.next(qname);
            },

            start: function() {
                var blocks = this.blocks,

                    count,
                    len = blocks.length;

                    queue = this.queue,
                    qname = 'rotate';

                if (this.animated) return;
                this.animated = true;

                queue.add(qname, function() {
                    count = 0;

                    _.invoke(blocks, 'show', function() {
                        if (++count >= len) {
                            queue.next(qname);
                        }
                    });
                });

                queue.add(qname, function() {
                    _.delay(function() {
                        queue.next(qname);
                    }, 100);
                });

                queue.add(qname, function() {
                    count = 0;

                    _.invoke(blocks, 'hide', function() {
                        if (++count >= len) {
                            queue.next(qname);
                        }
                    });
                });

                queue.add(qname, function() {
                    this.animated = false;

                    this.random(_.shuffle(_.range(0, len)));

                    this.state = 0;
                    this.trigger('start');

                    queue.next(qname);
                });

                queue.next(qname);
            }
        });


    module.exports = Fliper;

});