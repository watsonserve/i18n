import { useState, useCallback, useEffect } from 'react';
import { Layout, Space, Button, Popconfirm, Message } from '@arco-design/web-react';
import DataView, { ITableMod } from './DataView';
import { ITableReq } from '../api/types';
import { loadTable } from '../api';

const Header = Layout.Header;
const Content = Layout.Content;

export default function DictPage() {
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
  }, []);

  useEffect(() => {
    _loadTable({ pageNo: 1, pageSize: 20 });
  }, [_loadTable]);

  const handleRelease = () => {
    Message.info({ content: 'ok' });
    console.log(tableSelected);
    setTableSelect([]);
  };

  return (
    <Content style={{ padding: '0 24px 24px', justifyContent: 'start' }}>
      <Header style={{ textAlign: 'left' }}>
        <Space wrap className="bach-btn-group">
          <Popconfirm
            title='Are you sure you want to delete?'
            onOk={handleRelease}
            onCancel={() => Message.error({ content: 'cancel' })}
          >
            <Button type='primary' disabled={!tableSelected.length}>release</Button>
          </Popconfirm>
        </Space>
      </Header>
      <DataView
        selected={tableSelected}
        data={data}
        onSelect={setTableSelect}
        onLoad={_loadTable}
      />
    </Content>
  );
}
