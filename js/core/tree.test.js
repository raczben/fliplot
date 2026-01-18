const { Node } = require("./tree.js");

describe("Tree Test", () => {
  test("basic insert", () => {
    var t = Node.createRoot();

    t.insert("asd", 0);
    expect(t.get("asd")).toBe(t._all_nodes["asd"]);
    expect(t.get("asd").getId()).toBe("asd");
    expect(t.get("asd").getParent()).toBe(t);
    expect(t.get("asd").getChildren()).toEqual([]);
    expect(t.get("#").getChildren()).toEqual([t.get("asd")]);
  });

  test("more insert", () => {
    var t = Node.createRoot();

    t.insert("a");
    var a = t.get("a");
    a.insert("a0");
    a.insert("a1");

    t.insert("b");
    var b = t.get("b");
    b.insert("b2", 0);
    b.insert("b0", 0);
    b.insert("b1", 1);

    a = t.get("a");
    const a0 = t.get("a0");
    const a1 = t.get("a1");
    b = t.get("b");
    const b0 = t.get("b0");
    const b1 = t.get("b1");
    const b2 = t.get("b2");

    expect(t.get("a")).toBe(t.children[0]);
    expect(t.get("b")).toBe(t.children[1]);
    expect(t.get("a0")).toBe(t.get("a").children[0]);
    expect(t.get("a1")).toBe(t.get("a").children[1]);
    expect(t.get("b0")).toBe(t.get("b").children[0]);
    expect(t.get("b1")).toBe(t.get("b").children[1]);
    expect(t.get("b2")).toBe(t.get("b").children[2]);

    expect(t.getId("a")).toBe("a");
    expect(t.getId(b)).toBe("b");
    expect(t.getId("a0")).toBe("a0");
    expect(t.getId("a1")).toBe("a1");
    expect(t.getId("b0")).toBe("b0");
    expect(t.getId("b1")).toBe("b1");
    expect(t.getId("b2")).toBe("b2");

    expect(t.getParent("a0")).toBe(a);
    expect(t.getParent("a1")).toBe(a);
    expect(t.getParent("b0")).toBe(b);
    expect(t.getParent("b1")).toBe(b);
    expect(t.getParent("b2")).toBe(b);

    expect(
      t
        .get("b")
        .getChildren(Node.Traverse.SHALLOW)
        .map((n) => n.id)
    ).toEqual(["b0", "b1", "b2"]);
    expect(
      t
        .get("a")
        .getChildren()
        .map((n) => n.id)
    ).toEqual([a0, a1].map((n) => n.id));
  });

  test("move", () => {
    var t = Node.createRoot();

    t.insert("a");
    var a = t.get("a");
    a.insert("a0");
    a.insert("a1");

    t.insert("b");
    var b = t.get("b");
    b.insert("b2", 0);
    b.insert("b0", 0);
    b.insert("b1", 1);

    t.get("b0").move(null, 1);
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b1", "b0", "b2"]);

    t.get("b0").move(null, 1);
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b1", "b0", "b2"]);

    t.get("b0").move(null, 0);
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b0", "b1", "b2"]);

    t.get("b2").move("a", 2);
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b0", "b1"]);
    expect(t.get("a").children.map((n) => n.id)).toEqual(["a0", "a1", "b2"]);

    t.get("b").move("a", 3);
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b0", "b1"]);
    expect(t.get("a").children.map((n) => n.id)).toEqual(["a0", "a1", "b2", "b"]);
    expect(t.getChildren().map((n) => n.id)).toEqual(["a", "a0", "a1", "b2", "b", "b0", "b1"]);
  });

  test("remove", () => {
    var t = Node.createRoot();

    t.insert("a");
    t.get("a").insert("a0");
    t.get("a").insert("a1");

    t.insert("b");
    t.get("b").insert("b2", 0);
    t.get("b").insert("b0", 0);
    t.get("b").insert("b1", 1);

    expect(Object.keys(t._all_nodes).length).toBe(8);
    t.get("b0").delete();
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b1", "b2"]);
    expect(Object.keys(t._all_nodes).length).toBe(7);

    t.get("b2").delete();
    expect(t.get("b").children.map((n) => n.id)).toEqual(["b1"]);
    expect(Object.keys(t._all_nodes).length).toBe(6);

    t.get("b").delete();
    expect(t.getChildren().map((n) => n.id)).toEqual(["a", "a0", "a1"]);
    expect(Object.keys(t._all_nodes).length).toBe(4);

    t.get("a").delete();
    expect(t.getChildren().map((n) => n.id)).toEqual([]);
    expect(Object.keys(t._all_nodes).length).toBe(1);
  });

  test("open-close", () => {
    var t = Node.createRoot();

    t.insert("a");
    t.get("a").insert("a0");
    t.get("a").insert("a1");

    t.insert("b");
    t.get("b").insert("b2", 0);
    t.get("b").insert("b0", 0);
    t.get("b").insert("b1", 1);

    expect(t.getVisible().map((n) => n.id)).toEqual(["a", "b"]);

    t.get("a").open();
    expect(t.getVisible().map((n) => n.id)).toEqual(["a", "a0", "a1", "b"]);

    t.openAll();
    expect(t.getVisible().map((n) => n.id)).toEqual(["a", "a0", "a1", "b", "b0", "b1", "b2"]);

    t.closeAll();
    expect(t.getVisible().map((n) => n.id)).toEqual(["a", "b"]);
  });
});
