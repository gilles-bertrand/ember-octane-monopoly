import { tracked } from "@glimmer/tracking";
import Player from "./player";
import Dice from "./dice";
import { action } from "@ember/object";
import { assert } from "@ember/debug";

/**
 * Data that describes where the game is at
 */
export default class State {
  // Initiate new player instances
  @tracked
  players = [new Player("Mike", "car"), new Player("Lisa", "dog")];

  // Game need to show which player's turn it is
  @tracked
  currentPlayerId = 0;

  get numPlayers() {
    return this.players.length;
  }

  get currentPlayer() {
    return this.players[this.currentPlayerId];
  }

  // Initiate new dice instance
  @tracked
  dice = new Dice();

  // Determine if player can roll dice
  @tracked
  isDiceRollAllowed = true;

  // Game need to prompt player to throw dice
  // Player need to be able to throw dice

  @action
  rollForCurrentPlayer() {
    this.dice.roll();
    const diceTot = this.dice.total;
    this.currentPlayer.moveToNextPosition(diceTot);

    // if roll is NOT a double, player can't roll again
    if (!this.dice.isDouble) {
      this.isDiceRollAllowed = false;
    }
    // if current player already rolled 2x doubles, and the third roll is still a double
    else if (this.dice.isDouble && this.currentPlayer.doublesCount >= 2) {
      this.isDiceRollAllowed = false;
      this.currentPlayer.goToJail();
    }
    // if roll is a double, increase doublesCount by 1
    else {
      this.currentPlayer.doublesCount++;
    }
  }

  // IF in jail, player can get out of jail by:

  getOutOfJail() {
    assert(
      "getOutOfJail should only be called while current player is in jail",
      this.currentPlayer.isInJail
    );
    if (this.currentPlayer.GOOJrolls < 3) {
      // Have less than 3 tries at double rolls, player may attempt a roll for doubles
      this.dice.roll(); // normally would call rollForCurrentPlayer, but that includes moving position on board

      // Roll Double to get out
      if (this.dice.isDouble) {
        // freedom!
        this.leaveJail();
      } else {
        // still in jail, good luck next turn
        this.currentPlayer.GOOJrolls++;
        this.isDiceRollAllowed = false;
      }
    } else {
      // Already had 3 tries at double rolls, must pay fine $50 and get out
      this.currentPlayer.money -= 50;
      this.isDiceRollAllowed = true;
      this.leaveJail();
    }
  }

  leaveJail() {
    this.currentPlayer.isInJail = false;
    this.currentPlayer.GOOJrolls = 0;
    this.currentPlayer.positionOnBoard = 10;

    // TODO: do we want the player to be involved in "rolling" to move? This is automatic
    this.rollForCurrentPlayer();
  }

  @action
  endTurn() {
    if (this.currentPlayerId === this.players.length - 1)
      this.currentPlayerId = 0;
    else this.currentPlayerId++;

    this.isDiceRollAllowed = true;
  }

  // After diceRoll, player's token should move to new space
  // IF space is empty, ask to buy?
  // IF space is owned, pay rent
}
