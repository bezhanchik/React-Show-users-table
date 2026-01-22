import React, { useState, useEffect, useRef } from 'react';
import './table.css';

export default function Table() {
  // Состояния 
  const [users, setUsers] = useState([]);
  const [sortConfig, setSortConfig] = useState({key: null, direction: null});
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10); 
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({
    fullName: '',
    age: '',
    gender: '',
    phone: ''
  });
  const [columnWidths, setColumnWidths] = useState({});
  const [isResizing, setIsResizing] = useState(false);
  const resizingColIndex = useRef(null);

  // Загрузка данных
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch('https://dummyjson.com/users?limit=0');
        if (!res.ok) throw new Error(`Ошибка HTTP подключения! статус: ${res.status}`);
        const data = await res.json();
        if (!Array.isArray(data?.users)) throw new Error('Неправильный ответ от API');

        const formatted = data.users.map(user => ({
          id: user.id,
          lastName: user.lastName,
          firstName: user.firstName,
          middleName: user.maidenName || '',
          age: user.age,
          gender: user.gender === 'male' ? 'Мужской' : 'Женский',
          phone: user.phone,
          email: user.email,
          country: user.address?.country || '-',
          city: user.address?.city || '-',
          address: user.address?.address || '-',
          height: user.height || '-',
          weight: user.weight || '-',
          avatar: user.image || null
        }));

        setUsers(formatted);
        setFilteredUsers(formatted);
      } catch (err) {
        console.error('Fetch error:', err);
        setError(err.message || 'Не удалось загрузить данные');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }

        setSortConfig({
            key: direction ? key : null,
            direction
        });
    };

  // Фильтрация
  useEffect(() => {
    let result = [...users]; // работаем с копией

    // Фильтрация
    if (filters.fullName) {
        const term = filters.fullName.toLowerCase();
        result = result.filter(u =>
        `${u.lastName} ${u.firstName} ${u.middleName}`.toLowerCase().includes(term)
        );
    }

    if (filters.age) {
        const age = Number(filters.age);
        if (!isNaN(age)) {
        result = result.filter(u => u.age === age);
        }
    }

    if (filters.gender) {
        result = result.filter(u => u.gender.toLowerCase().includes(filters.gender.toLowerCase()));
    }

    if (filters.phone) {
        const term = filters.phone.replace(/\D/g, '');
        result = result.filter(u => u.phone.replace(/\D/g, '').includes(term));
    }

    // Сортировка
    const { key, direction } = sortConfig;
    if (key && direction) {
        result = [...result].sort((a, b) => { 
        let aVal = a[key];
        let bVal = b[key];

        if (key === 'fullName') {
            aVal = `${a.lastName} ${a.firstName} ${a.middleName}`.trim();
            bVal = `${b.lastName} ${b.firstName} ${b.middleName}`.trim();
        }

        if (typeof aVal === 'string') {
            aVal = aVal.toLowerCase();
            bVal = bVal.toLowerCase();
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
        });
    }

    setFilteredUsers(result);
    setCurrentPage(1);
    }, [filters, users, sortConfig]); 


  // Пагинация
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);
  const startIndex = (currentPage - 1) * usersPerPage;
  const currentUsers = filteredUsers.slice(startIndex, startIndex + usersPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Обработчики фильтров
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Модальное окно
  const openModal = (user) => setSelectedUser(user);
  const closeModal = () => setSelectedUser(null);

  // Изменение ширины колонок
  const handleMouseDown = (e, index) => {
    setIsResizing(true);
    resizingColIndex.current = index;
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isResizing || resizingColIndex.current === null) return;
    const table = document.querySelector('.resizable-table');
    if (!table) return;

    const rect = table.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newWidth = Math.max(50, offsetX - getColumnLeftOffset(resizingColIndex.current));

    setColumnWidths(prev => ({
      ...prev,
      [resizingColIndex.current]: newWidth
    }));
  };

  const handleMouseUp = () => {
    setIsResizing(false);
    resizingColIndex.current = null;
  };

  const getColumnLeftOffset = (index) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += columnWidths[i] || getDefaultWidth(i);
    }
    return offset;
  };

  const getDefaultWidth = (index) => {
    const defaults = [60, 120, 100, 100, 80, 90, 140, 180, 100, 100];
    return defaults[index] || 100;
  };



  // Подписка на события мыши для ресайза
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Рендер
  if (loading) return <div className="container">Загрузка...</div>;
  if (error) return <div className="container">Ошибка: {error}</div>;

  const columns = [
    'ID', 'Фамилия', 'Имя', 'Отчество', 'Возраст', 'Пол',
    'Номер телефона', 'Email', 'Страна', 'Город'
  ];

  return (
    <div className="container">
      {/* Фильтры */}
      <div className="filters">
        {['fullName', 'age', 'gender', 'phone'].map((field, idx) => (
          <input
            key={field}
            type="text"
            placeholder={`Фильтр: ${columns[idx + (field === 'fullName' ? 1 : field === 'age' ? 4 : field === 'gender' ? 5 : 3)]}`}
            value={filters[field]}
            onChange={(e) => handleFilterChange(field, e.target.value)}
            className="filter-input"
          />
        ))}
      </div>

      {/* Таблица */}
      <div style={{ overflowX: 'auto' }}>
        <table className="resizable-table">
          <thead>
                <tr>
                    {/* ID — без сортировки */}
                    <th 
                    style={{ width: columnWidths[0] || getDefaultWidth(0), minWidth: '50px' }}
                    >
                    ID
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 0)} />
                    </th>

                    {/* Фамилия — сортировка по fullName */}
                    <th 
                    style={{ width: columnWidths[1] || getDefaultWidth(1), minWidth: '50px' }}
                    onClick={() => handleSort('fullName')}
                    className="sortable"
                    >
                    Фамилия
                    {sortConfig.key === 'fullName' && (
                        sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇'
                    )}
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 1)} />
                    </th>

                    {/* Имя и Отчество — без сортировки */}
                    <th style={{ width: columnWidths[2] || getDefaultWidth(2), minWidth: '50px' }}>
                    Имя
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 2)} />
                    </th>
                    <th style={{ width: columnWidths[3] || getDefaultWidth(3), minWidth: '50px' }}>
                    Отчество
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 3)} />
                    </th>

                    {/* Возраст — сортировка по age */}
                    <th 
                    style={{ width: columnWidths[4] || getDefaultWidth(4), minWidth: '50px' }}
                    onClick={() => handleSort('age')}
                    className="sortable"
                    >
                    Возраст
                    {sortConfig.key === 'age' && (
                        sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇'
                    )}
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 4)} />
                    </th>

                    {/* Пол — сортировка по gender */}
                    <th 
                    style={{ width: columnWidths[5] || getDefaultWidth(5), minWidth: '50px' }}
                    onClick={() => handleSort('gender')}
                    className="sortable"
                    >
                    Пол
                    {sortConfig.key === 'gender' && (
                        sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇'
                    )}
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 5)} />
                    </th>

                    {/* Телефон — сортировка по phone */}
                    <th 
                    style={{ width: columnWidths[6] || getDefaultWidth(6), minWidth: '50px' }}
                    onClick={() => handleSort('phone')}
                    className="sortable"
                    >
                    Номер телефона
                    {sortConfig.key === 'phone' && (
                        sortConfig.direction === 'asc' ? ' ⬆' : ' ⬇'
                    )}
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 6)} />
                    </th>

                    {/* Остальные колонки — без сортировки */}
                    <th style={{ width: columnWidths[7] || getDefaultWidth(7), minWidth: '50px' }}>
                    Email
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 7)} />
                    </th>
                    <th style={{ width: columnWidths[8] || getDefaultWidth(8), minWidth: '50px' }}>
                    Страна
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 8)} />
                    </th>
                    <th style={{ width: columnWidths[9] || getDefaultWidth(9), minWidth: '50px' }}>
                    Город
                    <div className="resizer" onMouseDown={(e) => handleMouseDown(e, 9)} />
                    </th>
                </tr>
            </thead>
          <tbody>
            {currentUsers.map(user => (
              <tr key={user.id} onClick={() => openModal(user)} className="clickable-row">
                <td>{user.id}</td>
                <td>{user.lastName}</td>
                <td>{user.firstName}</td>
                <td>{user.middleName}</td>
                <td>{user.age}</td>
                <td>{user.gender}</td>
                <td>{user.phone}</td>
                <td>{user.email}</td>
                <td>{user.country}</td>
                <td>{user.city}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Назад
          </button>
          <span>Страница {currentPage} из {totalPages}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Вперёд
          </button>
        </div>
      )}

      {/* Модальное окно */}
      {selectedUser && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Информация о пользователе</h2>
            <img
              src={selectedUser.avatar}
              alt={`${selectedUser.firstName} ${selectedUser.lastName}`}
              style={{ width: '100px', height: '100px', objectFit: 'cover' }}
            />
            <p><strong>ФИО:</strong> {selectedUser.lastName} {selectedUser.firstName} {selectedUser.middleName}</p>
            <p><strong>Возраст:</strong> {selectedUser.age}</p>
            <p><strong>Адрес:</strong> {selectedUser.address}, {selectedUser.city}, {selectedUser.country}</p>
            <p><strong>Рост:</strong> {selectedUser.height} см</p>
            <p><strong>Вес:</strong> {selectedUser.weight} кг</p>
            <p><strong>Телефон:</strong> {selectedUser.phone}</p>
            <p><strong>Email:</strong> {selectedUser.email}</p>
            <button onClick={closeModal}>Закрыть</button>
          </div>
        </div>
      )}
    </div>
  );
}