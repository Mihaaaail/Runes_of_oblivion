import { Container, Graphics, Text } from 'pixi.js';
import gsap from 'gsap';
import { IsoMath } from '../utils/IsoMath.js';
import { UNIT_TYPES, TEAMS } from '../data/constants.js';

export class UnitRenderer {
  constructor(app) {
    this.app = app;
    this.container = new Container();
    this.container.sortableChildren = true;
    this.app.stage.addChild(this.container);
    this.unitSprites = new Map();
  }

  createUnitVisual(unitModel) {
    if (this.unitSprites.has(unitModel.id)) return;

    const wrapper = new Container();
    const isoPos = IsoMath.gridToIso(unitModel.x, unitModel.y);
    wrapper.x = isoPos.x;
    wrapper.y = isoPos.y;
    wrapper.zIndex = IsoMath.getDepth(unitModel.x, unitModel.y);

    // Тень с градиентом
    const shadow = new Graphics();
    shadow.ellipse(3, 10, 24, 14).fill({ color: 0x000000, alpha: 0.45 });
    wrapper.addChild(shadow);

    const body = new Graphics();

    switch (unitModel.type) {
      case UNIT_TYPES.PLAYER:
        this.drawDarkKnight(body);
        break;
      case UNIT_TYPES.ENEMY_MELEE:
        this.drawUndeadWarrior(body);
        break;
      case UNIT_TYPES.ENEMY_RANGED:
        this.drawCloakedArcher(body);
        break;
      case UNIT_TYPES.SUMMON_TURRET:
        this.drawArcaneTurret(body);
        break;
      case UNIT_TYPES.OBSTACLE:
        this.drawAncientRock(body);
        break;
      default:
        this.drawDefaultUnit(body);
    }

    wrapper.addChild(body);
    if (unitModel.type === UNIT_TYPES.OBSTACLE && body.decals) {
    wrapper.addChild(body.decals);
    }

    if (unitModel.type !== UNIT_TYPES.OBSTACLE) {
      this.drawHpBar(wrapper, unitModel);
    }

    this.container.addChild(wrapper);
    this.unitSprites.set(unitModel.id, { container: wrapper, body });
  }

  drawDarkKnight(body) {
    // Тёмный рыцарь в чёрной броне
    const plateColor = 0x2a2a2a; // чёрная сталь
    const trimColor = 0x4a4a4a;
    
    // Ноги (сапоги)
    body.rect(-11, -18, 22, 18).fill({ color: 0x1a1a1a });
    
    // Поножи
    body.rect(-13, -30, 26, 12).fill({ color: plateColor });
    
    // Туловище
    body.rect(-17, -50, 34, 20).fill({ color: plateColor });
    
    // Наплечники
    body.rect(-22, -55, 14, 14).fill({ color: trimColor });
    body.rect(8, -55, 14, 14).fill({ color: trimColor });
    
    // Шлем с прорезью
    body.rect(-12, -68, 24, 16).fill({ color: plateColor });
    body.rect(-8, -64, 16, 8).fill({ color: 0x111111 }); // визор
    
    // Плащ снизу
    body.beginFill(0x1f1f1f);
    body.moveTo(-18, -32);
    body.lineTo(18, -32);
    body.lineTo(12, -8);
    body.lineTo(-12, -8);
    body.endFill();
    
    // Рукоять меча
    body.rect(14, -48, 3, 12).fill(0x331100);
  }

  drawUndeadWarrior(body) {
    // Оживший воин-скелет
    const boneColor = 0xe8d5b7;
    const rustColor = 0x4a2f1f;
    
    // Череп с трещинами
    body.circle(0, -62, 10).fill({ color: boneColor });
    body.lineStyle({ width: 1.5, color: 0x8b7355, alpha: 0.7 });
    body.moveTo(-6, -66).lineTo(6, -58);
    body.moveTo(4, -64).lineTo(-4, -60);
    
    // Глазницы
    body.circle(-3, -64, 2).fill(0x660000);
    body.circle(3, -64, 2).fill(0x660000);
    
    // Торс из рёбер
    body.rect(-14, -52, 28, 20).fill({ color: boneColor, alpha: 0.6 });
    for (let i = 0; i < 4; i++) {
      const y = -50 + i * 5;
      body.rect(-12, y, 24, 2).fill({ color: boneColor });
    }
    
    // Руки с ржавым оружием
    body.rect(-18, -42, 10, 18).fill({ color: boneColor, alpha: 0.7 });
    body.rect(8, -42, 10, 18).fill({ color: boneColor, alpha: 0.7 });
    body.rect(16, -48, 2, 14).fill(rustColor); // топор
    
    // Ноги
    body.rect(-9, -24, 8, 20).fill({ color: boneColor, alpha: 0.5 });
    body.rect(1, -24, 8, 20).fill({ color: boneColor, alpha: 0.5 });
  }

