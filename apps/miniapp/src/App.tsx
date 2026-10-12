import React, { useEffect, useState } from 'react';
import { useTelegram } from './lib/telegram';
import { Service, Barber, Booking, BookingFormState, AppTab } from './types';
import { fetchServices, fetchBarbers, fetchTelegramBookings } from './lib/api';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { ServiceStep } from './components/ServiceStep';
import { BarberStep } from './components/BarberStep';
import { DateTimeStep } from './components/DateTimeStep';
import { ContactStep } from './components/ContactStep';
import { ConfirmationStep } from './components/ConfirmationStep';
import { SuccessStep } from './components/SuccessStep';
import { MyBookingsTab } from './components/MyBookingsTab';
import { CatalogTab } from './components/CatalogTab';

type BookingStep = 'service' | 'barber' | 'datetime' | 'contact' | 'confirmation' | 'success';

export const App: React.FC = () => {
  const tg = useTelegram();

  // Tab & Flow states
  const [currentTab, setCurrentTab] = useState<AppTab>('booking');
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');

  // Loaded DB data
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [activeBookingCount, setActiveBookingCount] = useState(0);

  // Completed booking result
  const [completedBooking, setCompletedBooking] = useState<Booking | null>(null);

  // Form State
  const [formState, setFormState] = useState<BookingFormState>({
    selectedServiceIds: [],
    selectedBarberId: 'any',
    selectedDate: '',
    selectedTime: '',
    clientName: tg.user ? `${tg.user.first_name || ''} ${tg.user.last_name || ''}`.trim() : '',
    clientPhone: '',
    comment: '',
  });

  // Load services and barbers
  useEffect(() => {
    async function loadData() {
      setLoadingInitial(true);
      try {
        const [sList, bList] = await Promise.all([
          fetchServices(),
          fetchBarbers(),
        ]);
        setServices(sList);
        setBarbers(bList);

        // Pre-select first popular service
        if (sList.length > 0 && formState.selectedServiceIds.length === 0) {
          setFormState((prev) => ({ ...prev, selectedServiceIds: [sList[0].id] }));
        }

        // Check active bookings count for user badge
        if (tg.user?.id) {
          const userBookings = await fetchTelegramBookings({ telegramId: String(tg.user.id) });
          const activeCount = userBookings.filter(
            (b) => b.status === 'CONFIRMED' && new Date(b.startsAt) >= new Date()
          ).length;
          setActiveBookingCount(activeCount);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      } finally {
        setLoadingInitial(false);
      }
    }

    loadData();
  }, [tg.user?.id]);

  // Update client name if tg.user loads later
  useEffect(() => {
    if (tg.user && !formState.clientName) {
      const name = `${tg.user.first_name || ''} ${tg.user.last_name || ''}`.trim() || tg.user.username || '';
      setFormState((prev) => ({ ...prev, clientName: name }));
    }
  }, [tg.user]);

  // Telegram BackButton integration
  useEffect(() => {
    try {
      const webApp = window.Telegram?.WebApp;
      if (!webApp?.BackButton) return;

      if (currentTab === 'booking' && currentStep !== 'service' && currentStep !== 'success') {
        try { webApp.BackButton.show(); } catch (e) {}
        const handleBack = () => {
          tg.haptic.light();
          if (currentStep === 'confirmation') setCurrentStep('contact');
          else if (currentStep === 'contact') setCurrentStep('datetime');
          else if (currentStep === 'datetime') setCurrentStep('barber');
          else if (currentStep === 'barber') setCurrentStep('service');
        };
        try { webApp.BackButton.onClick(handleBack); } catch (e) {}
        return () => {
          try { webApp.BackButton.offClick(handleBack); } catch (e) {}
        };
      } else {
        try { webApp.BackButton.hide(); } catch (e) {}
      }
    } catch (e) {
      console.warn('Telegram BackButton warning:', e);
    }
  }, [currentTab, currentStep]);

  // Handler for toggling services
  const handleToggleService = (serviceId: string) => {
    tg.haptic.selection();
    setFormState((prev) => {
      const exists = prev.selectedServiceIds.includes(serviceId);
      if (exists) {
        if (prev.selectedServiceIds.length === 1) return prev; // Keep at least one
        return {
          ...prev,
          selectedServiceIds: prev.selectedServiceIds.filter((id) => id !== serviceId),
        };
      } else {
        return {
          ...prev,
          selectedServiceIds: [...prev.selectedServiceIds, serviceId],
        };
      }
    });
  };

  // Calculate total selected services duration
  const selectedServices = services.filter((s) => formState.selectedServiceIds.includes(s.id));
  const totalDurationMin = selectedServices.reduce((sum, s) => sum + s.durationMin, 0);

  // Success handler
  const handleBookingSuccess = (booking: Booking) => {
    tg.haptic.success();
    setCompletedBooking(booking);
    setCurrentStep('success');
    setActiveBookingCount((c) => c + 1);
  };

  // Reset booking form
  const handleNewBooking = () => {
    tg.haptic.light();
    setFormState((prev) => ({
      ...prev,
      selectedDate: '',
      selectedTime: '',
      comment: '',
    }));
    setCompletedBooking(null);
    setCurrentStep('service');
    setCurrentTab('booking');
  };

  return (
    <div className="app-container">
      {/* App Header */}
      <Header user={tg.user} />

      {/* Main Content Area */}
      <main className="app-content">
        {currentTab === 'booking' && (
          <>
            {/* Step Bar Indicator */}
            {currentStep !== 'success' && (
              <div className="steps-progress">
                {['service', 'barber', 'datetime', 'contact', 'confirmation'].map((step, idx) => {
                  const stepIndex = ['service', 'barber', 'datetime', 'contact', 'confirmation'].indexOf(currentStep);
                  return (
                    <div
                      key={step}
                      className={`step-bar ${idx === stepIndex ? 'active' : idx < stepIndex ? 'completed' : ''}`}
                    />
                  );
                })}
              </div>
            )}

            {currentStep === 'service' && (
              <ServiceStep
                services={services}
                selectedServiceIds={formState.selectedServiceIds}
                onToggleService={handleToggleService}
                onNext={() => {
                  tg.haptic.light();
                  setCurrentStep('barber');
                }}
                isLoading={loadingInitial}
              />
            )}

            {currentStep === 'barber' && (
              <BarberStep
                barbers={barbers}
                selectedBarberId={formState.selectedBarberId}
                onSelectBarber={(id) => {
                  tg.haptic.selection();
                  setFormState((prev) => ({ ...prev, selectedBarberId: id }));
                }}
                onBack={() => {
                  tg.haptic.light();
                  setCurrentStep('service');
                }}
                onNext={() => {
                  tg.haptic.light();
                  setCurrentStep('datetime');
                }}
                isLoading={loadingInitial}
              />
            )}

            {currentStep === 'datetime' && (
              <DateTimeStep
                barberId={formState.selectedBarberId}
                durationMin={totalDurationMin || 45}
                selectedDate={formState.selectedDate}
                selectedTime={formState.selectedTime}
                onSelectDate={(date) => {
                  tg.haptic.selection();
                  setFormState((prev) => ({ ...prev, selectedDate: date, selectedTime: '' }));
                }}
                onSelectTime={(time) => {
                  tg.haptic.selection();
                  setFormState((prev) => ({ ...prev, selectedTime: time }));
                }}
                onBack={() => {
                  tg.haptic.light();
                  setCurrentStep('barber');
                }}
                onNext={() => {
                  tg.haptic.light();
                  setCurrentStep('contact');
                }}
              />
            )}

            {currentStep === 'contact' && (
              <ContactStep
                clientName={formState.clientName}
                clientPhone={formState.clientPhone}
                comment={formState.comment}
                onChangeName={(name) => setFormState((p) => ({ ...p, clientName: name }))}
                onChangePhone={(phone) => setFormState((p) => ({ ...p, clientPhone: phone }))}
                onChangeComment={(comment) => setFormState((p) => ({ ...p, comment }))}
                onBack={() => {
                  tg.haptic.light();
                  setCurrentStep('datetime');
                }}
                onNext={() => {
                  tg.haptic.light();
                  setCurrentStep('confirmation');
                }}
              />
            )}

            {currentStep === 'confirmation' && (
              <ConfirmationStep
                services={services}
                barbers={barbers}
                selectedServiceIds={formState.selectedServiceIds}
                selectedBarberId={formState.selectedBarberId}
                selectedDate={formState.selectedDate}
                selectedTime={formState.selectedTime}
                clientName={formState.clientName}
                clientPhone={formState.clientPhone}
                comment={formState.comment}
                telegramId={tg.user ? String(tg.user.id) : undefined}
                onBack={() => {
                  tg.haptic.light();
                  setCurrentStep('contact');
                }}
                onSuccess={handleBookingSuccess}
                onSlotTakenError={() => {
                  tg.haptic.warning();
                  setCurrentStep('datetime');
                }}
              />
            )}

            {currentStep === 'success' && completedBooking && (
              <SuccessStep
                booking={completedBooking}
                onGoToMyBookings={() => {
                  tg.haptic.light();
                  setCurrentTab('my-bookings');
                }}
                onNewBooking={handleNewBooking}
              />
            )}
          </>
        )}

        {currentTab === 'my-bookings' && (
          <MyBookingsTab
            telegramId={tg.user ? String(tg.user.id) : undefined}
            userPhone={formState.clientPhone}
            onNewBookingClick={handleNewBooking}
            onShowAlert={(msg) => tg.showAlert(msg)}
            onShowConfirm={(msg) => tg.showConfirm(msg)}
          />
        )}

        {currentTab === 'catalog' && (
          <CatalogTab
            services={services}
            barbers={barbers}
            onBookWithBarber={(barberId) => {
              tg.haptic.light();
              setFormState((prev) => ({ ...prev, selectedBarberId: barberId }));
              setCurrentStep('service');
              setCurrentTab('booking');
            }}
            onBookWithService={(serviceId) => {
              tg.haptic.light();
              setFormState((prev) => ({ ...prev, selectedServiceIds: [serviceId] }));
              setCurrentStep('barber');
              setCurrentTab('booking');
            }}
          />
        )}
      </main>

      {/* Bottom Navigation */}
      <Navigation
        currentTab={currentTab}
        onTabChange={(tab) => {
          tg.haptic.light();
          setCurrentTab(tab);
        }}
        bookingCount={activeBookingCount}
      />
    </div>
  );
};
