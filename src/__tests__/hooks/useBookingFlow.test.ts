import { renderHook, act } from '@testing-library/react';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { useAuth } from '@/components/AuthProvider';
import { supabase } from '@/integrations/supabase/client';

// Mock dependencies
jest.mock('@/components/AuthProvider');
jest.mock('@/integrations/supabase/client');

describe('useBookingFlow', () => {
  const mockUser = { id: 'user-123' };
  const mockProfile = { phone: '9876543210' };
  const mockCar = {
    id: 'car-123',
    title: 'Test Car',
    model: 'Model X',
    make: 'Test Make',
    year: 2023,
    image: 'test-image.jpg',
    images: ['test-image.jpg'],
    pricePerDay: 1000,
    location: 'Hyderabad',
    fuel: 'Petrol',
    transmission: 'Manual',
    seats: 5,
    rating: 4.5,
    reviewCount: 10,
    isAvailable: true,
    badges: ['Available'],
    thumbnail: 'test-thumbnail.jpg',
    bookingStatus: 'available',
    price_in_paise: 100000,
    image_urls: ['test-image.jpg'],
    image_paths: ['test-path'],
    status: 'published',
    isArchived: false,
  };

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      user: mockUser,
      profile: mockProfile,
    });
    
    (supabase.storage.from as jest.Mock).mockReturnValue({
      upload: jest.fn().mockResolvedValue({ error: null }),
    });
    
    (supabase.from as jest.Mock).mockReturnValue({
      insert: jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({ data: {}, error: null }),
        }),
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    expect(result.current.isBookingModalOpen).toBe(false);
    expect(result.current.bookingData).toBeNull();
  });

  it('should open booking modal when user has phone number', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    expect(result.current.isBookingModalOpen).toBe(true);
    expect(result.current.bookingData).toEqual({
      car: mockCar,
      startDate: null,
      endDate: null,
      startTime: '10:00',
      endTime: '18:00',
      termsAccepted: false,
      licenseId: null,
      paymentChoice: null,
    });
  });

  it('should close booking modal and reset state', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    // Open modal first
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    // Then close it
    act(() => {
      result.current.closeBookingModal();
    });
    
    expect(result.current.isBookingModalOpen).toBe(false);
    expect(result.current.bookingData).toBeNull();
  });

  it('should handle date time submission correctly', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    const startDate = new Date('2025-10-15');
    const endDate = new Date('2025-10-17');
    const startTime = '09:00';
    const endTime = '17:00';
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    act(() => {
      result.current.handleDateTimeSubmit(startDate, endDate, startTime, endTime);
    });
    
    expect(result.current.bookingData?.startDate).toEqual(startDate);
    expect(result.current.bookingData?.endDate).toEqual(endDate);
    expect(result.current.bookingData?.startTime).toBe(startTime);
    expect(result.current.bookingData?.endTime).toBe(endTime);
  });

  it('should validate date time submission', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    // Test with invalid dates (end date before start date)
    const startDate = new Date('2025-10-17');
    const endDate = new Date('2025-10-15');
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    act(() => {
      const success = result.current.handleDateTimeSubmit(startDate, endDate, '10:00', '18:00');
      expect(success).toBe(false);
    });
  });

  it('should handle terms acceptance', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    act(() => {
      const success = result.current.handleTermsAccept(true);
      expect(success).toBe(true);
    });
    
    expect(result.current.bookingData?.termsAccepted).toBe(true);
  });

  it('should reject terms when not accepted', () => {
    const { result } = renderHook(() => useBookingFlow());
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    act(() => {
      const success = result.current.handleTermsAccept(false);
      expect(success).toBe(false);
    });
    
    expect(result.current.bookingData?.termsAccepted).toBe(false);
  });

  it('should handle license upload', async () => {
    const { result } = renderHook(() => useBookingFlow());
    
    const mockFile = new File(['test'], 'license.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    await act(async () => {
      const licenseId = await result.current.handleLicenseUpload(mockFile);
      expect(licenseId).toBeTruthy();
    });
  });

  it('should validate license file type', async () => {
    const { result } = renderHook(() => useBookingFlow());
    
    const mockFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    await act(async () => {
      const licenseId = await result.current.handleLicenseUpload(mockFile);
      expect(licenseId).toBeNull();
    });
  });

  it('should validate license file size', async () => {
    const { result } = renderHook(() => useBookingFlow());
    
    // Create a large file (6MB)
    const largeFileContent = new ArrayBuffer(6 * 1024 * 1024);
    const mockFile = new File([largeFileContent], 'large-license.jpg', { type: 'image/jpeg' });
    
    act(() => {
      result.current.openBookingModal(mockCar);
    });
    
    await act(async () => {
      const licenseId = await result.current.handleLicenseUpload(mockFile);
      expect(licenseId).toBeNull();
    });
  });
});