// 'Patience' - Solitaire card game (found in video game EXAPUNKS)

class SolitaireGame {
  static get Card() {
    return {
      Suits: ['S', 'H', 'C', 'D'],
      Values: [10, 9, 8, 7, 6]
    };
  }
  static isBlackSuit(card) { return card.suit === 'S' || card.suit === 'C'; }
  static isRedSuit(card) { return card.suit === 'H' || card.suit === 'D'; }

  constructor(onGameOverCallback) {
    // register game over callback
    this.gameOverCallback = onGameOverCallback;

    // game rules
    this.rule = {
      // Valid cards for stacking?
      // 10, 9, 8, 7, 6: descending order of value & alternate color
      // S, H, C, D: same value/suit & same color
      validStack: (card, nextCard) => {
        // console.log('game rule.validStack', card, nextCard);
        if (SolitaireGame.Card.Values.includes(card.value)) {
          // 10, 9, 8, 7, 6: descending order of value & alternate color
          const isDiffSuitColor = SolitaireGame.isBlackSuit(card) ?
            SolitaireGame.isRedSuit(nextCard) :
            SolitaireGame.isBlackSuit(nextCard);
          if (nextCard.value === card.value - 1 && isDiffSuitColor) {
            return true;
          }
        } else if (SolitaireGame.Card.Suits.includes(card.value)) {
          // S, H, C, D: same value/suit & same color
          if (card.value === nextCard.value && card.suit === nextCard.suit) {
            return true;
          }
        }
        return false;
      },
      cardsSelection: (stackIdx, cardIdx) => {
        let selectionPosEnd = cardIdx;
        const stack = this.cardStacks[stackIdx];
        const cards = stack.slice(cardIdx, stack.length);

        for (let i = 0; i < cards.length - 1; i++) {
          const card = cards[i], nextCard = cards[i + 1];
          if (this.rule.validStack(card, nextCard)) {
            selectionPosEnd++;
          } else break;
        }
        // selection ends on top card of stack?
        return selectionPosEnd === stack.length - 1 ? selectionPosEnd : -1;
      },
      cardPlacement: (stackIdx) => {
        const stack = this.cardStacks[stackIdx];
        // allow any cards on empty slot
        if (stack.length === 0) return true;
        // check: selected cards can stack on top of target stack?
        // assume selected cards already a valid stack
        const topCardOfStack = stack[stack.length - 1];
        const bottomSelectedCard = this.getSelectedCards()[0];
        // console.log('cardPlacement', topCardOfStack, bottomSelectedCard);
        return this.rule.validStack(topCardOfStack, bottomSelectedCard);
      },
      // Free cell rule (checked when dropping cards onto cell)
      freeCellDropRule: () => {
        const conditions = [
          // free cell is free
          this.freeCellCard === null,
          // only allow 1 card on free cell
          this.selectedCardIDs.length === 1
        ];
        return conditions.every(cond => cond === true);
      }
    };

    // cards in this solitaire game
    const baseCardsBySuits = [
      ...SolitaireGame.Card.Suits.map(suit => [
        // 4 suit cards of each suit
        ...Array(4).fill({ suit, value: suit }),
        // 5 value cards of each suit
        ...SolitaireGame.Card.Values.map(i => ({ suit, value: i }))
      ])
    ];
    this.baseCards = baseCardsBySuits.reduce((allCards, cardsOfSuit) =>
      allCards.concat(cardsOfSuit), []);
    // console.log(this.baseCards);


    // game state
    this.isGameOver = false;
    // 9 stacks
    this.cardStacks = null;
    // 1 free cell
    this.freeCellCard = null;

    this.selectedCardIDs = null;
    this.closedStackIdxs = null;
  }

  newGame() {
    console.log('SolitaireGame.newGame');
    this.isGameOver = false;

    // populate card stacks
    let cardID = 0;
    const newCards = this.baseCards.map(baseCard => ({
      ...baseCard,
      id: cardID++
    }));
    shuffle(newCards);
    this.cardStacks = [];
    for (let i = 0; i < 9; i++) {
      this.cardStacks.push(newCards.splice(0, 4));
    }
    console.log(this);
    this.freeCellCard = null;
    this.closedStackIdxs = [];
  }

  // Actions e.g. select/drag, place/drop cards

