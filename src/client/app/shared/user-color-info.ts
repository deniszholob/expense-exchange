// #region Imports
import { UserColor } from 'src/client/api/generated/expense-exchange-api.schemas';
import type {
  ExternalParticipantDto,
  GroupMemberDto,
} from 'src/client/api/generated/expense-exchange-api.schemas';
// #endregion

// #region User Color Metadata
export interface UserColorInfo {
  readonly label: string;
  readonly value: string;
}

export const USER_COLOR_INFO: Record<UserColor, UserColorInfo> = {
  [UserColor.Blue]: { label: 'Blue', value: 'var(--color-blue-300)' },
  [UserColor.Cyan]: { label: 'Cyan', value: 'var(--color-cyan-300)' },
  [UserColor.Emerald]: { label: 'Teal', value: 'var(--color-teal-300)' },
  [UserColor.Amber]: { label: 'Indigo', value: 'var(--color-indigo-300)' },
  [UserColor.Rose]: { label: 'Violet', value: 'var(--color-violet-300)' },
  [UserColor.Violet]: { label: 'Fuchsia', value: 'var(--color-fuchsia-300)' },
  [UserColor.Gray]: { label: 'Gray', value: 'var(--color-zinc-400)' },
};

export const USER_COLOR_OPTIONS = Object.values(UserColor).filter(
  (color) => color !== UserColor.Gray,
);

export function getParticipantColor(
  participant: GroupMemberDto | ExternalParticipantDto | undefined,
): UserColor | undefined {
  return participant && 'color' in participant ? participant.color : undefined;
}
// #endregion
