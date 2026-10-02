import './style.css';
import { CrossyGame } from './game.js';
import { UIManager } from './ui.js';

window.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('canvas-container');

  let uiManager = null;
  const game = new CrossyGame(container, {
    onScoreUpdate: (score, best, coins, isNewBest) => {
      if (uiManager) uiManager.onScoreUpdate(score, best, coins, isNewBest);
    },
    onCoinCollect: () => {
      if (uiManager) uiManager.onCoinCollect();
    },
    onStateChange: (state) => {
      if (uiManager) uiManager.onStateChange(state);
    },
    onGameOver: (data) => {
      if (uiManager) uiManager.onGameOver(data);
    }
  });

  uiManager = new UIManager(game);

  // Main game loop
  let lastTime = performance.now();
  function animate(now) {
    requestAnimationFrame(animate);
    const dt = (now - lastTime) / 1000;
    lastTime = now;

    game.update(dt);
    game.render();
  }
  requestAnimationFrame(animate);
});