  select(cardID) {
    if (this.isGameOver) return [];

    // select card on free cell?
    if (this.freeCellCard && cardID === this.freeCellCard.id) {
      return this.selectedCardIDs = [cardID];
    }
    // select cards of stack: from the one selected to top of stack if possible
    let targetCardIDs = [];
    for (let stackIdx = 0; stackIdx < this.cardStacks.length; stackIdx++) {
      const stack = this.cardStacks[stackIdx];
      const selectedCardIndex = stack.findIndex(card => card.id === cardID);
      if (selectedCardIndex === -1) continue;
      // select cards from clicked index to top of stack, if valid
      // game logic: what cards can be selected as a stack?
      const lastCardPos = this.rule.cardsSelection(stackIdx, selectedCardIndex);
      targetCardIDs = lastCardPos > -1 ? // selection is valid?
        stack.slice(selectedCardIndex, lastCardPos + 1).map(card => card.id) :
        [];
    }
    // console.log('selected card IDs', targetCardIDs);
    this.selectedCardIDs = Array.prototype.slice.call(targetCardIDs);
    return targetCardIDs;
  }

  place(targetStackIdx) {
    // check: currently dragging any card?
    if (!this.selectedCardIDs) return false;

    // game logic: validate cards drop
    // target stack is valid?
    if (targetStackIdx === -1) {
      // not dropped on a stack: reset dragged cards
      this.selectedCardIDs = null;
      return false;
    }
    // is stack closed?
    if (this.closedStackIdxs.includes(targetStackIdx)) {
      return false;
    }
    // rule check: placing card onto a 'valid' stack?
    if (this.rule.cardPlacement(targetStackIdx) === false) {
      return false;
    }

    const targetStack = this.cardStacks[targetStackIdx];
    // remove dragged cards from original stack
    let draggedCards;
    // check: card from free cell
    if (this.freeCellCard && this.selectedCardIDs[0] === this.freeCellCard.id) {
      // place dragged cards onto stack
      targetStack.push(this.freeCellCard);
      this.freeCellCard = null; // clear free cell
    } else {
      // find dragged cards from stacks
      for (let _stackIdx = 0; _stackIdx < this.cardStacks.length; _stackIdx++) {
        const stack = this.cardStacks[_stackIdx];
        const draggedCardIdx = stack.findIndex(card =>
          this.selectedCardIDs.includes(card.id));
        if (draggedCardIdx === -1) continue;
        // remove cards using array splice
        draggedCards = stack.splice(draggedCardIdx, this.selectedCardIDs.length);
      }
      // place dragged cards onto stack
      targetStack.push(...draggedCards);
    }

    this.onStackUpdated(targetStackIdx);
    // console.log('updated', targetStack);
    // console.log('game state', this.cardStacks);
    return true;
  }

  placeOnFreeCell() {
    // console.log('placeOnFreeCell');
    // game logic: validate free cell usage
    if (this.rule.freeCellDropRule() === false) return false;
    // remove selected card from stack
    const selectedCardID = this.selectedCardIDs[0];
    for (let stack of this.cardStacks) {
      const draggedCardIdx = stack.findIndex(card =>
        card.id === selectedCardID);
      if (draggedCardIdx === -1) continue;
      // remove cards using array splice
      const freeCellCard = stack.splice(draggedCardIdx, 1);
      // move selected card to free cell
      this.freeCellCard = freeCellCard[0];
      console.log('placeOnFreeCell - placed cards', this.freeCellCard);
      return true;
    }
    return false;
  }

  // Game events

  onStackUpdated(cardStackIdx) {
    const cardStack = this.cardStacks[cardStackIdx];

    // turn over stack if 4 cards of same suit/symbol
    const allSameValue = cardStack.every(card =>
      card.value === cardStack[0].value);
    if (allSameValue && cardStack.length === 4) {
      // "turn over" stack: set flag
      this.closedStackIdxs.push(cardStackIdx);
    }

    // check: win condition
    this.checkWinCondition();
  }

