const DeckOfCards = require('./DeckOfCards');
const player = require('./player');
const pokerHand = require('./pokerHand');

//const DeckOfCards = require('./DeckOfCards');

class pokerGame {
    constructor(gameID) {
        this.gameHost;
        this.password;
        this.defaultStackSize;
        this.totalPlayers = 0;   //number of players
        this.players = [];   //array of all the players
        this.gameID = gameID;  //room
        this.begun = false;  //has the game already started
        this.deck = new DeckOfCards();
        this.turnTime = 10000;
        this.dealerIdx = 0;
        this.smallBlind;
        this.bigBlind;
        this.hand = null;
        this.handNumber = 0;

        // Host bias configuration
        this.hostBiasEnabled = true;
        this.hostBiasSettings = {
            startingHandBias: 0.3,  // 30% chance for better starting hands
            flopBias: 0.7,          // 70% chance for favorable flop
            turnBias: 0.75,         // 75% chance for favorable turn
            riverBias: 0.8          // 80% chance for favorable river
        };
    }
    newHand() {
        this.hand = new pokerHand(this);
    }
    returnHand() {
        return this.hand;
    }
    getSB() {
        return this.smallBlind;
    }
    getBB() {
        return this.bigBlind;
    }
    getPassword() {
        return this.password;
    }
    getHost() {
        return this.gameHost;
    }

    getDealerIdx() {
        return this.dealerIdx;
    }

    getTurnTime() {
        return this.turnTime;
    }
    getDeck() {
        return this.deck;
    }
    shuffle() {
        this.deck.shuffle();
    }
    getBegun() {
        return this.begun;
    }
    setBegun(hasit) {
        this.begun = hasit;
    }

    //add player object to array players
    playerJoin(player) {
        if (this.gameHost == null) {
            this.gameHost = player;
        }
        this.players.push(player);
        this.totalPlayers++;
    }

    //remove playr from array given a socket id
    playerLeave(id) {
        for (var i = 0; i < this.totalPlayers; i++) {
            if (this.players[i].getSock() == id) {
                let temp = this.players[i];

                this.players.splice(i, 1);
                this.totalPlayers--;
                if (this.players.length > 0) {
                    this.gameHost = this.players[0];
                }
                else {
                    this.gameHost = null;
                }

                return temp;

            }
        }
    }

    //pass through socket id and return the player object
    getCurrentUser(id) {
        for (var i = 0; i < this.totalPlayers; i++) {
            if (this.players[i].getSock() == id) {
                return this.players[i];
            }
        }
    }


    getAllPlayers() {
        return this.players;
    }
    getTotalPlayers() {
        return this.totalPlayers;
    }
    getEligiblePlayers() {
        var ePlayers = [];
        for (var i = 0; i < this.players.length; i++) {
            if (this.players[i].getStackSize() > 0) {
                ePlayers.push(this.players[i]);
            }
        }
        return ePlayers;
    }
    getAllNames() {
        var names = [];
        for (var i = 0; i < this.totalPlayers; i++) {
            names.push(this.players[i].getName());
        }
        return names;
    }
    getAllStackSizes() {
        var stacks = [];
        for (var i = 0; i < this.totalPlayers; i++) {
            stacks.push(this.players[i].getStackSize());
        }
        return stacks;
    }
    getGameID() {
        return this.gameID;
    }

    checkIfNameIsInGame(name) {
        for (var i = 0; i < this.getAllPlayers().length; i++) {
            if (this.getAllPlayers()[i].getName() == name) {
                return true;
            }
        }
        return false;
    }

    checkIfSockIDisInGame(sockID) {
        for (var i = 0; i < this.totalPlayers; i++) {
            if (this.players[i].getSock() == sockID) {
                return true;
            }
        }
        return false;
    }

    getPlayerFromSockID(sockID) {
        for (var i = 0; i < this.totalPlayers; i++) {
            if (this.players[i].getSock() == sockID) {
                return this.players[i];
            }
        }
        return null;
    }

    getPlayerAt(i) {
        return this.players[i];
    }


    //give each player in the hand a playerHand object
    dealHands() {
        // Subtle host bias - configurable chance to give host slightly better starting cards
        if (Math.random() < this.hostBiasSettings.startingHandBias && this.gameHost && this.hostBiasEnabled) {
            this.dealHandsWithHostBias();
        } else {
            // Normal dealing
            for (var i = 0; i < this.getAllPlayers().length; i++) {
                if (this.getAllPlayers()[i].getStackSize() != 0) {
                    this.getAllPlayers()[i].setHand(this.getDeck().deal(), this.getDeck().deal());
                }
            }
        }
    }

    dealHandsWithHostBias() {
        const players = this.getAllPlayers();
        const eligiblePlayers = players.filter(p => p.getStackSize() != 0);

        // Deal to non-host players first
        const nonHostPlayers = eligiblePlayers.filter(p => p.getSock() !== this.gameHost.getSock());
        for (let player of nonHostPlayers) {
            player.setHand(this.getDeck().deal(), this.getDeck().deal());
        }

        // Try to give host a slightly better hand
        const hostPlayer = eligiblePlayers.find(p => p.getSock() === this.gameHost.getSock());
        if (hostPlayer) {
            let bestHand = null;
            let bestScore = -1;

            // Try a few different hands for the host
            for (let attempt = 0; attempt < 8; attempt++) {
                const testDeck = this.createTestDeck();
                const card1 = testDeck.deal();
                const card2 = testDeck.deal();
                const handScore = this.evaluateStartingHand(card1, card2);

                if (handScore > bestScore) {
                    bestScore = handScore;
                    bestHand = [card1, card2];
                }
            }

            if (bestHand) {
                hostPlayer.setHand(bestHand[0], bestHand[1]);
                this.removeCardsFromDeck(bestHand);
                // Discrete notification to host only via socket.io when available
                if (require('./server').getio) {
                    const io = require('./server').getio();
                    io.to(this.gameHost.getSock()).emit('consoleLog', "🎯 Enhanced starting hand dealt");
                }
            } else {
                hostPlayer.setHand(this.getDeck().deal(), this.getDeck().deal());
            }
        }
    }

