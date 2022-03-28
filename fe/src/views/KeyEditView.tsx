import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Modal, Space, Input } from '@arco-design/web-react';

interface IAddViewProps {
  value: string;
  onCancel(): void;
  onSave(p: string, o: string, k: string): void;
}

export default function AddView(props: IAddViewProps) {
  const { value, onCancel, onSave } = props;
  const [prefix, key] = value.split('\n\t\r');
  const prefixRef = useRef('');
  prefixRef.current = prefix;
  const [nxtValue, setNxtValue] = useState<string>(key);

  const handleSave = useCallback(() => {
    onSave(prefix, key, nxtValue);
  }, [prefix, key, nxtValue, onSave]);

  useEffect(() => {
    if (!value) return;
    const [prefix, key] = value.split('\n\t\r');
    prefixRef.current = prefix;
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
        <Space>prefix: <span>{prefix}</span></Space>
        <Input
          placeholder="new key"
          value={nxtValue}
          onChange={setNxtValue}
        />
      </Modal>
    );
  }, [value, onCancel, handleSave, prefix, nxtValue]);
}
