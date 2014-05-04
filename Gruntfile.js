module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            js: {
                src: [
                    'OysterData/js/libs/*.js',
                    'OysterData/js/main.js'
                ],
                dest: 'OysterData/js/build/production.js',
            },
            css: {
                src: [
                    'OysterData/css/bootstrap.min.css',
                    'OysterData/css/bootstrap-responsive.min.css',
                    'OysterData/css/sortable-theme-light.css',
                    'OysterData/css/style.css',
                ],
                dest: 'OysterData/css/build/global.css',
            },
        },

        uglify: {
            options : {
                preserveComments: 'some'
            },
            build: {
                src: 'OysterData/js/build/production.js',
                dest: 'OysterData/js/build/production.min.js'
            },
        },

        imagemin: {
            dynamic: {
                files: [{
                    expand: true,
                    cwd: 'OysterData/images/',
                    src: ['*.{png,jpg,gif}'],
                    dest: 'OysterData/images/build/'
                }]
            }
        },

        sass: {
            dist: {
                options: {
                    style: 'compressed'
                },
                files: {
                    'OysterData/css/style.css': 'OysterData/css/style.scss'
                }
            }
        },

        watch: {
            scripts: {
                files: ['OysterData/js/*.js'],
                tasks: ['concat:js', 'uglify'],
                options: {
                    spawn: false,
                },
            },
            css: {
                files: ['OysterData/css/*.scss'],
                tasks: ['sass', 'concat:css'],
                options: {
                    spawn: false,
                }
            }
        },

    });

    require('load-grunt-tasks')(grunt);
    grunt.registerTask('default', ['sass', 'concat', 'uglify', 'imagemin']);
};
