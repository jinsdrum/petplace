import axios, { AxiosResponse } from 'axios';

// API Base URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          });

          const { access_token } = response.data.data;
          localStorage.setItem('access_token', access_token);

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// API Types
export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string;
  phone?: string;
  profile_image?: string;
  bio?: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  is_premium: boolean;
  pet_types: string[];
  address?: string;
  created_at: string;
  last_login_at?: string;
}

export interface Business {
  id: string;
  name: string;
  description?: string;
  category: string;
  phone?: string;
  email?: string;
  website?: string;
  address: string;
  address_detail?: string;
  latitude: number;
  longitude: number;
  business_hours?: Record<string, string>;
  holiday_info?: string;
  parking_available: boolean;
  wifi_available: boolean;
  outdoor_seating: boolean;
  pet_allowed_types: string[];
  pet_size_limit?: string;
  pet_fee?: number;
  pet_facilities?: string[];
  pet_rules?: string;
  main_image?: string;
  gallery_images?: string[];
  status: string;
  is_premium: boolean;
  is_featured: boolean;
  view_count: number;
  favorite_count: number;
  review_count: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  nickname?: string;
  phone?: string;
  pet_types?: string[];
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    tokens: {
      access_token: string;
      refresh_token: string;
    };
  };
  message: string;
}

