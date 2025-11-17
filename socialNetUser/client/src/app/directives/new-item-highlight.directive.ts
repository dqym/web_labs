import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appNewItemHighlight]',
  standalone: true
})
export class NewItemHighlightDirective implements OnChanges {
  @Input('appNewItemHighlight') trigger: string | number | null = null;
  @Input() highlightColor = 'rgba(255, 193, 7, 0.4)';
  #timeout?: ReturnType<typeof setTimeout>;

  constructor(private readonly el: ElementRef<HTMLElement>, private readonly renderer: Renderer2) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['trigger'] && this.trigger !== null && this.trigger !== undefined) {
      this.#applyPulse();
    }
  }

  #applyPulse(): void {
    if (this.#timeout) {
      clearTimeout(this.#timeout);
    }
    this.renderer.setStyle(this.el.nativeElement, 'box-shadow', `0 0 0 999px ${this.highlightColor}`);
    this.renderer.setStyle(this.el.nativeElement, 'position', 'relative');
    this.renderer.setStyle(this.el.nativeElement, 'transition', 'box-shadow 600ms ease-out');
    requestAnimationFrame(() => {
      this.renderer.setStyle(this.el.nativeElement, 'box-shadow', `0 0 0 0 ${this.highlightColor}`);
    });
    this.#timeout = setTimeout(() => {
      this.renderer.removeStyle(this.el.nativeElement, 'box-shadow');
    }, 600);
  }
}
