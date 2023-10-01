import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Input } from '@arco-design/web-react';
import { IconSave } from '@arco-design/web-react/icon';

const InputSave = Input.Search;
// const EditableContext = React.createContext({});

interface IEditableCellProps {
  value: string;
  onSave(v: string): void;
}

export function EditableCell(props: IEditableCellProps) {
  const { value, onSave } = props;
  const refInput = useRef<any>(null);
  const [editing, setEditing] = useState(false);
  const [inoutVal, setInputVal] = useState(value);

  // on save
  const handleSave = useCallback(() => {
    onSave(inoutVal);
    setEditing(false);
  }, [onSave, inoutVal]);

  // focus
  useEffect(() => {
    const el = refInput.current;
    if (!editing || !el) return;
    el.focus && el.focus();
  }, [editing]);

  // value changed
  useEffect(() => setInputVal(value), [value]);

  // cancel on blur
  useEffect(() => {
    const handleClick = () => setEditing(false);

    document.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('click', handleClick);
    };
  }, [editing, setEditing]);

  if (!editing) {
    return (
      <div className="editable-cell readonly" onDoubleClick={() => setEditing(true)}>
        {value}
      </div>
    );
  }

  return (
    <div className="editable-cell editing" onClick={e => { e.stopPropagation(); e.preventDefault() }}>
      <InputSave
        className="editable-cell__input"
        ref={refInput}
        value={inoutVal}
        // onPressEnter={handleSave}
        searchButton={
          <Button type="primary" icon={<IconSave />} onClick={handleSave} />
        }
        onChange={setInputVal}
      />
    </div>
  );
}
