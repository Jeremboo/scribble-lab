/**
 * Logical card entity. No rendering or DOM knowledge.
 * @typedef {{ id: string, value: number, type: string, [key: string]: any }} CardData
 */
export default class Card {
  /**
   * @param {CardData} data
   */
  constructor(data) {
    this.id = data.id;
    this.value = data.value;
    this.type = data.type;
    this.data = data;

    /** @type {'idle' | 'hover' | 'dragging' | 'returning'} */
    this.interaction = 'idle';

    // Target layout pose (hand slot)
    this.target = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      zIndex: 0,
      opacity: 1,
    };

    // Current interpolated pose (what renderers read)
    this.visual = {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      zIndex: 0,
      opacity: 1,
    };

    // Drag offset in logical space (pointer → card center)
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
  }

  getCardState() {
    return {
      id: this.id,
      data: this.data,
      state: this.interaction,
      position: { x: this.visual.x, y: this.visual.y },
      rotation: this.visual.rotation,
      scale: this.visual.scale,
      zIndex: this.visual.zIndex,
      opacity: this.visual.opacity,
    };
  }

  snapVisualToTarget() {
    Object.assign(this.visual, this.target);
  }
}
