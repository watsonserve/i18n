import { useState, useCallback, useEffect } from 'react';
import { Layout, Space, Button, Popconfirm, Message } from '@arco-design/web-react';
import DataView, { ITableMod } from './DataView';
import { ITableReq } from '../../api/types';
import { loadDraft, release } from '../../api';

const Header = Layout.Header;
const Content = Layout.Content;

export default function ReleasePage() {
  const [query, setQuery] = useState<Partial<{scope: string; language: string}>>({});
  const [tableSelected, setTableSelect] = useState<string[]>([]);
  const [data, setData] = useState<ITableMod>({
    list: [],
    pageNo: 1,
    total: 0,
    pageSize: 20
  });

  const _loadTable = useCallback(async (p: ITableReq) => {
    const resp = await loadDraft(p);
    setData({ ...resp, pageNo: p.pageNo, pageSize: p.pageSize });
  }, []);

  const handleRelease = useCallback(async () => {
    Message.info({ content: 'ok' });
    const { scope = '_', language = '' } = query;
    await release(scope, language, tableSelected);
    setTableSelect([]);
  }, [query, tableSelected]);

  useEffect(() => {
    const { searchParams } = new URL(window.location.href);
    const scope = searchParams.get('scope') || '_';
    const language = searchParams.get('language') || 'en';
    const pageNo = Number(searchParams.get('pageNo')) || 1;
    setQuery({ scope, language });

    _loadTable({ scope, language, pageNo, pageSize: 20 } as any);
  }, [_loadTable]);

  return (
    <Content style={{ padding: '0 24px 24px', justifyContent: 'start' }}>
      <Header style={{ textAlign: 'left' }}>
        <Space wrap className="bach-btn-group">
          <Popconfirm
            title='Are you sure you want to release?'
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
