import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Question {
  id: number;
  question: string;
}

interface PasswordResetState {
  step: 1 | 2 | 3;
  email: string;
  questions: Question[];
  resetToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: PasswordResetState = {
  step: 1,
  email: '',
  questions: [],
  resetToken: null,
  loading: false,
  error: null,
};

const passwordResetSlice = createSlice({
  name: 'passwordReset',
  initialState,
  reducers: {
    setStep: (state, action: PayloadAction<1 | 2 | 3>) => {
      state.step = action.payload;
    },
    setEmail: (state, action: PayloadAction<string>) => {
      state.email = action.payload;
    },
    setQuestions: (state, action: PayloadAction<Question[]>) => {
      state.questions = action.payload;
    },
    setResetToken: (state, action: PayloadAction<string>) => {
      state.resetToken = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    resetState: () => initialState,
  },
});

export const {
  setStep,
  setEmail,
  setQuestions,
  setResetToken,
  setLoading,
  setError,
  resetState,
} = passwordResetSlice.actions;

export default passwordResetSlice.reducer;