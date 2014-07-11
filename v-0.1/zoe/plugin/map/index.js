define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var bmap = require('tool/bmap'),

        Map = bmap.Map,
        Point = bmap.Point,
        Size = bmap.Size,

        Icon = bmap.Icon,
        Marker = bmap.Marker,
        Label = bmap.Label,

        NavigationControl = bmap.NavigationControl,
        MapTypeControl = bmap.MapTypeControl,
        OverviewMapControl = bmap.OverviewMapControl,

        $ = require('jquery'),
        _ = require('underscore'),

        View = require('backbone').View,

        Panel = require('plugin/panel/index');


    var defaults = {
        'lat'      : 39.943146, //纬度
        'lng'      : 116.337284, //经度
        'zoom'     : 13, //地图缩放级别
        'nav'      : false, //是否添加导航控件
        'overview' : false, //是否添加右下角缩略图
        'offset'   : 0.02, //中心点偏移量
        'icon'     : {
            url    : 'http://img4.bitauto.com/dealer/dealersite/20140626/images/map_i24.png',
            size   : { w: 28, h: 35 },
            anchor : { w: 14, h: 33 },
            events : [
                { 
                    name : 'click',
                    fn : function () { }
                }
            ]
        }, //自定义标点信息
        'label'    : {
            style : {
                'border-color' : '#ccc'
            }
        },

        'speed'    : 300,
        'current'  : 0
    };


    var MapSite = View.extend({
            className : 'z_map_site',

            labelTmpl : _.template([

                '<div class="z_map_label">',
                    '<%= content %>',
                '</div>'

            ].join('')),

            initialize : function(options) {
                this.itemId = options.itemId;
                this.map = options.map,
                this.lng = options.lng || 0;
                this.lat = options.lat || 0;

                this.position = new Point(this.lng, this.lat);
            },

            initMarker : function(options) {
                var map = this.map,
                    center = this.position,

                    iconSize,
                    iconAnchor,
                    iconOffset,
                    icon,
                    marker,
                    i = -1,
                    len;

                if (options) {
                    if (options.url != '') {
                        iconSize = new Size(options.size.w, options.size.h);
                        iconAnchor = new Size(options.anchor.w, options.anchor.h);
                        iconOffset = new Size(0, 0);
                        icon = new Icon(options.url, iconSize, { anchor : iconAnchor, imageOffset : iconOffset });// 设置图片偏移

                        marker = new Marker(center, { icon : icon });
                    } else {
                        marker = new Marker(center);
                    }

                    if (options.events) {
                        len = options.events.length;
                        while (++i < len) {
                            marker.addEventListener(options.events[i].name, options.events[i].fn);
                        }
                    }

                    map.addOverlay(marker);
                }

                this.marker = marker;
            },

            initLabel : function(options) {
                var $elem = this.$el,
                    
                    width = $elem.outerWidth(true),
                    height = $elem.outerHeight(true),

                    map = this.map,
                    center = this.position,

                    labelTmpl = this.labelTmpl,
                    labelContent,
                    labelOffset,
                    label;

                if (options) {
                    labelContent = labelTmpl({
                        content : $elem.html()
                    });
                    labelOffset = new Size(-width / 2 + 18, -height - 45);
                    label = new Label(labelContent, { offset : labelOffset, position : center});

                    if (options.style) {
                        label.setStyle(options.style);
                    }

                    map.addOverlay(label);
                }

                this.label = label;
            },

            show : function(offset, zoom, silent) {
                var map = this.map,
                    lng = this.lng,
                    lat = this.lat + offset;

                if (silent) {
                    map.centerAndZoom(new Point(lng, lat), zoom);
                } else {
                    map.panTo(new Point(lng, lat));
                }
            }
        }),

        MapView = Panel.extend({

            template : [

                '<div class="z_map_view"></div>',
                '<div class="z_map_asset"></div>'

            ].join(''),

            initialize : function(options) {
                options = _.defaults(options, defaults);

                Panel.prototype.initialize.call(this, options);
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children(),

                    $view,
                    $asset,

                    options = this.options,
                    hasNav = options.nav,
                    hasOrv = options.overview,
                    map;

                $items.detach();

                $elem.html(this.template);
                $elem.addClass('z_map');

                $view = this.$('.z_map_view');
                $asset = this.$('.z_map_asset');

                this.$items = $items;
                this.$inner = $asset;

                this.$view = $view;
                this.$asset = $asset;

                map = new Map($view[0]);
                map.enableScrollWheelZoom();

                if (hasNav) {
                    map.addControl(new NavigationControl());
                    map.addControl(new MapTypeControl());
                }

                if (hasOrv) {
                    map.addControl(new OverviewMapControl({
                        anchor : BMAP_ANCHOR_BOTTOM_RIGHT,
                        isOpen : true
                    }));
                }

                this.map = map;
            },

            reset : function() {
                var $items = this.$items,
                    $asset = this.$asset,

                    map = this.map,

                    options = this.options,
                    current = options.current,
                    icon = options.icon,
                    label = options.label,
                    lat = options.lat,
                    lng = options.lng,
                    remote = options.remote,
                    template = options.template;

                if (remote && template && _.isFunction(template)) {
                    if (_.isArray(remote)) {
                        _.each(remote, function(data) {
                            var itemId = data.id || void 0,
                                item;

                            item = new MapSite({
                                itemId : itemId,
                                map : map,
                                lat : data.lat || lat,
                                lng : data.lng || lng
                            });
                            item.$el.html(template(data));

                            this.addItem(item);

                            item.initMarker(icon);
                            item.initLabel(label);
                        }, this);
                    } else {
                        remote.each(function(model) {
                            var itemId = model.id || model.cid,
                                item;

                            item = new MapSite({
                                itemId : itemId,
                                map : map,
                                lat : model.get('lat') || lat,
                                lng : model.get('lng') || lng
                            });
                            item.$el.html(template(model.toJSON()));

                            this.addItem(item);

                            item.initMarker(icon);
                            item.initLabel(label);
                        }, this);
                    }
                } else {
                    _.each($items, function(elem) {
                        var $elem = $(elem),

                            itemId = elem.id || void 0,
                            item;

                        item = new MapSite({
                            itemId : itemId,
                            map : map,
                            lat : $elem.data('lat') || lat,
                            lng : $elem.data('lng') || lng
                        });
                        item.$el.html(elem);

                        this.addItem(item);

                        item.initMarker(icon);
                        item.initLabel(label);
                    }, this);
                }

                if (!this.size()) {
                    this.addItem(item = new MapSite({
                        map : map,
                        lat : lat,
                        lng : lng
                    }));

                    item.initMarker(icon);
                }

                $asset.hide();

                this.cache();
                this.show(current);
            },

            show : function(index) {
                var items = this.items,
                    curIndex = this.curIndex,

                    map = this.map,

                    options = this.options,
                    zoom = options.zoom,
                    offset = options.offset;

                if (!this.visible) {
                    this.$el.show();
                    this.visible = true;

                    if (curIndex != -1) {
                        items[curIndex].show(true);
                    }
                }

                index = this.validIndex(index);
                if (curIndex == index) return;

                items[index].show(offset, zoom, curIndex == -1);

                this.updateIndex(index);
            }
        });


    module.exports = MapView;

});