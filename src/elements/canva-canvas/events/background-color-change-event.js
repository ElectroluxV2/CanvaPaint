export class BackgroundColorChangeEvent extends CustomEvent {
  static type = 'canva-background-color-change-event';
  color;

  constructor(color) {
    super(BackgroundColorChangeEvent.type, {
      bubbles: true,
    });

    this.color = color;
  }
}
