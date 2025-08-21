import React, { useState, useEffect } from 'react';
import { 
  MapPin, 
  Star, 
  Edit, 
  Trash2, 
  Plus, 
  Search,
  Filter,
  Eye,
  Check,
  X
} from 'lucide-react';

interface PetFacility {
  id: number;
  name: string;
  description: string;
  address: string;
  phone: string;
  category: string;
  rating: number;
  reviewCount: number;
  status: 'active' | 'pending' | 'inactive';
  image?: string;
  createdAt: string;
  updatedAt: string;
}

const FacilityManagement: React.FC = () => {
  const [facilities, setFacilities] = useState<PetFacility[]>([]);
  const [filteredFacilities, setFilteredFacilities] = useState<PetFacility[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchFacilities();
  }, []);

  useEffect(() => {
    filterFacilities();
  }, [facilities, searchTerm, statusFilter, categoryFilter]);

  const fetchFacilities = async () => {
    try {
      const response = await fetch('/api/admin/facilities');
      if (response.ok) {
        const data = await response.json();
        setFacilities(data);
      } else {
        // 임시 데모 데이터
        const demoFacilities: PetFacility[] = [
          {
            id: 1,
            name: '서울 반려동물 종합병원',
            description: '24시간 응급 진료 가능한 종합 동물병원',
            address: '서울시 강남구 테헤란로 123',
            phone: '02-1234-5678',
            category: '동물병원',
            rating: 4.5,
            reviewCount: 89,
            status: 'active',
            createdAt: '2025-01-15',
            updatedAt: '2025-01-20'
          },
          {
            id: 2,
            name: '펫프렌들리 카페',
            description: '반려동물과 함께 즐길 수 있는 아늑한 카페',
            address: '서울시 홍대 와우산로 456',
            phone: '02-9876-5432',
            category: '카페/레스토랑',
            rating: 4.2,
            reviewCount: 45,
            status: 'pending',
            createdAt: '2025-01-18',
            updatedAt: '2025-01-18'
          },
          {
            id: 3,
            name: '행복한 펜션',
            description: '반려동물과 함께하는 휴식공간',
            address: '경기도 가평군 설악면 123',
            phone: '031-555-7890',
            category: '펜션/호텔',
            rating: 4.0,
            reviewCount: 23,
            status: 'inactive',
            createdAt: '2025-01-10',
            updatedAt: '2025-01-12'
          }
        ];
        setFacilities(demoFacilities);
      }
    } catch (error) {
      console.error('시설 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterFacilities = () => {
    let filtered = facilities;

    // 검색어 필터
    if (searchTerm) {
      filtered = filtered.filter(facility =>
        facility.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        facility.address.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(facility => facility.status === statusFilter);
    }

    // 카테고리 필터
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(facility => facility.category === categoryFilter);
    }

    setFilteredFacilities(filtered);
  };

  const updateFacilityStatus = async (id: number, status: 'active' | 'inactive') => {
    try {
      const response = await fetch(`/api/admin/facilities/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        setFacilities(prev =>
          prev.map(facility =>
            facility.id === id ? { ...facility, status } : facility
          )
        );
      }
    } catch (error) {
      console.error('시설 상태 업데이트 실패:', error);
    }
  };

  const deleteFacility = async (id: number) => {
    if (!window.confirm('정말로 이 시설을 삭제하시겠습니까?')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/facilities/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setFacilities(prev => prev.filter(facility => facility.id !== id));
      }
    } catch (error) {
      console.error('시설 삭제 실패:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const classes = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800'
    };

    const labels = {
      active: '활성',
      pending: '승인대기',
      inactive: '비활성'
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${classes[status as keyof typeof classes]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">시설 관리</h1>
            <p className="text-gray-600">등록된 펫 시설을 관리하세요</p>
          </div>
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            새 시설 추가
          </button>
        </div>
      </div>

      {/* 필터 및 검색 */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="시설명 또는 주소 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">모든 상태</option>
            <option value="active">활성</option>
            <option value="pending">승인대기</option>
            <option value="inactive">비활성</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="all">모든 카테고리</option>
            <option value="동물병원">동물병원</option>
            <option value="카페/레스토랑">카페/레스토랑</option>
            <option value="펜션/호텔">펜션/호텔</option>
            <option value="미용실">미용실</option>
            <option value="용품점">용품점</option>
          </select>

          <div className="flex items-center text-sm text-gray-600">
            <Filter className="w-4 h-4 mr-1" />
            총 {filteredFacilities.length}개 시설
          </div>
        </div>
      </div>

      {/* 시설 목록 */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  시설 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  카테고리
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  평점
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  등록일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredFacilities.map((facility) => (
                <tr key={facility.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {facility.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {facility.address}
                      </div>
                      <div className="text-sm text-gray-500">
                        📞 {facility.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{facility.category}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span className="text-sm text-gray-900">{facility.rating}</span>
                      <span className="text-xs text-gray-500 ml-1">
                        ({facility.reviewCount})
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(facility.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {facility.createdAt}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button className="text-indigo-600 hover:text-indigo-900">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="text-green-600 hover:text-green-900">
                      <Edit className="w-4 h-4" />
                    </button>
                    {facility.status === 'pending' && (
                      <>
                        <button 
                          onClick={() => updateFacilityStatus(facility.id, 'active')}
                          className="text-green-600 hover:text-green-900"
                          title="승인"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => updateFacilityStatus(facility.id, 'inactive')}
                          className="text-red-600 hover:text-red-900"
                          title="거부"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    )}
                    <button 
                      onClick={() => deleteFacility(facility.id)}
                      className="text-red-600 hover:text-red-900"
                      title="삭제"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {filteredFacilities.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">시설이 없습니다</h3>
            <p className="mt-1 text-sm text-gray-500">
              검색 조건에 맞는 시설이 없거나 아직 등록된 시설이 없습니다.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FacilityManagement;