export class ForegroundColorChangeEvent extends CustomEvent {
  static type = 'canva-foreground-color-change-event';
  color;

  constructor(color) {
    super(ForegroundColorChangeEvent.type, {
      bubbles: true,
    });

    this.color = color;
  }
}
