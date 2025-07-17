export class Node {
  constructor(id, data, parent = null, children = [], opened = false) {
    this.id = id;
    this.data = data;
    this.parent = parent;
    this.children = children;
    this.opened = opened;
  }
}

export class Tree {
  static Traverse = Object.freeze({
    SHALLOW: "shallow",
    PREORDER: "preorder"
  });

  constructor(id = "#", data) {
    this._root = new Node(id, data, null, []);
    this._root.opened = true;
    this.nodes = {};
    this.nodes[id] = this._root;
  }

  get(id) {
    if (id == undefined) {
      return this._root;
    }
    if (id.constructor == Node) {
      id = id.id;
    }
    return this.nodes[id];
  }

  getId(node) {
    if (node == undefined) {
      node = this._root;
    } else if (node.constructor != Node) {
      node = this.nodes[node];
    }
    return node.id;
  }

  getParent(id) {
    return this.get(id).parent;
  }

  insert(id, parent, pos = -1, data = null) {
    parent = this.get(parent);
    if (pos < 0) {
      pos = parent.children.length;
    }
    var child = new Node(id, data, parent, []);
    this.nodes[id] = child;
    child.parent = parent;
    parent.children.splice(pos, 0, child);
  }

  remove(node) {
    node = this.get(node);
    const parChildren = node.parent.children;
    parChildren.splice(parChildren.indexOf(node), 1);
    this.getChildren(node).forEach((child) => delete this.nodes[child.id]);
    delete this.nodes[node.id];
  }

  move(node, pos, parent, force = false) {
    node = this.get(node);
    if (!parent) {
      parent = node.parent;
    } else {
      parent = this.get(parent);
    }
    const parChildren = node.parent.children;
    const currentPos = parChildren.indexOf(node);
    if (!force) {
      if (parent == node.parent && pos == currentPos) {
        return;
      }
    }
    parChildren.splice(currentPos, 1);
    node.parent = parent;
    parent.children.splice(pos, 0, node);
  }

  traverse(node, traverse = Tree.Traverse.PREORDER, getHidden = true) {
    node = this.get(node);
    var children = [node];
    if (traverse == Tree.Traverse.SHALLOW) {
      return children;
    } else if (traverse == Tree.Traverse.PREORDER) {
      if (getHidden || node.opened) {
        children.push(
          ...node.children.reduce((acc, child) => {
            acc.push(...this.traverse(child, traverse));
            return acc;
          }, [])
        );
      }
      return children;
    }
  }

  getChildren(node, traverse = Tree.Traverse.PREORDER, field = null, getHidden = true) {
    node = this.get(node);
    var children = node.children.reduce(
      (acc, child) => acc.concat(this.traverse(child, traverse, getHidden)),
      []
    );

    if (field) {
      return children.map((child) => child[field]);
    }
    return children;
  }

  getVisible(node, traverse = Tree.Traverse.PREORDER, field = null) {
    if (!node) {
      node = this._root;
    }
    return this.getChildren(node, traverse, field, false);
  }

  open(node, open = true) {
    node = this.get(node);
    if (node === this._root) {
      return;
    } else {
      node.opened = open;
    }
  }

  close(node) {
    this.open(node, false);
  }

  openAll(open = true) {
    for (var id in this.nodes) {
      this.open(id, open);
    }
  }

  closeAll() {
    this.openAll(false);
  }

  nodeList() {
    return Object.values(this.nodes).filter((n) => n != this._root);
  }
}
