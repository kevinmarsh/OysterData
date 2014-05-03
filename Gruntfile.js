module.exports = function(grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        concat: {
            dist: {
                src: [
                    'OysterData/js/libs/*.js',
                    'OysterData/js/main.js'
                ],
                dest: 'OysterData/js/build/production.js',
            }
        },

        uglify: {
            build: {
                src: 'OysterData/js/build/production.js',
                dest: 'OysterData/js/build/production.min.js'
            }
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


    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-imagemin');
    grunt.registerTask('default', ['concat', 'uglify', 'imagemin']);
};
