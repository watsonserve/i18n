import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Modal, Space, Input } from '@arco-design/web-react';

interface IAddViewProps {
  value: string;
  onCancel(): void;
  onSave(p: string, o: string, k: string): void;
}

export default function AddView(props: IAddViewProps) {
  const { value, onCancel, onSave } = props;
  const [scope, key] = value.split('\n\t\r');
  const prefixRef = useRef('');
  prefixRef.current = scope;
  const [nxtValue, setNxtValue] = useState<string>(key);

  const handleSave = useCallback(() => {
    onSave(scope, key, nxtValue);
  }, [scope, key, nxtValue, onSave]);

  useEffect(() => {
    if (!value) return;
    const [scope, key] = value.split('\n\t\r');
    prefixRef.current = scope;
    setNxtValue(key);
  }, [value]);

  return useMemo(() => {
    return (
      <Modal
        title="alter key"
        visible={!!value}
        closable={false}
        onCancel={onCancel}
        onOk={handleSave}
      >
        <Space>scope: <span>{scope}</span></Space>
        <Input
          placeholder="new key"
          value={nxtValue}
          onChange={setNxtValue}
        />
      </Modal>
    );
  }, [value, onCancel, handleSave, scope, nxtValue]);
}
