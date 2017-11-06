'use strict';

const assert = require('assert');

describe('Tools', function () {
	describe('toId', function () {
		it('should return an id', function () {
			assert(Tools.toId("Test") === "test");
			assert(Tools.toId({id: "Test"}) === "test");
		});
	});
	describe('getPokemon', function () {
		it('should return a Pokemon with the necessary data', function () {
			let base = Tools.getPokemon("Arceus");
			assert(base.types.length === 1);
			assert(base.types[0] === 'Normal');
			assert(base.species === 'Arceus');
			assert(base.speciesid === 'arceus');
			assert(base.baseSpecies === base.species);
			assert(base.learnset);
			assert(base.tier);

			let forme = Tools.getPokemon('Arceus-Fire');
			assert(forme.types.length === 1);
			assert(forme.types[0] === 'Fire');
			assert(forme.species === 'Arceus-Fire');
			assert(forme.speciesid === 'arceusfire');
			assert(forme.baseSpecies === "Arceus");
			assert(!forme.learnset);
			assert(forme.tier);

			assert(Tools.getPokemon("Missingno.").isNonstandard);
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
