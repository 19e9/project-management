import { Modal } from './Modal';
import { Button } from './Button';
import { useT } from '../../i18n/I18nProvider';

interface Props {
  open: boolean;
  title: string;
  body?: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  body,
  destructive,
  onCancel,
  onConfirm,
  loading,
}: Props) {
  const t = useT();
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onCancel}>
            {t('common.cancel')}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
            {t('common.confirm')}
          </Button>
        </>
      }
    >
      {body && <p className="text-sm text-muted">{body}</p>}
    </Modal>
  );
}
