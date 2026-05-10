import { Scene } from 'phaser';

// ── Conteúdo dos slides ────────────────────────────────────────
// Troque bgColor por imagens reais quando tiver os assets prontos.
const SLIDES = [
  {
    bgColor:  0x2d0a0a,
    tag:      'DIA 0',
    titulo:   'O COLAPSO',
    texto:    'O vírus H-9 se espalhou por São Paulo\nem menos de 48 horas.\n\nHospitais, ruas, bairros inteiros —\ntudo tomado pelos infectados.'
  },
  {
    bgColor:  0x0a0a2d,
    tag:      'DIA 30',
    titulo:   'A CIDADE CAÍDA',
    texto:    'São Paulo virou uma cidade fantasma.\nOs infectados dominam cada rua,\ncada beco, cada esquina.\n\nPoucos sobreviveram.'
  },
  {
    bgColor:  0x0a2d12,
    tag:      'AGORA',
    titulo:   'O BAR',
    texto:    'Você encontrou abrigo num bar abandonado\nno centro da cidade.\n\nAlguns sobreviventes se juntaram a você.\nÉ daqui que vocês vão defender São Paulo.'
  }
];

export class StoryScene extends Scene {
  constructor() { super('StoryScene'); }

  create() {
    this.indice = 0;
    this.bloqueado = false; // evita cliques duplos durante transição

    // Camadas criadas uma vez — atualizamos o conteúdo a cada slide
    this.retBg     = this.add.rectangle(400, 225, 800, 450, 0x000000);
    this.retImagem = this.add.rectangle(400, 160, 520, 200, 0x333333);

    // Ícone de placeholder no centro da imagem
    this.iconePlaceholder = this.add.text(400, 160, '[ imagem ]', {
      fontSize: '14px', color: '#555577'
    }).setOrigin(0.5);

    this.textoTag = this.add.text(140, 62, '', {
      fontSize: '11px', color: '#3dff6e', letterSpacing: 4
    }).setOrigin(0.5);

    this.textoTitulo = this.add.text(400, 95, '', {
      fontSize: '28px', color: '#ffffff', fontStyle: 'bold'
    }).setOrigin(0.5);

    this.textoCorpo = this.add.text(400, 285, '', {
      fontSize: '15px', color: '#ccccdd',
      align: 'center', lineSpacing: 8
    }).setOrigin(0.5);

    // Indicador de progresso (bolinhas)
    this.bolinhas = [];
    for (let i = 0; i < SLIDES.length; i++) {
      const b = this.add.circle(385 + i * 20, 425, 4, 0x444466);
      this.bolinhas.push(b);
    }

    // Instrução de clique
    this.textoAvanco = this.add.text(400, 438, 'clique para continuar', {
      fontSize: '12px', color: '#555577'
    }).setOrigin(0.5);

    // Piscar a instrução
    this.tweens.add({
      targets: this.textoAvanco,
      alpha: 0.2,
      duration: 900,
      yoyo: true,
      repeat: -1
    });

    this.mostrarSlide(0);

    // Clique em qualquer lugar avança
    this.input.on('pointerdown', () => this.avancar());
  }

  mostrarSlide(i) {
    const slide = SLIDES[i];

    // Fade rápido de entrada
    this.cameras.main.fadeIn(300, 0, 0, 0);

    this.retBg.setFillStyle(slide.bgColor);
    this.textoTag.setText(slide.tag);
    this.textoTitulo.setText(slide.titulo);
    this.textoCorpo.setText(slide.texto);

    // Atualiza bolinhas de progresso
    this.bolinhas.forEach((b, idx) => {
      b.setFillStyle(idx === i ? 0x3dff6e : 0x444466);
    });

    // Último slide: muda instrução
    if (i === SLIDES.length - 1) {
      this.textoAvanco.setText('clique para criar seu sobrevivente');
    } else {
      this.textoAvanco.setText('clique para continuar');
    }
  }

  avancar() {
    if (this.bloqueado) return;
    this.bloqueado = true;

    this.cameras.main.fadeOut(250, 0, 0, 0);

    this.time.delayedCall(260, () => {
      this.indice++;

      if (this.indice >= SLIDES.length) {
        // Repassa slot e modo de jogo para CharacterScene
        const slot = this.scene.settings.data?.slot || null;
        const modo = this.scene.settings.data?.modo || 'normal';
        this.scene.start('CharacterScene', { slot, modo });
      } else {
        this.mostrarSlide(this.indice);
        this.bloqueado = false;
      }
    });
  }
}
