import { Scene } from 'phaser';
import menuBg from '../assets/MENUBG.png';

export class BootScene extends Scene {
  constructor() { super('BootScene'); }

  preload() {
    console.log('Carregando assets...');
    this.load.image('menuBg', menuBg);
  }

  create() {
    this.scene.start('MenuScene');
  }
}