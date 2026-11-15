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
  [UserColor.Blue]: { label: 'Blue', value: '#7089aa' },
  [UserColor.Cyan]: { label: 'Cyan', value: '#6a9aa8' },
  [UserColor.Emerald]: { label: 'Teal', value: '#75947e' },
  [UserColor.Amber]: { label: 'Amber', value: '#a79265' },
  [UserColor.Rose]: { label: 'Rose', value: '#a7787b' },
  [UserColor.Violet]: { label: 'Violet', value: '#857da3' },
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
