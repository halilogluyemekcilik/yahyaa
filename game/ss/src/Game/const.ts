export const enum playerStatus {
  INIT = 'idle', // ayakta bekleme
  JUMP = 'jump', // zıplama
  RUN = 'run', // koşma
  ROLL = 'roll', // yuvarlanma
  DANCE = 'dance', // dans
  LOOKBACK = 'lookback', // arkaya bakma
  RUNLOOKBACK = 'runlookback', // koşarken arkaya bakma
  FALL = 'fall', // düşme
  DIE = 'die', // ölme
}
export const Obstacal: any = {
  train: {
    x: 5.646066284179687,
    y: 8.351531163230542,
    z: 16.539642333984375,
  },
  kerbStone: {
    x: 3.7279505729675293,
    y: 3.6123956470692073,
    z: 3.989417910575868,
  },
};

export const enum GAME_STATUS {
  READY = 'ready',
  START = 'start',
  PAUSE = 'pause',
  END = 'end',
}