  checkWinCondition() {
    // Win condition:
    // - Number/value cards arranged in stacks
    //   (descending order of value & alternate suit)
    // - Suit cards stacked by each suit (4 cards in a stack & closed/flipped)
    for (const stack of this.cardStacks) {
      if (stack.length === 0) continue; // fail if empty stack

      const bottomCard = stack[0];
      if (SolitaireGame.Card.Values.includes(bottomCard.value)) {
        // need all 5 value cards
        if (stack.length < SolitaireGame.length) return false;
        // number/value card: descending order stack & alternate suit
        const numberStackCheck = stack.every((card, cardIdx) => {
          // first/bottom card is a 10
          if (cardIdx === 0) return card.value === 10;
          const prevCard = stack[cardIdx - 1];
          return card.value === prevCard.value - 1 &&
            card.suit !== prevCard.suit;
        });
        if (numberStackCheck === false) return false;
      } else {
        // symbol/suit card: all cards are the same suit/symbol/value
        const suitStackCheck = stack.every(card =>
          card.value === bottomCard.value && card.suit === bottomCard.suit);
        if (suitStackCheck === false) return false;
      }
    }
    // failsafe: only 1 empty stack on table
    if (this.cardStacks.map(stack => stack.length)
      .filter(stackSize => stackSize === 0).length !== 1) return false;
    // win condition reached!
    this.gameOver(true);
  }

  gameOver(gameIsWon) {
    console.log('gameOver', gameIsWon ? 'WIN' : 'LOSE');
    if (typeof this.gameOverCallback === 'function')
      this.gameOverCallback(gameIsWon);
  }

  // utility

  getSelectedCards() {
    // console.log('getSelectedCards', this.selectedCardIDs, this.freeCellCard);
    if (this.freeCellCard != null &&
      this.selectedCardIDs[0] === this.freeCellCard.id) {
      return [this.freeCellCard];
    }
    const selectedCards = [];
    const allCards = Array.prototype.concat.call(...this.cardStacks);
    for (const card of allCards) {
      if (this.selectedCardIDs.includes(card.id)) {
        selectedCards.push(card);
        if (selectedCards.length === this.selectedCardIDs.length) break;
        continue;
      }
    }
    return selectedCards;
  }

  log() {
    console.groupCollapsed('game state');
    console.log('free cell', this.freeCellCard);

    const cardAsText = card => card.suit === card.value ? `${card.value}` :
      `${card.suit}${card.value}`;
    console.log('card stacks',
      this.cardStacks.slice(0, 4).map(stack => stack.map(cardAsText).join(' ')),
      this.cardStacks.slice(4).map(stack => stack.map(cardAsText).join(' ')));
    console.groupEnd();
  }
}

/**
 * TODO:
 * -  responsive for large/wide screen
 */
class SolitaireCanvas {

  constructor(gameCanvas) {
    // HTML canvas setup
    this.canvas = gameCanvas;
    this.canvasCtx = this.canvas.getContext('2d');
    // canvas size
    this.canvas.width = window.innerWidth * 0.95;
    this.canvas.height = window.innerHeight * 0.8;

    // game instance
    this.game = new SolitaireGame(this.onGameOver.bind(this));
    this.gameOptions = {
      suitColor: {
        'S': 'black',
        'H': 'red',
        'C': 'black',
        'D': 'red'
      },
      valueText: {
        'S': '♠️',
        'H': '♥️',
        'C': '♣️',
        'D': '♦️',
        10: '10',
        9: '9',
        8: '8',
        7: '7',
        6: '6'
      },
      // stack position/index of free cell
      freeCellPos: 4
    };

    // game options
    const isMobileBrowser = isUsingMobileBrowser();
    // card & card stack graphics values
    const cardWidth = this.canvas.width / 6.5;
    const cardHeight = cardWidth * 3.5 / 2.5;
    const gapWidth = 10;
    const boardPadding = { x: 16, y: 16 };
    this.canvasOptions = {
      cardWidth,
      cardHeight,
      cardStackOffset: 28,
      gapWidth,
      gapHeight: 20,
      boardPadding,
      freeCell: {
        x: boardPadding.x +
          (cardWidth + gapWidth) * this.gameOptions.freeCellPos,
        y: boardPadding.y
      },
      cardText: {
        fontSize: {
          emojiSymbol: isMobileBrowser ? 16 : 20,
          text: 20
        },
        offset: {
          x: cardWidth / 12,
          y: isMobileBrowser ? cardHeight / 4 : cardHeight / 6
        }
      },
      // customizable (not affect gameplay/render)
      style: {
        stackBase: {
          fill: {
            default: undefined, // no colour
            closedStack: 'grey'
          },
          border: 'grey'
        },
        freeCell: {
          fill: 'beige',
          border: 'grey'
        },
        card: { border: 'black' },
        fontFace: 'Lato'
      }
    };

    this.init();
  }

