export class Node {
  static ROOT_ID = "#";
  static Traverse = Object.freeze({
    SHALLOW: "shallow",
    PREORDER: "preorder"
  });

  /**
   * A static method to create a root node.
   *
   * @returns {Node} the root node.
   */
  static createRoot() {
    return new Node(Node.ROOT_ID, null, -1, [], true);
  }

  /**
   *
   * @param {string} id a unique identifier (could be any type but string is recommended)
   * @param {Node} parent the parent node (the root node has a null parent)
   * @param {[Node]} children the list of the children nodes.
   * @param {boolean} opened whether the node is opened (true) or closed (false)
   */
  constructor(id, parent = null, pos = -1, children = [], opened = false) {
    /** @type {string} */
    this.id = id;
    /**
     * list of all parent nodes up to the root
     * @type {[Node]} */
    this.parents = [];
    /**  @type {[Node]} */
    this.children = children;
    /**  @type {boolean} */
    this.opened = opened;

    /**
     * This is a shared dictionary of all nodes in the tree
     * it is set only in the setParents method modified in all insertion or remove
     * @type {{[key: string]: Node}}
     */
    this._all_nodes = {};

    if (parent != null) {
      parent.insert(this, pos);
    } else {
      // this is the root node
      this.setParents(null);
      this._all_nodes[this.id] = this;
    }
  }

  /**
   * Returns the nodes id.
   *
   * @returns {string} the id of the node.
   */
  getId(node = null) {
    if (node == null) {
      return this.id;
    } else {
      return this.get(node).id;
    }
  }

  /**
   *
   * @returns {Node} the root node of the whole tree.
   */
  getRoot() {
    return this.parents.length > 0 ? this.parents[this.parents.length - 1] : this;
  }

  /**
   *
   * @param {Node|string} id
   * @returns {Node} the node with the given id.
   */
  get(id) {
    if (id == null) {
      return this.getRoot();
    }
    if (id instanceof Node) {
      id = id.id;
    }
    return this._all_nodes[id];
  }

  /**
   * Returns the immediate parent.
   *
   * @returns {Node} The parent node.
   */
  getParent(node) {
    if (node == null) {
      node = this;
    } else {
      node = this.get(node);
    }
    return node.parents[0];
  }

  /**
   * Returns all the parents.
   *
   * @returns {[Node]} The parent node.
   */
  getParents() {
    return this.parents;
  }

  /**
   *
   * @param {Node|string} immediateParent
   */
  setParents(immediateParent) {
    this.parents = immediateParent ? [immediateParent, ...immediateParent.parents] : [];
    // check if this is not its own ancestor
    if (this.parents.indexOf(this) >= 0) {
      throw `Node with id ${this.id} cannot be its own ancestor`;
    }
    // add this node to the root's all_nodes list
    this._all_nodes = this.getRoot()._all_nodes;
  }

  /**
   *
   * @returns {number} the position of the given node.
   */
  getPosition(node = null) {
    if (node == null) {
      return this.getParent().children.indexOf(this);
    } else {
      return this.children.indexOf(node);
    }
  }

  /**
   *
   * @param {string | Node} child the node to insert, or id if creating new.
   * @param {number} pos the position to insert the new node at the parent children list.
   */
  insert(child, pos = -1) {
    if (pos < 0) {
      pos = this.children.length;
    }
    if (!(child instanceof Node)) {
      // create new node
      child = new Node(child, this, pos);
      // The constructor will handle the rest of insertion
      return;
    } else {
      child.setParents(this);
      this.children.splice(pos, 0, child);
      this._all_nodes[child.id] = child;
    }
  }

  /**
   *
   * @param {Node} parent the parent node (or its id) to move the node into.
   * @param {number} pos the position to move the node to.
   * @returns
   */
  move(parent = null, pos = -1) {
    if (!parent) {
      parent = this.getParent();
    } else {
      parent = this.get(parent);
    }
    // check if parent is in the same tree
    if (this.getRoot() != parent.getRoot()) {
      this.delete();
      parent.insert(this, pos);
      throw `Cannot move node with id ${this.id} to a different tree`;
    } else {
      this.delete((recursive = false));
      parent.insert(this, pos);
    }
  }

  /**
   *
   * @param {Node} node the node (or its id) to remove from this's children.
   */
  remove(node, recursive = true) {
    node = this.get(node);
    if (recursive) {
      // remove all children of the node from the all_nodes list
      node.getChildren().forEach((child) => {
        child.children = [];
        delete this._all_nodes[child.id];
      });
    }
    // if the node is in the children of this node, remove it
    const idx = this.children.indexOf(node);
    if (idx < 0) {
      throw `Node with id ${node.id} is not a child of node with id ${this.id}`;
    } else {
      this.children.splice(idx, 1);
      delete this._all_nodes[node.id];
    }
  }

  /**
   *
   * Remove this node from its parent
   */
  delete(recursive = true) {
    // if this is the root node, delete whole tree
    if (this.getParent() == null) {
      this.children.forEach((child) => {
        this.remove(child, recursive);
      });
      return;
    }
    this.getParent().remove(this, recursive);
  }

  /**
   *
   * @param {Node.Traverse} traverse the mode of the trasverse (preorder or shallow).
   * @param {boolean} getHidden if its true returns also the closed nodes.
   * @returns
   */
  traverse(traverse = Node.Traverse.PREORDER, getHidden = true) {
    var children = [this];
    if (traverse == Node.Traverse.SHALLOW) {
      return children.concat(this.children);
    } else if (traverse == Node.Traverse.PREORDER) {
      if (getHidden || this.opened) {
        children.push(
          ...this.children.reduce((acc, child) => {
            acc.push(...child.traverse(traverse, getHidden));
            return acc;
          }, [])
        );
      }
      return children;
    } else {
      throw `Unknown traverse mode: ${traverse}`;
    }
  }

  /**
   *
   * @param {Node.Traverse} traverse the mode of the trasverse (preorder or shallow).
   * @param {boolean} getHidden if its true returns also the closed nodes.
   * @returns
   */
  getChildren(traverse = Node.Traverse.PREORDER, getHidden = true) {
    return this.traverse(traverse, getHidden).slice(1); // remove the first element (this)
  }

  /**
   * A helper function to get only the visible nodes. (cover of the trasverse function)
   *
   * @param {Node.Traverse} traverse the mode of the trasverse (preorder or shallow).
   * @param {boolean} getHidden if its true returns also the closed nodes.
   *
   * @returns
   */
  getVisible(traverse = Node.Traverse.PREORDER, getHidden = false) {
    return this.getChildren(traverse, getHidden);
  }

  /**
   *
   * Opens (or closes) a given node.
   *
   * @param {boolean} open
   */
  open(open = true) {
    if (this.id === Node.ROOT_ID) {
      return;
    }
    this.opened = open;
  }

  /**
   * Closes a given node.
   */
  close() {
    this.open(false);
  }

  /**
   * Opens (or closes) all nodes in the tree.
   * @param {boolean} open
   */
  openAll(open = true) {
    this.getChildren().forEach((child) => {
      child.open(open);
    });
  }

  /**
   * Closes all nodes in the tree.
   */
  closeAll() {
    this.openAll(false);
  }
}
