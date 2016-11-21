(function () {
    angular
        .module('arraysApp')
        .service('DatasetService', DatasetService);

    DatasetService.$inject = ['$http', '$q'];
    function DatasetService($http, $q) {

        var getAll = function() {
            var deferred = $q.defer();
            $http.get('/api/dataset/getAll')
                .success(function(data) {
                    if (!data.error) {
                        return deferred.resolve(data.datasets);
                    } else {
                        return deferred.reject(data.error);
                    }
                })
                .error(function(data) {
                    return deferred.reject(data);
                });
            return deferred.promise;
        };

        var remove = function(id) {
            var deferred = $q.defer();
            $http.post('api/dataset/remove', {id: id})
                .success(function(data) {
                    if (!data.error && data.success == 'ok') {
                        return deferred.resolve(true);
                    } else {
                        return deferred.reject(data.error);
                    }
                })
                .error(function(data) {
                    return deferred.reject(data)
                });
            return deferred.promise;
        };

        var get = function(id) {
            // New Dataset
            if (!id) return {
                urls: []
            };

            var deferred = $q.defer();
            $http.get('api/dataset/get/' + id)
                .success(function(data) {
                    if (!data.error && data.dataset) {
                        return deferred.resolve(data.dataset);
                    } else {
                        return deferred.reject(data.error);
                    }
                })
                .error(function(data) {
                    return deferred.reject(data);
                });
            return deferred.promise;
        };

        var getSources = function(id) {
            var deferred = $q.defer();
            $http.get('api/dataset/getSources/' + id)
                .success(function(data) {
                    if (!data.error && data.sources) {
                        return deferred.resolve(data.sources);
                    } else {
                        return deferred.reject(data.error);
                    }
                })
                .error(function(data) {
                    return deferred.reject(data);
                });
            return deferred.promise;
        }

        var save = function(dataset) {
            var deferred = $q.defer();
            $http.post('api/dataset/update', dataset)
                .success(function(data) {
                    if (!data.error && data.id) {
                        return deferred.resolve(data.id);
                    } else {
                        return deferred.reject(data.error);
                    }
                })
                .error(function(data) {
                    return deferred.reject(data);
                });
            return deferred.promise;
        };

        return {
            getAll: getAll,
            remove: remove,
            get: get,
            getSources: getSources,
            save: save,
        }
    }
})();