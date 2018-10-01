// 'Patience' - Solitaire card game (found in video game EXAPUNKS)

// cards in this solitaire game
const baseCardsBySuits = [
  ...across(['S', 'H', 'C', 'D'], suit => [
    // 4 suit cards of each suit
    ...Array(4).fill({ suit, value: suit }),
    // 5 value cards of each suit
    ...across([10, 9, 8, 7, 6], i => ({ suit, value: i }))
  ])
];
const baseCards = baseCardsBySuits.reduce((allCards, cardsOfSuit) =>
  allCards.concat(cardsOfSuit), []);
// console.log(baseCards);

function shuffle(array) {
  for (let i = 0; i < array.length; i++) {
    const a = Math.floor(Math.random() * array.length);
    const b = Math.floor(Math.random() * array.length);
    const temp = array[a];
    array[a] = array[b];
    array[b] = temp;
  }
}

function isBlackSuit(card) { return card.suit === 'S' || card.suit === 'C'; }
function isRedSuit(card) { return card.suit === 'H' || card.suit === 'D'; }

/**
 * TODO:
 * - free cell only supports 1 card (see class property)
 */
class SolitaireGame {
  constructor() {
    // game rule: what cards are a valid stack?
    // 10, 9, 8, 7, 6: descending order of value & alternate color
    // S, H, C, D: same value/suit & same color
    this.rule = {
      cardsSelection: (stackPos, cardPos) => {
        let selectionPosEnd = cardPos;
        const stack = this.cardStacks[stackPos];
        const cards = stack.slice(cardPos, stack.length);

        for (let i = 0; i < cards.length - 1; i++) {
          const card = cards[i], nextCard = cards[i + 1];
          // console.log('cardSelection compare', selectionPosEnd, card, nextCard);
          if ([10, 9, 8, 7, 6].includes(card.value)) {
            // 10, 9, 8, 7, 6: descending order of value & alternate color
            const isDiffSuitColor = isBlackSuit(card) ?
              isRedSuit(nextCard) : isBlackSuit(nextCard);
            if (nextCard.value === card.value - 1 && isDiffSuitColor) {
              selectionPosEnd++;
            }
          } else if (['S', 'H', 'C', 'D'].includes(card.value)) {
            // S, H, C, D: same value/suit & same color
            if (card.value === nextCard.value && card.suit === nextCard.suit) {
              selectionPosEnd++;
            }
          } else break;
        }
        // selection ends on top card of stack?
        return selectionPosEnd === stack.length - 1 ? selectionPosEnd : -1;
      },
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

    // game state
    // 9 stacks
    this.cardStacks = null;
    // 1 free cell
    this.freeCellCard = null;

    this.selectedCardIDs = null;
  }

  newGame() {
    console.log('SolitaireGame.newGame');
    // populate card stacks
    let cardID = 0;
    const newCards = baseCards.map(baseCard => ({
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
  }

  select(cardID) {
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
    //// target stack is valid?
    if (targetStackIdx === -1) {
      // not dropped on a stack: reset dragged cards
      this.selectedCardIDs = null;
      return false;
    }
    // is first/bottom card being dragged 
    // consecutive to top card of dropped stack?

    // remove dragged cards from original stack
    let draggedCards;
    // check: card from free cell
    if (this.freeCellCard && this.selectedCardIDs[0] === this.freeCellCard.id) {
      // place dragged cards onto stack
      this.cardStacks[targetStackIdx].push(this.freeCellCard);
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
      this.cardStacks[targetStackIdx].push(...draggedCards);
    }

    // console.log('updated', this.cardStacks[stackIdx]);
    // console.log('game state', this.cardStacks);
  }

  placeOnFreeCell() {
    console.log('placeOnFreeCell');
    // game logic: validate free cell usage
    if (this.rule.freeCellDropRule() === false) return;
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
      break;
    }
    console.log('placeOnFreeCell - placed cards', this.freeCellCard[0]);
  }

  log() {
    console.group('game state');
    console.log('free cell', this.freeCellCard);

    const cardAsText = card => card.suit === card.value ? `${card.value}` :
      `${card.suit}${card.value}`;
    console.log('card stacks',
      this.cardStacks.slice(0, 4).map(stack => stack.map(cardAsText).join(' ')),
      this.cardStacks.slice(4).map(stack => stack.map(cardAsText).join(' ')));
    console.groupEnd();
  }
}

class SolitaireCanvas {

  constructor(canvasContainer) {
    // HTML canvas
    this.canvas = document.createElement('canvas');
    // canvas size
    this.canvas.width = window.innerWidth * 0.9;
    this.canvas.height = window.innerHeight * 0.8;
    // canvas setup
    // put canvas into container
    canvasContainer.appendChild(this.canvas);

    // game instance
    this.game = new SolitaireGame();
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
      freeCellPos: 4
    };

    // game options
    // card & card stack graphics values
    const cardWidth = this.canvas.width / 6;
    const gapWidth = 10;
    const boardPadding = { x: 20, y: 20 };
    this.canvasOptions = {
      cardWidth,
      cardHeight: cardWidth * 3.5 / 2.5,
      cardStackOffset: 28,
      gapWidth,
      gapHeight: 20,
      boardPadding,
      freeCell: {
        x: boardPadding.x + (cardWidth + gapWidth) * this.gameOptions.freeCellPos,
        y: boardPadding.y
      }
    };

    this.init();
  }

  init() {
    // event listeners
    this.initMouseControl();
  }

  initMouseControl() {
    // init mouse drag control
    this.mouseControl = {
      drag: {
        cardIDs: null,
        offset: { x: 0, y: 0 }
      }
    };
    this.mouseControl.drag = false;

    // mouse event listeners
    this.canvas.addEventListener('mousedown', event => {
      this.onMouseDown(event.offsetX, event.offsetY);
    });
    this.canvas.addEventListener('mousemove', event => {
      this.onMouseMove(event.offsetX, event.offsetY);
    });
    this.canvas.addEventListener('mouseup', event => {
      this.onMouseUp(event.offsetX, event.offsetY);
    });
  }

  onMouseDown(mouseX, mouseY) {
    const cardSprites = this.graphics.cardSprites;

    // check: mouse down on a card?
    // sort cards by larger z-index first
    const clickedCardSprites = cardSprites.sort((a, b) => b.zIndex - a.zIndex)
      .filter(card =>
        isPointInRect(mouseX, mouseY, card.x, card.y, card.width, card.height)
      );
    if (clickedCardSprites.length === 0) return;

    // ask game logic: card(s) to be picked up
    const selectedCardIDs = this.game.select(clickedCardSprites[0].card.id);
    // do nothing if selection is invalid
    if (selectedCardIDs.length === 0) return;

    // Dragging
    // set mouse drag cards target
    const bottomCardSprite = cardSprites.find(cardSprite =>
      cardSprite.card.id === selectedCardIDs[0]);
    this.mouseControl.drag = {
      cardIDs: selectedCardIDs,
      offset: { x: mouseX - bottomCardSprite.x, y: mouseY - bottomCardSprite.y }
    };
    console.log('onMouseDown: dragging', selectedCardIDs.map(selectedCardID => {
      const card = cardSprites.find(cardSprite =>
        cardSprite.card.id === selectedCardID).card;
      return card.suit === card.value ? `${card.suit}`
        : `${card.suit} ${card.value}`;
    }));
    // set dragged cards to render on top
    selectedCardIDs.map(selectedCardID =>
      cardSprites.find(cardSprite => cardSprite.card.id === selectedCardID))
      .forEach(cardSprite => {
        // draw "higher" with incrementing z-index
        cardSprite.zIndex = ++this.graphics.lastZindex;
      });
    // this.render();
  }

  onMouseMove(mouseX, mouseY) {
    // ignore mouse move if not dragging anything
    if (this.mouseControl.drag === false) return;

    const { cardIDs: draggedCardIDs, offset } = this.mouseControl.drag;
    const { cardStackOffset } = this.canvasOptions;
    // move sprites of dragged card along mouse position
    this.getCardSpritesByIDs(draggedCardIDs).forEach((cardSprite, idx) => {
      this.moveCardTo(cardSprite, {
        x: mouseX - offset.x,
        y: mouseY - offset.y + idx * cardStackOffset
      });
    });
    this.render();
  }

  // TODO: group as utility function
  getCardSpritesByIDs(cardIDs) {
    return cardIDs.map(cardID => this.graphics.cardSprites.find(
      cardSprite => cardSprite.card.id === cardID));
  }

  onMouseUp(mouseX, mouseY) {
    console.log('onMouseUp');
    if (this.mouseControl.drag === false) return;

    // check: dropped on card stack?
    /// mouse release bound check against card stacks
    // mouse released on top of stack?
    const droppedOnCardIDs = this.graphics.cardSprites.filter(cardSprite =>
      // ignore cards being dragged
      this.mouseControl.drag.cardIDs.includes(cardSprite.card.id) === false &&
      // mouse click bound check
      isPointInRect(mouseX, mouseY,
        cardSprite.x, cardSprite.y, cardSprite.width, cardSprite.height)
    ).map(cardSprite => cardSprite.card.id);
    // drop target stack
    let droppedOnStack;
    if (droppedOnCardIDs.length > 0) {
      // dropped on card: find the stack it belongs to
      droppedOnStack = this.game.cardStacks.findIndex(stack =>
        stack.some(card => droppedOnCardIDs.includes(card.id)))
    } else {
      // check if dropped on stack
      const { cardWidth, cardHeight } = this.canvasOptions;
      droppedOnStack = this.graphics.stackPos.findIndex(stackPos =>
        isPointInRect(mouseX, mouseY,
          stackPos.x, stackPos.y, cardWidth, cardHeight));
    }
    // is dropped on card stack/stack base?
    if (droppedOnStack >= 0) {
      // game logic: place cards on stack
      this.game.place(droppedOnStack);
      // update card graphics to match game state
      const cardSpritesToUpdate = this.getCardSpritesByIDs(
        this.mouseControl.drag.cardIDs);
      cardSpritesToUpdate.forEach(cardSprite => {
        this.game.cardStacks.forEach((stack, stackIdx) => {
          const cardIdx = stack.findIndex(card => card.id === cardSprite.card.id);
          if (cardIdx === -1) return;
          // update this card sprite props
          const stackPos = this.graphics.stackPos[stackIdx];
          this.moveCardTo(cardSprite, {
            x: stackPos.x,
            y: stackPos.y + (this.canvasOptions.cardStackOffset * cardIdx)
          }, cardIdx);
        });
      });
    } else { // dropped on free cell?
      const { freeCell, cardWidth, cardHeight } = this.canvasOptions;
      if (isPointInRect(mouseX, mouseY,
        freeCell.x, freeCell.y, cardWidth, cardHeight)) {
        // game logic: place cards on free cell
        this.game.placeOnFreeCell();
        console.log(this.game.freeCellCard);
        if (this.game.freeCellCard !== null) {
          const freeCellCardSprite = this.graphics.cardSprites.find(cardSprite =>
            cardSprite.card.id === this.game.freeCellCard.id);
          this.moveCardTo(freeCellCardSprite, this.canvasOptions.freeCell, 1);
          console.log('dropped on free cell', freeCellCardSprite.card);
        } else {
          this.resetDraggedCards(
            this.getCardSpritesByIDs(this.mouseControl.drag.cardIDs));
        }
      } else { // dropped on table
        console.log('dropped on table');
        console.log('dragged card IDs', this.mouseControl.drag.cardIDs);
        // return dragged cards to original stack
        const cardSpritesToUpdate =
          this.getCardSpritesByIDs(this.mouseControl.drag.cardIDs);
        // check: dragged card from free cell?
        if (this.game.freeCellCard &&
          this.mouseControl.drag.cardIDs[0] === this.game.freeCellCard.id) {
          this.moveCardTo(cardSpritesToUpdate[0], this.canvasOptions.freeCell, 1);
        } else {
          this.resetDraggedCards(cardSpritesToUpdate);
        }
      }
    }

    this.game.log();
    // reset drag state
    this.mouseControl.drag = false;
    this.render();
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
      stack.some(card => this.mouseControl.drag.cardIDs.includes(card.id)))

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
    const ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    // Draw table
    const { freeCell, cardWidth, cardHeight } = this.canvasOptions;
    const { stackPos: stackPosList, cardSprites } = this.graphics;
    // -- stack base
    for (let stackPos of stackPosList) {
      this.drawRect(stackPos.x, stackPos.y, cardWidth, cardHeight, 'grey');
    }
    // -- free cell
    this.drawRect(freeCell.x, freeCell.y, cardWidth, cardHeight,
      'grey', 'lightgrey');

    // Draw things ON the table
    // draw cards in stack
    // filter: draw cards on "table" first
    cardSprites.filter(card => card.zIndex === 0)
      .forEach(this.drawCardGraphic.bind(this));

    // Draw cards ABOVE table: by z-index (> 0) order
    cardSprites.filter(card => card.zIndex > 0)
      .sort((a, b) => a.zIndex - b.zIndex)
      .forEach(this.drawCardGraphic.bind(this));
  }

  // game canvas utilities

  drawCardGraphic({ card, x, y, width, height }) {
    const ctx = this.canvas.getContext('2d');

    // clear rect "under" card
    ctx.clearRect(x, y, width, height);
    // draw card shape (rectangle)
    this.drawRect(x, y, width, height, 'black');
    // draw card info: values (text)
    this.drawText(this.gameOptions.valueText[card.value],
      x + width / 12, y + width / 4, {
        font: (['S', 'H', 'C', 'D'].includes(card.value) ?
          24 : 18) + 'px Lato',
        color: this.gameOptions.suitColor[card.suit]
      });
  }

  // canvas utilities

  drawRect(x1, y1, x2, y2, strokeStyle, fillStyle) {
    const ctx = this.canvas.getContext('2d');
    if (strokeStyle) ctx.strokeStyle = strokeStyle;
    ctx.strokeRect(x1, y1, x2, y2);
    if (typeof fillStyle !== 'undefined') {
      ctx.fillStyle = fillStyle;
      ctx.fillRect(x1, y1, x2, y2);
    }
  }

  drawText(text, x, y, { font, color }) {
    const ctx = this.canvas.getContext('2d');
    ctx.font = font;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
  }
}

// utility functions
function across(list, fn) {
  const items = [];
  for (let item of list) items.push(fn(item));
  return items;
}

function isPointInRect(pointX, pointY, rectX, rectY, width, height) {
  return rectX <= pointX && pointX <= rectX + width &&
    rectY <= pointY && pointY <= rectY + height;
}
