// var chai = require('chai');
import {Node, Tree} from '../../core/tree.js';
import { inspect } from 'util';
import chai from 'chai';
const { assert } = chai;
const { expect } = chai;

describe('Tree Test', function() {
	it('basic insert', function(done) {
        var t = new Tree();

        t.insert('asd', null, 0);
		
		assert.equal(t.get('asd'), t.nodes.asd);
		assert.equal(t.get('asd'), t._root.children[0]);

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
		
		assert.equal(t.get('a'), t._root.children[0]);
		assert.equal(t.get('b'), t._root.children[1]);
		assert.equal(t.get('a0'), t.get('a').children[0]);
		assert.equal(t.get('a1'), t.get('a').children[1]);
		assert.equal(t.get('b0'), t.get('b').children[0]);
		assert.equal(t.get('b1'), t.get('b').children[1]);
		assert.equal(t.get('b2'), t.get('b').children[2]);

		assert.equal(t.getId('a'), 'a');
		assert.equal(t.getId(b), 'b');
		assert.equal(t.getId('a0'), 'a0');
		assert.equal(t.getId('a1'), 'a1');
		assert.equal(t.getId('b0'), 'b0');
		assert.equal(t.getId('b1'), 'b1');
		assert.equal(t.getId('b2'), 'b2');

		assert.equal(t.getParent('a0'), a);
		assert.equal(t.getParent('a1'), a);
		assert.equal(t.getParent('b0'), b);
		assert.equal(t.getParent('b1'), b);
		assert.equal(t.getParent('b2'), b);

		expect(t.getChildren('b', Tree.Traverse.SHALLOW)).to.eql([b0, b1, b2]);
		expect(t.getChildren('a').map(n=>n.id)).to.eql([a0, a1].map(n=>n.id));

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
		
		assert.equal(t.get('a').data, databank['a']);
		assert.equal(t.get('b').data, databank['b']);
		assert.equal(t.get('a0').data, databank['a0']);
		assert.equal(t.get('a1').data, databank['a1']);
		assert.equal(t.get('b0').data, databank['b0']);
		assert.equal(t.get('b1').data, databank['b1']);
		assert.equal(t.get('b2').data, databank['b2']);

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
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b1', 'b0', 'b2']);
		
		t.move('b0', 1)
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b1', 'b0', 'b2']);
		
		t.move('b0', 0)
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b0', 'b1', 'b2']);
		
		t.move('b2', 2, 'a')
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b0', 'b1']);
		expect(t.get('a').children.map(n=>n.id)).to.eql(['a0', 'a1', 'b2']);
		
		t.move('b', 3, 'a')
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b0', 'b1']);
		expect(t.get('a').children.map(n=>n.id)).to.eql(['a0', 'a1', 'b2', 'b']);
		expect(t.getChildren('#').map(n=>n.id)).to.eql(['a', 'a0', 'a1', 'b2', 'b', 'b0', 'b1']);

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
		
		
		assert.equal(Object.keys(t.nodes).length, 8);
		t.remove('b0', 1)
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b1', 'b2']);
		assert.equal(Object.keys(t.nodes).length, 7);
		
		t.remove('b2', 1)
		expect(t.get('b').children.map(n=>n.id)).to.eql(['b1']);
		assert.equal(Object.keys(t.nodes).length, 6);
		
		t.remove('b', 0)
		expect(t.getChildren('#').map(n=>n.id)).to.eql(['a', 'a0', 'a1']);
		assert.equal(Object.keys(t.nodes).length, 4);
		
		t.remove('a', 0)
		expect(t.getChildren('#').map(n=>n.id)).to.eql([]);
		assert.equal(Object.keys(t.nodes).length, 1);
		
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
		
		expect(t.getVisible().map(n=>n.id)).to.eql(['a', 'b']);
		
		t.open('a');
		expect(t.getVisible().map(n=>n.id)).to.eql(['a', 'a0', 'a1', 'b']);
		
		t.openAll();
		expect(t.getVisible().map(n=>n.id)).to.eql(['a', 'a0', 'a1', 'b', 'b0', 'b1', 'b2']);
		
		t.closeAll();
		expect(t.getVisible().map(n=>n.id)).to.eql(['a', 'b']);
		
		done();
	});


});