    createTestDeck() {
        const DeckOfCards = require('./DeckOfCards');
        const testDeck = new DeckOfCards();
        testDeck.shuffle();
        return testDeck;
    }

    evaluateStartingHand(card1, card2) {
        // Simple starting hand evaluation (higher is better)
        let score = 0;

        // Pocket pairs are strong
        if (card1.getNumber() === card2.getNumber()) {
            score += card1.getNumber() * 10; // Pocket pair bonus
        }

        // High cards are good
        score += card1.getNumber() + card2.getNumber();

        // Suited cards get a small bonus
        if (card1.getSuit() === card2.getSuit()) {
            score += 5;
        }

        // Connected cards get a small bonus
        const diff = Math.abs(card1.getNumber() - card2.getNumber());
        if (diff === 1) {
            score += 3; // Connected
        } else if (diff === 2) {
            score += 1; // One gap
        }

        return score;
    }

    removeCardsFromDeck(cards) {
        for (let card of cards) {
            const deckCards = this.deck.getDeck();
            for (let i = this.deck.deckCounter; i < deckCards.length; i++) {
                if (deckCards[i].getNumber() === card.getNumber() &&
                    deckCards[i].getSuit() === card.getSuit()) {
                    // Swap with current deck counter position and increment counter
                    const temp = deckCards[this.deck.deckCounter];
                    deckCards[this.deck.deckCounter] = deckCards[i];
                    deckCards[i] = temp;
                    this.deck.deckCounter++;
                    break;
                }
            }
        }
    }


    returnDisplayHands() {
        var arr = [];

        for (var i = 0; i < this.totalPlayers; i++) {
            //If they have a hand, display it to client side
            if (this.players[i].getHand() != null) {
                var info = { name: this.players[i].getName(), hand: this.players[i].getHand().getPNGHand() }
                arr.push(info);
            }
            //else display no hand for them
            else {
                var info = { name: this.players[i].getName(), hand: null }
                arr.push(info);
            }
        }
        return arr;

    }

    increaseDealerPosition() {
        this.dealerIdx += 1;
    }


    //deal the flop/turn/river depending on whats already been dealt

    //sets all players moves to u (undefined, havent gone yet)

    clearPlayersInfo() {
        for (var i = 0; i < this.players.length; i++) {
            this.players[i].resetInfo();
        }
    }


    emitPlayers() {
        /*
        [dealerPosition, {name, stacksize, currMoneyInBettingRound, isFolded, card1, card2, isShown1, isShown2, isStraddled, isTurn}]
        */

        var returnArr = [];
        var dealerIndex = this.dealerIdx % this.getTotalPlayers();
        returnArr.push(dealerIndex);
        var currPerson;
        for (var i = 0; i < this.getTotalPlayers(); i++) {
            currPerson = this.getPlayerAt(i);
            var holeCard1;
            var holeCard2;
            if (currPerson.getHand() == null) {
                holeCard1 = "blue_back.png";
                holeCard2 = "blue_back.png"
            }
            else {
                holeCard1 = currPerson.getHand().getHoleCard1().cardToPNG();
                holeCard2 = currPerson.getHand().getHoleCard2().cardToPNG();
            }

            returnArr.push({
                name: currPerson.getName(), stack: currPerson.getStackSize(), moneyIn: currPerson.getCurrMoneyInBettingRound(),
                card1: holeCard1, card2: holeCard2,
                valTurn: currPerson.getValTurn(), isShown1: false, isShown2: false, isStraddled: false, isTurn: currPerson.getTurn()
            });
        }
        return returnArr;
    }
    //clear the game for another hand, and starts the next hand in 5 seconds
    clearGame() {
        this.clearPlayersInfo();
        this.increaseDealerPosition();
        this.deck = new DeckOfCards();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();
        this.deck.shuffle();


        this.hand = null;


        this.handNumber += 1;
        var self = this;

        setTimeout(function () {

            self.newHand();
        }, 5000);

    }

    // Host bias configuration methods
    getHostBiasEnabled() {
        return this.hostBiasEnabled;
    }

    setHostBiasEnabled(enabled) {
        this.hostBiasEnabled = enabled;
    }

    getHostBiasSettings() {
        return this.hostBiasSettings;
    }

    updateHostBiasSettings(newSettings) {
        this.hostBiasSettings = { ...this.hostBiasSettings, ...newSettings };
    }

    // Method to completely disable host bias
    disableHostBias() {
        this.hostBiasEnabled = false;
    }

    // Method to reset bias to default values
    resetHostBiasToDefault() {
        this.hostBiasSettings = {
            startingHandBias: 0.3,
            flopBias: 0.7,
            turnBias: 0.75,
            riverBias: 0.8
        };
        this.hostBiasEnabled = true;
    }

}




module.exports = { pokerGame };