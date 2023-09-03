import { useState, useEffect, useMemo } from 'react';
import { Table, Layout } from '@arco-design/web-react';
import { loadOptions } from '../api';

const Content = Layout.Content;
const Header = Layout.Header;

export default function ScopePage() {
  const [data, setData] = useState<{prefixList: any[]}>({
    prefixList: []
  });

  useEffect(() => {
    loadOptions().catch(() => ({ prefixList: [] })).then((resp) => {
      console.log(resp)
      setData(resp);
    });
  }, [setData]);

  return (
    <Content style={{ padding: '0 24px 24px', justifyContent: 'start' }}>
      <Header style={{ display: 'flex', justifyContent: 'space-between' }}>
      </Header>
      <Table
        columns={[{
          title: 'prefix',
          dataIndex: 'value',
        }]}
        data={data.prefixList}
        rowKey="id"
      />
    </Content>
  );
}
