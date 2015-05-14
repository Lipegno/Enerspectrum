// This file is an ugly little parser for simple math expressions.
// This could be improved. As is, it's traumatic to add new operators

function tokenize_subexp(subexp) {
    // subexp ::= <name> | <name> <op> <subexp> | (subexp) | (<subexp>) <op> <subexp> | <value>
    // Check the (<subexp>) <op> <subexp> case
    match = subexp.match(/^\s*(\(.+\))\s*([\+|\/|\*|\-])\s*(.+)\s*$/);
    if (match) {
        var vs = tokenize_subexp(match[1]);
        vs.push(match[2]);
        return vs.concat(tokenize_subexp(match[3]));
    }

    // Check for (<subexp>) case
    var match = subexp.match(/^\s*\((.+)\)\s*$/);
    if (match) {
        var vs = ['('];
        vs = vs.concat(tokenize_subexp(match[1]));
        vs.push(')');
        return vs;
    }
    
    // Check <name> <op> <subexp> case
    match = subexp.match(/^\s*(\w+)\s*([\+|\/|\*|\-])\s*(.+)\s*$/);
    if (match) {
        var vs = [match[1], match[2]];
        return vs.concat(tokenize_subexp(match[3]));
    }
    
    // Check for simple 'name' case
    match = subexp.match(/^\s*(\w+)\s*$/);
    if (match) {
        return [match[1]];
    }
}

function tokenize(exp) {
    var expMatcher = /^\s*(\w+)\s*\=(.*)$/;
    var match = exp.match(expMatcher);
    if (match) {
        var vs = [match[1], '='];
        var subtokens = tokenize_subexp(match[2]);
        if (!subtokens) {
            return;
        }

        for (var i = 0; i < subtokens.length; i++) {
            if (typeof subtokens[i] === 'undefined') {
                return;
            }
        }

        return vs.concat(subtokens);
    } else {
        return;
    }
}

function isName(val) {
    return !!(val.match(/^[a-zA-Z]\w*$/));
}

function isNumber(val) {
    return !isNaN(Number(val));
}

function tokensToTree(tokens) {
    if (tokens.length == 1) {
        if (isName(tokens[0])) {
            return { 'name': tokens[0] };
        } else if (isNumber(tokens[0])) {
            return { 'value': Number(tokens[0]) };
        } else {
            return null;
        }
    }
    
    if (tokens[0] == '(' && tokens[tokens.length - 1] == ')') {
        var valid = true;
        for (var i = 0; i < tokens.length - 1; i++) {
            if (tokens[i] == ')') {
                valid = false;
                break;
            }
        }

        if (valid) {
            return tokensToTree(tokens.slice(1, tokens.length - 1));
        }
    }

    for (var i = 0; i < tokens.length; i++) {
        if (tokens[i] == '=') {
            return { 'op': '=', 'lhs': tokensToTree(tokens.slice(0, i)), 'rhs': tokensToTree(tokens.slice(i + 1)) };
        }
    }
    
    var pCount = 0;
    for (var i = 0; i < tokens.length; i++) {
        switch (tokens[i]) {
            case '(':
                pCount++;
                break;
            case ')':
                pCount--;
                break;
            case '+':
                if (!pCount)
                    return {'op': '+', 'lhs': tokensToTree(tokens.slice(0, i)), 'rhs': tokensToTree(tokens.slice(i + 1)) };
            case '-':
                if (!pCount)
                    return { 'op': '-', 'lhs': tokensToTree(tokens.slice(0, i)), 'rhs': tokensToTree(tokens.slice(i + 1)) };
        }
    }
    
    pCount = 0;
    for (var i = 0; i < tokens.length; i++) {
        switch (tokens[i]) {
            case '(':
                pCount++;
                break;
            case ')':
                pCount--;
                break;
            case '*':
                if (!pCount)
                    return { 'op': '*', 'lhs': tokensToTree(tokens.slice(0, i)), 'rhs': tokensToTree(tokens.slice(i + 1)) };
            case '/':
                if (!pCount)
                    return { 'op': '/', 'lhs': tokensToTree(tokens.slice(0, i)), 'rhs': tokensToTree(tokens.slice(i + 1)) };
        }
    }
}

var operators = {
    '+': '$add',
    '-': '$subtract',
    '*': '$multiply',
    '/': '$divide'
};

function treeToMongoDB(tree) {
    if (tree.op) {
        if (tree.op == '=') {
            var rhs = treeToMongoDB(tree.rhs);
            var lhs = tree.lhs.name;
            var rVal = {};
            rVal[lhs] = rhs;
            return rVal;
        }
        
        if (tree.op in operators) {
            var rVal = {};
            var lhs = operators[tree.op];
            var arguments = [treeToMongoDB(tree.lhs), treeToMongoDB(tree.rhs)];
            rVal[lhs] = arguments;
            return rVal;
        }
    } else {
        if (tree.name) {
            return '$' + tree.name;
        } else if (tree.value) {
            return {'$literal': tree.value};
        }
    }
}

function parseExpression(exp) {
    var tokens = tokenize(exp);
    if (!tokens) {
        return;
    }

    var tree = tokensToTree(tokens);
    if (!tree) {
        return;
    }

    return treeToMongoDB(tree);
}

module.exports = parseExpression;