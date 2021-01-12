import { simDB } from "./core.js";

export class Tree{
    constructor(){
        /** @type {string} */
        this.containerName = '#object-tree';
    }

    showTree(){
        const tree = []
        for (var key in simDB.objects) {
            if (Object.prototype.hasOwnProperty.call(simDB.objects, key)){
                /** @type {SimulationObject} */
                const obj = simDB.objects[key];
                var treeObj = {};
                treeObj['id'] = obj.hierarchy;
                treeObj['data'] = key;
                if(obj.hierarchy.length > 1) {
                    treeObj['parent'] = obj.hierarchy.slice(0,-1);
                } else {
                    treeObj['parent'] = '#';
                }
                treeObj['text'] = obj.hierarchy[obj.hierarchy.length-1];

                treeObj['type'] = obj.type;

                tree.push(treeObj)
            }
        }
        
        $('#object-tree').jstree("destroy").empty();
        $('#object-tree').jstree({
            'plugins': ['search', 'wholerow', 'types'],
            'core': {
                'data': tree,
                'animation': false,
            },

            types: {
                "module": {
                "icon" : "glyphicon glyphicon-oil" // looks like an IC
                },
                "signal": {
                "icon" : "glyphicon glyphicon-leaf"
                },
                "default" : {
                }
            },
            'search': {
            'show_only_matches': true,
            'show_only_matches_children': true
            }
        })
        
        
        var to = false;
        $('#structure-search').keyup(function () {
            if(to) {
                clearTimeout(to);
            }
            to = setTimeout(function () {
                var v = $('#structure-search').val();
                $('#object-tree').jstree(true).search(v);
            }, 150);
        });

    }

    getSelectedObjects(){
        return this._getTree().get_selected(true).map(
            element => element.data
        );
    }

    _getTree(arg = true){
      return $(this.containerName).jstree(arg);
    }
}