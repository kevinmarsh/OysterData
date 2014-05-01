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

    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.registerTask('default', ['concat']);

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.registerTask('default', ['concat', 'uglify']);
};
