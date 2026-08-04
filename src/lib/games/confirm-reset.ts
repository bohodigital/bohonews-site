export interface ResetConfirmation {
  complete: boolean;
  hasProgress: boolean;
  label?: string;
}

export function confirmProgressLoss(
  {complete,hasProgress,label="start a new puzzle"}: ResetConfirmation,
  ask: (message: string) => boolean = (message)=>window.confirm(message)
): boolean {
  if(complete||!hasProgress)return true;
  return ask(`Are you sure you want to ${label}? Your current progress will be lost.`);
}
