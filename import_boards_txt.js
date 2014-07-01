var fs = require('fs');

///Applications/Arduino.app/Contents/Resources/Java/hardware/arduino/boards.txt
var txtfile = process.argv[2];
console.log("reading",txtfile);
var txt = fs.readFileSync(txtfile).toString();
//console.log(txt);
console.log('read file');

var boards = {};

txt.split(/[\n\r]+/).forEach(function(line){
    console.log('on line', arguments[1]);
    if(line.indexOf("#") == 0) return;
    if(line.length == 0) return;
    var parts = line.split('=');
    var ref = parts[0];
    var value = parts[1];
    var refs = ref.split('.');

    var root = boards;
    for(var i=0; i<refs.length; i++) {
        var sec = refs[i];
        if('object' !== typeof root[sec] && (i+1) < refs.length){
            root[sec] = { _value: root[sec] };
        }
        if(!root[sec]) {
            root[sec] = {};
        }
        if(i == refs.length-1) {
            root[sec] = value;
        }
        root = root[sec];
    }


});

console.log('finished parsing, on to saving')

// for(var id in boards) {
Object.keys(boards)
    .filter(function(v){return !!v;})
    .forEach(function(id){
        var board = boards[id];
        board.id = id;
        console.log("board = ",id);
        var path = 'boards/'+id+'.json';
        console.log('reading from '+path);
        try{
            var existingContents = fs.readFileSync(path, {encoding:'UTF8'});
            existingContents = JSON.parse(existingContents);
            console.log('merging new data with existing');
            board = mergeObjects(board, existingContents);
        }catch(e){
            console.error('error opening file, or parsing JSON, or mergeObjects');
        }
        board = formatObject(board);
        console.log('writing to',path);
        fs.writeFileSync(path,JSON.stringify(board,null,'    '));
    });
// }

function mergeObjects(a, b){
    //var keys = Object.keys(a).concat(Object.keys(b)).filter(function(v,i,a){ return ~a.indexOf(v, i+1); });
    var keys = Object.keys(b);
    keys.forEach(function(name){
        if('object' === typeof b[name]){
            a[name] = a[name] || {};
            mergeObjects(a[name], b[name]);
        }else if(!a.hasOwnProperty(name)){
            a[name] = b[name];
        }
    });
    return a;
}

function formatObject(o){
    var oF = o;
    switch(typeof o){
        case 'string':
            // might be a number
            if((+o).toString() === o){
                oF = +o;
            }

            if('true' === o){
                oF = true;
            }
            if('false' === o){
                oF = false;
            }

            break;
        case 'number': /* intended dropthrough from number to undefined */
        case 'boolean': /* intended dropthrough from boolean to undefined */
        case 'undefined':
            return o;
            break;
        case 'object':
            // might be an array? {0:asdf, 1:qwer}
            var keys = Object.keys(o);
            var nonNumericKeys = keys.filter(function(k){ return (+k).toString() !== k && 'length' !== k; });
            if(keys.length && !nonNumericKeys.length){
                // all keys are array indicies
                var oF = [];
                keys.forEach(function(k){
                    if('length' !== k){
                        oF[k] = o[k];
                    }
                });
            }

            keys.forEach(function(k){
                oF[k] = formatObject(oF[k]);
            });
            break;
        default:
            // ???
            break;
    }

    return oF;
}