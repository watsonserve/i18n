import { useNavigate, useLocation } from "react-router-dom";
import { Menu } from '@arco-design/web-react';
import { IconHome, IconCalendar } from '@arco-design/web-react/icon';

const MenuItem = Menu.Item;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <div className='logo' />
      <Menu
        selectedKeys={[location.pathname]}
        onClickMenuItem={key => navigate(key)}
        style={{ width: '100%' }}
      >
        <MenuItem key='/dict'>
          <IconHome />
          Dict
        </MenuItem>
        <MenuItem key='/release'>
          <IconCalendar />
          Release
        </MenuItem>
      </Menu>
    </>
  );
}