  onGameOver() {
    // remove canvas event listeners
    this.removeAllCanvasEventListeners();

    // add small delay to skip last render call
    setTimeout(() => {
      // Draw game over text
      this.drawRect(0, 0, this.canvas.width, this.canvas.height,
        '', 'rgba(123, 123, 123, 0.5)');
      this.drawText('You Win!', this.canvas.width / 2, this.canvas.height / 2,
        { fontSizePx: 48, color: 'black' }, true);
    }, 500);
  }

  init() {
    // event listeners
    this.canvasEventListeners = [];
    this.initMouseControl();
  }

  initMouseControl() {
    // init mouse drag control
    this.pointerControl = {
      drag: {
        cardIDs: null,
        offset: { x: 0, y: 0 }
      }
    };
    this.pointerControl.drag = false;

    // Pointer (mouse/touch) event listeners
    const isTouchDevice = isUsingMobileBrowser();
    // -- down/press
    if (isTouchDevice) {
      this.addCanvasEventListener('touchstart', touchEvent => {
        // this removes the touch "pixel threshold"
        touchEvent.preventDefault();
        // use first touch only
        const touch = touchEvent.changedTouches[0];
        // calculate offsetX/Y with clientX/Y - offsetLeft/Top
        const { clientX, clientY, target: { offsetLeft, offsetTop } } = touch;
        this.onPointerDown(clientX - offsetLeft, clientY - offsetTop);
      });
    } else {
      this.addCanvasEventListener('mousedown', mouseEvent => {
        this.onPointerDown(mouseEvent.offsetX, mouseEvent.offsetY);
      });
    }
    // -- move
    if (isTouchDevice) {
      this.addCanvasEventListener('touchmove', touchEvent => {
        const touch = touchEvent.changedTouches[0];
        const { clientX, clientY, target: { offsetLeft, offsetTop } } = touch;
        this.onPointerMove(clientX - offsetLeft, clientY - offsetTop);
      });
    } else {
      this.addCanvasEventListener('mousemove', mouseEvent => {
        this.onPointerMove(mouseEvent.offsetX, mouseEvent.offsetY);
      });
    }
    // -- up/release
    if (isTouchDevice) {
      const onTouchEnd = touchEvent => {
        const touch = touchEvent.changedTouches[0];
        const { clientX, clientY, target: { offsetLeft, offsetTop } } = touch;
        this.onPointerUp(clientX - offsetLeft, clientY - offsetTop);
      };
      this.addCanvasEventListener('touchend', onTouchEnd);
      this.addCanvasEventListener('touchcancel', onTouchEnd);
    } else {
      this.addCanvasEventListener('mouseup', mouseEvent => {
        this.onPointerUp(mouseEvent.offsetX, mouseEvent.offsetY);
      });
    }
  }

  onPointerDown(pointerX, pointerY) {
    const cardSprites = this.graphics.cardSprites;

    // check: mouse down on a card?
    // sort cards by larger z-index first
    const clickedCardSprites = cardSprites.sort((a, b) => b.zIndex - a.zIndex)
      .filter(card => this.hitTestCardSprite(pointerX, pointerY, card));
    if (clickedCardSprites.length === 0) return;

    // ask game logic: card(s) to be picked up
    const selectedCardIDs = this.game.select(clickedCardSprites[0].card.id);
    // do nothing if selection is invalid
    if (selectedCardIDs.length === 0) return;

    // Dragging
    // set mouse drag cards target
    const bottomCardSprite = cardSprites.find(cardSprite =>
      cardSprite.card.id === selectedCardIDs[0]);
    this.pointerControl.drag = {
      cardIDs: selectedCardIDs,
      offset: { x: pointerX - bottomCardSprite.x, y: pointerY - bottomCardSprite.y }
    };
    // console.log('onMouseDown: dragging', selectedCardIDs.map(selectedCardID => {
    //   const card = cardSprites.find(cardSprite =>
    //     cardSprite.card.id === selectedCardID).card;
    //   return card.suit === card.value ? `${card.suit}`
    //     : `${card.suit} ${card.value}`;
    // }));
    // set dragged cards to render on top
    selectedCardIDs.map(selectedCardID =>
      cardSprites.find(cardSprite => cardSprite.card.id === selectedCardID))
      .forEach(cardSprite => {
        // draw "higher" with incrementing z-index
        cardSprite.zIndex = ++this.graphics.lastZindex;
      });
    // this.render();
  }

