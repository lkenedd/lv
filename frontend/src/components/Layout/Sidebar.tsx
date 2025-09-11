import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { isAdmin } from '../../utils/auth';
import {
  ChartBarIcon,
  UsersIcon,
  WrenchScrewdriverIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  TrashIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const adminMenuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: ChartBarIcon,
    },
    {
      name: 'Clientes',
      path: '/clientes',
      icon: UsersIcon,
    },
    {
      name: 'Serviços',
      path: '/servicos',
      icon: WrenchScrewdriverIcon,
    },
    {
      name: 'Usuários',
      path: '/usuarios',
      icon: UserGroupIcon,
    },
    {
      name: 'Solicitações',
      path: '/exclusoes',
      icon: TrashIcon,
    },
    {
      name: 'Relatórios',
      path: '/relatorios',
      icon: ClipboardDocumentListIcon,
    },
  ];

  const employeeMenuItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: ChartBarIcon,
    },
    {
      name: 'Meus Serviços',
      path: '/servicos',
      icon: WrenchScrewdriverIcon,
    },
    {
      name: 'Clientes',
      path: '/clientes',
      icon: UsersIcon,
    },
    {
      name: 'Solicitações',
      path: '/exclusoes',
      icon: TrashIcon,
    },
  ];

  const menuItems = isAdmin(user) ? adminMenuItems : employeeMenuItems;

  return (
    <div className="w-64 bg-gray-900 bg-opacity-50 backdrop-blur-sm border-r border-gray-700 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">LV</span>
          </div>
          <div>
            <h1 className="text-white text-xl font-bold">Lava Jato</h1>
            <p className="text-gray-400 text-sm">Dashboard</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">
              {user?.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-white text-sm font-medium">{user?.nome}</p>
            <p className="text-gray-400 text-xs capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-item ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="h-5 w-5 mr-3" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Settings and Logout */}
      <div className="p-4 border-t border-gray-700 space-y-2">
        <NavLink
          to="/configuracoes"
          className={({ isActive }) =>
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <Cog6ToothIcon className="h-5 w-5 mr-3" />
          <span>Configurações</span>
        </NavLink>
        
        <button
          onClick={handleLogout}
          className="w-full sidebar-item text-red-400 hover:text-red-300 hover:bg-red-900 hover:bg-opacity-20"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 mr-3" />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;