import * as React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { Header } from '@/components/layout/header';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';
import { TodayPage } from '@/app/routes/TodayPage';
import { WordsPage } from '@/app/routes/WordsPage';
import { ReviewPage } from '@/app/routes/ReviewPage';
import { StatsPage } from '@/app/routes/StatsPage';
import { AddWordDialog } from '@/features/words/components/AddWordDialog';
import { AddWordStepperModal } from '@/features/words/components/stepper/AddWordStepperModal';
import { useCreateWordMutation } from '@/features/words/api/words-api';
import type { CreateWordInput } from '@/features/words/types';

function AppLayout() {
  const [isAddWordOpen, setIsAddWordOpen] = React.useState(false);
  const createMutation = useCreateWordMutation();

  const handleCreateWord = async (data: CreateWordInput) => {
    await createMutation.mutateAsync(data);
  };

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col font-sans selection:bg-accent-subtle selection:text-ink">
      <Header onOpenAddWord={() => setIsAddWordOpen(true)} />
      
      <main className="flex-1 pb-24 sm:pb-16">
        <Routes>
          <Route path="/" element={<TodayPage />} />
          <Route path="/words" element={<WordsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/stats" element={<StatsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Modern Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* Global Add Word Dialog triggered from Header */}
      <AddWordDialog
        open={isAddWordOpen}
        onOpenChange={setIsAddWordOpen}
        onSubmitWord={handleCreateWord}
        isSubmitting={createMutation.isPending}
      />

      {/* 4-Step Memory Coach Stepper Modal */}
      <AddWordStepperModal />
    </div>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
