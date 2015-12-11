window.enerspectrum = (function () {
    var privateData = {};

    function _query(tableName) {
        this.table = tableName;
        this.pipeline = [];
    }
    
    function _whereClause(q, field) {
        this._query = q;
        this._field = field;
    }
    
    function whereClauseToJSON(field, op, value) {
        return { '$match': { field: { op: value } } };
    }
    
    _whereClause.prototype.lt = function (v) {
        this._query.pipeline.push(whereClauseToJSON(this._field, '$lt', v));
        return this._query;
    };
    
    _whereClause.prototype.lte = function (v) {
        this._query.pipeline.push(whereClauseToJSON(this._field, '$lte', v));
        return this._query;
    };
    
    _whereClause.prototype.gt = function (v) {
        this._query.pipeline.push(whereClauseToJSON(this._field, '$gt', v));
        return this._query;
    };
    
    _whereClause.prototype.gte = function (v) {
        this._query.pipeline.push(whereClauseToJSON(this._field, '$gte', v));
        return this._query;
    };
    
    _whereClause.prototype.eq = function (v) {
        this._query.pipeline.push(whereClauseToJSON(this._field, '$eq', v));
        return this._query;
    };
    
    _whereClause.prototype.neq = function (v) {
        this._query.pipeline.push(whereClauseToJSON(this._field, '$neq', v));
        return this._query;
    };
    
    _query.prototype.where = function (field) {
        return new _whereClause(this, field);
    };
    
    _query.prototype.project = function () {
        var expressions = [];
        for (var i = 0; i < arguments.length; i++) {
            expressions.push(arguments[i]);
        }

        this.pipeline.push({ '$project': expressions });
        return this;
    };
    
    _query.prototype.latest = function () {
        return this.sort('-timestamp').limit(1);
    }
    
    _query.prototype.sort = function () {
        var sortParams = [];
        for (var i = 0; i < arguments.length; i++) {
            sortParams.push(arguments[i]);
        }
        
        this.pipeline.push({ '$sort': sortParams });
        return this;
    };
    
    _query.prototype.limit = function (v) {
        this.pipeline.push({ '$limit': v });
        return this;
    };
    
    _query.prototype.paginate = function (itemsPerPage, currentPage) {
        this.pipeline.push({ '$skip': itemsPerPage * currentPage });
        return this;
    };
    
    // This can be called with or without username and password
    function sendRequest(method, url, payload, username, password, callback) {
        if (!callback && !password) {
            callback = username;
            username = null;
        }
        
        payload = JSON.stringify(payload);
        var request = new XMLHttpRequest();

        if (method == 'GET') {
            request.open('GET', url + '?q=' + encodeURIComponent(payload), true, username, password);
        } else if (method == 'POST') {
            request.open('POST', url, true, username, password);
            request.setRequestHeader("Content-type", "application/json;charset=UTF-8");
        }

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                // Success!
                var data = JSON.parse(request.responseText);
                callback(null, data);
            } else {
                // We reached our target server, but it returned an error
                callback(new Error('Server error'));
            }
        };
        
        request.onerror = function () {
            callback(new Error('Cannot reach server'));
        };

        if (method == 'POST') {
            alert(JSON.stringify(request));
            request.send(payload);
        } else {
            request.send();
        }
    }
    
    _query.prototype.execute = function (callback) {
        sendRequest('GET', '/api/source/' + encodeURIComponent(this.table),
            this.pipeline, privateData.username, privateData.password, callback);
    };
    
    function _post(tableName, samples) {
        this._table = tableName;
        this._samples = samples;
    }
    
    _post.prototype.execute = function (callback) {
        sendRequest('POST', '/api/json/' + encodeURIComponent(this._table),
            this._samples, privateData.deviceId, privateData.authToken, callback);
    };
    
    function table(tableName) {
        this._table = tableName;
    }
    
    table.prototype.query = function () {
        return new _query(this._table);
    };
    
    table.prototype.post = function (samples) {
        return new _post(this._table, samples);
    };
    
    function getTable(tableName) {
        return new table(tableName);
    }
    
    getTable.setDevice = function (deviceId, authToken) {
        privateData.deviceId = deviceId;
        privateData.authToken = authToken;
    };
    
    getTable.loginProducer = function (username, password) {
        privateData.username = username;
        privateData.password = password;
    };

    return getTable;
})();