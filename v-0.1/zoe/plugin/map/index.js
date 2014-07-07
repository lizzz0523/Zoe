define(function(require, exports, module) {

    // 加载对应的css文件
    require('./style.css');


    var $ = require('jquery'),
        _ = require('underscore'),

        B = require('backbone'),
        
        bmap = require('tool/bmap'),

        Map = bmap.Map,
        Point = bmap.Point,
        Size = bmap.Size,

        Icon = bmap.Icon,
        Marker = bmap.Marker,
        Label = bmap.Label,

        NavigationControl = bmap.NavigationControl,
        MapTypeControl = bmap.MapTypeControl,
        OverviewMapControl = bmap.OverviewMapControl;


    var defaults = {
        'lat'        : 39.943146, //纬度
        'lng'        : 116.337284, //经度
        'zoom'       : 13, //地图缩放级别
        'nav'        : false, //是否添加导航控件
        'overview'   : false, //是否添加右下角缩略图
        'offset'     : 0.02, //中心点偏移量
        'icon'       : {
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
        'label' : {
            style : {
                'border-color' : '#ccc'
            }
        }
    };


    var MapSite = B.View.extend({

            tagName : 'div',

            className : 'z_map_site',

            labelTmpl : _.template([

                '<div class="z_map_label">',
                    '<%= content %>',
                '</div>'

            ].join('')),

            initialize : function(options) {
                this.siteId = options.siteId,
                this.map = options.map,
                this.lng = options.lng || 0,
                this.lat = options.lat || 0;

                this.position = new Point(this.lng, this.lat);
            },

            reset : function() {
                var $elem = this.$el,

                    width = $elem.outerWidth(true),
                    height = $elem.outerHeight(true);

                this.label.setOffset(new Size(-width / 2 + 18, -height - 45));
            },

            initMarker : function(options) {
                var center = this.position,
                    map = this.map,

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
                var center = this.position,
                    map = this.map,

                    labelContent,
                    labelOffset,
                    label;

                if (options) {
                    labelContent = this.labelTmpl({
                        content : this.$el.html()
                    });
                    labelOffset = new Size(0, 0);
                    label = new Label(labelContent, { offset : labelOffset, position : center});

                    if (options.style) {
                        label.setStyle(options.style);
                    }

                    map.addOverlay(label);
                }

                this.label = label;
            },

            center : function(offset, zoom) {
                var map = this.map,
                    lng = this.lng,
                    lat = this.lat + offset;

                map.centerAndZoom(new Point(lng, lat), zoom);
                map.enableScrollWheelZoom();
            }

        }),

        MapView = B.View.extend({

            template : [

                '<div class="z_map_view"></div>',
                '<div class="z_map_asset"></div>'

            ].join(''),

            initialize : function(options) {
                options = _.defaults(options, defaults);

                this.offset = options.offset;
                this.zoom = options.zoom;

                this.render();

                this.$view = this.$('.z_map_view');
                this.$asset = this.$('.z_map_asset');

                this.map = new Map(this.$view[0]);

                if (options.nav) {
                    this.map.addControl(new NavigationControl());
                    this.map.addControl(new MapTypeControl());
                }

                if (options.overview) {
                    this.map.addControl(new OverviewMapControl({
                        anchor : BMAP_ANCHOR_BOTTOM_RIGHT,
                        isOpen : true
                    }));
                }

                this.sites = (function($items, map) {

                    var sites = [];

                    $items.each(function() {
                        var $item = $(this),

                            lng = $item.data('lng') || options.lng,
                            lat = $item.data('lat') || options.lat,

                            siteId = $item.attr('id') || void 0,
                            site;

                        site = new MapSite({
                            map : map,
                            lng : lng,
                            lat : lat,
                            siteId : siteId
                        });

                        site.$el.append($item);
                        site.initMarker(options.icon);
                        site.initLabel(options.label);

                        sites.push(site);
                    });

                    if (!sites.length) {
                        sites.push(new MapSite({
                            lng : options.lng,
                            lat : options.lat,
                        }));

                        sites[0].initMarker(options.icon);
                    }

                    return sites;

                })(this.$items, this.map);

                this.curIndex = -1;
                this.minIndex = 0;
                this.maxIndex = this.size() - 1;

                this.id2index = _.reduce(this.sites, function(hash, site, index) {  
                    var siteId = site.siteId;

                    if (siteId != void 0) {
                        hash[siteId] = index;
                    }

                    return hash;
                }, {});

                this.reset(options.current);
            },

            render : function() {
                var $elem = this.$el,
                    $items = $elem.children();

                $items.detach();

                $elem.html(this.template);
                $elem.addClass('z_map');

                this.$items = $items;

                return this;
            },

            reset : function(initIndex) {
                var $asset = this.$asset,
                    sites = this.sites;

                _.each(sites, function(site) {
                    site.$el.appendTo($asset);
                    site.reset();
                });

                $asset.hide();

                this.zoomTo(this.validIndex(initIndex || this.minIndex));
            },

            zoomTo : function(index) {
                var zoom = this.zoom,
                    offset = this.offset,
                    sites = this.sites;

                sites[index].center(offset, zoom);
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

            size : function() {
                return this.sites.length;
            }
            
        });


    module.exports = MapView;

});