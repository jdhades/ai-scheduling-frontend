import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import type {
  SemanticRuleListItem,
  RulePriority,
  UpdateSemanticRuleMetadataPayload,
} from '../../types/semantic-rule';

interface Props {
  rule: SemanticRuleListItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (patch: UpdateSemanticRuleMetadataPayload) => Promise<unknown>;
  submitting?: boolean;
}

/** PATCH metadata: priority, isActive, expiresAt. NO regenera embedding. */
export const EditRuleMetadataDialog = ({
  rule,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const [priorityLevel, setPriorityLevel] = useState<RulePriority>(3);
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');

  useEffect(() => {
    if (rule) {
      setPriorityLevel(rule.priorityLevel);
      setIsActive(rule.isActive);
      setExpiresAt(rule.expiresAt ? rule.expiresAt.slice(0, 10) : '');
    }
  }, [rule]);

  const open = rule !== null;

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    const patch: UpdateSemanticRuleMetadataPayload = {
      priorityLevel,
      isActive,
      expiresAt: expiresAt
        ? new Date(`${expiresAt}T00:00:00Z`).toISOString()
        : null,
    };
    try {
      await onSubmit(patch);
    } catch {
      /* el padre maneja el error visible */
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rules:editMetadata.title')}</DialogTitle>
          <DialogDescription>
            {t('rules:editMetadata.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <div className="space-y-1">
            <Label htmlFor="m-priority">
              {t('rules:editMetadata.fields.priority')}
            </Label>
            <select
              id="m-priority"
              data-testid="meta-priority-select"
              value={priorityLevel}
              onChange={(e) =>
                setPriorityLevel(Number(e.target.value) as RulePriority)
              }
              disabled={submitting}
              className="flex h-9 w-full rounded-md border border-white/10 bg-surface-low px-3 py-1 text-sm text-foreground"
            >
              <option value={1}>{t('rules:editMetadata.fields.priorityLegal')}</option>
              <option value={2}>{t('rules:editMetadata.fields.priorityHard')}</option>
              <option value={3}>{t('rules:editMetadata.fields.prioritySoft')}</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input
              id="m-active"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              data-testid="meta-active-cb"
              disabled={submitting}
              className="rounded border-white/20"
            />
            <Label htmlFor="m-active" className="!text-sm !normal-case !tracking-normal">
              {t('rules:editMetadata.fields.active')}
            </Label>
          </div>
          <div className="space-y-1">
            <Label htmlFor="m-expires">
              {t('rules:editMetadata.fields.expires')}
            </Label>
            <Input
              id="m-expires"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              data-testid="meta-expires-input"
              disabled={submitting}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('rules:editMetadata.actions.cancel')}
            </Button>
            <Button type="submit" disabled={submitting} data-testid="meta-submit">
              {submitting
                ? t('rules:editMetadata.actions.submitting')
                : t('rules:editMetadata.actions.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
