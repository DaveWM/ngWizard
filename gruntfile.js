
module.exports = function (grunt){
    require('load-grunt-tasks')(grunt);

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        karma:{
            unit:{
                configFile: 'karma.conf.js',
                singleRun: true
            }
        },
        less:{
            normal:{
                src: ['src/styles.less'],
                dest: 'dist/ngWizard.css'
            },
            min:{
                src: ['src/styles.less'],
                dest: 'dist/ngWizard.min.css',
                options:{
                    compress: true
                }
            }
        },
        uglify:{
            normal:{
                src: ['src/**/*.js', 'tmp/**/*.js', 'bower_components/angular-tooltips/dist/angular-tooltips.js'],
                dest: 'dist/ngWizard.js',
                options:{
                    mangle: false,
                    compress: false,
                    beautify: true
                }
            },
            min:{
                src: ['src/**/*.js', 'tmp/**/*.js', 'bower_components/angular-tooltips/dist/angular-tooltips.min.js'],
                dest: 'dist/ngWizard.min.js',
                options:{
                    mangle: true,
                    compress: true,
                    beautify: false
                }
            }
        },
        html2js:{
            all:{
                src: ['src/**/*.html'],
                dest: 'tmp/templates.js',
                options: {
                    module: 'ngWizardTemplates',
                    base: 'src'
                }
            }
        },
        jshint:{
            all:{
                src: ['src/**/*.js']
            }
        }
    });

    grunt.registerTask('default', ['html2js', 'jshint', 'karma', 'less:normal','less:min', 'uglify:normal', 'uglify:min']);
    grunt.registerTask('test', ['html2js','karma']);
}
