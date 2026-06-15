export interface ValidateTokenResponse {
  success: boolean;
  data: {
    isValid: boolean;
    error?: string;
    user?: {
      email: string;
      firstName: string;
      lastName: string;
    };
  };
}

export interface ActivateAccountForm {
  password: string;
  confirmPassword: string;
}

export interface RequestPasswordResetForm {
  email: string;
}

export interface ValidateResetTokenResponse {
  success: boolean;
  data: {
    isValid: boolean;
    error?: string;
    expiresAt?: Date;
  };
}

export interface ResetPasswordForm {
  password: string;
  confirmPassword: string;
}
