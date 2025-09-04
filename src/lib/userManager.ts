'use client';

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: Date;
}

export interface GameStats {
  gamesPlayed: number;
  totalPlayTime: number; // in seconds
  highScore: number;
  averageScore: number;
  achievements: Achievement[];
  lastPlayed?: Date;
}

export interface UserProfile {
  id: string;
  username: string;
  avatar: string;
  level: number;
  experience: number;
  totalGamesPlayed: number;
  totalPlayTime: number;
  joinDate: Date;
  gameStats: {
    snake: GameStats;
    tetris: GameStats;
    pong: GameStats;
    memory: GameStats;
    platformer: GameStats;
  };
  globalAchievements: Achievement[];
}

export class UserManager {
  private static instance: UserManager;
  private currentUser: UserProfile | null = null;
  private readonly STORAGE_KEY = 'gaming_platform_user';

  private constructor() {
    if (typeof window !== 'undefined') {
      this.loadUser();
    }
  }

  static getInstance(): UserManager {
    if (!UserManager.instance) {
      UserManager.instance = new UserManager();
    }
    return UserManager.instance;
  }

  private getDefaultGameStats(): GameStats {
    return {
      gamesPlayed: 0,
      totalPlayTime: 0,
      highScore: 0,
      averageScore: 0,
      achievements: [],
      lastPlayed: undefined
    };
  }

  private getDefaultAchievements(): Achievement[] {
    return [
      {
        id: 'first_game',
        name: 'First Steps',
        description: 'Play your first game',
        icon: '🎮',
        unlocked: false
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon',
        description: 'Score 1000+ points in Snake',
        icon: '⚡',
        unlocked: false
      },
      {
        id: 'tetris_master',
        name: 'Tetris Master',
        description: 'Clear 10 lines in Tetris',
        icon: '🧱',
        unlocked: false
      },
      {
        id: 'memory_champion',
        name: 'Memory Champion',
        description: 'Complete Memory game in under 30 seconds',
        icon: '🧠',
        unlocked: false
      },
      {
        id: 'platformer_pro',
        name: 'Platformer Pro',
        description: 'Reach level 5 in Platformer',
        icon: '🏃',
        unlocked: false
      },
      {
        id: 'pong_champion',
        name: 'Pong Champion',
        description: 'Score 10 points in Pong',
        icon: '🏓',
        unlocked: false
      },
      {
        id: 'dedicated_player',
        name: 'Dedicated Player',
        description: 'Play for 1 hour total',
        icon: '⏰',
        unlocked: false
      },
      {
        id: 'game_master',
        name: 'Game Master',
        description: 'Play all 5 games',
        icon: '👑',
        unlocked: false
      }
    ];
  }

  createUser(username: string): UserProfile {
    const newUser: UserProfile = {
      id: `user_${Date.now()}`,
      username,
      avatar: '🎮',
      level: 1,
      experience: 0,
      totalGamesPlayed: 0,
      totalPlayTime: 0,
      joinDate: new Date(),
      gameStats: {
        snake: this.getDefaultGameStats(),
        tetris: this.getDefaultGameStats(),
        pong: this.getDefaultGameStats(),
        memory: this.getDefaultGameStats(),
        platformer: this.getDefaultGameStats()
      },
      globalAchievements: this.getDefaultAchievements()
    };

    this.currentUser = newUser;
    this.saveUser();
    return newUser;
  }

  getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  updateGameStats(game: keyof UserProfile['gameStats'], score: number, playTime: number) {
    if (!this.currentUser) return;

    const gameStats = this.currentUser.gameStats[game];
    gameStats.gamesPlayed++;
    gameStats.totalPlayTime += playTime;
    gameStats.lastPlayed = new Date();

    if (score > gameStats.highScore) {
      gameStats.highScore = score;
    }

    gameStats.averageScore = (gameStats.averageScore * (gameStats.gamesPlayed - 1) + score) / gameStats.gamesPlayed;

    this.currentUser.totalGamesPlayed++;
    this.currentUser.totalPlayTime += playTime;
    this.currentUser.experience += Math.floor(score / 10) + Math.floor(playTime / 60);

    // Level up system
    const newLevel = Math.floor(this.currentUser.experience / 100) + 1;
    if (newLevel > this.currentUser.level) {
      this.currentUser.level = newLevel;
    }

    this.checkAchievements(game, score, playTime);
    this.saveUser();
  }

  private checkAchievements(game: keyof UserProfile['gameStats'], score: number, playTime: number) {
    if (!this.currentUser) return;

    // Check for first game achievement
    if (this.currentUser.totalGamesPlayed === 1) {
      this.unlockAchievement('first_game');
    }

    // Game-specific achievements
    switch (game) {
      case 'snake':
        if (score >= 1000) this.unlockAchievement('speed_demon');
        break;
      case 'tetris':
        if (score >= 1000) this.unlockAchievement('tetris_master');
        break;
      case 'pong':
        if (score >= 10) this.unlockAchievement('pong_champion');
        break;
      case 'memory':
        if (playTime <= 30) this.unlockAchievement('memory_champion');
        break;
      case 'platformer':
        if (score >= 5000) this.unlockAchievement('platformer_pro');
        break;
    }

    // Global achievements
    if (this.currentUser.totalPlayTime >= 3600) {
      this.unlockAchievement('dedicated_player');
    }

    // Check if played all games
    const gamesPlayed = Object.values(this.currentUser.gameStats)
      .filter(stats => stats.gamesPlayed > 0).length;
    if (gamesPlayed === 5) {
      this.unlockAchievement('game_master');
    }
  }

  private unlockAchievement(achievementId: string) {
    if (!this.currentUser) return;

    const achievement = this.currentUser.globalAchievements.find(a => a.id === achievementId);
    if (achievement && !achievement.unlocked) {
      achievement.unlocked = true;
      achievement.unlockedAt = new Date();
    }
  }

  getLeaderboard(game?: keyof UserProfile['gameStats']): Array<{username: string; score: number; game?: string}> {
    // In a real app, this would fetch from a database
    // For now, return mock data with current user
    const mockData = [
      { username: 'ProGamer123', score: 1250, game: 'snake' },
      { username: 'TetrisKing', score: 2500, game: 'tetris' },
      { username: 'MemoryMaster', score: 15, game: 'memory' },
      { username: 'PongChamp', score: 15, game: 'pong' },
      { username: 'JumpHero', score: 8500, game: 'platformer' }
    ];

    if (this.currentUser && game) {
      const userScore = this.currentUser.gameStats[game].highScore;
      if (userScore > 0) {
        mockData.push({ username: this.currentUser.username, score: userScore, game });
      }
    }

    return mockData.sort((a, b) => b.score - a.score).slice(0, 10);
  }

  private loadUser() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const userData = JSON.parse(stored);
        // Convert date strings back to Date objects
        userData.joinDate = new Date(userData.joinDate);
        Object.values(userData.gameStats).forEach((stats: any) => {
          if (stats.lastPlayed) {
            stats.lastPlayed = new Date(stats.lastPlayed);
          }
        });
        userData.globalAchievements.forEach((achievement: any) => {
          if (achievement.unlockedAt) {
            achievement.unlockedAt = new Date(achievement.unlockedAt);
          }
        });
        this.currentUser = userData;
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  private saveUser() {
    if (typeof window !== 'undefined' && this.currentUser) {
      try {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.currentUser));
      } catch (error) {
        console.error('Error saving user data:', error);
      }
    }
  }

  logout() {
    this.currentUser = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }
}