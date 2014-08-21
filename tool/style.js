// 内置样式表
// by lizzz (http://lizzz0523.github.io/)

define(function(require, exports, module) {

var _ = require('underscore');


var rdashCase = /([\dA-Z])/g;

function dashCase(str) {
    if (str == null) return '';

    return String(str).replace(rdashCase, function(all, first) {
        return '-' + first.toLowerCase();
    });
}


var doc = document,
    head = doc.head,

    style = doc.createElement('style'),
    styleId = 'zoe-style',

    sheet;

style.id = styleId;
head.appendChild(style);

sheet = (function() {
    var sheets = [].slice.call(doc.styleSheets, 0);
    
    return _.find(sheets, function(sheet) {
        return sheet.ownerNode.id == styleId;
    });
})();


module.exports = {
    version : 'zoe-style 0.0.1',

    insert : function(selector, rules) {
        var ruleText = '';

        _.each(rules, function(value, name) {
            ruleText += dashCase(name) + ':' + value + ';';
        });

        ruleText = selector + '{' + ruleText + '}';

        if (sheet.insertRule) {
            sheet.insertRule(ruleText, 0);
        } else if (sheet.addRule) {
            sheet.addRule(ruleText, 0);
        }
    },

    remove : function(selector) {
        var rules = sheet.cssRules || sheet.rules;

        _.each(rules, function(rule, index) {
            if (rule.selectorText !== selector) return;

            if (sheet.deleteRule) {
                sheet.deleteRule(index);
            } else if (sheet.removeRule) {
                sheet.removeRule(index);
            }
        })
    }
};

});