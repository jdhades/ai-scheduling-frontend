import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import type {
  SemanticRuleListItem,
  UpdateSemanticRuleTextPayload,
} from '../../types/semantic-rule';

interface Props {
  rule: SemanticRuleListItem | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: UpdateSemanticRuleTextPayload) => Promise<unknown>;
  submitting?: boolean;
}

/**
 * EditRuleTextDialog — operación CARA. El backend regenera embedding +
 * structure (cada uno = 1 LLM call). Mostramos warning explícito y un
 * confirm checkbox para que el manager sea consciente del costo.
 */
export const EditRuleTextDialog = ({
  rule,
  onOpenChange,
  onSubmit,
  submitting,
}: Props) => {
  const { t } = useTranslation();
  const [ruleText, setRuleText] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rule) {
      setRuleText(rule.ruleText);
      setConfirmed(false);
      setError(null);
    }
  }, [rule]);

  const open = rule !== null;

  const handle = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (ruleText.trim().length < 10) {
      setError(t('rules:editText.errors.minLength'));
      return;
    }
    if (rule && ruleText.trim() === rule.ruleText.trim()) {
      setError(t('rules:editText.errors.identical'));
      return;
    }
    try {
      await onSubmit({ ruleText: ruleText.trim() });
    } catch (err) {
      setError((err as Error).message ?? t('rules:editText.errors.generic'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('rules:editText.title')}</DialogTitle>
          <DialogDescription>
            {t('rules:editText.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handle} className="space-y-3">
          <div className="rounded-md border border-yellow-500/30 bg-yellow-500/10 p-3 flex items-start gap-2 text-xs text-yellow-200">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{t('rules:editText.warning')}</span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="rt-text">{t('rules:editText.fields.text')}</Label>
            <Textarea
              id="rt-text"
              rows={4}
              value={ruleText}
              onChange={(e) => setRuleText(e.target.value)}
              data-testid="rt-text-input"
              disabled={submitting}
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              id="rt-confirm"
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              data-testid="rt-confirm-cb"
              disabled={submitting}
              className="rounded border-white/20"
            />
            <Label htmlFor="rt-confirm" className="!text-sm !normal-case !tracking-normal">
              {t('rules:editText.fields.confirm')}
            </Label>
          </div>
          {error && (
            <p className="text-sm text-error" data-testid="rt-form-error">
              {error}
            </p>
          )}
          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t('rules:editText.actions.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={!confirmed || submitting}
              data-testid="rt-submit"
            >
              {submitting
                ? t('rules:editText.actions.submitting')
                : t('rules:editText.actions.submit')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
