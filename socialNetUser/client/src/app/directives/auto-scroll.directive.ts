import { Directive, ElementRef, Input, OnChanges, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appAutoScroll]',
  standalone: true
})
export class AutoScrollDirective implements OnChanges {
  @Input('appAutoScroll') trigger: unknown;
  @Input() stickToBottom = true;

  constructor(private readonly el: ElementRef<HTMLElement>) {}

  ngOnChanges(_changes: SimpleChanges): void {
    if (!this.stickToBottom) {
      return;
    }
    queueMicrotask(() => {
      const nativeEl = this.el.nativeElement;
      nativeEl.scrollTop = nativeEl.scrollHeight;
    });
  }
}