  drawCloakedArcher(body) {
    // Лучник в плаще
    const cloakColor = 0x2a1810;
    
    // Капюшон
    body.circle(0, -64, 13).fill({ color: cloakColor });
    
    // Лицо (бледное)
    body.circle(0, -66, 7).fill(0xb89a76);
    
    // Капюшон тень
    body.circle(0, -64, 11).fill({ color: 0x1a0f08, alpha: 0.8 });
    
    // Туловище
    body.rect(-15, -52, 30, 24).fill({ color: cloakColor });
    
    // Пояс
    body.rect(-12, -42, 24, 4).fill(0x4a2f1f);
    
    // Лук
    body.rect(-24, -56, 4, 32).fill(0x5c4033);
    body.rect(-22, -48, 20, 2).fill(0x8b7355); // тетива
    
    // Стрела
    body.rect(-8, -64, 12, 2).fill(0x8b7355);
    
    // Ноги
    body.rect(-10, -28, 20, 24).fill({ color: cloakColor, alpha: 0.9 });
  }

  drawArcaneTurret(body) {
    // Магическая турель
    const stoneColor = 0x3e3a38;
    
    // Основание
    body.rect(-20, -38, 40, 38).fill({ color: stoneColor });
    
    // Башня
    body.rect(-14, -58, 28, 20).fill({ color: 0x2e2b28 });
    
    // Кристалл наверху
    body.circle(0, -68, 8).fill({ color: 0x4169e1, alpha: 0.9 });
    body.circle(0, -68, 6).fill({ color: 0x87ceeb });
    
    // Металлические крепления
    body.rect(-16, -62, 32, 6).fill(0x4a4a4a);
    
    // Руны на основании
    body.rect(-18, -20, 36, 2).fill(0x4169e1);
    body.rect(-16, -16, 32, 2).fill(0x4169e1);
  }

  drawAncientRock(body) {
    // Скалистый валун с рунами
    const rockColor = 0x3a3a3a; // тёмно-серый камень
    const mossColor = 0x2a4a32;
    
    // Основная форма валуна (неровная)
    body.beginFill(rockColor);
    body.moveTo(-22, -32);
    body.lineTo(22, -28);
    body.quadraticCurveTo(26, -12, 20, 14);
    body.quadraticCurveTo(12, 30, -18, 28);
    body.quadraticCurveTo(-26, 16, -22, -32);
    body.endFill();
    
    // Светлые прожилки/минералы
    body.rect(-14, -20, 8, 16).fill({ color: 0x5a5a5a, alpha: 0.8 });
    body.rect(4, -16, 6, 12).fill({ color: 0x5a5a5a, alpha: 0.8 });
    
    // Мох по нижнему краю
    body.rect(-16, 12, 24, 12).fill({ color: mossColor, alpha: 0.6 });
    body.rect(-8, 18, 12, 8).fill({ color: mossColor, alpha: 0.8 });
    
    // Трещины
    body.lineStyle({ width: 2, color: 0x1f1f1f, alpha: 0.9 });
    body.moveTo(-16, -26).lineTo(12, 20);
    body.moveTo(2, -30).lineTo(18, 8);
    body.lineStyle({ width: 1, color: 0x2a2a2a, alpha: 0.7 });
    body.moveTo(-10, -18).lineTo(8, 24);
    
    // Руны на камне (древние символы)
    const runes = ['ᚦ', 'ᚱ', 'ᚢ', 'ᚨ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ'];
    const rune1 = runes[Math.floor(Math.random() * runes.length)];
    const rune2 = runes[Math.floor(Math.random() * runes.length)];
    
    // Первая руна (свечение)
    const runeText1 = new Text(rune1, {
        fontFamily: 'serif',
        fontSize: 16,
        fill: 0x8b7355, // бронзовый
        stroke: { color: 0x3a2f1f, width: 1.5 },
        strokeThickness: 1.5,
        dropShadow: true,
        dropShadowColor: 0xaa5500,
        dropShadowBlur: 4,
        dropShadowAngle: Math.PI / 4,
        dropShadowDistance: 2,
    });
    runeText1.anchor.set(0.5);
    runeText1.x = -8;
    runeText1.y = -8;
    runeText1.alpha = 0.9;
    
    // Вторая руна
    const runeText2 = new Text(rune2, {
        fontFamily: 'serif',
        fontSize: 14,
        fill: 0x6b5d4a,
        stroke: { color: 0x2a221c, width: 1 },
        strokeThickness: 1,
    });
    runeText2.anchor.set(0.5);
    runeText2.x = 10;
    runeText2.y = 4;
    
    // Добавляем руны к body (Graphics не может содержать Text напрямую, 
    // но мы можем создать отдельный контейнер для декалей)
    const decals = new Container();
    decals.addChild(runeText1);
    decals.addChild(runeText2);
    decals.x = 0;
    decals.y = 0;
    
    // Прикрепляем к wrapper'у снаружи body
    // Это делается в createUnitVisual после body.addChild
    
    body.decals = decals; // метка для последующего доступа
  }

