
export class Node {
    constructor(id, data, parent=null, children=[], opened=false) {
        this.id = id;
        this.data = data;
        this.parent = parent;
        this.children = children;
        this.opened = opened;
    }
}
 
export class Tree {
    static Traverse = Object.freeze({
        SHALLOW:'shallow',
        PREORDER:'preorder'
    })

    constructor(id='#', data) {
        this._root = new Node(id, data, null, []);;
        this.nodes = {};
        this.nodes[id] = this._root;
    }

    get(id) {
        if(id.constructor == Node){
            id = id.id;
        }
        return this.nodes[id];
    }

    getId(node) {
        if(node.constructor != Node){
            node = this.nodes[node];
        }
        return node.id;
    }

    getParent(id){
        return this.get(id).parent;
    }

    insert(id, parent, pos=-1, data=null) {
        if(!parent){
            parent = this._root;
        } else {
            parent = this.get(parent);
        }
        if(pos<0){
            pos = parent.children.length;
        }
        var child = new Node(id, data, this.get(parent), []);
        this.nodes[id] = child;
        child.parent = parent;
        parent.children.splice(pos, 0, child);
    }

    remove(id) {
        node = this.get(node);
        const parChildren = this.getParent(id).children;
        parChildren.splice(parChildren.indexOf(item), 1);
        this.getChildren(node).forEach(child => delete this.nodes[child.id]);
    }

    getChildren(node, traverse=Tree.Traverse.PREORDER, field=null){
        node = this.get(node);
        if(traverse == Tree.Traverse.SHALLOW){
            var children = node.children;
        } else if(traverse == Tree.Traverse.PREORDER){
            children = [node]
            children.push(...node.children.reduce((acc, child) => {
                acc.push(...(this.getChildren(child, traverse, field)));
                return acc;
            }, []));
        }
        if(field){
            return children.map(child => child[field]);
        }
        return children;
    }

    move(node, pos, parent){
        node = this.get(node);
        parent = this.get(parent);
        const parChildren = this.getParent(id).children;
        parChildren.splice(parChildren.indexOf(item), 1);
        node.parent = parent;
        parent.children.splice(pos, 0, node);
    }

    open(node, open=true){
        this.get(node).opened = open;
    }

    close(node){
        this.open(node, false);
    }
}
