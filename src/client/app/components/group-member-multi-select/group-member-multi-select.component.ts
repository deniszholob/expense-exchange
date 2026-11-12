// #region Imports
import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import type { FormValueControl } from '@angular/forms/signals';
import type { GroupMemberDto } from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region Component
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-group-member-multi-select',
  template: `
    <fieldset
      class="border-finance-border rounded-control flex flex-col gap-2 border p-3"
    >
      <legend class="sr-only">Choose people who share this expense</legend>
      @for (user of $groupMembers(); track user.id) {
        <label class="text-finance-text flex items-center gap-2 text-sm">
          <input
            [checked]="value().includes(user.id)"
            (change)="toggle(user.id, $event)"
            type="checkbox"
          />
          {{ user.name }}
        </label>
      } @empty {
        <span class="text-finance-muted text-sm"
          >Add a group member first.</span
        >
      }
    </fieldset>
  `,
  host: { class: 'block' },
})
export class GroupMemberMultiSelectComponent implements FormValueControl<
  string[]
> {
  public readonly value = model.required<string[]>();
  public readonly $groupMembers = input.required<GroupMemberDto[]>();

  protected toggle(id: string, event: Event): void {
    const checked =
      event.target instanceof HTMLInputElement && event.target.checked;
    const selected = this.value();
    this.value.set(
      checked
        ? [...new Set([...selected, id])]
        : selected.filter((value) => value !== id),
    );
  }
}
// #endregion