  onPointerMove(pointerX, pointerY) {
    // ignore mouse move if not dragging anything
    if (this.pointerControl.drag === false) return;

    const { cardIDs: draggedCardIDs, offset } = this.pointerControl.drag;
    const { cardStackOffset } = this.canvasOptions;
    // move sprites of dragged card along mouse position
    this.getCardSpritesByIDs(draggedCardIDs).forEach((cardSprite, idx) => {
      this.moveCardTo(cardSprite, {
        x: pointerX - offset.x,
        y: pointerY - offset.y + idx * cardStackOffset
      });
    });
    this.render();
  }

  onPointerUp(pointerX, pointerY) {
    // console.log('onMouseUp');
    if (this.pointerControl.drag === false) return;

    // check: dropped on card stack?
    // -- mouse release bound check against card stacks
    // mouse released on top of stack?
    const droppedOnCardIDs = this.graphics.cardSprites.filter(cardSprite =>
      // ignore cards being dragged
      this.pointerControl.drag.cardIDs.includes(cardSprite.card.id) === false &&
      // mouse click bound check
      this.hitTestCardSprite(pointerX, pointerY, cardSprite)
    ).map(cardSprite => cardSprite.card.id);
    // drop target stack
    let droppedOnStackIdx;
    if (droppedOnCardIDs.length > 0) {
      // dropped on card: find the stack it belongs to
      droppedOnStackIdx = this.game.cardStacks.findIndex(stack =>
        stack.some(card => droppedOnCardIDs.includes(card.id)))
    } else {
      // check if dropped on stack
      droppedOnStackIdx = this.graphics.stackPos.findIndex(stackPos =>
        this.hitTestCardSprite(pointerX, pointerY, stackPos));
    }
    // is dropped on card stack/stack base?
    if (droppedOnStackIdx >= 0) {
      // game logic: place cards on stack
      const placeSuccess = this.game.place(droppedOnStackIdx);
      // update card graphics to match game state
      const cardSpritesToUpdate = this.getCardSpritesByIDs(
        this.pointerControl.drag.cardIDs);
      cardSpritesToUpdate.forEach(cardSprite => {
        this.game.cardStacks.forEach((stack, stackIdx) => {
          const cardIdx = stack.findIndex(card =>
            card.id === cardSprite.card.id);
          if (cardIdx === -1) return;
          // update this card sprite props
          const stackPos = this.graphics.stackPos[stackIdx];
          this.moveCardTo(cardSprite, {
            x: stackPos.x,
            y: stackPos.y + (this.canvasOptions.cardStackOffset * cardIdx)
          }, cardIdx);
        });
      });
      // check: stack is closed?
      if (this.game.closedStackIdxs.includes(droppedOnStackIdx)) {
        this.closeStack(droppedOnStackIdx);
      }
      // if failed to place free cell card: reset it
      if (placeSuccess === false && this.game.freeCellCard !== null &&
        this.pointerControl.drag.cardIDs[0] === this.game.freeCellCard.id) {
        const freeCellCardSprite = this.graphics.cardSprites.find(
          cardSprite => cardSprite.card.id === this.game.freeCellCard.id);
        this.moveCardTo(freeCellCardSprite, this.canvasOptions.freeCell, 1);
      }
    } else { // dropped on free cell?
      const freeCellSpace = this.canvasOptions.freeCell;
      if (this.hitTestCardSprite(pointerX, pointerY, freeCellSpace)) {
        // game logic: place cards on free cell
        const placeSuccess = this.game.placeOnFreeCell();
        if (placeSuccess && this.game.freeCellCard !== null) {
          const freeCellCardSprite = this.graphics.cardSprites.find(
            cardSprite => cardSprite.card.id === this.game.freeCellCard.id);
          this.moveCardTo(freeCellCardSprite, freeCellSpace, 1);
          // console.log('dropped on free cell', freeCellCardSprite.card);
        } else {
          this.resetDraggedCards(
            this.getCardSpritesByIDs(this.pointerControl.drag.cardIDs));
        }
      } else { // dropped on table
        console.log('dropped on table');
        // console.log('dragged card IDs', this.pointerControl.drag.cardIDs);
        // return dragged cards to original stack
        const cardSpritesToUpdate =
          this.getCardSpritesByIDs(this.pointerControl.drag.cardIDs);
        // check: dragged card from free cell?
        if (this.game.freeCellCard &&
          this.pointerControl.drag.cardIDs[0] === this.game.freeCellCard.id) {
          this.moveCardTo(cardSpritesToUpdate[0], freeCellSpace, 1);
        } else {
          this.resetDraggedCards(cardSpritesToUpdate);
        }
      }
    }

    this.game.log();
    // reset drag state
    this.pointerControl.drag = false;
    this.render();
  }

