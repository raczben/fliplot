import { simDB } from "./core.js";

export function showTree(){
    const tree = []
    for (var key in simDB.objects) {
        if (Object.prototype.hasOwnProperty.call(simDB.objects, key)){
            /** @type {SimulationObject} */
            const obj = simDB.objects[key];
            var treeObj = {};
            treeObj['id'] = obj.hierarchy;
            if(obj.hierarchy.length > 1) {
                treeObj['parent'] = obj.hierarchy.slice(0,-1);
            } else {
                treeObj['parent'] = '#';
            }
            treeObj['text'] = obj.hierarchy[obj.hierarchy.length-1];

            tree.push(treeObj)
        }
    }
    
    $('#jstree').jstree("destroy").empty();
    $('#jstree').jstree({
        'plugins': ['search', 'checkbox', 'wholerow'],
        'core': {
            'data': tree,
        'animation': false,
        //'expand_selected_onload': true,
        'themes': {
            'icons': false,
        }
        },
        'search': {
        'show_only_matches': true,
        'show_only_matches_children': true
        }
    })
    
    $('#search').on("keyup change", function () {
        $('#jstree').jstree(true).search($(this).val())
    })
    
    $('#clear').click(function (e) {
        $('#search').val('').change().focus()
    })
    
    $('#jstree').on('changed.jstree', function (e, data) {
        var objects = data.instance.get_selected(true)
        var leaves = $.grep(objects, function (o) { return data.instance.is_leaf(o) })
        var list = $('#output')
        list.empty()
        $.each(leaves, function (i, o) {
        $('<li/>').text(o.text).appendTo(list)
        })
    })
}
