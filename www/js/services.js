angular.module('starter.services', ['ngResource'])

.factory('Speaker', function($resource) {
    return $resource('https://www.mannheim-forum.org/api/mannheim-forum-schedule/speakers/:speakerId');
});