  // Utility functions

  getCardSpritesByIDs(cardIDs) {
    return cardIDs.map(cardID => this.graphics.cardSprites.find(
      cardSprite => cardSprite.card.id === cardID));
  }

  moveCardTo(cardSprite, { x, y }, zIndex) {
    cardSprite.x = x;
    cardSprite.y = y;
    if (typeof zIndex !== 'undefined') {
      cardSprite.zIndex = zIndex;
    }
  }

  resetDraggedCards(cardSpritesToUpdate) {
    const orgStackIdx = this.game.cardStacks.findIndex(stack =>
      stack.some(card => this.pointerControl.drag.cardIDs.includes(card.id)))

    const stackPos = this.graphics.stackPos[orgStackIdx];
    // for each card sprite, get its stack index of the original stack
    const cardSpritesStackPos = cardSpritesToUpdate.map(cardSprite =>
      this.game.cardStacks[orgStackIdx].findIndex(card =>
        card.id === cardSprite.card.id))
    cardSpritesStackPos.forEach((cardStackPos, idx) => {
      // update card sprite position back to its original stack
      const cardSprite = cardSpritesToUpdate[idx];
      this.moveCardTo(cardSprite, {
        x: stackPos.x,
        y: stackPos.y + (this.canvasOptions.cardStackOffset * cardStackPos)
      }, cardStackPos);
    });
  }

  closeStack(stackIdx) {
    // remove card sprites of closed stack
    const closedStack = this.game.cardStacks[stackIdx];
    closedStack.map(card => card.id).forEach(closedCardID => {
      const cardSpriteIdx = this.graphics.cardSprites.findIndex(
        cardSprite => cardSprite.card.id === closedCardID);
      this.graphics.cardSprites.splice(cardSpriteIdx, 1);
    });
  }

  hitTestCardSprite(x, y, cardLikeSprite) {
    const { cardWidth, cardHeight } = this.canvasOptions;
    return isPointInRect(x, y,
      cardLikeSprite.x, cardLikeSprite.y, cardWidth, cardHeight);
  }

  startGame() {
    // start game instance
    this.game.newGame();
    // init card graphics
    this.initGraphics();
  }

  initGraphics() {
    // store graphics object for rendering
    this.graphics = {
      stackPos: [],
      cardSprites: [],
      lastZindex: 1
    };

    const { cardWidth, cardHeight, gapWidth, gapHeight, cardStackOffset,
      boardPadding } = this.canvasOptions;

    for (let i = 0; i < this.game.cardStacks.length; i++) {
      let pos = i;
      if (i >= this.gameOptions.freeCellPos) { // free cell on top right slot
        pos += 1;
      }
      // set stack position
      const stackPos = {
        x: boardPadding.x + (cardWidth + gapWidth) * (pos % 5),
        y: boardPadding.y + ((cardHeight * 3 + gapHeight) * Math.floor(pos / 5))
      };
      // Round off screen coordinates for canvas perf
      stackPos.x = Math.floor(stackPos.x);
      stackPos.y = Math.floor(stackPos.y);
      // --------
      this.graphics.stackPos.push(stackPos);

      // make card graphics object
      this.game.cardStacks[i].forEach((card, cardIdx) => {
        const cardX = stackPos.x;
        const cardY = stackPos.y + (cardStackOffset * cardIdx);
        this.graphics.cardSprites.push({
          card: card,
          x: cardX,
          y: cardY,
          width: cardWidth,
          height: cardHeight,
          zIndex: cardIdx
        });
      });
    }
    this.graphics.lastZindex = 3;

    this.render();
  }

