module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            js: {
                src: [
                    'src/js/libs/*.js',
                    'src/js/main.js'
                ],
                dest: 'build/js/production.js',
            },
            css: {
                src: [
                    'src/css/bootstrap.min.css',
                    'src/css/bootstrap-responsive.min.css',
                    'src/css/sortable-theme-light.css',
                    'build/css/style.css',
                ],
                dest: 'build/css/production.min.css',
            },
        },

        uglify: {
            options : {
                preserveComments: 'some'
            },
            build: {
                src: 'build/js/production.js',
                dest: 'build/js/production.min.js'
            },
        },

        jshint: {
            options: {
                '-W069': true, // This ignores any warning with a special option syntax (TODO: remove once main.js is refactored)
                reporter: require('jshint-stylish')
            },
            target: ['src/js/main.js']
        },

        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'src/images/',
                    src: ['*.{png,jpg,gif}'],
                    dest: 'build/images/'
                }]
            }
        },

        real_favicon: {
            my_icon: {
                src: 'src/images/train_favicon.png',
                dest: 'build/images/',
                icons_path: 'images/',
                html: [],
                design: {
                    ios: {
                        picture_aspect: 'background_and_margin',
                        background_color: '#ffffff',
                        margin: 4
                    },
                    windows: {
                        picture_aspect: 'white_silhouette',
                        background_color: '#2b5797'
                    }
                },
                settings: {
                    compression: 5,
                    scaling_algorithm: 'Lanczos'
                }
            }
        },

        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'build/css/style.css': 'src/css/style.scss'
                }
            }
        },

        targethtml: {
            dist: {
                files: {
                    'build/index.html': 'src/index.html'
                }
            },
            dev: {
                files: {
                    'build/index_dev.html': 'src/index.html'
                }
            }
        },

        watch: {
            scripts: {
                files: ['src/js/*.js'],
                tasks: ['jshint', 'concat:js', 'uglify'],
                options: {
                    spawn: false,
                },
            },
            css: {
                files: ['src/css/*.scss'],
                tasks: ['sass', 'concat:css'],
                options: {
                    spawn: false,
                }
            },
            html: {
                files: ['src/index.html'],
                tasks: ['targethtml'],
                options: {
                    spawn: false,
                }
            }
        },

    });

    require('load-grunt-tasks')(grunt);
    grunt.registerTask('default', ['sass', 'jshint', 'concat', 'uglify', 'imagemin', 'real_favicon', 'targethtml']);
};