// Auth API
export const authAPI = {
  register: (data: RegisterData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/register', data),

  login: (data: LoginData): Promise<AxiosResponse<AuthResponse>> =>
    api.post('/auth/login', data),

  refresh: (): Promise<AxiosResponse<{ data: { access_token: string } }>> =>
    api.post('/auth/refresh'),

  getCurrentUser: (): Promise<AxiosResponse<{ data: User }>> =>
    api.get('/auth/me'),

  updateProfile: (data: Partial<User>): Promise<AxiosResponse<{ data: User }>> =>
    api.put('/auth/update-profile', data),

  changePassword: (data: { current_password: string; new_password: string }): Promise<AxiosResponse> =>
    api.put('/auth/change-password', data),
};

// Business API
export const businessAPI = {
  getBusinesses: (params?: {
    category?: string;
    pet_type?: string;
    lat?: number;
    lng?: number;
    radius?: number;
    search?: string;
    page?: number;
    per_page?: number;
  }): Promise<AxiosResponse<{ data: { businesses: Business[]; pagination: any } }>> =>
    api.get('/businesses', { params }),

  getBusiness: (id: string): Promise<AxiosResponse<{ data: Business }>> =>
    api.get(`/businesses/${id}`),

  createBusiness: (data: Partial<Business>): Promise<AxiosResponse<{ data: Business }>> =>
    api.post('/businesses', data),

  updateBusiness: (id: string, data: Partial<Business>): Promise<AxiosResponse<{ data: Business }>> =>
    api.put(`/businesses/${id}`, data),

  deleteBusiness: (id: string): Promise<AxiosResponse> =>
    api.delete(`/businesses/${id}`),

  getCategories: (): Promise<AxiosResponse<{ data: Array<{ code: string; name: string; count: number }> }>> =>
    api.get('/businesses/categories'),

  getFeatured: (): Promise<AxiosResponse<{ data: Business[] }>> =>
    api.get('/businesses/featured'),

  searchNearby: (data: {
    latitude: number;
    longitude: number;
    radius?: number;
    category?: string;
    pet_type?: string;
    limit?: number;
  }): Promise<AxiosResponse<{ data: Business[] }>> =>
    api.post('/businesses/nearby', data),
};

// User API
export const userAPI = {
  getDashboard: (): Promise<AxiosResponse<{ data: any }>> =>
    api.get('/users/dashboard'),

  getProfile: (userId: string): Promise<AxiosResponse<{ data: User }>> =>
    api.get(`/users/profile/${userId}`),

  getNotifications: (params?: {
    unread_only?: boolean;
    type?: string;
    page?: number;
    per_page?: number;
  }): Promise<AxiosResponse<{ data: any }>> =>
    api.get('/users/notifications', { params }),

  markNotificationRead: (notificationId: string): Promise<AxiosResponse> =>
    api.put(`/users/notifications/${notificationId}/read`),

  markAllNotificationsRead: (): Promise<AxiosResponse> =>
    api.put('/users/notifications/read-all'),

  getSettings: (): Promise<AxiosResponse<{ data: any }>> =>
    api.get('/users/settings'),

  updateSettings: (data: any): Promise<AxiosResponse> =>
    api.put('/users/settings', data),
};

// Review types
export interface Review {
  id: string;
  user_id: string;
  business_id: string;
  rating: number;
  content: string;
  pet_type?: string;
  visit_date?: string;
  recommendation?: string;
  images: string[];
  helpful_count?: number;
  status: 'active' | 'hidden' | 'reported';
  created_at: string;
  updated_at: string;
  user?: User;
  business?: Business;
}

export interface ReviewFormData {
  business_id: string;
  rating: number;
  content: string;
  pet_type?: string;
  visit_date?: string;
  recommendation?: string;
  images?: string[];
}

// Review API
export const reviewAPI = {
  // Create a new review
  createReview: (data: ReviewFormData): Promise<AxiosResponse<{ data: { review: Review } }>> =>
    api.post('/reviews', data),

  // Update an existing review
  updateReview: (reviewId: string, data: Partial<ReviewFormData>): Promise<AxiosResponse<{ data: { review: Review } }>> =>
    api.put(`/reviews/${reviewId}`, data),

  // Delete a review
  deleteReview: (reviewId: string): Promise<AxiosResponse> =>
    api.delete(`/reviews/${reviewId}`),

  // Get a specific review
  getReview: (reviewId: string): Promise<AxiosResponse<{ data: { review: Review } }>> =>
    api.get(`/reviews/${reviewId}`),

  // Get reviews for a business
  getBusinessReviews: (businessId: string, params?: {
    page?: number;
    per_page?: number;
    sort_by?: 'newest' | 'oldest' | 'rating_high' | 'rating_low';
  }): Promise<AxiosResponse<{
    data: {
      reviews: Review[];
      pagination: any;
      rating_distribution: { [key: string]: number };
      average_rating: number;
      total_reviews: number;
    }
  }>> =>
    api.get(`/businesses/${businessId}/reviews`, { params }),

  // Get reviews by a user
  getUserReviews: (userId: string, params?: {
    page?: number;
    per_page?: number;
  }): Promise<AxiosResponse<{
    data: {
      reviews: Review[];
      pagination: any;
    }
  }>> =>
    api.get(`/users/${userId}/reviews`, { params }),

  // Get all reviews (for admin or general listing)
  getAllReviews: (params?: {
    page?: number;
    per_page?: number;
    business_id?: string;
    user_id?: string;
    min_rating?: number;
    max_rating?: number;
  }): Promise<AxiosResponse<{
    data: {
      reviews: Review[];
      pagination: any;
    }
  }>> =>
    api.get('/reviews', { params }),
};

// Blog interfaces and API
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string;
  category: string;
  featured_image?: string;
  status: 'draft' | 'published';
  view_count: number;
  like_count: number;
  estimated_read_time: number;
  created_at: string;
  updated_at: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  author?: {
    id: string;
    name: string;
    email: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  affiliate_links?: AffiliateLink[];
}

export interface BlogPostFormData {
  title: string;
  content: string;
  excerpt?: string;
  category?: string;
  featured_image?: string;
  status?: 'draft' | 'published';
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  tags?: string[];
  affiliate_links?: Array<{
    product_name: string;
    product_url: string;
    affiliate_url: string;
    platform: string;
    commission_rate?: number;
  }>;
}

export interface AffiliateLink {
  id: string;
  product_name: string;
  product_url: string;
  affiliate_url: string;
  platform: string;
  commission_rate: number;
  click_count: number;
  conversion_count: number;
  total_earnings: number;
  created_at: string;
  blog_post?: {
    id: string;
    title: string;
    slug: string;
  };
}

export interface AffiliateProduct {
  id: string;
  name: string;
  price: number;
  image_url: string;
  product_url: string;
  affiliate_url: string;
  rating: number;
  review_count: number;
  commission_rate: number;
  platform: string;
}

export const blogAPI = {
  getPosts: (params?: {
    page?: number;
    per_page?: number;
    search?: string;
    category?: string;
    tag?: string;
    sort_by?: 'newest' | 'oldest' | 'popular' | 'title';
    status?: 'published' | 'draft' | 'all';
  }): Promise<AxiosResponse<{ data: { posts: BlogPost[], pagination: any } }>> =>
    api.get('/blog/posts', { params }),
  
  getPost: (slug: string): Promise<AxiosResponse<{ data: { post: BlogPost } }>> =>
    api.get(`/blog/posts/${slug}`),
  
  createPost: (data: BlogPostFormData): Promise<AxiosResponse<{ data: { blog_post: BlogPost } }>> =>
    api.post('/blog/posts', data),
  
  updatePost: (postId: string, data: Partial<BlogPostFormData>): Promise<AxiosResponse<{ message: string }>> =>
    api.put(`/blog/posts/${postId}`, data),
  
  deletePost: (postId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/blog/posts/${postId}`),
  
  likePost: (postId: string): Promise<AxiosResponse<{ data: { like_count: number } }>> =>
    api.post(`/blog/posts/${postId}/like`),
  
  getCategories: (): Promise<AxiosResponse<{ data: { categories: string[] } }>> =>
    api.get('/blog/categories'),
  
  getTags: (): Promise<AxiosResponse<{ data: { tags: Array<{ id: string; name: string }> } }>> =>
    api.get('/blog/tags')
};

export const affiliateAPI = {
  getLinks: (params?: {
    page?: number;
    per_page?: number;
    platform?: string;
  }): Promise<AxiosResponse<{ data: { links: AffiliateLink[], pagination: any } }>> =>
    api.get('/affiliate/links', { params }),
  
  createLink: (data: {
    product_name: string;
    product_url: string;
    affiliate_url: string;
    platform: string;
    commission_rate?: number;
    blog_post_id?: string;
  }): Promise<AxiosResponse<{ data: { affiliate_link: AffiliateLink } }>> =>
    api.post('/affiliate/links', data),
  
  trackClick: (linkId: string): Promise<AxiosResponse<any>> =>
    api.post(`/affiliate/links/${linkId}/click`),
  
  trackConversion: (linkId: string, data: { commission_amount: number }): Promise<AxiosResponse<{ message: string }>> =>
    api.post(`/affiliate/links/${linkId}/conversion`, data),
  
  getStats: (params?: {
    period?: 'day' | 'week' | 'month' | 'year';
  }): Promise<AxiosResponse<{ data: any }>> =>
    api.get('/affiliate/stats', { params }),
  
  searchProducts: (params: {
    query: string;
    platform?: string;
    limit?: number;
  }): Promise<AxiosResponse<{ data: { products: AffiliateProduct[] } }>> =>
    api.get('/affiliate/products/search', { params }),
  
  getRecommendedProducts: (params?: {
    category?: string;
    limit?: number;
  }): Promise<AxiosResponse<{ data: { products: AffiliateProduct[] } }>> =>
    api.get('/affiliate/products/recommend', { params }),
  
  getEarningsReport: (params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<AxiosResponse<{ data: any }>> =>
    api.get('/affiliate/earnings/report', { params })
};

export default api;