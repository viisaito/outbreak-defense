// ── Configurações compartilhadas do GameScene ───────────────────

export const PERSONAGENS_CONFIG = {
  vini:   { nome: 'Vini',   cor: 0x3399ff, custo: 20, dano: 26, hp: 110 },
  helena: { nome: 'Helena', cor: 0xff66aa, custo: 20, dano: 15, hp: 80  },
  daniel: { nome: 'Daniel', cor: 0xffaa33, custo: 20, dano: 20, hp: 95  }
};

export const CORES_ROUPAS = [0x27ae60, 0x2980b9, 0xc0392b, 0xe67e22, 0x8e44ad];

export const LOJA_ITENS = [
  {
    id: 'danoGlobal', label: '+5 Dano Global',
    descricao: 'Todas as torres causam +5 de dano.',
    custos: [20], maxNivel: 1
  },
  {
    id: 'cooldownMult', label: 'Cadência +25%',
    descricao: 'Todas as torres atiram 25% mais rápido.',
    custos: [35], maxNivel: 1
  },
  {
    id: 'baseReforco', label: 'Reforço da Base',
    descricao: '+20 HP máximo na base.',
    custos: [25], maxNivel: 1
  },
  {
    id: 'viniDano', label: 'Vini — Precisão',
    descricao: 'Nível 1: +10% dano\nNível 2: +20% dano\nNível 3: +30% dano',
    custos: [30, 50, 80], maxNivel: 3
  },
  {
    id: 'helenaCura', label: 'Helena — Alcance',
    descricao: 'Nível 1: raio de cura 400→500px\nNível 2: raio 500→600px',
    custos: [30, 50], maxNivel: 2
  },
  {
    id: 'danielKnockback', label: 'Daniel — Chave de Rosca',
    descricao: '10% de chance de knockback por ataque.\nNível 2: 20% | Nível 3: 30%',
    custos: [25, 40, 65], maxNivel: 3
  },
  {
    id: 'avatarHP', label: 'Colete Balístico',
    descricao: '+60 HP máximo no seu avatar.',
    custos: [40], maxNivel: 1
  }
];

// spot: área a destacar (x, y, w, h) | cx/cy: centro do callout de texto
export const TUTORIAL_PASSOS = [
  {
    titulo: 'SUA BASE',
    texto:  'Esta parede verde é sua base.\nSe os infectados chegarem aqui,\nvocê perde vida.\nHP = 0 → fim de jogo!',
    spot:   { x: 718, y: 0,   w: 82,  h: 450 },
    cx: 310, cy: 225
  },
  {
    titulo: 'SLOTS DE DEFESA',
    texto:  'Posicione aliados nestes slots.\nCada slot ataca inimigos dentro\ndo seu raio (círculo azul).\nArraste um aliado até um slot.',
    spot:   { x: 158, y: 108, w: 400, h: 234 },
    cx: 648, cy: 225
  },
  {
    titulo: 'SEUS ALIADOS',
    texto:  'Seus aliados ficam aqui embaixo.\nArraste um deles até um slot livre\npara posicioná-lo na defesa.\nCada personagem tem uma passiva única.',
    spot:   { x: 80,  y: 382, w: 640, h: 50  },
    cx: 400, cy: 284
  },
  {
    titulo: 'SP E LOJA',
    texto:  'SP = Suprimentos, sua moeda.\nVocê ganha SP eliminando infectados.\nAbra a LOJA antes de cada onda\npara comprar upgrades ao esquadrão.',
    spot:   { x: 0,   y: 5,   w: 730, h: 96  },
    cx: 400, cy: 218
  }
];
