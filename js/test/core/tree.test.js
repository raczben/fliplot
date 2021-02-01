import {Node, Tree} from '../../core/tree.js';
import { inspect } from 'util';

describe('Tree Test', function() {
	it('basic insert', function(done) {
        var t = new Tree();

        t.insert('asd', null, 0);
		
		expect(t.get('asd')).toBe(t.nodes.asd);
		expect(t.get('asd')).toBe(t._root.children[0]);

		done();
	});

	it('more insert', function(done) {
        var t = new Tree();

        t.insert('a');
        t.insert('a0', 'a');
		t.insert('a1', 'a');
		
        t.insert('b');
        t.insert('b2', 'b', 0);
        t.insert('b0', 'b', 0);
		t.insert('b1', 'b', 1);
		
		const a =  t.get('a');
		const a0 = t.get('a0');
		const a1 = t.get('a1');
		const b =  t.get('b');
		const b0 = t.get('b0');
		const b1 = t.get('b1');
		const b2 = t.get('b2');
		
		expect(t.get('a')).toBe(t._root.children[0]);
		expect(t.get('b')).toBe(t._root.children[1]);
		expect(t.get('a0')).toBe(t.get('a').children[0]);
		expect(t.get('a1')).toBe(t.get('a').children[1]);
		expect(t.get('b0')).toBe(t.get('b').children[0]);
		expect(t.get('b1')).toBe(t.get('b').children[1]);
		expect(t.get('b2')).toBe(t.get('b').children[2]);

		expect(t.getId('a')).toBe('a');
		expect(t.getId(b)).toBe('b');
		expect(t.getId('a0')).toBe('a0');
		expect(t.getId('a1')).toBe('a1');
		expect(t.getId('b0')).toBe('b0');
		expect(t.getId('b1')).toBe('b1');
		expect(t.getId('b2')).toBe('b2');

		expect(t.getParent('a0')).toBe(a);
		expect(t.getParent('a1')).toBe(a);
		expect(t.getParent('b0')).toBe(b);
		expect(t.getParent('b1')).toBe(b);
		expect(t.getParent('b2')).toBe(b);

		expect(t.getChildren('b', Tree.Traverse.SHALLOW)).toEqual([b0, b1, b2]);
		expect(t.getChildren('a').map(n=>n.id)).toEqual([a0, a1].map(n=>n.id));

		done();
	});

	it('insert with data', function(done) {
		var t = new Tree();
		
		const databank = {
			a: 'Hello darkness my old friend!',
			a0: [1,2,3,4,5,6],
			a1: ['Not', 'to', 'us'],
			b: 1234567,
			b0: {x:1, y:2, z:3},
			b1: {x:11, y:12, z:13},
			b2: {x:21, y:22, z:23}
		};

        t.insert('a', null, null, databank['a']);
        t.insert('a0', 'a', null, databank['a0']);
		t.insert('a1', 'a', null, databank['a1']);
		
        t.insert('b', null, null, databank['b']);
        t.insert('b2', 'b', 0, databank['b2']);
        t.insert('b0', 'b', 0, databank['b0']);
        t.insert('b1', 'b', 1, databank['b1']);
		
		expect(t.get('a').data).toBe(databank['a']);
		expect(t.get('b').data).toBe(databank['b']);
		expect(t.get('a0').data).toBe(databank['a0']);
		expect(t.get('a1').data).toBe(databank['a1']);
		expect(t.get('b0').data).toBe(databank['b0']);
		expect(t.get('b1').data).toBe(databank['b1']);
		expect(t.get('b2').data).toBe(databank['b2']);

		done();
	});

	it('move', function(done) {
        var t = new Tree();

        t.insert('a');
        t.insert('a0', 'a');
		t.insert('a1', 'a');
		
        t.insert('b');
        t.insert('b2', 'b', 0);
        t.insert('b0', 'b', 0);
		t.insert('b1', 'b', 1);
		
		t.move('b0', 1)
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b1', 'b0', 'b2']);
		
		t.move('b0', 1)
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b1', 'b0', 'b2']);
		
		t.move('b0', 0)
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b0', 'b1', 'b2']);
		
		t.move('b2', 2, 'a')
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b0', 'b1']);
		expect(t.get('a').children.map(n=>n.id)).toEqual(['a0', 'a1', 'b2']);
		
		t.move('b', 3, 'a')
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b0', 'b1']);
		expect(t.get('a').children.map(n=>n.id)).toEqual(['a0', 'a1', 'b2', 'b']);
		expect(t.getChildren('#').map(n=>n.id)).toEqual(['a', 'a0', 'a1', 'b2', 'b', 'b0', 'b1']);

		done();
	});

	it('remove', function(done) {
        var t = new Tree();

        t.insert('a');
        t.insert('a0', 'a');
		t.insert('a1', 'a');
		
        t.insert('b');
        t.insert('b2', 'b', 0);
        t.insert('b0', 'b', 0);
		t.insert('b1', 'b', 1);
		
		
		expect(Object.keys(t.nodes).length).toBe(8);
		t.remove('b0', 1)
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b1', 'b2']);
		expect(Object.keys(t.nodes)).toHaveLength(7);
		
		t.remove('b2', 1)
		expect(t.get('b').children.map(n=>n.id)).toEqual(['b1']);
		expect(Object.keys(t.nodes)).toHaveLength(6);
		
		t.remove('b', 0)
		expect(t.getChildren('#').map(n=>n.id)).toEqual(['a', 'a0', 'a1']);
		expect(Object.keys(t.nodes)).toHaveLength(4);
		
		t.remove('a', 0)
		expect(t.getChildren('#').map(n=>n.id)).toEqual([]);
		expect(Object.keys(t.nodes)).toHaveLength(1);
		
		done();
	});

	it('open-close', function(done) {
        var t = new Tree();

        t.insert('a');
        t.insert('a0', 'a');
		t.insert('a1', 'a');
		
        t.insert('b');
        t.insert('b2', 'b', 0);
        t.insert('b0', 'b', 0);
		t.insert('b1', 'b', 1);
		
		expect(t.getVisible().map(n=>n.id)).toEqual(['a', 'b']);
		
		t.open('a');
		expect(t.getVisible().map(n=>n.id)).toEqual(['a', 'a0', 'a1', 'b']);
		
		t.openAll();
		expect(t.getVisible().map(n=>n.id)).toEqual(['a', 'a0', 'a1', 'b', 'b0', 'b1', 'b2']);
		
		t.closeAll();
		expect(t.getVisible().map(n=>n.id)).toEqual(['a', 'b']);
		
		done();
	});


});
