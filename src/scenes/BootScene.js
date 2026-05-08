import { Scene } from 'phaser';

export class BootScene extends Scene {
  constructor() { super('BootScene'); }

  preload() {
    console.log('Carregando assets...');
  }

  create() {
    this.scene.start('MenuScene');
  }
}