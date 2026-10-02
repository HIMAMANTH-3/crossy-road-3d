import confetti from 'canvas-confetti';
import { sounds } from './audio.js';

export class UIManager {
  constructor(game) {
    this.game = game;

    // DOM Elements
    this.scoreDisplay = document.getElementById('hud-score');
    this.bestScoreDisplay = document.getElementById('hud-best');
    this.coinDisplay = document.getElementById('hud-coins');
    this.startOverlay = document.getElementById('start-overlay');
    this.pauseOverlay = document.getElementById('pause-overlay');
    this.gameOverOverlay = document.getElementById('gameover-overlay');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalBestEl = document.getElementById('final-best');
    this.finalDistanceEl = document.getElementById('final-distance');
    this.finalCoinsEl = document.getElementById('final-coins');
    this.newBestBadge = document.getElementById('new-best-badge');
    this.playAgainBtn = document.getElementById('play-again-btn');
    this.pauseBtn = document.getElementById('btn-pause');
    this.muteBtn = document.getElementById('btn-mute');
    this.resumeBtn = document.getElementById('btn-resume');
    this.mobileControls = document.getElementById('mobile-controls');

    this.prevScore = 0;
    this.setupEventListeners();
    this.updateMuteIcon();
    this.checkMobile();
  }

  setupEventListeners() {
    // Start on tap / click
    this.startOverlay.addEventListener('click', () => {
      this.game.start();
    });

    // Play again button (supports click and pointerdown for instant responsiveness)
    const handleRestart = (e) => {
      e.stopPropagation();
      sounds.playClick();
      this.game.reset();
      this.game.start();
    };
    this.playAgainBtn.addEventListener('click', handleRestart);
    this.playAgainBtn.addEventListener('pointerdown', handleRestart);

    // Pause button
    this.pauseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sounds.playClick();
      this.game.pause();
    });

    // Resume button
    this.resumeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      sounds.playClick();
      this.game.pause();
    });

    // Mute button
    this.muteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isMuted = sounds.toggleMute();
      this.updateMuteIcon();
      sounds.playClick();
    });

    // Mobile Virtual D-Pad buttons
    const btnUp = document.getElementById('btn-up');
    const btnDown = document.getElementById('btn-down');
    const btnLeft = document.getElementById('btn-left');
    const btnRight = document.getElementById('btn-right');

    const bindTouch = (el, dir) => {
      if (!el) return;
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.game.triggerMove(dir);
      });
    };

    bindTouch(btnUp, 'FORWARD');
    bindTouch(btnDown, 'BACKWARD');
    bindTouch(btnLeft, 'LEFT');
    bindTouch(btnRight, 'RIGHT');

    window.addEventListener('resize', () => this.checkMobile());
  }

  checkMobile() {
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0) || window.innerWidth < 800;
    if (this.mobileControls) {
      this.mobileControls.style.display = isTouchDevice ? 'flex' : 'none';
    }
  }

  updateMuteIcon() {
    const isMuted = sounds.isMuted();
    this.muteBtn.innerHTML = isMuted
      ? `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>`
      : `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>`;
  }

  onScoreUpdate(score, bestScore, coins, isNewBest = false) {
    if (this.scoreDisplay) {
      this.scoreDisplay.textContent = score;

      // Bounce animation if score increased
      if (score > this.prevScore) {
        this.scoreDisplay.classList.remove('score-pop');
        void this.scoreDisplay.offsetWidth; // Trigger reflow
        this.scoreDisplay.classList.add('score-pop');
      }
      this.prevScore = score;
    }

    if (this.bestScoreDisplay) {
      this.bestScoreDisplay.textContent = `BEST: ${bestScore}`;
    }

    if (this.coinDisplay) {
      this.coinDisplay.textContent = coins;
    }

    if (isNewBest) {
      sounds.playNewBest();
    }
  }

  onCoinCollect() {
    if (this.coinDisplay) {
      this.coinDisplay.classList.remove('coin-pop');
      void this.coinDisplay.offsetWidth;
      this.coinDisplay.classList.add('coin-pop');
    }
  }

  onStateChange(state) {
    if (state === 'READY') {
      this.startOverlay.classList.remove('hidden');
      this.gameOverOverlay.classList.add('hidden');
      this.pauseOverlay.classList.add('hidden');
    } else if (state === 'PLAYING') {
      this.startOverlay.classList.add('hidden');
      this.gameOverOverlay.classList.add('hidden');
      this.pauseOverlay.classList.add('hidden');
    } else if (state === 'PAUSED') {
      this.pauseOverlay.classList.remove('hidden');
    }
  }

  onGameOver(data) {
    this.finalScoreEl.textContent = data.score;
    this.finalBestEl.textContent = data.bestScore;
    this.finalDistanceEl.textContent = data.distance;
    this.finalCoinsEl.textContent = data.coins;

    if (data.isNewBest) {
      this.newBestBadge.classList.remove('hidden');
      // Confetti burst for high score!
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch (e) {
        // Fallback if confetti fails
      }
    } else {
      this.newBestBadge.classList.add('hidden');
    }

    this.gameOverOverlay.classList.remove('hidden');
  }
}
