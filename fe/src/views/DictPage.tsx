import { useState, useCallback, useEffect } from 'react';
import { Layout, Space, Button, Popconfirm, Message } from '@arco-design/web-react';
import DataView, { ITableMod } from './DataView';
import AddView from './AddView';
import KeyEditView from './KeyEditView';
import { IList, ITableReq } from '../api/types';
import { loadTable, saveRow, alter, remove } from '../api';

const Content = Layout.Content;
const Header = Layout.Header;

export default function DictPage() {
  const [showBatch, _setShowBatch] = useState(false);
  const [visibleAdder, setVisibleAdder] = useState(false);
  const [visibleKeyEditor, setVisibleKeyEditor] = useState('');
  const [tableSelected, setTableSelect] = useState<string[]>([]);
  const [data, setData] = useState<ITableMod>({
    list: [],
    pageNo: 1,
    total: 0,
    pageSize: 20
  });

  const _loadTable = useCallback(async (p: ITableReq) => {
    const resp = await loadTable(p);
    setData({ ...resp, pageNo: p.pageNo, pageSize: p.pageSize });
  }, [setData]);

  useEffect(() => {
    _loadTable({ pageNo: 1, pageSize: 20 });
  }, [_loadTable]);

  const handleRemove = () => {
    remove(tableSelected).then(() => {
      Message.info({ content: 'ok' });
      setTableSelect([]);
      _setShowBatch(false);
    });
  };

  const saveKey = (scope: string, oldKey: string, key: string) => {
    alter({ scope, oldKey, key }).then(() => {
      setVisibleKeyEditor('');
      for (let item of data.list) {
        if (item.key !== oldKey) continue;
        item.key = key;
      }
      setData({ ...data, list: data.list });
    });
  };

  const saveTxtValue = (r: IList, value = '') => {
    alter({ id: r.id, value }).then(() => {
      const thatRow = data.list.find(item => item.id === r.id);
      if (!thatRow) return;
      thatRow.value = value;
      setData({ ...data, list: data.list });
    });
  };

  const handleEditKey = (scope: string, key: string) => setVisibleKeyEditor(`${scope}\n\t\r${key}`);

  const addRow = (p: any) => {
    saveRow(p).then(() => {
      setVisibleAdder(false);
      _loadTable({ pageNo: 1, pageSize: 20 });
    });
  };

  const setShowBatch = () => {
    if (showBatch) setTableSelect([]);
    _setShowBatch(!showBatch);
  };

  return (
    <Content style={{ padding: '0 24px 24px', justifyContent: 'start' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Space wrap className="bach-btn-group">
          <Button type={showBatch ? 'secondary' : 'primary'} onClick={setShowBatch}>
            { showBatch ? 'cancel' : 'remove' }
          </Button>
          {showBatch &&
            <Popconfirm
              title='Are you sure you want to delete?'
              onOk={handleRemove}
              onCancel={() => Message.error({ content: 'cancel' })}
            >
              <Button type='primary' disabled={!tableSelected.length}>remove</Button>
            </Popconfirm>
          }
        </Space>
        <Button type="primary" onClick={() => setVisibleAdder(true)}>add</Button>
      </Header>
      <DataView
        selected={tableSelected}
        data={data}
        onSelect={showBatch ? setTableSelect : undefined}
        onEditKey={handleEditKey}
        onSaveTxt={saveTxtValue}
        onLoad={_loadTable}
      />
      <AddView visible={visibleAdder} onCancel={() => setVisibleAdder(false)} onSave={addRow} />
      <KeyEditView value={visibleKeyEditor} onCancel={() => setVisibleKeyEditor('')} onSave={saveKey} />
    </Content>
  );
}
