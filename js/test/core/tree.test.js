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
		
		assert.equal(t.get('a'), t._root.children[0]);
		assert.equal(t.get('b'), t._root.children[1]);
		assert.equal(t.get('a0'), t.get('a').children[0]);
		assert.equal(t.get('a1'), t.get('a').children[1]);
		assert.equal(t.get('b0'), t.get('b').children[0]);
		assert.equal(t.get('b1'), t.get('b').children[1]);
		assert.equal(t.get('b2'), t.get('b').children[2]);

		done();
	});

});

