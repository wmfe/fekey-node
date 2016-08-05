var path = require('path');

fis.require.prefixes.unshift('yogurt');

module.exports = function(fis, isMount) {
    var sets = {
        'namespace': '',
        'static': 'static',
        'template': 'views'
    };

    fis.set('server.type', 'node');
    fis.set('project.fileType.text', 'es6,jsx');

    fis.set('project.ignore', [
        '.git/**',
        '.svn/**',
        '**.md',
        'fis-conf.js',
        'fekey-conf.js',
        'package.json',
        'MIT-LICENSE',
        'upload.py',
        'issue.info',
        'build.sh',
        'build.dev.sh',
        'output/**',
        'test/**'
    ]);

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

        '/client/(**)': {
            id: '$1',
            moduleId: '${namespace}:$1',
            release: '/${static}/${namespace}/$1'
        },

        '/client/(**.tmpl)' : {
            parser : fis.plugin('swig'),
            release : false
        },

        '/client/**.{js,css,less,es6,jsx}': {
            useHash: true
        },

        '/client/**.{js,es6,jsx}': {
            optimizer: fis.plugin('uglify-js')
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

        '/client/**.{tpl,js,jsx,es6}': {
            useSameNameRequire: true
        },

        '/client/page/**.tpl': {
            // 标记是否是个页面，向下兼容
            extras: {
                isPage: true
            }
        },

        '/client/widget/**.{js,jsx,less,css,es6}': {
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

        '/client/**.tmpl' : {
            parser : "swig",
            release : false
        },

        '/client/**.{jsx,es6}' : {
            rExt: '.js',
            postprocessor: fis.plugin('babel-5.x', {
                blacklist: ['regenerator'],
                stage: 3,
                sourceMaps: true
            }),
            isMod: true,
            useHash: true,
            isJsLike: true
        },

        '/client/**.{css,less}' : {
            postprocessor: fis.plugin('autoprefixer', {
                browsers: ['android 4', 'ios 6', 'last 1 Chrome versions', 'last 2 Safari versions'],
                "cascade": true
            })
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