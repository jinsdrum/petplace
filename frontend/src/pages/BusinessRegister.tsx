import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { businessAPI } from '../services/api';

interface BusinessFormData {
  name: string;
  description: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  address_detail: string;
  business_hours: Record<string, string>;
  holiday_info: string;
  parking_available: boolean;
  wifi_available: boolean;
  outdoor_seating: boolean;
  pet_allowed_types: string[];
  pet_size_limit: string;
  pet_fee: number;
  pet_facilities: string[];
  pet_rules: string;
}

const BusinessRegister: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<BusinessFormData>({
    name: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website: '',
    address: '',
    address_detail: '',
    business_hours: {
      monday: '',
      tuesday: '',
      wednesday: '',
      thursday: '',
      friday: '',
      saturday: '',
      sunday: ''
    },
    holiday_info: '',
    parking_available: false,
    wifi_available: false,
    outdoor_seating: false,
    pet_allowed_types: [],
    pet_size_limit: '',
    pet_fee: 0,
    pet_facilities: [],
    pet_rules: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentStep, setCurrentStep] = useState(1);

  const categories = [
    { code: 'restaurant', name: '식당/카페' },
    { code: 'accommodation', name: '숙박시설' },
    { code: 'veterinary', name: '동물병원' },
    { code: 'grooming', name: '미용실' },
    { code: 'park', name: '공원/놀이터' },
    { code: 'shopping', name: '쇼핑몰/매장' },
    { code: 'entertainment', name: '놀이시설' },
    { code: 'training', name: '훈련소' },
    { code: 'daycare', name: '펜션/호텔' },
    { code: 'other', name: '기타' }
  ];

  const petTypes = [
    { code: 'dog', name: '강아지', icon: '🐕' },
    { code: 'cat', name: '고양이', icon: '🐱' },
    { code: 'rabbit', name: '토끼', icon: '🐰' },
    { code: 'bird', name: '새', icon: '🐦' },
    { code: 'fish', name: '물고기', icon: '🐠' },
    { code: 'hamster', name: '햄스터', icon: '🐹' },
    { code: 'other', name: '기타', icon: '🐾' }
  ];

  const petFacilities = [
    '물그릇', '사료그릇', '배변패드', '리드줄', '목줄', '캐리어',
    '놀이터', '산책로', '목욕시설', '미용시설', '의료시설'
  ];

  const daysOfWeek = [
    { key: 'monday', name: '월요일' },
    { key: 'tuesday', name: '화요일' },
    { key: 'wednesday', name: '수요일' },
    { key: 'thursday', name: '목요일' },
    { key: 'friday', name: '금요일' },
    { key: 'saturday', name: '토요일' },
    { key: 'sunday', name: '일요일' }
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? Number(value) : value
    }));
  };

  const handleBusinessHoursChange = (day: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: value
      }
    }));
  };

  const handlePetTypeChange = (petType: string) => {
    setFormData(prev => ({
      ...prev,
      pet_allowed_types: prev.pet_allowed_types.includes(petType)
        ? prev.pet_allowed_types.filter(type => type !== petType)
        : [...prev.pet_allowed_types, petType]
    }));
  };

  const handlePetFacilityChange = (facility: string) => {
    setFormData(prev => ({
      ...prev,
      pet_facilities: prev.pet_facilities.includes(facility)
        ? prev.pet_facilities.filter(f => f !== facility)
        : [...prev.pet_facilities, facility]
    }));
  };

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return formData.name && formData.category && formData.address;
      case 2:
        return true; // Optional fields
      case 3:
        return formData.pet_allowed_types.length > 0;
      default:
        return true;
    }
  };

  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4));
    } else {
      setError('필수 항목을 모두 입력해주세요.');
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) {
      setError('필수 항목을 모두 입력해주세요.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await businessAPI.createBusiness(formData);
      navigate(`/businesses/${response.data.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || '사업체 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
      <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>기본 정보</h3>
      
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          사업체명 *
        </label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleInputChange}
          className="form-input"
          placeholder="사업체 이름을 입력하세요"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category" className="form-label">
          카테고리 *
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleInputChange}
          className="form-select"
          required
        >
          <option value="">카테고리를 선택하세요</option>
          {categories.map(category => (
            <option key={category.code} value={category.code}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="address" className="form-label">
          주소 *
        </label>
        <input
          id="address"
          type="text"
          name="address"
          value={formData.address}
          onChange={handleInputChange}
          className="form-input"
          style={{marginBottom: '0.5rem'}}
          placeholder="기본 주소"
          required
        />
        <input
          type="text"
          name="address_detail"
          value={formData.address_detail}
          onChange={handleInputChange}
          className="form-input"
          placeholder="상세 주소 (선택사항)"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          사업체 소개
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          rows={4}
          className="form-textarea"
          placeholder="사업체에 대한 소개를 작성해주세요"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
      <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>연락처 및 운영정보</h3>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem'}}>
        <div className="form-group">
          <label htmlFor="phone" className="form-label">
            전화번호
          </label>
          <input
            id="phone"
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="form-input"
            placeholder="02-1234-5678"
          />
        </div>

        <div className="form-group">
          <label htmlFor="email" className="form-label">
            이메일
          </label>
          <input
            id="email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            className="form-input"
            placeholder="contact@example.com"
          />
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="website" className="form-label">
          웹사이트
        </label>
        <input
          id="website"
          type="url"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          className="form-input"
          placeholder="https://example.com"
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{marginBottom: '1rem'}}>
          영업시간
        </label>
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.5rem'}}>
          {daysOfWeek.map(day => (
            <div key={day.key} style={{display: 'flex', alignItems: 'center', gap: '1rem'}}>
              <div style={{width: '4rem', fontSize: '0.875rem', color: 'var(--gray-600)'}}>{day.name}</div>
              <input
                type="text"
                value={formData.business_hours[day.key]}
                onChange={(e) => handleBusinessHoursChange(day.key, e.target.value)}
                className="form-input"
                style={{flex: '1'}}
                placeholder="09:00 - 18:00 또는 휴무"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="holiday_info" className="form-label">
          휴무일 정보
        </label>
        <input
          id="holiday_info"
          type="text"
          name="holiday_info"
          value={formData.holiday_info}
          onChange={handleInputChange}
          className="form-input"
          placeholder="매주 월요일, 명절 당일"
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{marginBottom: '1rem'}}>
          편의시설
        </label>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem'}}>
          <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
            <input
              type="checkbox"
              name="parking_available"
              checked={formData.parking_available}
              onChange={handleInputChange}
              style={{marginRight: '0.5rem'}}
            />
            <span style={{fontSize: '0.875rem', color: 'var(--gray-700)'}}>🅿️ 주차 가능</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
            <input
              type="checkbox"
              name="wifi_available"
              checked={formData.wifi_available}
              onChange={handleInputChange}
              style={{marginRight: '0.5rem'}}
            />
            <span style={{fontSize: '0.875rem', color: 'var(--gray-700)'}}>📶 WiFi</span>
          </label>
          <label style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
            <input
              type="checkbox"
              name="outdoor_seating"
              checked={formData.outdoor_seating}
              onChange={handleInputChange}
              style={{marginRight: '0.5rem'}}
            />
            <span style={{fontSize: '0.875rem', color: 'var(--gray-700)'}}>🌿 야외 좌석</span>
          </label>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
      <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>반려동물 정보</h3>
      
      <div className="form-group">
        <label className="form-label" style={{marginBottom: '1rem'}}>
          입장 가능한 반려동물 * (복수 선택 가능)
        </label>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.75rem'}}>
          {petTypes.map(petType => (
            <div
              key={petType.code}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '0.75rem',
                borderRadius: 'var(--border-radius-lg)',
                border: `2px solid ${formData.pet_allowed_types.includes(petType.code) ? 'var(--primary-500)' : 'var(--gray-300)'}`,
                background: formData.pet_allowed_types.includes(petType.code) ? 'var(--primary-50)' : 'white',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handlePetTypeChange(petType.code)}
            >
              <span style={{fontSize: '1.25rem', marginRight: '0.5rem'}}>{petType.icon}</span>
              <span style={{fontSize: '0.875rem', fontWeight: '500'}}>{petType.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pet_size_limit" className="form-label">
          크기 제한
        </label>
        <select
          id="pet_size_limit"
          name="pet_size_limit"
          value={formData.pet_size_limit}
          onChange={handleInputChange}
          className="form-select"
        >
          <option value="">제한 없음</option>
          <option value="small">소형견만 (10kg 이하)</option>
          <option value="medium">중형견까지 (25kg 이하)</option>
          <option value="large">대형견 가능</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="pet_fee" className="form-label">
          반려동물 입장료 (원)
        </label>
        <input
          id="pet_fee"
          type="number"
          name="pet_fee"
          value={formData.pet_fee}
          onChange={handleInputChange}
          min="0"
          className="form-input"
          placeholder="0"
        />
      </div>

      <div className="form-group">
        <label className="form-label" style={{marginBottom: '1rem'}}>
          반려동물 전용 시설 (복수 선택 가능)
        </label>
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem'}}>
          {petFacilities.map(facility => (
            <label key={facility} style={{display: 'flex', alignItems: 'center', cursor: 'pointer'}}>
              <input
                type="checkbox"
                checked={formData.pet_facilities.includes(facility)}
                onChange={() => handlePetFacilityChange(facility)}
                style={{marginRight: '0.5rem'}}
              />
              <span style={{fontSize: '0.875rem', color: 'var(--gray-700)'}}>{facility}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="pet_rules" className="form-label">
          이용 규칙 및 주의사항
        </label>
        <textarea
          id="pet_rules"
          name="pet_rules"
          value={formData.pet_rules}
          onChange={handleInputChange}
          rows={4}
          className="form-textarea"
          placeholder="반려동물 이용 시 지켜야 할 규칙이나 주의사항을 작성해주세요"
        />
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
      <h3 style={{fontSize: '1.125rem', fontWeight: '600', color: 'var(--gray-900)'}}>등록 완료</h3>
      
      <div style={{
        background: 'var(--gray-50)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1.5rem'
      }}>
        <h4 style={{fontWeight: '500', color: 'var(--gray-900)', marginBottom: '1rem'}}>입력하신 정보를 확인해주세요</h4>
        
        <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.875rem'}}>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{color: 'var(--gray-600)'}}>사업체명:</span>
            <span style={{color: 'var(--gray-900)', fontWeight: '500'}}>{formData.name}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{color: 'var(--gray-600)'}}>카테고리:</span>
            <span style={{color: 'var(--gray-900)', fontWeight: '500'}}>
              {categories.find(c => c.code === formData.category)?.name}
            </span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{color: 'var(--gray-600)'}}>주소:</span>
            <span style={{color: 'var(--gray-900)', fontWeight: '500'}}>{formData.address}</span>
          </div>
          <div style={{display: 'flex', justifyContent: 'space-between'}}>
            <span style={{color: 'var(--gray-600)'}}>반려동물:</span>
            <span style={{color: 'var(--gray-900)', fontWeight: '500'}}>
              {formData.pet_allowed_types.map(type => 
                petTypes.find(p => p.code === type)?.name
              ).join(', ')}
            </span>
          </div>
        </div>
      </div>

      <div style={{
        background: 'var(--primary-50)',
        border: '1px solid var(--primary-200)',
        borderRadius: 'var(--border-radius-lg)',
        padding: '1rem'
      }}>
        <div style={{display: 'flex'}}>
          <div style={{flexShrink: 0}}>
            <span style={{color: 'var(--primary-600)', fontSize: '1.25rem'}}>ℹ️</span>
          </div>
          <div style={{marginLeft: '0.75rem'}}>
            <h3 style={{fontSize: '0.875rem', fontWeight: '600', color: 'var(--primary-800)', marginBottom: '0.5rem'}}>
              승인 절차 안내
            </h3>
            <div style={{fontSize: '0.875rem', color: 'var(--primary-700)'}}>
              <p>
                등록하신 사업체는 관리자 검토 후 승인됩니다. 
                승인까지 1-2일 정도 소요되며, 승인 결과는 이메일로 알려드립니다.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{minHeight: '100vh', background: 'var(--gray-50)', padding: '3rem 0'}}>
      <div className="container" style={{maxWidth: '48rem'}}>
        {/* Header */}
        <div style={{textAlign: 'center', marginBottom: '2rem'}}>
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>🏢</div>
          <h1 style={{fontSize: '1.875rem', fontWeight: '800', color: 'var(--gray-900)', marginBottom: '0.5rem'}}>
            사업체 등록
          </h1>
          <p style={{color: 'var(--gray-600)'}}>
            반려동물 친화적인 사업체를 등록하고 더 많은 고객과 만나보세요
          </p>
        </div>

        {/* Progress Steps */}
        <div style={{marginBottom: '2rem'}}>
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
            {[1, 2, 3, 4].map((step) => (
              <div key={step} style={{display: 'flex', alignItems: 'center'}}>
                <div
                  style={{
                    width: '2rem',
                    height: '2rem',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.875rem',
                    fontWeight: '600',
                    background: step <= currentStep ? 'var(--primary-600)' : 'var(--gray-300)',
                    color: step <= currentStep ? 'white' : 'var(--gray-600)'
                  }}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    style={{
                      width: '3rem',
                      height: '2px',
                      margin: '0 0.5rem',
                      background: step < currentStep ? 'var(--primary-600)' : 'var(--gray-300)'
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <div style={{display: 'flex', justifyContent: 'center', marginTop: '0.5rem'}}>
            <div style={{fontSize: '0.875rem', color: 'var(--gray-600)'}}>
              {currentStep === 1 && '기본 정보'}
              {currentStep === 2 && '운영 정보'}
              {currentStep === 3 && '반려동물 정보'}
              {currentStep === 4 && '등록 완료'}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="card">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="error" style={{marginBottom: '1.5rem'}}>
                {error}
              </div>
            )}

            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}
            {currentStep === 4 && renderStep4()}

            {/* Navigation Buttons */}
            <div style={{display: 'flex', justifyContent: 'space-between', marginTop: '2rem'}}>
              {currentStep > 1 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="btn btn-secondary"
                >
                  이전
                </button>
              ) : (
                <div></div>
              )}

              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="btn btn-primary"
                >
                  다음
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary"
                  style={{opacity: loading ? '0.5' : '1', cursor: loading ? 'not-allowed' : 'pointer'}}
                >
                  {loading ? '등록 중...' : '등록하기'}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BusinessRegister;