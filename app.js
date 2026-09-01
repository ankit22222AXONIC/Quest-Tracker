/**
 * Quest - Gamified Productivity & Focus Application
 * Complete Application Logic & State Engine
 */

(function () {
  'use strict';

  // ==========================================
  // 1. DATA MODELS & INITIAL STATE
  // ==========================================
  const STORAGE_KEY = 'quest_app_ai_v2';

  // Helper: get today's date string (YYYY-MM-DD) in Indian Standard Time (Asia/Kolkata, UTC+5:30)
  function getISTDateString(timestamp) {
    const d = timestamp ? new Date(timestamp) : new Date();
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }

  function getISTYesterday() {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return yesterday.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  }

  const STREAK_MIN_QUESTS = 3; // minimum quests per day to earn a streak

  const DEFAULT_STATE = {
    user: {
      name: 'Adventurer',
      xp: 0,
      level: 1,
      streak: 0,
      bestStreak: 0,
      lastStreakDate: null, // IST date string when streak was last awarded
      totalFocusMinutes: 0,
      questsCompletedCount: 0,
    },
    dailyCompletions: {}, // { 'YYYY-MM-DD': count } keyed by IST date
    settings: {
      focusDuration: 25,
      shortBreakDuration: 5,
      longBreakDuration: 15,
      autoStartBreaks: false,
      soundEffects: true,
      soundVolume: 0.7,
      theme: 'indigo',
      notifications: true,
    },
    categories: ['Study', 'Work', 'Health', 'Coding', 'Creative', 'Personal'],
    quests: [],
    futureGoals: [],
    history: [],
    achievements: [
      // --- Starter ---
      { id: 'first_quest', title: 'First Blood', desc: 'Complete your very first quest', icon: 'military_tech', unlocked: false, xp: 50 },
      { id: 'triple_threat', title: 'Triple Threat', desc: 'Complete 3 quests in a single day to earn your first streak', icon: 'looks_3', unlocked: false, xp: 75 },
      // --- Focus & Timer ---
      { id: 'pioneer', title: 'Pomodoro Pioneer', desc: 'Complete 5 focus sessions', icon: 'timer', unlocked: false, progress: 0, maxProgress: 5, xp: 100 },
      { id: 'deep_diver', title: 'Deep Diver', desc: 'Complete a 45+ minute continuous focus session', icon: 'surfing', unlocked: false, xp: 250 },
      { id: 'marathon_runner', title: 'Marathon Runner', desc: 'Complete a 60+ minute continuous focus session', icon: 'directions_run', unlocked: false, xp: 400 },
      { id: 'focus_100', title: 'Century of Focus', desc: 'Accumulate 100+ minutes of total focus time', icon: 'hourglass_top', unlocked: false, progress: 0, maxProgress: 100, xp: 120 },
      { id: 'centurion', title: 'Master of Time', desc: 'Accumulate 300+ minutes of total focus time', icon: 'psychology', unlocked: false, progress: 0, maxProgress: 300, xp: 300 },
      { id: 'focus_1000', title: 'Time Lord', desc: 'Accumulate 1000+ minutes of total focus time', icon: 'rocket_launch', unlocked: false, progress: 0, maxProgress: 1000, xp: 750 },
      // --- Streaks ---
      { id: 'streak_3', title: 'Momentum Builder', desc: 'Maintain a 3-day streak (3+ quests/day)', icon: 'local_fire_department', unlocked: false, progress: 0, maxProgress: 3, xp: 150 },
      { id: 'streak_7', title: 'Weekly Warrior', desc: 'Maintain a 7-day streak', icon: 'whatshot', unlocked: false, progress: 0, maxProgress: 7, xp: 350 },
      { id: 'streak_14', title: 'Fortnight Legend', desc: 'Maintain a 14-day streak', icon: 'bolt', unlocked: false, progress: 0, maxProgress: 14, xp: 600 },
      { id: 'streak_30', title: 'Unstoppable Force', desc: 'Maintain a 30-day streak — true mastery', icon: 'diamond', unlocked: false, progress: 0, maxProgress: 30, xp: 1500 },
      // --- Category Mastery ---
      { id: 'scholar', title: 'Scholar of Wisdom', desc: 'Complete 5 Study quests', icon: 'menu_book', unlocked: false, progress: 0, maxProgress: 5, xp: 200 },
      { id: 'code_ninja', title: 'Code Ninja', desc: 'Complete 5 Coding quests', icon: 'code', unlocked: false, progress: 0, maxProgress: 5, xp: 200 },
      { id: 'fit_warrior', title: 'Fitness Warrior', desc: 'Complete 5 Health quests', icon: 'fitness_center', unlocked: false, progress: 0, maxProgress: 5, xp: 200 },
      { id: 'creative_spark', title: 'Creative Spark', desc: 'Complete 5 Creative quests', icon: 'brush', unlocked: false, progress: 0, maxProgress: 5, xp: 200 },
      // --- Milestones ---
      { id: 'quest_10', title: 'Adventurer Rising', desc: 'Complete 10 total quests', icon: 'trending_up', unlocked: false, progress: 0, maxProgress: 10, xp: 150 },
      { id: 'quest_25', title: 'Quest Conqueror', desc: 'Complete 25 total quests', icon: 'emoji_events', unlocked: false, progress: 0, maxProgress: 25, xp: 400 },
      { id: 'quest_50', title: 'Half-Centurion', desc: 'Complete 50 total quests', icon: 'military_tech', unlocked: false, progress: 0, maxProgress: 50, xp: 800 },
      // --- Levels ---
      { id: 'level_3', title: 'Rising Star', desc: 'Reach Level 3', icon: 'star', unlocked: false, progress: 1, maxProgress: 3, xp: 200 },
      { id: 'level_5', title: 'Grandmaster Quest', desc: 'Reach Level 5', icon: 'workspace_premium', unlocked: false, progress: 1, maxProgress: 5, xp: 500 },
      { id: 'level_10', title: 'Legendary Hero', desc: 'Reach Level 10', icon: 'auto_awesome', unlocked: false, progress: 1, maxProgress: 10, xp: 1000 },
      { id: 'level_20', title: 'Elite Warrior', desc: 'Reach Level 20', icon: 'shield', unlocked: false, progress: 1, maxProgress: 20, xp: 2000 },
      { id: 'level_30', title: 'Champion of Focus', desc: 'Reach Level 30', icon: 'emoji_events', unlocked: false, progress: 1, maxProgress: 30, xp: 3500 },
      { id: 'level_50', title: 'Titan of Discipline', desc: 'Reach Level 50', icon: 'local_fire_department', unlocked: false, progress: 1, maxProgress: 50, xp: 6000 },
      { id: 'level_100', title: 'Quest God', desc: 'Reach the maximum Level 100', icon: 'whatshot', unlocked: false, progress: 1, maxProgress: 100, xp: 15000 },
      // --- Special ---
      { id: 'night_owl', title: 'Night Owl', desc: 'Complete a quest between midnight and 5 AM IST', icon: 'dark_mode', unlocked: false, xp: 100 },
      { id: 'early_bird', title: 'Early Bird', desc: 'Complete a quest between 5 AM and 7 AM IST', icon: 'wb_twilight', unlocked: false, xp: 100 },
      { id: 'all_rounder', title: 'All-Rounder', desc: 'Complete at least 1 quest in every category', icon: 'interests', unlocked: false, xp: 500 }
    ]
  };

  // Application State
  let state = loadState();

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return Object.assign({}, DEFAULT_STATE, JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load state from localStorage:', e);
    }
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save state to localStorage:', e);
    }
  }

  // ==========================================
  // 2. AUDIO & AMBIENT SOUND ENGINE (Web Audio API)
  // ==========================================
  const AudioEngine = {
    ctx: null,
    ambientNodes: null,
    currentAmbient: 'none',

    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    },

    playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
      if (!state.settings.soundEffects) return;
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      const actualGain = gainVal * (state.settings.soundVolume || 0.7);
      gain.gain.setValueAtTime(actualGain, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    },

    playClick() {
      this.playTone(800, 'triangle', 0.05, 0.05);
    },

    playCheck() {
      if (!state.settings.soundEffects) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [523.25, 659.25].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);
        gain.gain.setValueAtTime(0.1 * state.settings.soundVolume, now + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.08 + 0.15);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.15);
      });
    },

    playStartQuest() {
      if (!state.settings.soundEffects) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.12 * state.settings.soundVolume, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.25);
      });
    },

    playCompleteFanfare() {
      if (!state.settings.soundEffects) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const notes = [
        { f: 523.25, t: 0, d: 0.15 },
        { f: 659.25, t: 0.12, d: 0.15 },
        { f: 783.99, t: 0.24, d: 0.2 },
        { f: 1046.5, t: 0.42, d: 0.5 }
      ];
      notes.forEach(({ f, t, d }) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + t);
        gain.gain.setValueAtTime(0.15 * state.settings.soundVolume, now + t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + t);
        osc.stop(now + t + d);
      });
    },

    playLevelUp() {
      if (!state.settings.soundEffects) return;
      this.init();
      if (!this.ctx) return;
      const now = this.ctx.currentTime;
      const chord = [392, 523.25, 659.25, 783.99, 1046.5];
      chord.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.14 * state.settings.soundVolume, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.09 + 0.6);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.6);
      });
    },

    setAmbient(type) {
      this.stopAmbient();
      if (type === 'none') return;
      this.init();
      if (!this.ctx) return;

      this.currentAmbient = type;
      const masterGain = this.ctx.createGain();
      masterGain.gain.setValueAtTime(0.08 * (state.settings.soundVolume || 0.7), this.ctx.currentTime);
      masterGain.connect(this.ctx.destination);

      if (type === 'rain' || type === 'brown' || type === 'white') {
        const bufferSize = 2 * this.ctx.sampleRate;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;

        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          if (type === 'white') {
            output[i] = white * 0.5;
          } else if (type === 'brown') {
            lastOut = (lastOut + 0.02 * white) / 1.02;
            output[i] = lastOut * 3.5;
          } else { // rain
            lastOut = (lastOut + 0.05 * white) / 1.05;
            output[i] = (lastOut + white * 0.1) * 2;
          }
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = this.ctx.createBiquadFilter();
        if (type === 'rain') {
          filter.type = 'lowpass';
          filter.frequency.value = 1000;
        } else if (type === 'brown') {
          filter.type = 'lowpass';
          filter.frequency.value = 350;
        } else {
          filter.type = 'lowpass';
          filter.frequency.value = 4000;
        }

        whiteNoise.connect(filter);
        filter.connect(masterGain);
        whiteNoise.start();

        this.ambientNodes = { source: whiteNoise, gain: masterGain };
      } else if (type === 'hum') {
        // Binaural 432Hz focus hum
        const osc1 = this.ctx.createOscillator();
        const osc2 = this.ctx.createOscillator();
        osc1.type = 'sine';
        osc1.frequency.value = 432;
        osc2.type = 'sine';
        osc2.frequency.value = 436; // 4Hz theta wave beat

        osc1.connect(masterGain);
        osc2.connect(masterGain);
        osc1.start();
        osc2.start();

        this.ambientNodes = { source1: osc1, source2: osc2, gain: masterGain };
      }
    },

    stopAmbient() {
      if (this.ambientNodes) {
        try {
          if (this.ambientNodes.source) this.ambientNodes.source.stop();
          if (this.ambientNodes.source1) this.ambientNodes.source1.stop();
          if (this.ambientNodes.source2) this.ambientNodes.source2.stop();
        } catch (e) {}
        this.ambientNodes = null;
      }
      this.currentAmbient = 'none';
    }
  };

  // ==========================================
  // 3. CONFETTI PARTICLE SYSTEM (Canvas)
  // ==========================================
  const Confetti = {
    canvas: null,
    ctx: null,
    particles: [],
    animationId: null,

    init() {
      this.canvas = document.getElementById('confettiCanvas');
      if (this.canvas) {
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
      }
    },

    resize() {
      if (this.canvas) {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
      }
    },

    burst(count = 80) {
      if (!this.canvas || !this.ctx) return;
      const colors = ['#8083ff', '#c0c1ff', '#6366f1', '#10b981', '#f59e0b', '#ec4899', '#38bdf8'];
      const cx = this.canvas.width / 2;
      const cy = this.canvas.height * 0.45;

      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 12 + 4;
        this.particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 4,
          size: Math.random() * 8 + 4,
          color: colors[Math.floor(Math.random() * colors.length)],
          rotation: Math.random() * 360,
          rotationSpeed: (Math.random() - 0.5) * 10,
          life: 1,
          decay: Math.random() * 0.015 + 0.008
        });
      }

      if (!this.animationId) {
        this.animate();
      }
    },

    animate() {
      if (!this.ctx) return;
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

      this.particles.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.25; // gravity
        p.vx *= 0.98; // air resistance
        p.rotation += p.rotationSpeed;
        p.life -= p.decay;

        this.ctx.save();
        this.ctx.translate(p.x, p.y);
        this.ctx.rotate((p.rotation * Math.PI) / 180);
        this.ctx.fillStyle = p.color;
        this.ctx.globalAlpha = Math.max(0, p.life);
        this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        this.ctx.restore();
      });

      this.particles = this.particles.filter(p => p.life > 0);

      if (this.particles.length > 0) {
        this.animationId = requestAnimationFrame(() => this.animate());
      } else {
        this.animationId = null;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    }
  };

  // ==========================================
  // 4. FOCUS TIMER ENGINE
  // ==========================================
  const TimerEngine = {
    activeQuest: null,
    mode: 'focus', // 'focus', 'shortBreak', 'longBreak'
    status: 'idle', // 'idle', 'running', 'paused'
    totalSeconds: 25 * 60,
    remainingSeconds: 25 * 60,
    intervalId: null,
    lastTick: null,

    start(quest = null) {
      if (quest) {
        this.activeQuest = quest;
        this.mode = 'focus';
        this.totalSeconds = (quest.duration || state.settings.focusDuration || 25) * 60;
        this.remainingSeconds = this.totalSeconds;
      }

      this.status = 'running';
      this.lastTick = Date.now();
      AudioEngine.playStartQuest();

      clearInterval(this.intervalId);
      this.intervalId = setInterval(() => this.tick(), 500);

      this.updateUI();
    },

    pause() {
      if (this.status === 'running') {
        this.status = 'paused';
        clearInterval(this.intervalId);
        AudioEngine.playClick();
        this.updateUI();
      }
    },

    resume() {
      if (this.status === 'paused') {
        this.status = 'running';
        this.lastTick = Date.now();
        AudioEngine.playClick();
        clearInterval(this.intervalId);
        this.intervalId = setInterval(() => this.tick(), 500);
        this.updateUI();
      }
    },

    tick() {
      const now = Date.now();
      const elapsedSec = Math.floor((now - this.lastTick) / 1000);
      if (elapsedSec >= 1) {
        this.remainingSeconds = Math.max(0, this.remainingSeconds - elapsedSec);
        this.lastTick = now;

        if (this.remainingSeconds <= 0) {
          this.onComplete();
        }
        this.updateUI();
      }
    },

    onComplete() {
      clearInterval(this.intervalId);
      this.status = 'idle';

      if (this.mode === 'focus') {
        AudioEngine.playCompleteFanfare();
        Confetti.burst(100);

        if (this.activeQuest) {
          App.completeQuest(this.activeQuest.id, true);
        }

        // Switch to Break mode
        const isLong = (state.user.questsCompletedCount % 4 === 0);
        this.mode = isLong ? 'longBreak' : 'shortBreak';
        this.totalSeconds = (isLong ? state.settings.longBreakDuration : state.settings.shortBreakDuration) * 60;
        this.remainingSeconds = this.totalSeconds;

        App.showToast(`🎉 Quest Focus Complete! Time for a ${isLong ? 'Long' : 'Short'} Break.`, 'success');

        if (state.settings.autoStartBreaks) {
          this.start();
        }
      } else {
        // Break finished
        AudioEngine.playStartQuest();
        App.showToast('🔔 Break finished! Ready for your next quest?', 'info');
        this.mode = 'focus';
        this.totalSeconds = (state.settings.focusDuration || 25) * 60;
        this.remainingSeconds = this.totalSeconds;
      }
      this.updateUI();
    },

    reset() {
      clearInterval(this.intervalId);
      this.status = 'idle';
      this.remainingSeconds = this.totalSeconds;
      AudioEngine.playClick();
      this.updateUI();
    },

    skipBreak() {
      clearInterval(this.intervalId);
      this.status = 'idle';
      this.mode = 'focus';
      this.totalSeconds = (state.settings.focusDuration || 25) * 60;
      this.remainingSeconds = this.totalSeconds;
      this.activeQuest = null;
      this.updateUI();
    },

    formatTime(sec) {
      const m = Math.floor(sec / 60);
      const s = sec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    },

    updateUI() {
      const timerDisplay = document.getElementById('focusTimerDisplay');
      const ringCircle = document.getElementById('timerRingCircle');
      const startBtn = document.getElementById('timerStartBtn');
      const pauseBtn = document.getElementById('timerPauseBtn');
      const resetBtn = document.getElementById('timerResetBtn');
      const questTitleElem = document.getElementById('focusQuestTitle');
      const questCategoryElem = document.getElementById('focusQuestCategory');
      const modeLabel = document.getElementById('focusModeLabel');

      if (!timerDisplay) return;

      const formatted = this.formatTime(this.remainingSeconds);
      timerDisplay.textContent = formatted;

      // Update Document Title
      if (this.status === 'running') {
        document.title = `(${formatted}) ${this.activeQuest ? this.activeQuest.title : 'Focusing'} - Quest`;
      } else {
        document.title = 'Quest - Stay Productive';
      }

      // SVG Ring Stroke
      if (ringCircle) {
        const radius = 130;
        const circumference = 2 * Math.PI * radius;
        ringCircle.style.strokeDasharray = `${circumference} ${circumference}`;
        const fraction = this.totalSeconds > 0 ? (this.totalSeconds - this.remainingSeconds) / this.totalSeconds : 0;
        const offset = circumference - fraction * circumference;
        ringCircle.style.strokeDashoffset = offset;
      }

      // Mode and Labels
      if (modeLabel) {
        if (this.mode === 'focus') {
          modeLabel.textContent = 'FOCUS SESSION';
          modeLabel.className = 'text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-primary-container/30 text-primary border border-primary/30';
        } else if (this.mode === 'shortBreak') {
          modeLabel.textContent = 'SHORT BREAK (5 MIN)';
          modeLabel.className = 'text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
        } else {
          modeLabel.textContent = 'LONG BREAK (15 MIN)';
          modeLabel.className = 'text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30';
        }
      }

      if (questTitleElem) {
        if (this.activeQuest && this.mode === 'focus') {
          questTitleElem.textContent = this.activeQuest.title;
          if (questCategoryElem) {
            questCategoryElem.textContent = `${this.activeQuest.category} • ${this.activeQuest.priority || 'Normal'} Priority`;
            questCategoryElem.classList.remove('hidden');
          }
        } else if (this.mode !== 'focus') {
          questTitleElem.textContent = 'Recharge Your Energy';
          if (questCategoryElem) {
            questCategoryElem.textContent = 'Stretch, hydrate, or rest your eyes';
            questCategoryElem.classList.remove('hidden');
          }
        } else {
          questTitleElem.textContent = 'Free Focus Session';
          if (questCategoryElem) {
            questCategoryElem.classList.add('hidden');
          }
        }
      }

      // Button states
      if (startBtn && pauseBtn) {
        if (this.status === 'running') {
          startBtn.classList.add('hidden');
          pauseBtn.classList.remove('hidden');
        } else {
          startBtn.classList.remove('hidden');
          pauseBtn.classList.add('hidden');
        }
      }

      // Render Focus Subtasks
      this.renderFocusSubtasks();
    },

    renderFocusSubtasks() {
      const container = document.getElementById('focusSubtasksContainer');
      if (!container) return;

      if (!this.activeQuest || !this.activeQuest.subtasks || this.activeQuest.subtasks.length === 0) {
        container.innerHTML = `<p class="text-xs text-on-surface-variant text-center py-2">No subtasks defined for this quest.</p>`;
        return;
      }

      container.innerHTML = this.activeQuest.subtasks.map((st, idx) => `
        <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-high/60 border border-surface-variant/40 hover:border-outline transition-colors text-sm">
          <input type="checkbox" ${st.done ? 'checked' : ''} onchange="App.toggleSubtask('${this.activeQuest.id}', '${st.id}')" class="rounded border-outline text-primary focus:ring-primary w-4 h-4 cursor-pointer">
          <span class="${st.done ? 'line-through text-on-surface-variant opacity-70' : 'text-on-surface'}">${escapeHtml(st.text)}</span>
        </div>
      `).join('');
    }
  };

  // ==========================================
  // 5. MAIN APPLICATION CONTROLLER
  // ==========================================
  const App = {
    currentView: 'today',
    selectedFilter: 'all',
    searchQuery: '',
    editingQuestId: null,
    futureFilter: 'all',
    futureSearchQuery: '',
    editingFutureId: null,

    init() {
      Confetti.init();
      this.applyTheme(state.settings.theme || 'indigo');
      this.bindEvents();
      this.renderAll();

      // Check daily streak reset/update
      this.checkDailyStreak();
    },

    bindEvents() {
      // Navigation
      document.querySelectorAll('[data-nav-target]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const target = link.getAttribute('data-nav-target');
          this.switchView(target);
        });
      });

      // Quick Quest Search Input
      const searchInput = document.getElementById('questSearchInput');
      if (searchInput) {
        searchInput.addEventListener('input', (e) => {
          this.searchQuery = e.target.value.toLowerCase().trim();
          this.renderActiveQuests();
        });
      }

      // Filter category tabs
      document.querySelectorAll('[data-filter-category]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-filter-category]').forEach(b => {
            b.classList.remove('bg-primary-container', 'text-on-primary-container');
            b.classList.add('bg-surface-container', 'text-on-surface-variant');
          });
          btn.classList.add('bg-primary-container', 'text-on-primary-container');
          btn.classList.remove('bg-surface-container', 'text-on-surface-variant');

          this.selectedFilter = btn.getAttribute('data-filter-category');
          this.renderActiveQuests();
        });
      });

      // Quick Future Goal Search Input
      const futureSearchInput = document.getElementById('futureSearchInput');
      if (futureSearchInput) {
        futureSearchInput.addEventListener('input', (e) => {
          this.futureSearchQuery = e.target.value.toLowerCase().trim();
          this.renderFutureGoals();
        });
      }

      // Filter category pills for Future Goals
      document.querySelectorAll('[data-future-filter]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-future-filter]').forEach(b => {
            b.classList.remove('bg-primary-container', 'text-on-primary-container');
            b.classList.add('bg-surface-container', 'text-on-surface-variant');
          });
          btn.classList.add('bg-primary-container', 'text-on-primary-container');
          btn.classList.remove('bg-surface-container', 'text-on-surface-variant');

          this.futureFilter = btn.getAttribute('data-future-filter');
          this.renderFutureGoals();
        });
      });

      // Timer Controls
      const timerStartBtn = document.getElementById('timerStartBtn');
      if (timerStartBtn) {
        timerStartBtn.addEventListener('click', () => {
          if (TimerEngine.status === 'paused') {
            TimerEngine.resume();
          } else {
            TimerEngine.start();
          }
        });
      }

      const timerPauseBtn = document.getElementById('timerPauseBtn');
      if (timerPauseBtn) {
        timerPauseBtn.addEventListener('click', () => TimerEngine.pause());
      }

      const timerResetBtn = document.getElementById('timerResetBtn');
      if (timerResetBtn) {
        timerResetBtn.addEventListener('click', () => TimerEngine.reset());
      }

      // Ambient Audio Selector
      const ambientSelect = document.getElementById('ambientSoundSelect');
      if (ambientSelect) {
        ambientSelect.addEventListener('change', (e) => {
          AudioEngine.setAmbient(e.target.value);
          this.updateAmbientUI();
        });
      }

      // Duration selector buttons in Create Modal
      document.querySelectorAll('[data-duration-preset]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-duration-preset]').forEach(b => {
            b.classList.remove('bg-primary-container', 'text-on-primary-container', 'border-primary-container');
            b.classList.add('bg-[#252525]', 'text-on-surface', 'border-[#333333]');
          });
          btn.classList.add('bg-primary-container', 'text-on-primary-container', 'border-primary-container');
          btn.classList.remove('bg-[#252525]', 'text-on-surface', 'border-[#333333]');

          const val = btn.getAttribute('data-duration-preset');
          const customInput = document.getElementById('customDurationInput');
          if (val === 'custom') {
            if (customInput) customInput.classList.remove('hidden');
          } else {
            if (customInput) customInput.classList.add('hidden');
          }
          this.updateModalXpPreview();
        });
      });

      // Priority selector buttons in Create Modal
      document.querySelectorAll('[data-priority-select]').forEach(btn => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('[data-priority-select]').forEach(b => {
            b.classList.remove('ring-2', 'ring-primary', 'bg-surface-container-highest');
          });
          btn.classList.add('ring-2', 'ring-primary', 'bg-surface-container-highest');
          this.updateModalXpPreview();
        });
      });

      // Keyboard Shortcuts
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key === 'c' || e.key === 'C') {
          e.preventDefault();
          this.openCreateModal();
        } else if (e.key === ' ') {
          if (this.currentView === 'focus') {
            e.preventDefault();
            if (TimerEngine.status === 'running') TimerEngine.pause();
            else TimerEngine.start();
          }
        } else if (e.key === 'Escape') {
          this.closeModals();
        }
      });
    },

    // ------------------------------------------
    // Navigation & Views
    // ------------------------------------------
    switchView(viewName) {
      AudioEngine.playClick();
      this.currentView = viewName;

      // Update View Sections
      document.querySelectorAll('.view-section').forEach(sec => {
        sec.classList.remove('active');
      });

      const activeSec = document.getElementById(`view-${viewName}`);
      if (activeSec) {
        activeSec.classList.add('active');
      }

      // Update Desktop Nav Links
      document.querySelectorAll('[data-nav-target]').forEach(link => {
        const target = link.getAttribute('data-nav-target');
        const isSelected = target === viewName;

        if (link.classList.contains('desktop-nav-link')) {
          if (isSelected) {
            link.className = 'desktop-nav-link flex items-center gap-sm bg-secondary-container text-on-secondary-container rounded-lg px-md py-sm border-l-4 border-primary font-label-md text-label-md hover:bg-surface-container-highest transition-all duration-150 scale-100 opacity-100 font-semibold';
          } else {
            link.className = 'desktop-nav-link flex items-center gap-sm text-on-surface-variant hover:bg-surface-container-high rounded-lg px-md py-sm font-label-md text-label-md hover:text-primary transition-colors duration-200';
          }
        } else if (link.classList.contains('mobile-nav-link')) {
          if (isSelected) {
            link.className = 'mobile-nav-link font-label-md text-label-md text-primary font-bold border-b-2 border-primary pb-1 hover:text-primary transition-colors duration-200 opacity-100';
          } else {
            link.className = 'mobile-nav-link font-label-md text-label-md text-on-surface-variant font-medium pb-[6px] hover:text-primary transition-colors duration-200';
          }
        }
      });

      // View specific refresh
      if (viewName === 'focus') {
        TimerEngine.updateUI();
      } else if (viewName === 'future') {
        this.renderFutureGoals();
      } else if (viewName === 'history') {
        this.renderHistoryView();
      } else if (viewName === 'settings') {
        this.renderSettingsView();
      } else {
        this.renderActiveQuests();
      }

      window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    // ------------------------------------------
    // Render Functions
    // ------------------------------------------
    renderAll() {
      this.renderUserProfile();
      this.renderActiveQuests();
      this.renderCompletedQuests();
      this.renderFutureGoals();
      this.renderHistoryView();
      this.renderSettingsView();
      this.renderDailyMotivation();
    },

    // ------------------------------------------
    // Daily Motivation (IST-based, changes each day)
    // ------------------------------------------
    renderDailyMotivation() {
      const el = document.getElementById('dailyMotivationText');
      if (!el) return;

      const quotes = [
        "Stop waiting for the right moment. You're creating excuses, not opportunities.",
        "Your comfort zone is a beautiful place, but nothing ever grows there. Get out.",
        "The people who are 'too busy' are the ones who end up working for the people who weren't.",
        "You don't rise to the level of your goals, you fall to the level of your systems. Fix your systems.",
        "Discipline is doing what needs to be done even when every part of you screams to stop.",
        "Most people won't do what it takes. That's why most people stay exactly where they are.",
        "Your future self is watching you right now through your memories. Don't disappoint them.",
        "Pain is temporary. Regret is forever. Choose your suffering wisely.",
        "You're not tired. You're uninspired. Find your reason or find your excuses.",
        "The version of you that exists 5 years from now is being built or destroyed right now.",
        "Hard work doesn't guarantee success, but the absence of it guarantees failure.",
        "Stop telling people your plans. Show them your results.",
        "The average person quits when it gets hard. That's exactly when champions get started.",
        "Every day you delay is a day your competition gains on you.",
        "You want it bad enough until it actually requires sacrifice. That's where most people quit.",
        "Nobody cares about your potential. They only care about what you produce.",
        "Motivation gets you started. Discipline keeps you going. You need both and most have neither.",
        "If your dreams don't scare you, they're not big enough. Fear is confirmation you're on the right path.",
        "Stop being afraid of what could go wrong and start being excited about what could go right.",
        "The graveyard is full of people who planned to start tomorrow.",
        "You are the average of the five people you spend the most time with. Look around you.",
        "Success is not given. It is earned. On the track, on the field, in the gym, with blood and sweat and tears.",
        "Most people overestimate what they can do in a day and underestimate what they can do in a decade.",
        "You will either find a way or find an excuse. You can only choose one.",
        "Stop being a spectator in your own life. Get in the game.",
        "The price of inaction is far greater than the cost of making a mistake.",
        "Talent without discipline is a car without fuel. Impressive to look at, useless in reality.",
        "The moment you think you're good enough is the moment you start declining.",
        "You're not unlucky. You're just not working hard enough to make your own luck.",
        "What you tolerate, you teach. Stop tolerating mediocrity in yourself.",
        "The weak make excuses. The strong make adjustments.",
        "Every single day you don't improve, you get slightly worse. There is no standing still.",
        "Your life is not a rehearsal. You don't get a second take on the time you're wasting right now.",
        "Don't wish it were easier. Wish you were better.",
        "The truth is, most people never start because they're too busy waiting to be ready.",
        "Suffering is inevitable. Suffering for nothing is a choice.",
        "Champions aren't made when things are comfortable. They're forged in the moments of maximum discomfort.",
        "You have exactly as many hours in a day as Elon Musk, LeBron James, and every person you admire. What's your excuse?",
        "Sleep is for people who have already earned it. Keep working.",
        "You said you wanted it. Your calendar, bank account, and energy levels all say otherwise.",
        "The world doesn't owe you anything. It was here first.",
        "Stop asking for permission to be great. Just be great.",
        "Mediocrity is comfortable. That's exactly why it's dangerous.",
        "Your past is not an excuse. It's the raw material you build from.",
        "The hardest part isn't the work. It's choosing to show up when you don't feel like it.",
        "You will never always be motivated. You need to learn to be disciplined.",
        "Most of what you're worrying about right now won't matter in 5 years. Get to work.",
        "You're not behind. Everyone's timeline is different. But you are definitely not moving fast enough.",
        "The only thing worse than starting over is wishing you had.",
        "Real growth feels like you're being torn apart. That's how it's supposed to feel.",
        "You are one decision away from a completely different life. Make it.",
        "Don't just dream big. Work obscenely hard to match your dreams.",
        "The difference between where you are and where you want to be is what you do today.",
        "Stop blaming circumstances. You are the circumstance.",
        "If you think you're already good enough, every person better than you is proving you wrong right now.",
        "Your reputation is built one choice at a time. What did you just choose?",
        "Comfort is the enemy of achievement. The sooner you accept that, the sooner you'll grow.",
        "Stop trying to be perfect. Start trying to be consistent. Consistent beats perfect every single time.",
        "You don't have a time management problem. You have a priority problem.",
        "Energy flows where attention goes. Stop giving your energy to things that don't matter.",
        "The person you're jealous of is just a version of you that outworked you.",
        "Every successful person was once at your level. The difference is they didn't stop.",
        "Self-doubt will destroy more potential than failure ever could.",
        "You're going to be tired either way. Tired of working, or tired of regret. Pick one.",
        "The longest relationship you'll ever have is with yourself. Make it worth respecting.",
        "Go to bed tired. Wake up determined. That's how legends are built.",
        "It's not about having time. It's about making time. Stop lying to yourself.",
        "Your habits are a vote for the type of person you're becoming. Are you voting correctly?",
        "The grind is real. The question is: are you real enough to handle it?",
        "You can have results or excuses. Not both.",
        "The gap between who you are and who you want to be is only closed by action, not intention.",
        "Stop overthinking and start overdoing.",
        "Consistency is what transforms average into excellence.",
        "The nights you want to quit are the nights that define you.",
        "Most people give up right before the breakthrough. Don't be most people.",
        "Success is rented, never owned. The rent is due every single day.",
        "You're either growing or you're dying. There's no comfortable middle ground.",
        "Stop looking for shortcuts. The shortcut is the work.",
        "One year from now you'll wish you had started today.",
        "The only limits that exist are the ones you've accepted.",
        "You don't get better by accident. You get better by deliberate, uncomfortable, relentless effort.",
        "Your silence is killing your potential. Speak up with your work.",
        "Discipline is the bridge between your goals and your accomplishments.",
        "Stop waiting for someone to believe in you. Believe in yourself first, then prove them wrong.",
        "The war is fought in the morning when no one is watching. Win that battle first.",
        "Everything worth having is on the other side of the effort you're currently avoiding.",
        "Nobody remembers the person who almost made it.",
        "Your standards are the ceiling of your success. Raise them or accept mediocrity.",
        "If it's important to you, you'll find a way. If it's not, you'll find an excuse.",
        "You are not entitled to anything. Earn it or go without.",
        "There's no traffic on the extra mile. That's why so few people ever take it.",
        "The hardest skill you'll ever develop is the ability to keep going when everything tells you to stop.",
        "Today's pain is tomorrow's strength. Don't run from it.",
        "Your dreams are valid. Your effort needs to match them.",
        "Stop being nice to the lazy version of yourself.",
        "The person who wakes up early consistently will almost always win.",
        "You're not stuck. You're just comfortable. There's a difference.",
        "Fear of failure is a luxury you can't afford. Act anyway.",
        "Your urgency is determined by your priorities. How urgent is your future to you?",
        "Every master was once a disaster. The only difference is they didn't quit.",
        "Real talk: most people are not willing to do what it takes. Are you?",
        "The body achieves what the mind believes. But first, the mind has to believe something worth achieving.",
        "Don't wish for a lighter load. Build stronger shoulders.",
        "You can't cheat the grind. It knows how much you've invested and it pays exactly that much back.",
        "The secret to getting ahead is getting started. Right now. This moment.",
        "Hard times reveal who you really are. What does your current behavior reveal?",
        "If you quit now, you'll be back to where you started. And where you started you wanted to get where you were.",
        "Small disciplines repeated daily lead to massive results over time.",
        "You don't have to be great to start but you have to start to be great.",
        "The mirror doesn't lie. Neither does your bank account, your health, or your relationships.",
        "Stop asking 'why is this happening to me?' and start asking 'what is this preparing me for?'",
        "You're stronger than you think. Your situation is more temporary than it feels. Keep going.",
        "The only workout you'll regret is the one you didn't do.",
        "When you feel like quitting, think about why you started.",
        "Your life won't change until your daily habits change.",
        "Outwork your doubts. They go quiet when you're busy producing results.",
        "Excellence is a habit, not an event. Build it daily.",
        "The world rewards people who show up and do the work, not people who meant to.",
        "You have to be willing to be uncomfortable to become unstoppable."
      ];

      // Use IST day-of-year as stable index (same quote all day, rotates daily)
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
      const [y, m, d] = todayStr.split('-').map(Number);
      const start = new Date(y, 0, 0);
      const now = new Date(y, m - 1, d);
      const dayOfYear = Math.floor((now - start) / 86400000);
      const idx = dayOfYear % quotes.length;

      el.textContent = `"${quotes[idx]}"`;
    },

    renderUserProfile() {
      // XP needed per level = level x 100 (linear). Level cap = 100.
      const MAX_LEVEL = 100;
      const currentLevel = Math.min(state.user.level || 1, MAX_LEVEL);
      const isMaxLevel = currentLevel >= MAX_LEVEL;
      const xpNeeded = currentLevel * 100;
      // XP earned within current level = total XP minus cumulative threshold
      const xpFloor = ((currentLevel - 1) * currentLevel / 2) * 100;
      const currentXp = isMaxLevel ? xpNeeded : Math.max(0, state.user.xp - xpFloor);
      const xpPercent = isMaxLevel ? 100 : Math.min(100, Math.floor((currentXp / xpNeeded) * 100));

      const levelElem = document.getElementById('userLevelBadge');
      if (levelElem) levelElem.textContent = isMaxLevel ? 'MAX' : `Lvl ${currentLevel}`;

      const levelRankElem = document.getElementById('userRankTitle');
      if (levelRankElem) {
        const ranks = [
          'Novice Adventurer', 'Apprentice of Focus', 'Quest Initiate', 'Chrono Scout', 'Focused Fighter',
          'Discipline Seeker', 'Iron Will', 'Shadow Grinder', 'Relentless Pursuer', 'Quest Master',
          'Storm Walker', 'Storm Walker', 'Storm Walker', 'Storm Walker', 'Storm Walker',
          'Elite Warrior', 'Elite Warrior', 'Elite Warrior', 'Elite Warrior', 'Elite Warrior',
          'Void Strider', 'Void Strider', 'Void Strider', 'Void Strider', 'Void Strider',
          'Chrono Knight', 'Chrono Knight', 'Chrono Knight', 'Chrono Knight', 'Chrono Knight',
          'Apex Hunter', 'Apex Hunter', 'Apex Hunter', 'Apex Hunter', 'Apex Hunter',
          'Apex Hunter', 'Apex Hunter', 'Apex Hunter', 'Apex Hunter', 'Apex Hunter',
          'Legend of the Grind', 'Legend of the Grind', 'Legend of the Grind', 'Legend of the Grind', 'Legend of the Grind',
          'Legend of the Grind', 'Legend of the Grind', 'Legend of the Grind', 'Legend of the Grind', 'Titan of Discipline',
          'Titan of Discipline', 'Titan of Discipline', 'Titan of Discipline', 'Titan of Discipline', 'Titan of Discipline',
          'Titan of Discipline', 'Titan of Discipline', 'Titan of Discipline', 'Titan of Discipline', 'Titan of Discipline',
          'Phantom Overlord', 'Phantom Overlord', 'Phantom Overlord', 'Phantom Overlord', 'Phantom Overlord',
          'Phantom Overlord', 'Phantom Overlord', 'Phantom Overlord', 'Phantom Overlord', 'Phantom Overlord',
          'Celestial Conqueror', 'Celestial Conqueror', 'Celestial Conqueror', 'Celestial Conqueror', 'Celestial Conqueror',
          'Celestial Conqueror', 'Celestial Conqueror', 'Celestial Conqueror', 'Celestial Conqueror', 'Celestial Conqueror',
          'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God',
          'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God',
          'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God',
          'Ascendant God', 'Ascendant God', 'Ascendant God', 'Ascendant God', '⚡ Quest God ⚡'
        ];
        levelRankElem.textContent = ranks[Math.min(ranks.length - 1, currentLevel - 1)];
      }

      const xpTextElem = document.getElementById('userXpText');
      if (xpTextElem) xpTextElem.textContent = isMaxLevel ? 'MAX LEVEL' : `${currentXp} / ${xpNeeded} XP`;

      const xpBarElem = document.getElementById('userXpProgressBar');
      if (xpBarElem) xpBarElem.style.width = `${xpPercent}%`;

      const streakElem = document.getElementById('userStreakCount');
      if (streakElem) streakElem.textContent = `${state.user.streak || 0}d`;

      const todayFocusElem = document.getElementById('userTodayFocus');
      if (todayFocusElem) todayFocusElem.textContent = `${state.user.totalFocusMinutes || 0}m`;

      // Update streak progress indicator
      const streakProgressElem = document.getElementById('streakDailyProgress');
      if (streakProgressElem) {
        const todayCount = this.getTodayQuestCount();
        const needed = STREAK_MIN_QUESTS;
        if (todayCount >= needed) {
          streakProgressElem.innerHTML = `<span class="text-emerald-400 flex items-center gap-0.5"><span class="material-symbols-outlined text-[12px]">check_circle</span> Streak earned today!</span>`;
        } else {
          streakProgressElem.innerHTML = `<span class="text-on-surface-variant">${todayCount}/${needed} quests for streak</span>`;
        }
      }
    },

    renderActiveQuests() {
      const container = document.getElementById('activeQuestsContainer');
      const emptyState = document.getElementById('activeQuestsEmpty');
      if (!container) return;

      let list = state.quests.filter(q => !q.completed);

      // Category filter
      if (this.selectedFilter && this.selectedFilter !== 'all') {
        list = list.filter(q => q.category.toLowerCase() === this.selectedFilter.toLowerCase());
      }

      // Search filter
      if (this.searchQuery) {
        list = list.filter(q =>
          q.title.toLowerCase().includes(this.searchQuery) ||
          q.category.toLowerCase().includes(this.searchQuery)
        );
      }

      const activeCountElem = document.getElementById('activeQuestCount');
      if (activeCountElem) activeCountElem.textContent = `(${list.length})`;

      if (list.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      const priorityColors = {
        'Low': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        'Medium': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        'High': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        'Legendary': 'text-purple-400 bg-purple-500/10 border-purple-500/20 font-semibold'
      };

      container.innerHTML = list.map(quest => {
        const completedSubtasks = (quest.subtasks || []).filter(s => s.done).length;
        const totalSubtasks = (quest.subtasks || []).length;
        const pColor = priorityColors[quest.priority] || priorityColors['Medium'];
        const xpAmount = (quest.duration || 25) * 2;

        return `
          <div class="bg-surface-container border border-surface-variant hover:border-outline/80 rounded-xl p-lg flex flex-col gap-md relative group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5">
            <!-- Top Header -->
            <div class="flex justify-between items-start gap-sm">
              <div class="flex items-start gap-sm flex-1">
                <div class="flex-1 min-w-0">
                  <h3 class="font-headline-sm text-headline-sm mb-xs text-on-surface font-semibold line-clamp-2">${escapeHtml(quest.title)}</h3>
                  <div class="flex flex-wrap items-center gap-2 text-on-surface-variant font-label-md text-label-md mt-1">
                    <span class="flex items-center gap-0.5 text-xs bg-surface-container-high px-2 py-0.5 rounded-md border border-surface-variant/50">
                      <span class="material-symbols-outlined text-[14px]">schedule</span>
                      ${quest.duration} min
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-md border ${pColor}">
                      ${quest.priority || 'Normal'}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-surface-variant/50">
                      ${quest.category}
                    </span>
                    <span class="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                      +${xpAmount} XP
                    </span>
                  </div>
                </div>
              </div>

              <!-- Menu Actions -->
              <div class="relative">
                <button onclick="App.toggleQuestMenu('${quest.id}')" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
                  <span class="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
                <div id="questMenu-${quest.id}" class="hidden absolute right-0 top-8 z-30 w-36 bg-[#252525] border border-[#383939] rounded-lg shadow-xl py-1 text-sm">
                  <button onclick="App.editQuest('${quest.id}')" class="w-full text-left px-3 py-1.5 hover:bg-surface-container-high text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">edit</span> Edit
                  </button>
                  <button onclick="App.deleteQuest('${quest.id}')" class="w-full text-left px-3 py-1.5 hover:bg-error/20 text-error flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">delete</span> Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Subtasks Preview (if any) -->
            ${totalSubtasks > 0 ? `
              <div class="bg-surface-container-lowest/60 rounded-lg p-2.5 border border-surface-variant/40 space-y-1.5 mt-1">
                <div class="flex justify-between text-xs text-on-surface-variant mb-1">
                  <span>Subtasks (${completedSubtasks}/${totalSubtasks})</span>
                  <span>${Math.round((completedSubtasks/totalSubtasks)*100)}%</span>
                </div>
                <div class="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary rounded-full transition-all" style="width: ${(completedSubtasks/totalSubtasks)*100}%"></div>
                </div>
                <div class="space-y-1 pt-1">
                  ${quest.subtasks.slice(0, 2).map(st => `
                    <div class="flex items-center gap-2 text-xs">
                      <input type="checkbox" ${st.done ? 'checked' : ''} onchange="App.toggleSubtask('${quest.id}', '${st.id}')" class="rounded border-outline text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer">
                      <span class="${st.done ? 'line-through text-on-surface-variant opacity-60' : 'text-on-surface'} truncate">${escapeHtml(st.text)}</span>
                    </div>
                  `).join('')}
                  ${totalSubtasks > 2 ? `<div class="text-[11px] text-on-surface-variant/80 pl-5">+${totalSubtasks - 2} more subtasks</div>` : ''}
                </div>
              </div>
            ` : ''}

            <!-- Card Footer -->
            <div class="mt-auto pt-md flex justify-between items-center border-t border-surface-variant/40">
              <span class="text-xs text-on-surface-variant/70">
                Created ${formatTimeAgo(quest.createdAt)}
              </span>
              <button onclick="App.startQuestFocus('${quest.id}')" class="bg-[#1e1e1e] border border-[#333333] hover:border-primary/50 text-on-surface hover:text-primary hover:bg-surface-container-high px-md py-sm rounded-lg font-label-md text-label-md transition-all flex items-center gap-xs shadow-sm hover:scale-105">
                <span class="material-symbols-outlined text-[18px] text-primary">play_arrow</span>
                Start Quest
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    renderCompletedQuests() {
      const container = document.getElementById('completedQuestsContainer');
      const countElem = document.getElementById('completedQuestCount');
      if (!container) return;

      const completed = state.quests.filter(q => q.completed);
      if (countElem) countElem.textContent = `(${completed.length})`;

      if (completed.length === 0) {
        container.innerHTML = `<div class="text-sm text-on-surface-variant py-3 italic">No completed quests yet today. Go conquer one!</div>`;
        return;
      }

      container.innerHTML = completed.map(quest => `
        <div class="flex items-center justify-between gap-md py-sm px-md rounded-lg bg-surface-container-low/40 border border-surface-variant/30 hover:border-surface-variant transition-colors group">
          <div class="flex items-center gap-md flex-1 min-w-0">
            <button onclick="App.uncompleteQuest('${quest.id}')" title="Undo completion" class="w-6 h-6 rounded-full border-2 border-primary bg-primary flex items-center justify-center hover:bg-transparent transition-colors shrink-0">
              <span class="material-symbols-outlined text-[16px] text-on-primary group-hover:text-primary">check</span>
            </button>
            <span class="font-body-md text-body-md line-through text-on-surface-variant truncate">${escapeHtml(quest.title)}</span>
          </div>
          <div class="flex items-center gap-sm shrink-0">
            <span class="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+${(quest.duration || 25) * 2} XP</span>
            <span class="font-label-md text-label-md text-on-surface-variant/80">${quest.duration} min</span>
            <button onclick="App.deleteQuest('${quest.id}')" title="Delete" class="opacity-0 group-hover:opacity-100 p-1 hover:text-error transition-opacity">
              <span class="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      `).join('');
    },

    // ------------------------------------------
    // History & Analytics View
    // ------------------------------------------
    renderHistoryView() {
      const container = document.getElementById('historyLogList');
      const statsTotalMinutes = document.getElementById('statsTotalMinutes');
      const statsCompletedCount = document.getElementById('statsCompletedCount');
      const statsCurrentStreak = document.getElementById('statsCurrentStreak');
      const statsTotalXp = document.getElementById('statsTotalXp');

      if (statsTotalMinutes) statsTotalMinutes.textContent = `${state.user.totalFocusMinutes || 0}m`;
      if (statsCompletedCount) statsCompletedCount.textContent = `${state.history.length}`;
      if (statsCurrentStreak) statsCurrentStreak.textContent = `${state.user.streak || 0} Days`;
      if (statsTotalXp) statsTotalXp.textContent = `${state.user.xp} XP`;

      // Render Weekly Chart
      this.renderWeeklyChart();

      // Render Achievements
      this.renderAchievements();

      // Render History Log
      if (!container) return;

      if (state.history.length === 0) {
        container.innerHTML = `<div class="text-center py-8 text-on-surface-variant">No history records yet. Complete your first quest!</div>`;
        return;
      }

      container.innerHTML = state.history.slice(0, 20).map(item => `
        <div class="flex items-center justify-between p-3 rounded-lg bg-surface-container border border-surface-variant hover:border-outline/60 transition-colors">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-8 h-8 rounded-lg bg-primary-container/20 text-primary flex items-center justify-center shrink-0">
              <span class="material-symbols-outlined text-[18px]">verified</span>
            </div>
            <div class="min-w-0">
              <h4 class="font-medium text-sm text-on-surface truncate">${escapeHtml(item.title)}</h4>
              <div class="text-xs text-on-surface-variant flex items-center gap-2">
                <span>${item.category || 'General'}</span>
                <span>•</span>
                <span>${formatDate(item.completedAt)}</span>
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            <span class="text-xs font-semibold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">+${item.xpEarned || 30} XP</span>
            <span class="text-xs text-on-surface-variant font-medium">${item.duration || 25} min</span>
          </div>
        </div>
      `).join('');
    },

    renderWeeklyChart() {
      const chartContainer = document.getElementById('weeklyActivityChart');
      if (!chartContainer) return;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      // Build array of last 7 IST days (oldest first → newest/today last)
      const weekData = [];
      const now = new Date();
      for (let offset = 6; offset >= 0; offset--) {
        const targetDate = new Date(now.getTime() - offset * 24 * 60 * 60 * 1000);
        const dateStr = targetDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
        const dayName = targetDate.toLocaleDateString('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short' });
        const isToday = (offset === 0);

        // Sum focus minutes from history entries that fall on this IST date
        let focusMins = 0;
        (state.history || []).forEach(h => {
          if (h.completedAt) {
            const hDate = getISTDateString(h.completedAt);
            if (hDate === dateStr) {
              focusMins += (h.duration || 0);
            }
          }
        });

        // Also check dailyFocusMinutes store as fallback
        if (state.dailyFocusMinutes && state.dailyFocusMinutes[dateStr]) {
          focusMins = Math.max(focusMins, state.dailyFocusMinutes[dateStr]);
        }

        weekData.push({ dayName, focusMins, isToday, dateStr });
      }

      const maxMin = Math.max(30, ...weekData.map(w => w.focusMins)); // min 30 for scale

      chartContainer.innerHTML = weekData.map(w => {
        const heightPercent = w.focusMins > 0 ? Math.max(4, Math.round((w.focusMins / maxMin) * 100)) : 0;
        const questCount = (state.dailyCompletions && state.dailyCompletions[w.dateStr]) || 0;

        return `
          <div class="flex flex-col items-center gap-1.5 flex-1 group">
            <div class="text-[11px] text-on-surface-variant font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              ${w.focusMins > 0 ? w.focusMins + 'm' : '—'}
            </div>
            <div class="w-full bg-surface-variant/50 rounded-t-md h-28 flex items-end p-0.5 relative overflow-hidden">
              <div class="w-full rounded-sm transition-all duration-700 ease-out ${
                w.isToday
                  ? 'bg-gradient-to-t from-primary to-primary-container glow-primary'
                  : w.focusMins > 0
                    ? 'bg-primary-container/70 group-hover:bg-primary-container'
                    : 'bg-surface-variant/30'
              }" style="height: ${heightPercent}%"></div>
            </div>
            <div class="flex flex-col items-center">
              <span class="text-xs ${w.isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}">${w.dayName}</span>
              ${questCount > 0 ? `<span class="text-[9px] ${questCount >= STREAK_MIN_QUESTS ? 'text-emerald-400' : 'text-on-surface-variant/60'}">${questCount}q</span>` : ''}
            </div>
          </div>
        `;
      }).join('');
    },

    renderAchievements() {
      const container = document.getElementById('achievementsList');
      if (!container) return;

      container.innerHTML = state.achievements.map(ach => `
        <div class="p-3 rounded-xl border transition-all ${ach.unlocked ? 'bg-surface-container-high/80 border-primary/40 glow-primary' : 'bg-surface-container-low/40 border-surface-variant opacity-60'} flex items-start gap-3">
          <div class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${ach.unlocked ? 'bg-primary text-on-primary badge-shine' : 'bg-surface-variant text-on-surface-variant'}">
            <span class="material-symbols-outlined text-[22px]">${ach.icon || 'star'}</span>
          </div>
          <div class="flex-1 min-w-0">
            <div class="flex items-center justify-between">
              <h4 class="text-sm font-semibold text-on-surface truncate">${ach.title}</h4>
              <span class="text-xs text-amber-400 font-bold">+${ach.xp} XP</span>
            </div>
            <p class="text-xs text-on-surface-variant mt-0.5 line-clamp-2">${ach.desc}</p>
            ${!ach.unlocked && ach.maxProgress ? `
              <div class="mt-2">
                <div class="flex justify-between text-[10px] text-on-surface-variant mb-0.5">
                  <span>Progress</span>
                  <span>${ach.progress}/${ach.maxProgress}</span>
                </div>
                <div class="w-full h-1 bg-surface-variant rounded-full overflow-hidden">
                  <div class="h-full bg-primary" style="width: ${(ach.progress/ach.maxProgress)*100}%"></div>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      `).join('');
    },

    // ------------------------------------------
    // Settings View
    // ------------------------------------------
    renderSettingsView() {
      const focusInp = document.getElementById('settingFocusDuration');
      const shortBreakInp = document.getElementById('settingShortBreak');
      const longBreakInp = document.getElementById('settingLongBreak');
      const autoStartBreakChk = document.getElementById('settingAutoStartBreaks');
      const soundEffectsChk = document.getElementById('settingSoundEffects');
      const volumeSlider = document.getElementById('settingSoundVolume');

      if (focusInp) focusInp.value = state.settings.focusDuration;
      if (shortBreakInp) shortBreakInp.value = state.settings.shortBreakDuration;
      if (longBreakInp) longBreakInp.value = state.settings.longBreakDuration;
      if (autoStartBreakChk) autoStartBreakChk.checked = state.settings.autoStartBreaks;
      if (soundEffectsChk) soundEffectsChk.checked = state.settings.soundEffects;
      if (volumeSlider) volumeSlider.value = Math.round((state.settings.soundVolume || 0.7) * 100);

      // Theme buttons active state
      document.querySelectorAll('[data-theme-choice]').forEach(btn => {
        const theme = btn.getAttribute('data-theme-choice');
        if (theme === state.settings.theme) {
          btn.classList.add('ring-2', 'ring-primary', 'scale-105');
        } else {
          btn.classList.remove('ring-2', 'ring-primary', 'scale-105');
        }
      });
    },

    saveSettingsFromForm() {
      const focusInp = document.getElementById('settingFocusDuration');
      const shortBreakInp = document.getElementById('settingShortBreak');
      const longBreakInp = document.getElementById('settingLongBreak');
      const autoStartBreakChk = document.getElementById('settingAutoStartBreaks');
      const soundEffectsChk = document.getElementById('settingSoundEffects');
      const volumeSlider = document.getElementById('settingSoundVolume');

      if (focusInp) state.settings.focusDuration = Math.max(1, parseInt(focusInp.value) || 25);
      if (shortBreakInp) state.settings.shortBreakDuration = Math.max(1, parseInt(shortBreakInp.value) || 5);
      if (longBreakInp) state.settings.longBreakDuration = Math.max(1, parseInt(longBreakInp.value) || 15);
      if (autoStartBreakChk) state.settings.autoStartBreaks = autoStartBreakChk.checked;
      if (soundEffectsChk) state.settings.soundEffects = soundEffectsChk.checked;
      if (volumeSlider) state.settings.soundVolume = (parseInt(volumeSlider.value) || 70) / 100;

      saveState();
      AudioEngine.playCheck();
      this.showToast('Settings saved successfully!', 'success');
    },

    applyTheme(themeName) {
      state.settings.theme = themeName;
      document.documentElement.setAttribute('data-theme', themeName);
      saveState();
    },

    // ------------------------------------------
    // Quest & Future Goal CRUD Operations
    // ------------------------------------------
    openCreateModal(questId = null, isFuture = false) {
      AudioEngine.playClick();
      this.editingQuestId = null;
      this.editingFutureId = null;

      const modal = document.getElementById('createModal');
      const modalTitle = document.getElementById('modalTitle');
      const titleInput = document.getElementById('questTitleInput');
      const categorySelect = document.getElementById('questCategorySelect');
      const isFutureCheckbox = document.getElementById('questIsFutureCheckbox');
      const submitBtn = document.getElementById('modalSubmitBtn');

      if (!modal) return;

      // Populate Categories
      if (categorySelect) {
        categorySelect.innerHTML = state.categories.map(c => `<option value="${c}">${c}</option>`).join('');
      }

      if (questId) {
        if (isFuture) {
          // Editing a Future Goal
          this.editingFutureId = questId;
          const goal = (state.futureGoals || []).find(g => g.id === questId);
          if (goal) {
            if (modalTitle) modalTitle.textContent = 'Edit Future Goal';
            if (submitBtn) submitBtn.textContent = 'Save Goal';
            if (titleInput) titleInput.value = goal.title;
            if (categorySelect) categorySelect.value = goal.category;
            if (isFutureCheckbox) isFutureCheckbox.checked = true;

            this.setModalDuration(goal.duration || 30);
            this.setModalPriority(goal.priority || 'Medium');
            this.renderModalSubtasks(goal.subtasks || []);
          }
        } else {
          // Editing an Active Quest
          this.editingQuestId = questId;
          const quest = state.quests.find(q => q.id === questId);
          if (quest) {
            if (modalTitle) modalTitle.textContent = 'Edit Quest';
            if (submitBtn) submitBtn.textContent = 'Save Changes';
            if (titleInput) titleInput.value = quest.title;
            if (categorySelect) categorySelect.value = quest.category;
            if (isFutureCheckbox) isFutureCheckbox.checked = false;

            this.setModalDuration(quest.duration);
            this.setModalPriority(quest.priority || 'Medium');
            this.renderModalSubtasks(quest.subtasks || []);
          }
        }
      } else {
        if (modalTitle) modalTitle.textContent = isFuture ? 'Set a Future Goal' : 'Create a Quest';
        if (submitBtn) submitBtn.textContent = isFuture ? 'Add to Future Goals' : 'Create Quest';
        if (titleInput) titleInput.value = '';
        if (isFutureCheckbox) isFutureCheckbox.checked = isFuture;

        this.setModalDuration(30);
        this.setModalPriority('Medium');
        this.renderModalSubtasks([]);
      }

      this.updateModalXpPreview();
      modal.classList.remove('hidden');
      if (titleInput) titleInput.focus();
    },

    setModalDuration(duration) {
      let found = false;
      document.querySelectorAll('[data-duration-preset]').forEach(btn => {
        const val = btn.getAttribute('data-duration-preset');
        if (parseInt(val) === duration) {
          btn.classList.add('bg-primary-container', 'text-on-primary-container', 'border-primary-container');
          btn.classList.remove('bg-[#252525]', 'text-on-surface', 'border-[#333333]');
          found = true;
        } else {
          btn.classList.remove('bg-primary-container', 'text-on-primary-container', 'border-primary-container');
          btn.classList.add('bg-[#252525]', 'text-on-surface', 'border-[#333333]');
        }
      });

      const customInput = document.getElementById('customDurationInput');
      if (!found && customInput) {
        const customBtn = document.querySelector('[data-duration-preset="custom"]');
        if (customBtn) {
          customBtn.classList.add('bg-primary-container', 'text-on-primary-container', 'border-primary-container');
          customBtn.classList.remove('bg-[#252525]', 'text-on-surface', 'border-[#333333]');
        }
        customInput.classList.remove('hidden');
        customInput.value = duration;
      } else if (customInput) {
        customInput.classList.add('hidden');
      }
    },

    getSelectedDuration() {
      const customInput = document.getElementById('customDurationInput');
      if (customInput && !customInput.classList.contains('hidden')) {
        return Math.max(1, parseInt(customInput.value) || 25);
      }
      const activeBtn = document.querySelector('[data-duration-preset].bg-primary-container');
      if (activeBtn) {
        const val = activeBtn.getAttribute('data-duration-preset');
        if (val !== 'custom') return parseInt(val);
      }
      return 30;
    },

    setModalPriority(priority) {
      document.querySelectorAll('[data-priority-select]').forEach(btn => {
        if (btn.getAttribute('data-priority-select') === priority) {
          btn.classList.add('ring-2', 'ring-primary', 'bg-surface-container-highest');
        } else {
          btn.classList.remove('ring-2', 'ring-primary', 'bg-surface-container-highest');
        }
      });
    },

    getSelectedPriority() {
      const activeBtn = document.querySelector('[data-priority-select].ring-2');
      return activeBtn ? activeBtn.getAttribute('data-priority-select') : 'Medium';
    },

    renderModalSubtasks(subtasks = []) {
      const container = document.getElementById('modalSubtasksList');
      if (!container) return;

      container.innerHTML = subtasks.map((st, idx) => `
        <div class="flex items-center gap-2 subtask-item" data-subtask-id="${st.id || 'st-' + idx}">
          <span class="material-symbols-outlined text-[16px] text-on-surface-variant">drag_indicator</span>
          <input type="text" value="${escapeHtml(st.text)}" class="subtask-text-input flex-1 bg-[#252525] border border-[#383939] rounded px-2 py-1 text-sm text-on-surface outline-none focus:border-primary">
          <button type="button" onclick="this.parentElement.remove()" class="p-1 text-on-surface-variant hover:text-error">
            <span class="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>
      `).join('');
    },

    addModalSubtask() {
      const container = document.getElementById('modalSubtasksList');
      if (!container) return;
      const div = document.createElement('div');
      div.className = 'flex items-center gap-2 subtask-item';
      div.innerHTML = `
        <span class="material-symbols-outlined text-[16px] text-on-surface-variant">drag_indicator</span>
        <input type="text" placeholder="e.g. Write introduction paragraph" class="subtask-text-input flex-1 bg-[#252525] border border-[#383939] rounded px-2 py-1 text-sm text-on-surface outline-none focus:border-primary">
        <button type="button" onclick="this.parentElement.remove()" class="p-1 text-on-surface-variant hover:text-error">
          <span class="material-symbols-outlined text-[16px]">close</span>
        </button>
      `;
      container.appendChild(div);
      const input = div.querySelector('input');
      if (input) input.focus();
    },

    updateModalXpPreview() {
      const duration = this.getSelectedDuration();
      const xp = duration * 2;
      const preview = document.getElementById('modalXpPreview');
      if (preview) preview.textContent = `+${xp} XP upon completion`;
    },

    saveQuestFromModal() {
      const titleInput = document.getElementById('questTitleInput');
      const categorySelect = document.getElementById('questCategorySelect');
      const isFutureCheckbox = document.getElementById('questIsFutureCheckbox');

      const title = titleInput ? titleInput.value.trim() : '';
      if (!title) {
        this.showToast('Please enter a title!', 'error');
        if (titleInput) titleInput.focus();
        return;
      }

      const category = categorySelect ? categorySelect.value : 'Study';
      const duration = this.getSelectedDuration();
      const priority = this.getSelectedPriority();
      const isFuture = isFutureCheckbox ? isFutureCheckbox.checked : false;

      // Collect Subtasks
      const subtasks = [];
      document.querySelectorAll('.subtask-item').forEach((item, idx) => {
        const inp = item.querySelector('.subtask-text-input');
        if (inp && inp.value.trim()) {
          subtasks.push({
            id: 'st-' + Date.now() + '-' + idx,
            text: inp.value.trim(),
            done: false
          });
        }
      });

      if (!state.futureGoals) state.futureGoals = [];

      if (this.editingFutureId) {
        const gIndex = state.futureGoals.findIndex(g => g.id === this.editingFutureId);
        if (gIndex !== -1) {
          state.futureGoals[gIndex].title = title;
          state.futureGoals[gIndex].category = category;
          state.futureGoals[gIndex].duration = duration;
          state.futureGoals[gIndex].priority = priority;
          state.futureGoals[gIndex].subtasks = subtasks;
          this.showToast('Future Goal updated successfully!', 'success');
        }
      } else if (this.editingQuestId) {
        const qIndex = state.quests.findIndex(q => q.id === this.editingQuestId);
        if (qIndex !== -1) {
          state.quests[qIndex].title = title;
          state.quests[qIndex].category = category;
          state.quests[qIndex].duration = duration;
          state.quests[qIndex].priority = priority;
          state.quests[qIndex].subtasks = subtasks;
          this.showToast('Quest updated successfully!', 'success');
        }
      } else {
        if (isFuture) {
          const newGoal = {
            id: 'fg-' + Date.now(),
            title,
            category,
            priority,
            duration,
            createdAt: Date.now(),
            subtasks
          };
          state.futureGoals.unshift(newGoal);
          this.showToast(`🚀 Future Goal "${title}" saved to Vault!`, 'success');
        } else {
          const newQuest = {
            id: 'q-' + Date.now(),
            title,
            category,
            priority,
            duration,
            completed: false,
            createdAt: Date.now(),
            subtasks
          };
          state.quests.unshift(newQuest);
          this.showToast(`✨ Quest "${title}" embarked for Today!`, 'success');
        }
      }

      saveState();
      AudioEngine.playClick();
      this.closeModals();
      this.renderActiveQuests();
      this.renderFutureGoals();
    },

    // Move a Future Goal from Vault to Today's Active Quests
    moveToToday(goalId) {
      if (!state.futureGoals) state.futureGoals = [];
      const goalIndex = state.futureGoals.findIndex(g => g.id === goalId);
      if (goalIndex === -1) return;

      const goal = state.futureGoals[goalIndex];

      // Create active quest for Today
      const newQuest = {
        id: 'q-' + Date.now(),
        title: goal.title,
        category: goal.category,
        priority: goal.priority || 'Medium',
        duration: goal.duration || 25,
        completed: false,
        createdAt: Date.now(),
        subtasks: (goal.subtasks || []).map(st => ({ ...st, done: false }))
      };

      // Remove from futureGoals
      state.futureGoals.splice(goalIndex, 1);

      // Add to active quests
      state.quests.unshift(newQuest);

      saveState();
      AudioEngine.playStartQuest();
      Confetti.burst(60);

      this.showToast(`⚡ Goal "${goal.title}" moved to Today!`, 'success');

      // Switch view to Today & re-render
      this.switchView('today');
      this.renderAll();
    },

    deleteFutureGoal(goalId) {
      if (!state.futureGoals) return;
      state.futureGoals = state.futureGoals.filter(g => g.id !== goalId);
      saveState();
      AudioEngine.playClick();
      this.showToast('Future Goal removed from Vault.', 'info');
      this.renderFutureGoals();
    },

    // ------------------------------------------
    // Future Goals View Renderer
    // ------------------------------------------
    renderFutureGoals() {
      const container = document.getElementById('futureGoalsContainer');
      const emptyState = document.getElementById('futureGoalsEmpty');
      const vaultCountElem = document.getElementById('todayVaultCount');
      const vaultBanner = document.getElementById('todayGoalVaultBanner');

      if (!state.futureGoals) state.futureGoals = [];

      // Update Goal Vault banner on Today page
      if (vaultCountElem) vaultCountElem.textContent = state.futureGoals.length;
      if (vaultBanner) {
        if (state.futureGoals.length > 0) {
          vaultBanner.classList.remove('hidden');
        } else {
          vaultBanner.classList.add('hidden');
        }
      }

      if (!container) return;

      let list = state.futureGoals;

      // Category filter
      if (this.futureFilter && this.futureFilter !== 'all') {
        list = list.filter(g => g.category.toLowerCase() === this.futureFilter.toLowerCase());
      }

      // Search filter
      if (this.futureSearchQuery) {
        list = list.filter(g =>
          g.title.toLowerCase().includes(this.futureSearchQuery) ||
          g.category.toLowerCase().includes(this.futureSearchQuery)
        );
      }

      if (list.length === 0) {
        container.innerHTML = '';
        if (emptyState) emptyState.classList.remove('hidden');
        return;
      }

      if (emptyState) emptyState.classList.add('hidden');

      const priorityColors = {
        'Low': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
        'Medium': 'text-sky-400 bg-sky-500/10 border-sky-500/20',
        'High': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
        'Legendary': 'text-purple-400 bg-purple-500/10 border-purple-500/20 font-semibold'
      };

      container.innerHTML = list.map(goal => {
        const subtaskCount = (goal.subtasks || []).length;
        const pColor = priorityColors[goal.priority] || priorityColors['Medium'];
        const xpAmount = (goal.duration || 25) * 2;

        return `
          <div class="bg-surface-container border border-surface-variant hover:border-primary/50 rounded-xl p-lg flex flex-col gap-md relative group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 ai-card">
            <!-- Card Header -->
            <div class="flex justify-between items-start gap-sm">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">Future Goal</span>
                  <span class="text-xs px-2 py-0.5 rounded-md border ${pColor}">${goal.priority || 'Normal'}</span>
                </div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold line-clamp-2">${escapeHtml(goal.title)}</h3>
                <div class="flex flex-wrap items-center gap-2 text-on-surface-variant font-label-md text-label-md mt-2">
                  <span class="flex items-center gap-0.5 text-xs bg-surface-container-high px-2 py-0.5 rounded-md border border-surface-variant/50">
                    <span class="material-symbols-outlined text-[14px]">schedule</span>
                    Target: ${goal.duration || 25} min
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-surface-variant/50">
                    ${goal.category}
                  </span>
                  <span class="text-xs px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 font-medium">
                    +${xpAmount} XP
                  </span>
                </div>
              </div>

              <!-- Menu Actions -->
              <div class="relative">
                <button onclick="App.toggleQuestMenu('fg-${goal.id}')" class="p-1 rounded-lg hover:bg-surface-container-high text-on-surface-variant hover:text-on-surface transition-colors">
                  <span class="material-symbols-outlined text-[20px]">more_vert</span>
                </button>
                <div id="questMenu-fg-${goal.id}" class="hidden absolute right-0 top-8 z-30 w-36 bg-[#252525] border border-[#383939] rounded-lg shadow-xl py-1 text-sm">
                  <button onclick="App.openCreateModal('${goal.id}', true)" class="w-full text-left px-3 py-1.5 hover:bg-surface-container-high text-on-surface flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">edit</span> Edit Goal
                  </button>
                  <button onclick="App.deleteFutureGoal('${goal.id}')" class="w-full text-left px-3 py-1.5 hover:bg-error/20 text-error flex items-center gap-2">
                    <span class="material-symbols-outlined text-[16px]">delete</span> Delete
                  </button>
                </div>
              </div>
            </div>

            <!-- Subtasks Preview if any -->
            ${subtaskCount > 0 ? `
              <div class="bg-surface-container-lowest/60 rounded-lg p-2 border border-surface-variant/40 text-xs text-on-surface-variant flex items-center justify-between">
                <span>📋 ${subtaskCount} Subtasks planned</span>
                <span class="text-primary font-medium">Ready</span>
              </div>
            ` : ''}

            <!-- Card Footer CTA -->
            <div class="mt-auto pt-md flex justify-between items-center border-t border-surface-variant/40">
              <span class="text-xs text-on-surface-variant/70">
                Added ${formatTimeAgo(goal.createdAt)}
              </span>
              <button onclick="App.moveToToday('${goal.id}')" class="bg-gradient-to-r from-primary-container to-indigo-600 hover:from-primary-fixed hover:to-indigo-500 text-white px-md py-sm rounded-lg font-label-md text-label-md transition-all flex items-center gap-xs shadow-md hover:scale-105 font-semibold">
                <span class="material-symbols-outlined text-[18px]">rocket_launch</span>
                Move to Today
              </button>
            </div>
          </div>
        `;
      }).join('');
    },

    closeModals() {
      document.querySelectorAll('.fixed.z-50').forEach(m => m.classList.add('hidden'));
    },

    editQuest(questId) {
      this.toggleQuestMenu(questId, false);
      this.openCreateModal(questId);
    },

    deleteQuest(questId) {
      this.toggleQuestMenu(questId, false);
      state.quests = state.quests.filter(q => q.id !== questId);
      saveState();
      AudioEngine.playClick();
      this.renderActiveQuests();
      this.renderCompletedQuests();
      this.showToast('Quest removed from log.', 'info');
    },

    toggleQuestMenu(questId, forceOpen = null) {
      const menu = document.getElementById(`questMenu-${questId}`);
      if (!menu) return;
      if (forceOpen === false) {
        menu.classList.add('hidden');
      } else if (forceOpen === true) {
        menu.classList.remove('hidden');
      } else {
        const isHidden = menu.classList.contains('hidden');
        document.querySelectorAll('[id^="questMenu-"]').forEach(m => m.classList.add('hidden'));
        if (isHidden) menu.classList.remove('hidden');
      }
    },

    toggleSubtask(questId, subtaskId) {
      const quest = state.quests.find(q => q.id === questId);
      if (!quest || !quest.subtasks) return;
      const st = quest.subtasks.find(s => s.id === subtaskId);
      if (st) {
        st.done = !st.done;
        AudioEngine.playCheck();
        saveState();
        this.renderActiveQuests();
        if (TimerEngine.activeQuest && TimerEngine.activeQuest.id === questId) {
          TimerEngine.renderFocusSubtasks();
        }
      }
    },

    startQuestFocus(questId) {
      const quest = state.quests.find(q => q.id === questId);
      if (!quest) return;

      this.switchView('focus');
      TimerEngine.start(quest);
    },

    completeQuest(questId, fromTimer = false) {
      const quest = state.quests.find(q => q.id === questId);
      if (!quest) return;

      quest.completed = true;
      const xpGained = (quest.duration || 25) * 2;
      const focusMinutes = quest.duration || 25;
      const now = Date.now();

      // Add to history
      state.history.unshift({
        id: 'h-' + now,
        title: quest.title,
        category: quest.category,
        duration: quest.duration,
        xpEarned: xpGained,
        completedAt: now
      });

      // Update User XP & Stats
      this.awardXP(xpGained);
      state.user.totalFocusMinutes = (state.user.totalFocusMinutes || 0) + focusMinutes;
      state.user.questsCompletedCount = (state.user.questsCompletedCount || 0) + 1;

      // Track daily completions and daily focus minutes in IST
      const todayIST = getISTDateString();
      if (!state.dailyCompletions) state.dailyCompletions = {};
      state.dailyCompletions[todayIST] = (state.dailyCompletions[todayIST] || 0) + 1;

      if (!state.dailyFocusMinutes) state.dailyFocusMinutes = {};
      state.dailyFocusMinutes[todayIST] = (state.dailyFocusMinutes[todayIST] || 0) + focusMinutes;

      // Check & update streak (IST-based, 3+ quests required per day)
      this.updateStreak();

      // Check achievements
      this.checkAchievements();

      saveState();

      if (!fromTimer) {
        AudioEngine.playCheck();
        Confetti.burst(60);
      }

      // Show streak progress toast when approaching 3
      const todayCount = state.dailyCompletions[todayIST] || 0;
      if (todayCount < STREAK_MIN_QUESTS) {
        this.showToast(`🎯 Quest completed! +${xpGained} XP  •  ${STREAK_MIN_QUESTS - todayCount} more for today's streak`, 'success');
      } else if (todayCount === STREAK_MIN_QUESTS) {
        this.showToast(`🔥 Streak earned! You completed ${STREAK_MIN_QUESTS} quests today! +${xpGained} XP`, 'success');
      } else {
        this.showToast(`🎯 Quest completed! +${xpGained} XP`, 'success');
      }
      this.renderAll();
    },

    uncompleteQuest(questId) {
      const quest = state.quests.find(q => q.id === questId);
      if (quest) {
        quest.completed = false;
        saveState();
        AudioEngine.playClick();
        this.showToast('Quest moved back to Active.', 'info');
        this.renderAll();
      }
    },

    // ------------------------------------------
    // Gamification: XP, Levels, Badges, Streaks
    // ------------------------------------------
    awardXP(amount) {
      const MAX_LEVEL = 100;
      state.user.xp = (state.user.xp || 0) + amount;
      const currentLevel = state.user.level || 1;

      if (currentLevel < MAX_LEVEL) {
        // Cumulative XP to complete current level = sum(1..level)*100 = level*(level+1)/2*100
        const xpToNextLevel = (currentLevel * (currentLevel + 1) / 2) * 100;
        if (state.user.xp >= xpToNextLevel) {
          state.user.level = Math.min(state.user.level + 1, MAX_LEVEL);
          AudioEngine.playLevelUp();
          Confetti.burst(120);
          if (state.user.level >= MAX_LEVEL) {
            this.showToast('⚡ QUEST GOD! You reached the maximum Level 100!', 'success');
          } else {
            this.showToast(`🌟 LEVEL UP! You reached Level ${state.user.level}!`, 'success');
          }
        }
      }

      this.renderUserProfile();
    },

    // ------------------------------------------
    // STREAK SYSTEM (IST-based, 3+ quests/day)
    // ------------------------------------------
    updateStreak() {
      const todayIST = getISTDateString();
      const yesterdayIST = getISTYesterday();
      if (!state.dailyCompletions) state.dailyCompletions = {};
      const todayCount = state.dailyCompletions[todayIST] || 0;

      // Only award streak if today's completions reach the threshold
      if (todayCount >= STREAK_MIN_QUESTS) {
        // Already awarded streak today?
        if (state.user.lastStreakDate === todayIST) {
          return; // streak already counted for today
        }

        const yesterdayCount = state.dailyCompletions[yesterdayIST] || 0;
        const lastStreakDate = state.user.lastStreakDate;

        if (lastStreakDate === yesterdayIST && yesterdayCount >= STREAK_MIN_QUESTS) {
          // Yesterday also qualified — continue streak
          state.user.streak = (state.user.streak || 0) + 1;
        } else if (lastStreakDate === todayIST) {
          // Already counted today, no-op
          return;
        } else {
          // Streak broken or first day — start fresh at 1
          state.user.streak = 1;
        }

        state.user.lastStreakDate = todayIST;

        // Track best streak
        if ((state.user.streak || 0) > (state.user.bestStreak || 0)) {
          state.user.bestStreak = state.user.streak;
        }
      }
      // If todayCount < STREAK_MIN_QUESTS, don't touch streak yet
    },

    // Called on app init — checks if streak should be reset
    checkDailyStreak() {
      const todayIST = getISTDateString();
      const yesterdayIST = getISTYesterday();
      if (!state.dailyCompletions) state.dailyCompletions = {};
      if (!state.dailyFocusMinutes) state.dailyFocusMinutes = {};

      const lastStreakDate = state.user.lastStreakDate;

      if (lastStreakDate) {
        if (lastStreakDate !== todayIST && lastStreakDate !== yesterdayIST) {
          // Last streak was awarded 2+ days ago — missed at least 1 full day
          state.user.streak = 0;
        } else if (lastStreakDate === yesterdayIST) {
          // Last streak was yesterday — check if yesterday actually met threshold
          const yesterdayCount = state.dailyCompletions[yesterdayIST] || 0;
          if (yesterdayCount < STREAK_MIN_QUESTS) {
            // Yesterday didn't qualify, but we somehow had a streakDate there (shouldn't happen,
            // but be safe). Streak is already correct from updateStreak, just leave it.
          }
          // If today we haven't done 3 quests yet, streak is still valid from yesterday.
          // It will break tomorrow if we don't do 3 today.
        }
        // If lastStreakDate === todayIST, streak is fine for today.
      }

      // CRITICAL: If there's NO lastStreakDate but streak > 0, reset
      if (!lastStreakDate && (state.user.streak || 0) > 0) {
        state.user.streak = 0;
      }

      // Clean up old dailyCompletions and dailyFocusMinutes (keep only last 45 days)
      [state.dailyCompletions, state.dailyFocusMinutes].forEach(store => {
        if (!store) return;
        const keys = Object.keys(store);
        if (keys.length > 45) {
          keys.sort();
          const cutoff = keys.length - 45;
          for (let i = 0; i < cutoff; i++) {
            delete store[keys[i]];
          }
        }
      });

      saveState();
    },

    // Get today's quest count (IST) for UI display
    getTodayQuestCount() {
      const todayIST = getISTDateString();
      if (!state.dailyCompletions) return 0;
      return state.dailyCompletions[todayIST] || 0;
    },

    checkAchievements() {
      let newlyUnlocked = false;

      // Helper to get IST hour (0 - 23)
      function getISTHour(timestamp) {
        const d = new Date(timestamp);
        const hourStr = d.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false, hour: '2-digit' });
        return parseInt(hourStr, 10);
      }

      state.achievements.forEach(ach => {
        if (ach.unlocked) return;

        const totalQuests = state.user.questsCompletedCount || 0;
        const streak = state.user.streak || 0;
        const focusMins = state.user.totalFocusMinutes || 0;
        const level = state.user.level || 1;
        const history = state.history || [];

        switch (ach.id) {
          // --- Starter ---
          case 'first_quest':
            if (history.length >= 1) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'triple_threat':
            if (this.getTodayQuestCount() >= 3) { ach.unlocked = true; newlyUnlocked = true; }
            break;

          // --- Focus & Timer ---
          case 'pioneer':
            ach.progress = Math.min(totalQuests, ach.maxProgress || 5);
            if (totalQuests >= 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'deep_diver':
            if (history.some(h => (h.duration || 0) >= 45)) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'marathon_runner':
            if (history.some(h => (h.duration || 0) >= 60)) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'focus_100':
            ach.progress = Math.min(focusMins, ach.maxProgress || 100);
            if (focusMins >= 100) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'centurion':
            ach.progress = Math.min(focusMins, ach.maxProgress || 300);
            if (focusMins >= 300) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'focus_1000':
            ach.progress = Math.min(focusMins, ach.maxProgress || 1000);
            if (focusMins >= 1000) { ach.unlocked = true; newlyUnlocked = true; }
            break;

          // --- Streaks ---
          case 'streak_3':
            ach.progress = Math.min(streak, ach.maxProgress || 3);
            if (streak >= 3) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'streak_7':
            ach.progress = Math.min(streak, ach.maxProgress || 7);
            if (streak >= 7) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'streak_14':
            ach.progress = Math.min(streak, ach.maxProgress || 14);
            if (streak >= 14) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'streak_30':
            ach.progress = Math.min(streak, ach.maxProgress || 30);
            if (streak >= 30) { ach.unlocked = true; newlyUnlocked = true; }
            break;

          // --- Category Mastery ---
          case 'scholar': {
            const c = history.filter(h => h.category === 'Study').length;
            ach.progress = Math.min(c, ach.maxProgress || 5);
            if (c >= 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }
          case 'code_ninja': {
            const c = history.filter(h => h.category === 'Coding').length;
            ach.progress = Math.min(c, ach.maxProgress || 5);
            if (c >= 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }
          case 'fit_warrior': {
            const c = history.filter(h => h.category === 'Health').length;
            ach.progress = Math.min(c, ach.maxProgress || 5);
            if (c >= 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }
          case 'creative_spark': {
            const c = history.filter(h => h.category === 'Creative').length;
            ach.progress = Math.min(c, ach.maxProgress || 5);
            if (c >= 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }

          // --- Milestones ---
          case 'quest_10':
            ach.progress = Math.min(totalQuests, ach.maxProgress || 10);
            if (totalQuests >= 10) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'quest_25':
            ach.progress = Math.min(totalQuests, ach.maxProgress || 25);
            if (totalQuests >= 25) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'quest_50':
            ach.progress = Math.min(totalQuests, ach.maxProgress || 50);
            if (totalQuests >= 50) { ach.unlocked = true; newlyUnlocked = true; }
            break;

          // --- Levels ---
          case 'level_3':
            ach.progress = Math.min(level, ach.maxProgress || 3);
            if (level >= 3) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'level_5':
            ach.progress = Math.min(level, ach.maxProgress || 5);
            if (level >= 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'level_10':
            ach.progress = Math.min(level, ach.maxProgress || 10);
            if (level >= 10) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'level_20':
            ach.progress = Math.min(level, ach.maxProgress || 20);
            if (level >= 20) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'level_30':
            ach.progress = Math.min(level, ach.maxProgress || 30);
            if (level >= 30) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'level_50':
            ach.progress = Math.min(level, ach.maxProgress || 50);
            if (level >= 50) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          case 'level_100':
            ach.progress = Math.min(level, ach.maxProgress || 100);
            if (level >= 100) { ach.unlocked = true; newlyUnlocked = true; }
            break;

          // --- Special / Time-based ---
          case 'night_owl': {
            const lastH = history.length > 0 ? getISTHour(history[0].completedAt) : -1;
            if (lastH >= 0 && lastH < 5) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }
          case 'early_bird': {
            const lastH = history.length > 0 ? getISTHour(history[0].completedAt) : -1;
            if (lastH >= 5 && lastH < 7) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }
          case 'all_rounder': {
            const cats = new Set(history.map(h => h.category));
            const allCats = ['Study', 'Work', 'Health', 'Coding', 'Creative', 'Personal'];
            if (allCats.every(c => cats.has(c))) { ach.unlocked = true; newlyUnlocked = true; }
            break;
          }
        }
      });

      if (newlyUnlocked) {
        AudioEngine.playLevelUp();
        this.showToast('🏆 New Achievement Unlocked!', 'success');
      }
    },

    updateAmbientUI() {
      const waves = document.getElementById('ambientSoundWave');
      if (waves) {
        if (AudioEngine.currentAmbient !== 'none') {
          waves.classList.remove('hidden');
        } else {
          waves.classList.add('hidden');
        }
      }
    },

    // ------------------------------------------
    // Data Backup / Restore
    // ------------------------------------------
    exportData() {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `quest_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      this.showToast('Quest data exported to JSON!', 'success');
    },

    importData(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const imported = JSON.parse(e.target.result);
          if (imported.quests && imported.user) {
            state = Object.assign({}, DEFAULT_STATE, imported);
            saveState();
            this.renderAll();
            this.showToast('Quest data restored successfully!', 'success');
          } else {
            this.showToast('Invalid backup file format.', 'error');
          }
        } catch (err) {
          this.showToast('Failed to parse backup JSON.', 'error');
        }
      };
      reader.readAsText(file);
    },

    resetToDefaultData() {
      if (confirm('Are you sure you want to reset all Quest data to sample defaults? This cannot be undone.')) {
        state = JSON.parse(JSON.stringify(DEFAULT_STATE));
        saveState();
        this.renderAll();
        this.showToast('Reset to default sample quests.', 'info');
      }
    },

    // ------------------------------------------
    // Toast Notification System
    // ------------------------------------------
    showToast(message, type = 'info') {
      const container = document.getElementById('toastContainer');
      if (!container) return;

      const toast = document.createElement('div');
      const icons = {
        success: 'check_circle',
        error: 'error',
        info: 'notifications'
      };
      const colors = {
        success: 'border-emerald-500/40 text-emerald-400 bg-surface-container-highest',
        error: 'border-error/40 text-error bg-surface-container-highest',
        info: 'border-primary/40 text-primary bg-surface-container-highest'
      };

      toast.className = `flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-2xl border ${colors[type] || colors.info} glass-modal text-sm font-medium toast-enter max-w-sm pointer-events-auto`;
      toast.innerHTML = `
        <span class="material-symbols-outlined text-[20px]">${icons[type] || 'info'}</span>
        <span class="text-on-surface flex-1">${escapeHtml(message)}</span>
      `;

      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.remove('toast-enter');
        toast.classList.add('toast-exit');
        setTimeout(() => toast.remove(), 250);
      }, 3500);
    }
  };

  // ==========================================
  // 6. HELPER UTILITIES
  // ==========================================
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function formatTimeAgo(timestamp) {
    if (!timestamp) return 'recently';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  function formatDate(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  // Expose App to global window for inline click handlers
  window.App = App;
  window.TimerEngine = TimerEngine;

  // Initialize on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }
})();
