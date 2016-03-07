var path = require('path');

fis.require.prefixes.unshift('yogurt');

module.exports = function(fis, isMount) {
    var sets = {
        'namespace': '',
        'static': 'static',
        'template': 'views'
    };

    fis.set('server.type', 'node');

    var matchRules = {
        // all release to $static dir

        '/server/(**)' : {
            release : '/app/${namespace}/$1',
            useMap: false,
            preprocessor: false,
            standard: false,
            postprocessor: false,
            optimizer: false,
            useHash: false,
            useDomain: false,
            isMod: false
        },

        'client/(**)': {
            id: '$1',
            moduleId: '${namespace}:$1',
            release: '/${static}/${namespace}/$1'
        },

        '/client/(**.{js,css})' : {
            release : '/static/${namespace}/$1'
        },

        '/client/(**.tmpl)' : {
            parser : fis.plugin('swig'),
            release : false
        },

        '{package.json, build.sh}' : {
            release : false
        },

        '/client/**.{js,css,less}': {
            useHash: true
        },

        '/client/**.js': {
            optimizer: null//fis.plugin('uglify-js')
        },
        '/client/(**.less)': {
            parser: fis.plugin('less'),
            rExt: '.css',
            release : '/static/${namespace}/$1'
        },
        '/client/**.{css,less}': {
            optimizer: fis.plugin('clean-css')
        },
        '::image': {
            useHash: true
        },
        '/client/**.png': {
            optimizer: fis.plugin('png-compressor')
        },
        '/client/**.tpl': {
            preprocessor: fis.plugin('extlang'),
            postprocessor: fis.plugin('require-async'),
            useMap: true
        },

        // widget

        '/client/**.{tpl,js}': {
            useSameNameRequire: true
        },

        '/client/page/**.tpl': {
            // 标记是否是个页面，向下兼容
            extras: {
                isPage: true
            }
        },


        '/client/widget/**.{js,css}': {
            isMod: true
        },

        'client/(page/**.tpl)': {
            url: '${namespace}/$1',
            release: '/${template}/${namespace}/$1',
            useMap: true
        },

        'client/(widget/**.tpl)': {
            url: '${namespace}/$1',
            release: '/${template}/${namespace}/$1',
            useMap: true
        },

        '${namespace}-map.json': {
            release: '/conf/fis/$0'
        },

        '*.sh': {
            release: false
        },

        '**.tmpl' : {
            parser : "swig",
            release : false
        }
    };

    function mount() {
        // smarty
        fis.set('system.localNPMFolder', path.join(__dirname, 'node_modules'));

        fis.util.map(sets, function(key, value) {
            fis.set(key, value);
        });

        fis.util.map(matchRules, function(selector, rules) {
            fis.match(selector, rules);
        });

        // 模块化支持
        fis.hook('commonjs');

        // map.json
        fis.match('::package', {
            postpackager: function createMap(ret) {
                var path = require('path')
                var root = fis.project.getProjectPath();
                var map = fis.file.wrap(path.join(root, fis.get('namespace') ? fis.get('namespace') + '-map.json' : 'map.json'));;
                map.setContent(JSON.stringify(ret.map, null, map.optimizer ? null : 4));
                ret.pkg[map.subpath] = map;
            }
        });
    }

    if (isMount !== false) {
        mount();
    }

    return {
        loadPath: path.join(__dirname, 'node_modules'),
        sets: sets,
        matchRules: matchRules
    }
};