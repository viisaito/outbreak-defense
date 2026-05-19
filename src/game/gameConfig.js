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

export const TUTORIAL_PASSOS = [
  {
    titulo: 'BEM-VINDO AO BAR',
    texto:  'Esta é a sua base. O lado direito (verde)\né o ponto que você deve defender.\nSe os infectados chegarem lá, você perde HP.'
  },
  {
    titulo: 'POSICIONAMENTO',
    texto:  'Clique num aliado na barra inferior para selecioná-lo.\nDepois clique num slot colorido no mapa para posicioná-lo.\nReposicionar custa SP.'
  },
  {
    titulo: 'LOJA E SP',
    texto:  'SP são Suprimentos — sua moeda do jogo.\nAbra a LOJA para comprar upgrades antes de cada onda.\nVocê ganha SP ao eliminar inimigos.'
  },
  {
    titulo: 'BOA SORTE!',
    texto:  'Você tem 15 segundos para se preparar antes da 1ª onda.\nInimigos virão da esquerda em direção à base.\nMonte seu esquadrão e bora defender São Paulo!'
  }
];
