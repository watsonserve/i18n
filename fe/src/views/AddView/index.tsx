import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input } from '@arco-design/web-react';
import Selector from './Selector';
import { ISaveData } from '../../api/types';
import { prefixList, languages } from '../../api';

interface IAddViewProps {
  visible: boolean;
  onCancel(): void;
  onSave(d: ISaveData): void;
}

export default function AddView(props: IAddViewProps) {
  const { visible, onCancel, onSave } = props;
  const [prefix, setPrefix] = useState<string | undefined>();
  const [language, setLanguage] = useState<string | undefined>();
  const [key, setKey] = useState<string | undefined>();
  const [value, setValue] = useState<string | undefined>();

  const [form] = Form.useForm();

  const handleSave = useCallback(() => {
    form.validate().then(() => {
      if (!prefix || !language || !key) return;
      onSave({ prefix, language, key, value });
    }, () => {});
  }, [form, prefix, language, key, value, onSave]);

  useEffect(() => {
    visible && form.resetFields();
  }, [visible, form]);

  return useMemo(() => (
    <Modal
      visible={visible}
      closable={false}
      onCancel={onCancel}
      onOk={handleSave}
    >
      <Form form={form}>
        <Form.Item label="prefix" field="prefix" rules={[{ required: true }]}>
          <Selector
            placeholder="select prefix"
            value={prefix!}
            list={prefixList}
            onChange={setPrefix}
          />
        </Form.Item>
        <Form.Item label="language" field="language" rules={[{ required: true }]}>
          <Selector
            placeholder="select language"
            value={language!}
            list={languages}
            onChange={setLanguage}
          />
        </Form.Item>
        <Form.Item label="key" field="key" rules={[{ required: true }]}>
          <Input
            placeholder="input key"
            value={key}
            onChange={setKey}
          />
        </Form.Item>
        <Form.Item label="value">
          <Input
            placeholder="input value"
            value={value}
            onChange={setValue}
          />
        </Form.Item>
      </Form>
    </Modal>
  ), [visible, onCancel, handleSave, form, prefix, language, key, value]);
}
