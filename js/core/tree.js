export class Node {
  /**
   *
   * @param {string} id a unique identifier (could be any type but string is recommended)
   * @param {*} data the payload of the node (could be any type)
   * @param {Node} parent the parent node (the root node has a null parent)
   * @param {[Node]} children the list of the children nodes.
   * @param {boolean} opened whether the node is opened (true) or closed (false)
   */
  constructor(id, data, parent = null, children = [], opened = false) {
    this.id = id;
    this.data = data;
    this.parent = parent;
    this.children = children;
    this.opened = opened;
  }

  /**
   *
   * @param {Node |string} node the node (or its id) to return its depth.
   * @returns {number} the depth of the given node.
   */
  getDepth() {
    let node = this;
    let depth = 0;
    while (node.parent) {
      depth++;
      node = node.parent;
    }
    return depth;
  }
}

export class Tree {
  static Traverse = Object.freeze({
    SHALLOW: "shallow",
    PREORDER: "preorder"
  });

  /**
   *
   * @param {string} id the id of the root node.
   * @param {*} data the payload of the root node.
   */
  constructor(id = "#", data) {
    this._root = new Node(id, data, null, []);
    this._root.opened = true;
    this.nodes = {};
    this.nodes[id] = this._root;
  }

  /**
   * Returns the node "payload" of the given id or the node itself.
   *
   * @param {string | Node} id of the node to return.
   * @returns {Node} the node "payload" of the given id.
   */
  get(id) {
    if (id == undefined) {
      return this._root;
    }
    if (id.constructor == Node) {
      id = id.id;
    }
    let node = this.nodes[id];
    if (!node) {
      throw new Error("Node not found. id: " + id);
    }
    return node;
  }

  /**
   * Returns the nodes id of the given node or the id itself.
   *
   * @param {Node | string} node the node to return its id.
   * @returns {string} the id of the given node "payload".
   */
  getId(node) {
    if (node == undefined) {
      node = this._root;
    } else if (node.constructor != Node) {
      node = this.nodes[node];
    }
    return node.id;
  }

  /**
   * Returns the parent node of the given id.
   *
   * @param {string | Node} id the node (or its id) to return its parent.
   * @returns {Node} The parent node of the given id.
   */
  getParent(id) {
    return this.get(id).parent;
  }

  /**
   *
   * @param {string} id the identifier of the node to insert.
   * @param {Node | string} parent the parent (or its id) node to insert the new node into.
   * @param {number} pos the position to insert the new node at the parent children list.
   * @param {*} data the payload of the new node.
   */
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

  /**
   *
   * @param {Node |string} node the node (or its id) to return its position.
   * @returns {number} the position of the given node.
   */
  getPosition(node) {
    node = this.get(node);
    return node.parent.children.indexOf(node);
  }

  /**
   *
   * @param {Node |string} node the node (or its id) to return its depth.
   * @returns {number} the depth of the given node.
   */
  getDepth(node) {
    return this.get(node).getDepth();
  }

  /**
   *
   * @param {Node} node the node (or its id) to remove.
   */
  remove(node) {
    node = this.get(node);
    const parChildren = node.parent.children;
    parChildren.splice(parChildren.indexOf(node), 1);
    this.getChildren(node).forEach((child) => delete this.nodes[child.id]);
    delete this.nodes[node.id];
  }

  /**
   *
   * @param {Node |string} node the node (or its id) to move.
   * @param {number} pos the position to move the node to.
   * @param {Node} parent the parent node (or its id) to move the node into. If null, keeps the current parent.
   * @param {boolean} force whether to force the move even if the target place is the same.
   * @returns
   */
  move(node, pos, parent = null, force = false) {
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

  /**
   *
   * @param {Node | string} node the node (or its id) from which to start the traverse.
   * @param {Tree.Traverse} traverse the mode of the trasverse (preorder or shallow).
   * @param {boolean} getHidden if its true returns also the closed nodes.
   * @returns
   */
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

  /**
   *
   * @param {Node |string} node the node (or its id) to return its children.
   * @param {Tree.Traverse} traverse the mode of the trasverse (preorder or shallow).
   * @param {string} field if its not null, select a given field of the children to return.
   * @param {boolean} getHidden if its true returns also the closed nodes.
   * @returns {Node[]} the list of the childre of the given node.
   */
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

  /**
   * A helper function to get only the visible nodes. (cover of the trasverse function)
   *
   * @param {Node |string} node the node (or its id) from which to start the traverse. Or null.
   * @param {Tree.Traverse} traverse the mode of the trasverse (preorder or shallow).
   * @param {string} field if its not null, select a given field of the children to return.
   * @returns {Node[]} the list of the visible nodes.
   */
  getVisible(node, traverse = Tree.Traverse.PREORDER, field = null) {
    if (!node) {
      node = this._root;
    }
    return this.getChildren(node, traverse, field, false);
  }

  /**
   *
   * Opens (or closes) a given node.
   *
   * @param {Node |string} node the node (or its id) to open.
   * @param {boolean} open
   * @returns
   */
  open(node, open = true) {
    node = this.get(node);
    if (node === this._root) {
      return;
    } else {
      node.opened = open;
    }
  }

  /**
   * Closes a given node.
   * @param {Node |string} node the node (or its id) to close.
   */
  close(node) {
    this.open(node, false);
  }

  /**
   * Opens (or closes) all nodes in the tree.
   * @param {boolean} open
   */
  openAll(open = true) {
    for (var id in this.nodes) {
      this.open(id, open);
    }
  }

  /**
   * Closes all nodes in the tree.
   */
  closeAll() {
    this.openAll(false);
  }
}
