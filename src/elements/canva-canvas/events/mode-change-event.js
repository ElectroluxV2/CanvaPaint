export class ModeChangeEvent extends CustomEvent {
  static type = 'canva-mode-change-event';
  mode;

  constructor(mode) {
    super(ModeChangeEvent.type, {
      bubbles: true,
    });

    this.mode = mode;
  }
}
