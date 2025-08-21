import React, { useState, useEffect } from 'react';
import { 
  Users, 
  MapPin, 
  Star, 
  MessageSquare, 
  DollarSign,
  TrendingUp,
  Activity,
  Calendar,
  Settings,
  Plus
} from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalFacilities: number;
  totalReviews: number;
  averageRating: number;
  monthlyRevenue: number;
  activeUsers: number;
  recentSignups: number;
  pendingReviews: number;
}

interface RecentActivity {
  id: number;
  type: 'user_signup' | 'facility_added' | 'review_posted' | 'booking_made';
  user: string;
  description: string;
  timestamp: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalFacilities: 0,
    totalReviews: 0,
    averageRating: 0,
    monthlyRevenue: 0,
    activeUsers: 0,
    recentSignups: 0,
    pendingReviews: 0,
  });

  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // API 호출로 대시보드 데이터 가져오기
      const response = await fetch('/api/admin/dashboard');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
        setRecentActivity(data.recentActivity);
      } else {
        // 임시 데모 데이터
        setStats({
          totalUsers: 1245,
          totalFacilities: 89,
          totalReviews: 523,
          averageRating: 4.3,
          monthlyRevenue: 45600,
          activeUsers: 324,
          recentSignups: 28,
          pendingReviews: 12
        });
        
        setRecentActivity([
          {
            id: 1,
            type: 'user_signup',
            user: '김민수',
            description: '새로운 사용자가 가입했습니다',
            timestamp: '2시간 전'
          },
          {
            id: 2,
            type: 'facility_added',
            user: '박영희',
            description: '새로운 동물병원이 등록되었습니다',
            timestamp: '4시간 전'
          },
          {
            id: 3,
            type: 'review_posted',
            user: '이철수',
            description: '펫프렌들리 카페에 리뷰를 작성했습니다',
            timestamp: '6시간 전'
          }
        ]);
      }
    } catch (error) {
      console.error('대시보드 데이터 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'positive' | 'negative' | 'neutral';
  }> = ({ icon, title, value, change, changeType = 'neutral' }) => (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs ${
              changeType === 'positive' ? 'text-green-600' : 
              changeType === 'negative' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {change}
            </p>
          )}
        </div>
        <div className="text-indigo-600">
          {icon}
        </div>
      </div>
    </div>
  );

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user_signup':
        return <Users className="w-4 h-4 text-blue-500" />;
      case 'facility_added':
        return <MapPin className="w-4 h-4 text-green-500" />;
      case 'review_posted':
        return <MessageSquare className="w-4 h-4 text-purple-500" />;
      case 'booking_made':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
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
        <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
        <p className="text-gray-600">PetPlace 플랫폼 현황을 한눈에 확인하세요</p>
      </div>

      {/* 주요 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          icon={<Users className="w-8 h-8" />}
          title="총 사용자"
          value={stats.totalUsers.toLocaleString()}
          change={`+${stats.recentSignups} 이번 달`}
          changeType="positive"
        />
        <StatCard
          icon={<MapPin className="w-8 h-8" />}
          title="등록 시설"
          value={stats.totalFacilities.toLocaleString()}
          change="+5 이번 주"
          changeType="positive"
        />
        <StatCard
          icon={<Star className="w-8 h-8" />}
          title="평균 평점"
          value={stats.averageRating.toFixed(1)}
          change="+0.2 전월 대비"
          changeType="positive"
        />
        <StatCard
          icon={<MessageSquare className="w-8 h-8" />}
          title="총 리뷰"
          value={stats.totalReviews.toLocaleString()}
          change={`${stats.pendingReviews}개 승인 대기`}
          changeType="neutral"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* 수익 정보 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">월간 수익</h2>
            <DollarSign className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-3xl font-bold text-green-600 mb-2">
            ₩{stats.monthlyRevenue.toLocaleString()}
          </div>
          <div className="flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            +12% 전월 대비
          </div>
        </div>

        {/* 활성 사용자 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">활성 사용자</h2>
            <Activity className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600 mb-2">
            {stats.activeUsers.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">
            지난 30일 기준
          </div>
        </div>

        {/* 빠른 액션 */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">빠른 작업</h2>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" />
              새 시설 추가
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <MessageSquare className="w-4 h-4 mr-2" />
              리뷰 승인 ({stats.pendingReviews})
            </button>
            <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              <Settings className="w-4 h-4 mr-2" />
              시스템 설정
            </button>
          </div>
        </div>
      </div>

      {/* 최근 활동 */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold mb-4">최근 활동</h2>
        <div className="space-y-4">
          {recentActivity.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              {getActivityIcon(activity.type)}
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {activity.user}
                </p>
                <p className="text-sm text-gray-600">
                  {activity.description}
                </p>
              </div>
              <div className="text-xs text-gray-500">
                {activity.timestamp}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4">
          <button className="text-indigo-600 hover:text-indigo-900 text-sm font-medium">
            모든 활동 보기 →
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;