define(function(require, exports, module) {

    var utils = require('tool/utils'),

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View;


    var defaults = {
            current : 0
        };


    var PanelItem = View.extend({

            tagName : 'div',

            className : 'z_panel_item',

            initialize : function(options) {
                this.itemId = options.itemId;
            },

            show : function(silent) {
                if (silent) {
                    this.$el.show();
                } else {
                    this.$el.fadeIn(500);
                }
            },

            hide : function() {
                this.$el.hide();
            }

        }),

        Panel = View.extend({

            template : [

                '<div class="z_panel_view"></div>',

            ].join(''),
            
            initialize : function(options) {
                this.options = _.defaults(options, defaults);

                this.visible = true;
                this.items = [];
                this.controls = [];

                this.render();

                // 重组整个控件的dom结构
                if (this.options.remote) {
                    this.listenTo(this.options.remote, 'reset', this.reset);
                } else {
                    this.reset();
                }
            },

            render : function() {
                var $elem = this.$el,

                    $items = $elem.children(),
                    $view;

                // 从dom中取出原有内容
                $items.detach();

                // 重新写入dom结构
                $elem.html(this.template);
                $elem.addClass('z_panel');

                // 提取dom结构
                $view = this.$('.z_panel_view');

                this.$items = $items;
                this.$view = $view;
            },

            reset : function() {
                var items = this.items,
                    options = this.options,
                    cache = {},
                    min,
                    max;
            },

            reset : function() {
                var $items = this.$items,

                    items = this.items,
                    options = this.options,
                    remote = options.remote,
                    template = options.template;

                if (remote && template && _.isFunction(template)) {
                    // 如果数据来源外部
                    // 则需要根据模板重新渲染
                    remote.each(function(model) {
                        var itemId = model.id || model.cid,
                            item;

                        item = new PanelItem({
                            itemId : itemId
                        });
                        item.$el.html(template(model.toJSON()));

                        this.addItem(item);
                    }, this);
                } else {
                    _.each($items, function(elem) {
                        var itemId = elem.id || void 0,
                            item;

                        item = new PanelItem({
                            itemId : itemId
                        });
                        item.$el.html(elem);

                        this.addItem(item);
                    }, this);
                }

                this.cache();
                this.show(options.current);
            },

            cache : function() {
                var items = this.items,
                    cache = {};

                _.each(items, function(item, index) {
                    var itemId = item.itemId;

                    if (itemId != void 0) {
                        cache[itemId] = index;
                    }
                });

                this.id2Index = cache;
                this.minIndex = 0;
                this.maxIndex = items.length - 1;
                this.curIndex = -1;
            },

            addItem : function(item) {
                var $view = this.$view,

                    panel = this,
                    items = this.items;

                $view.append(item.$el);
                items.push(item);
            },

            addControl : function(control, append) {
                var $elem =  this.$el,

                    panel = this,
                    controls = this.controls;

                if (append) {
                    $elem.append(control.$el);
                }
                controls.push(control);

                panel.listenTo(control, 'update', panel.show);
                control.listenTo(this, 'update', control.active);
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

            show : function(index) {
                var items = this.items,
                    curIndex = this.curIndex;

                if (!this.visible) {
                    this.$el.show();
                    this.visible = true;

                    if (curIndex != -1) {
                        items[curIndex].show(true);
                    }
                }

                if (index == void 0) return;

                index = this.validIndex(index);
                if (curIndex == index) return;
                
                if (curIndex == -1) {
                    // curIndex == -1
                    // 说明控件仍未初始化
                    _.each(items, function(item) {
                        item.hide();
                    });
                    items[index].show(true);
                } else {
                    items[curIndex].hide();
                    items[index].show();
                }

                this.curIndex = index;
            },

            hide : function() {
                var items = this.items,
                    curIndex = this.curIndex;

                if (this.visible) {
                    this.$el.hide();
                    this.visible = false;

                    if (curIndex != -1) {
                        items[curIndex].hide();
                    }
                }
            },

            next : function() {
                this.show('next');
            },

            prev : function() {
                this.show('prev');
            },

            size : function() {
                return this.items.length;
            }
            
        });


    module.exports = Panel;

});