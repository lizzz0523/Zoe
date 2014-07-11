seajs.config({
    // 别名配置
    alias : {
      'backbone' : 'lib/backbone-min',
      'underscore' : 'lib/underscore-min',
      'jquery' : 'lib/jquery-1.8.3.min'
    },

    paths : {
        'plugin' : 'plugin',
        'toop' : 'tool'
    },

    // 文件编码
    charset : 'utf-8'
});

seajs.use('zoe');