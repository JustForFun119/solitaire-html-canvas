(function () {
  // service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js').then(registration => {
      console.log('service worker: registration successful, scope is:',
        registration);
    }).catch(error => {
      console.log('service worker: registration failed, error:', error);
    });
  }

  console.log('init');
  // init game on HTML5 Canvas
  const gameCanvas = document.getElementById('gameCanvas');
  // start solitaire game on canvas
  let gameInstance = new SolitaireCanvas(gameCanvas);
  // button to start new game
  const btnNewGame = document.getElementById('btnNewGame');
  btnNewGame.addEventListener('click', e => {
    startGame();
  });

  // wait for CSS font loading (if possible)
  if ('fonts' in document) {
    document.fonts.ready.then(startGame);
  } else {
    startGame();
  }

  function startGame() {
    gameInstance.startGame();
  }

})();