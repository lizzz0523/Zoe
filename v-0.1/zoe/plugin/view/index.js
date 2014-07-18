// ZView，是Zoe组件库所有组件的基类
// 包含Zoe组件最基本的逻辑和接口
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

    var $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),

        View = B.View,
        Data = B.Collection;


    var ZView = View.extend({

            // terminal标志
            // 用于判断，数据的渲染，是由自身负责，还是交由子节点负责

            terminal : false,

            visible : true,

            template : _.template(''),

            tmpl : _.template(''),

            initialize : function(options) {
                _.extend(this, _.pick(options, ['zid', 'terminal', 'visible', 'template', 'tmpl']));


                // 当options包含data和属性

                if (options.data) {
                    if (options.data instanceof Data) {
                        // 如果是，则直接赋值到this.collection

                        this.collection = options.data;
                    } else {
                        // 如果不是，则对data进行转换

                        this.collection = this.parse(options.data);
                    }
                }

                // 重构节点的dom结构
                this.reset();

                if (this.collection) {
                    // 如果节点包含未渲染的数据
                    // 则等待数据准备完成后，马上进行渲染操作

                    this.listenTo(this.collection, 'reset', this.render);
                } else {
                    // 如果节点不包含未渲染数据
                    // 则直接通过现有节点进行渲染

                    // this.build();
                }
            },

            parse : function(data) {
                return collection = new Data(_.isArray(data) ? data : [data]);
            },

            reset : function() {
                var $elem = this.$el,
                    $items = $elem.children();


                // 由于Zoe是接受html配置的
                // 配置信息会保存在dom
                // 因此，在重建时，要先分离出配置信息

                $items.detach();


                // 重新写入dom结构

                $elem.html(this.template({}));


                // 加入组件对应的类名

                $elem.addClass('z_view');


                // 缓存dom节点

                this.$items = $items;
                this.$inner = $elem;

                return this;
            },


            // ZView的渲染过程是一个递归的过程
            // 即ZView会把渲染的过程交给他的子节点（也是ZView节点）来负责
            // 直到，我们在某个字节点上设置terminal为true
            // 这个渲染逻辑在render方法和build方法中均有体现
            
            render : function() {
                var collection = this.collection,

                    terminal = this.terminal,
                    tmpl = this.tmpl;

                if (!terminal) {
                    collection.each(function(model) {
                        var item = new ZView({
                                data : model.toJSON(),
                                tmpl : tmpl
                            });

                        this.append(item.render().el);
                        this.addItem(item);
                    }, this);
                } else {
                    this.collection.each(function(model) {
                        this.append(tmpl(model.toJSON()));
                    }, this);
                }

                return this.show();
            },

            build : function() {
                var $items = this.$items,

                    terminal = this.terminal;

                if (!terminal) {
                    _.each($items, function(elem) {
                        var item = new ZView();


                        // ZView支持使用标签内元素进行配置
                        // 但需要先把元素stack到子节点的配置元素($items)里
                        // 然后递归执行子节点的build方法

                        this.append(item.stack(elem).build().el);
                        this.addItem(item);
                    }, this);
                } else {
                    _.each($items, function(elem) {
                        this.append(elem);
                    }, this);
                }

                return this.show();
            },

            addItem : function(item) {
                var items = this.items || (this.items = []);

                items.push(item);

                return this; 
            },

            eachItem : function(callback) {
                var items = this.items || (this.items = []);

                _.each(items, callback, this);

                return this;
            },

            append : function(child, out) {
                var $elem = this.$el,
                    $inner = this.$inner || $elem;

                if (!out) {
                    $inner.append(child);
                } else {
                    $elem.append(child);
                }

                return this;
            },

            prepend : function(child, out) {
                var $elem = this.$el,
                    $inner = this.$inner || $elem;

                if (!out) {
                    $inner.prepend(child);
                } else {
                    $elem.prepend(child);
                }

                return this;
            },


            // stack方法用于向节点压入配置元素

            stack : function(child) {
                var $items = this.$items;

                $items.push(child);

                return this;
            },

            show : function() {
                var $elem = this.$el,

                    items = this.items,
                    visible = this.visible;

                if (!visible) {
                    $elem.show();

                    if (items) {
                        _.invoke(items, 'show');
                    }
                }

                this.visible = true;

                return this;
            },

            hide : function() {
                var $elem = this.$el,

                    items = this.items,
                    visible = this.visible;

                if (visible) {
                    $elem.hide();

                    if (items) {
                        _.invoke(items, 'hide');
                    }
                }

                this.visible = false;

                return this;
            },


            // binding方法，主要是用于支持Zoe的View Binding功能
            // 各组件都可以按自己需求重载binding方法
            
            binding : function(node) {
                this.listenTo(node, 'update', this.show);
            }
        });


    module.exports = ZView;

});