import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  IconButton,
  Typography,
  Divider,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  ShoppingCart,
  Inventory,
  Assessment,
  Settings,
  ExpandLess,
  ExpandMore,
  Person,
  Group,
  Security,
  History,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

interface MenuItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  children?: MenuItem[];
  requiredRole?: string;
}

const menuItems: MenuItem[] = [
  {
    title: 'Dashboard',
    icon: <Dashboard />,
    path: '/dashboard',
  },
  {
    title: 'Kullanıcı Yönetimi',
    icon: <People />,
    path: '/users',
    requiredRole: 'Admin',
    children: [
      {
        title: 'Kullanıcılar',
        icon: <Person />,
        path: '/users',
      },
      {
        title: 'Roller',
        icon: <Security />,
        path: '/roles',
      },
      {
        title: 'Kullanıcı Grupları',
        icon: <Group />,
        path: '/user-groups',
      },
      {
        title: 'Kullanıcı Yetkileri',
        icon: <Security />,
        path: '/user-permissions',
      },
      {
        title: 'İşlem Logları',
        icon: <History />,
        path: '/audit-logs',
      },
    ],
  },
  {
    title: 'Siparişler',
    icon: <ShoppingCart />,
    path: '/orders',
  },
  {
    title: 'Ürünler',
    icon: <Inventory />,
    path: '/products',
  },
  {
    title: 'Raporlar',
    icon: <Assessment />,
    path: '/reports',
  },
  {
    title: 'Ayarlar',
    icon: <Settings />,
    path: '/settings',
  },
];

const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openMenus, setOpenMenus] = useState<{ [key: string]: boolean }>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleDesktopDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleMenuClick = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const renderMenuItem = (item: MenuItem) => {
    if (item.requiredRole && !user?.roles.includes(item.requiredRole)) {
      return null;
    }

    const isSelected = location.pathname === item.path;
    const hasChildren = item.children && item.children.length > 0;
    const isOpen = openMenus[item.title];

    return (
      <React.Fragment key={item.title}>
        <ListItem disablePadding>
          <Link to={item.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
            <ListItemButton
              selected={isSelected}
              onClick={() => hasChildren && handleMenuClick(item.title)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.title} />
              {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
            </ListItemButton>
          </Link>
        </ListItem>
        {hasChildren && (
          <Collapse in={isOpen} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.children?.map((child) => (
                <ListItem key={child.title} disablePadding>
                  <Link to={child.path} style={{ textDecoration: 'none', color: 'inherit', width: '100%' }}>
                    <ListItemButton
                      selected={location.pathname === child.path}
                      sx={{ pl: 4 }}
                    >
                      <ListItemIcon>{child.icon}</ListItemIcon>
                      <ListItemText primary={child.title} />
                    </ListItemButton>
                  </Link>
                </ListItem>
              ))}
            </List>
          </Collapse>
        )}
      </React.Fragment>
    );
  };

  const drawer = (
    <Box>
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" noWrap component="div">
          ERP Sistemi
        </Typography>
        <IconButton onClick={handleDesktopDrawerToggle} sx={{ display: { xs: 'none', sm: 'block' } }}>
          <MenuIcon />
        </IconButton>
      </Box>
      <Divider />
      <List>
        {menuItems.map(renderMenuItem)}
      </List>
    </Box>
  );

  return (
    <Box
      component="nav"
      sx={{ width: { sm: drawerOpen ? drawerWidth : 0 }, flexShrink: { sm: 0 } }}
    >
      <IconButton
        color="inherit"
        aria-label="open drawer"
        edge="start"
        onClick={handleDrawerToggle}
        sx={{ mr: 2, display: { sm: 'none' } }}
      >
        <MenuIcon />
      </IconButton>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            transition: 'width 0.2s ease-in-out',
          },
        }}
        open={drawerOpen}
      >
        {drawer}
      </Drawer>
    </Box>
  );
};

export default Sidebar; 