  render() {
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw table
    const { freeCell, cardWidth, cardHeight, style } = this.canvasOptions;
    const { stackPos: stackPosList, cardSprites } = this.graphics;
    // -- stack base
    stackPosList.forEach((stackPos, stackIdx) => {
      this.drawRect(stackPos.x, stackPos.y, cardWidth, cardHeight,
        style.stackBase.border,
        // grey-out stack base if stack is closed
        this.game.closedStackIdxs.includes(stackIdx) ?
          style.stackBase.fill.closedStack : style.stackBase.fill.default);
    });
    // -- free cell
    this.drawRect(freeCell.x, freeCell.y, cardWidth, cardHeight,
      style.freeCell.border, style.freeCell.fill);

    // Draw things ON the table
    //// draw cards in stack
    //// filter: draw cards on "table" first
    cardSprites.filter(card => card.zIndex === 0)
      .forEach(this.drawCardGraphic.bind(this));

    // Draw cards ABOVE table: by z-index (> 0) order
    cardSprites.filter(card => card.zIndex > 0)
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(this.drawCardGraphic.bind(this));
  }

  // game canvas utilities
  // -- Round off screen coordinates for canvas performance

  drawCardGraphic({ card, x, y, width, height }) {
    // clear rect "under" card
    this.canvasCtx.clearRect(x, y, width, height);
    // draw card shape (rectangle)
    this.drawRect(x, y, width, height, this.canvasOptions.style.card.border);
    // draw card info: values (text)
    const { cardText } = this.canvasOptions;
    this.drawText(this.gameOptions.valueText[card.value],
      x + cardText.offset.x, y + cardText.offset.y, {
        fontSizePx: (SolitaireGame.Card.Suits.includes(card.value) ?
          cardText.fontSize.emojiSymbol : cardText.fontSize.text),
        color: this.gameOptions.suitColor[card.suit]
      });
  }

  drawRect(x1, y1, x2, y2, strokeStyle, fillStyle) {
    x1 = Math.floor(x1); y1 = Math.floor(y1);
    x2 = Math.floor(x2); y2 = Math.floor(y2);

    if (strokeStyle) this.canvasCtx.strokeStyle = strokeStyle;
    this.canvasCtx.strokeRect(x1, y1, x2, y2);
    if (typeof fillStyle !== 'undefined') {
      this.canvasCtx.fillStyle = fillStyle;
      this.canvasCtx.fillRect(x1, y1, x2, y2);
    }
  }

  drawText(text, x, y, { fontSizePx, color }, centered = false) {
    this.canvasCtx.font = `${fontSizePx}px ${this.canvasOptions.style.fontFace}`;
    this.canvasCtx.fillStyle = color;
    if (centered) {
      // centered text
      x -= this.canvasCtx.measureText(text).width / 2;
    }
    this.canvasCtx.fillText(text, Math.floor(x), Math.floor(y));
  }

  // event listener utilities

  addCanvasEventListener(eventName, listener) {
    this.canvasEventListeners.push({ eventName, listener });
    this.canvas.addEventListener(eventName, listener);
  }

  removeAllCanvasEventListeners() {
    for (const { eventName, listener } of this.canvasEventListeners) {
      this.canvas.removeEventListener(eventName, listener);
    }
  }
}

// utility functions (global)
function shuffle(array) {
  for (let i = 0; i < array.length; i++) {
    const a = Math.floor(Math.random() * array.length);
    const b = Math.floor(Math.random() * array.length);
    const temp = array[a];
    array[a] = array[b];
    array[b] = temp;
  }
}

function isPointInRect(pointX, pointY, rectX, rectY, width, height) {
  return rectX <= pointX && pointX <= rectX + width &&
    rectY <= pointY && pointY <= rectY + height;
}

function isUsingMobileBrowser() {
  // Android & iPhone only
  return Boolean(window.navigator.userAgent.match(/Android/i) ||
    window.navigator.userAgent.match(/iPhone/i));
}