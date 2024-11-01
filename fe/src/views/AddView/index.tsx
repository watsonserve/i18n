import { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, Form, Input } from '@arco-design/web-react';
import Selector from './Selector';
import { ISaveData } from '../../api/types';
import { loadOptions } from '../../api';

interface IAddViewProps {
  visible: boolean;
  onCancel(): void;
  onSave(d: ISaveData): void;
}

export default function AddView(props: IAddViewProps) {
  const { visible, onCancel, onSave } = props;
  const [prefixes, setPrefixes] = useState<string[]>([]);
  const [langs, setLangs] = useState<string[]>([]);
  const [scope, setPrefix] = useState<string | undefined>();
  const [language, setLanguage] = useState<string | undefined>();
  const [key, setKey] = useState<string | undefined>();
  const [value, setValue] = useState<string | undefined>();

  const [form] = Form.useForm();

  const handleSave = useCallback(() => {
    form.validate().then(() => {
      if (!scope || !language || !key) return;
      onSave({ scope, language, key, value });
    }, () => {});
  }, [form, scope, language, key, value, onSave]);

  useEffect(() => {
    loadOptions()
    .then(({ prefixList, languages }) => {
      setPrefixes(prefixList.map(item => item.value));
      setLangs(languages);
    });

    visible && form.resetFields();
  }, [visible, form, setPrefixes, setLangs]);

  return useMemo(() => (
    <Modal
      visible={visible}
      closable={false}
      onCancel={onCancel}
      onOk={handleSave}
    >
      <Form form={form}>
        <Form.Item label="scope" field="scope" rules={[{ required: true }]}>
          <Selector
            placeholder="select scope"
            value={scope!}
            list={prefixes}
            onChange={setPrefix}
          />
        </Form.Item>
        <Form.Item label="language" field="language" rules={[{ required: true }]}>
          <Selector
            placeholder="select language"
            value={language!}
            list={langs}
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
  ), [visible, onCancel, handleSave, form, scope, language, key, value]);
}