  drawDefaultUnit(body) {
    body.roundRect(-16, -54, 32, 54, 8).fill(0x5a5a5a);
  }

  drawHpBar(wrapper, unitModel) {
    const oldBar = wrapper.getChildByName('hpBar');
    if (oldBar) oldBar.destroy();

    const bar = new Graphics();
    bar.name = 'hpBar';
    bar.y = -82;

    const width = 48;
    const pct = unitModel.maxHp > 0 ? Math.max(0, unitModel.hp / unitModel.maxHp) : 0;

    // Деревянная рамка
    bar.rect(-width/2 - 2, -2, width + 4, 9).fill(0x3a2f25);
    
    // Фон
    bar.rect(-width/2, 0, width, 6).fill(0x1a150f);
    // HP (тёмно-зелёный)
    bar.rect(-width/2, 0, width * pct, 6).fill(0x5a7d3e);

    if (unitModel.shield > 0) {
      bar.rect(-width/2, -1, width * (unitModel.shield / 10), 2).fill(0x3a5f8c);
    }

    wrapper.addChild(bar);
  }

  // Анимации без изменений (moveUnit, damageUnit, healUnit, removeUnit)
  moveUnit(unit, x, y) {
    const spriteData = this.unitSprites.get(unit.id);
    if (!spriteData) return;
    const targetIso = IsoMath.gridToIso(x, y);
    const newZ = IsoMath.getDepth(x, y);
    gsap.to(spriteData.container, {
      x: targetIso.x,
      y: targetIso.y,
      zIndex: newZ,
      duration: 0.4,
      ease: 'power2.out',
    });
    gsap.to(spriteData.body, { y: -8, duration: 0.2, yoyo: true, repeat: 1 });
  }

  damageUnit(unit) {
    const spriteData = this.unitSprites.get(unit.id);
    if (!spriteData) return;
    if (unit.type === UNIT_TYPES.OBSTACLE) return;

    this.drawHpBar(spriteData.container, unit);

    gsap.to(spriteData.body, {
        alpha: 0.4,
        duration: 0.08,
        yoyo: true,
        repeat: 4,
        onComplete: () => {
        spriteData.body.alpha = 1;
        },
    });

    gsap.to(spriteData.container, {
        x: '+=5',
        duration: 0.06,
        yoyo: true,
        repeat: 4,
    });
    }


  healUnit(unit) {
    const spriteData = this.unitSprites.get(unit.id);
    if (!spriteData) return;
    if (unit.type === UNIT_TYPES.OBSTACLE) return;

    this.drawHpBar(spriteData.container, unit);

    gsap.to(spriteData.body, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        onComplete: () => {
        spriteData.body.scale.set(1);
        spriteData.body.alpha = 1;
        },
    });
    }

  removeUnit(unit) {
    const spriteData = this.unitSprites.get(unit.id);
    if (!spriteData) return;
    gsap.to(spriteData.container, {
      alpha: 0,
      y: '+=20',
      scale: 0.8,
      duration: 0.5,
      onComplete: () => {
        spriteData.container.destroy();
        this.unitSprites.delete(unit.id);
      },
    });
  }

  clearAll() {
    // Убиваем все визуалы юнитов, иначе новый энкаунтер будет “наследовать” старые спрайты
    for (const entry of this.unitSprites.values()) {
      entry?.container?.destroy({ children: true });
    }
    this.unitSprites.clear();

    // На всякий случай подчистить контейнер (если что-то не попало в unitSprites)
    this.container.removeChildren();
  }
}
