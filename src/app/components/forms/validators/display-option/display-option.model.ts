export interface DisplayOption<T extends string | number = string> {
  id: T;
  displayAs: string;
}
