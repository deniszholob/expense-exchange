// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import type { DateRange } from 'src/client/app/shared/date-range/date-range.model';
import { formatDataRangeLabel } from 'src/client/app/shared/date-range/date-range.util';
import { DataRangePanelComponent } from '../data-range-panel/data-range-panel.component';
import { DataRangeTriggerComponent } from '../data-range-trigger/data-range-trigger.component';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-data-range-control',
  templateUrl: './data-range-control.component.html',
  host: {
    class: 'contents',
    '(document:pointerdown)': 'closeWhenClickOutside($event)',
    '(document:keydown.escape)': 'closePanel()',
  },
  imports: [DataRangePanelComponent, DataRangeTriggerComponent],
})
export class DataRangeControlComponent {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  public readonly $dataRange = model.required<DateRange>();
  public readonly $earliestDate = input<string>();
  public readonly $idPrefix = input('data-range');
  protected readonly $panelOpen = signal(false);
  protected readonly $panelId = computed(() => `${this.$idPrefix()}-panel`);
  protected readonly $dataRangeLabel = computed(() =>
    formatDataRangeLabel(this.$dataRange()),
  );

  protected togglePanel(): void {
    this.$panelOpen.update((isOpen) => !isOpen);
  }

  protected closeWhenClickOutside(event: PointerEvent): void {
    const target = event.target;
    if (
      this.$panelOpen() &&
      (!(target instanceof Node) ||
        !this.elementRef.nativeElement.contains(target))
    )
      this.closePanel();
  }

  protected closePanel(): void {
    this.$panelOpen.set(false);
  }
}
// #endregion
