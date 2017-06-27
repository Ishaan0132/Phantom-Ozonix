'use strict';

const assert = require('assert');

describe('Tools', function () {
	describe('global text functions', function () {
		it('toId should return an id', function () {
			assert.strictEqual(toId("Test"), "test");
			assert.strictEqual(toId({id: "test"}), "test");
		});
	});
	describe('getPokemon', function () {
		it('should return a Pokemon', function () {
			assert(Tools.getPokemon('Pikachu').species === "Pikachu");
		});
	});
	describe('getMove', function () {
		it('should return a move', function () {
			assert(Tools.getMove('Tackle').name === "Tackle");
		});
	});
	describe('getItem', function () {
		it('should return an item', function () {
			assert(Tools.getItem('Choice Scarf').name === "Choice Scarf");
		});
	});
	describe('getAbility', function () {
		it('should return an ability', function () {
			assert(Tools.getAbility('Intimidate').name === "Intimidate");
		});
	});
});
