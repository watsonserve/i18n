import { useCallback, useMemo, useState } from 'react';
import { Drawer, Checkbox } from '@arco-design/web-react';
import { useEffect } from 'react';

const CheckboxGroup = Checkbox.Group;

interface ILangPanelProps {
  languages: string[];
  value: string[];
  visible: boolean;
  setVisible(visible: boolean): void;
  onChange(value: string[]): void;
}

export default function LangPanel(props: ILangPanelProps) {
  const { languages, value, setVisible, onChange: propsOnChange } = props;
  const [indeterminate, setIndeterminate] = useState(value.length !== 0 && value.length < languages.length);
  const [checkAll, setCheckAll] = useState(false);
  const [selected, setSelected] = useState(value);

  const onChangeAll = useCallback((checked: boolean) => {
    setIndeterminate(false);
    setCheckAll(checked);
    setSelected(checked ? languages : []);
  }, [languages, setSelected, setCheckAll, setIndeterminate]);

  const onChange = useCallback((checkList: string[]) => {
    setIndeterminate(!!(checkList.length && checkList.length !== languages.length));
    setCheckAll(!!(checkList.length === languages.length));
    setSelected(checkList);
  }, [languages, setCheckAll, setSelected, setIndeterminate]);

  useEffect(() => onChange(value), [value, onChange]);

  const handleSelected = useCallback(() => {
    setVisible(false);
    propsOnChange(selected);
  }, [selected, languages, setVisible, propsOnChange]);

  const checkable = useMemo(() => (
    <>
      <Checkbox checked={checkAll} indeterminate={indeterminate} onChange={onChangeAll}>
        Check All
      </Checkbox>
      <CheckboxGroup
        value={selected}
        options={languages.map(x => ({ label: x, value: x }))}
        onChange={onChange}
      />
    </>
  ), [
    checkAll,
    indeterminate,
    selected,
    languages,
    onChange,
    onChangeAll
  ]);

  return (
    <Drawer
      width={332}
      title={<span>language</span>}
      visible={props.visible}
      onOk={handleSelected}
      onCancel={() => setVisible(false)}
    >
      {checkable}
    </Drawer>
  );
}
