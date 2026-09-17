export const VERIFICATION_PROVIDER = Symbol("VERIFICATION_PROVIDER");

export interface VerificationProvider {
  sendEmailVerification(input: { email: string; token: string }): Promise<void>;
}

export class DevelopmentVerificationProvider implements VerificationProvider {
  async sendEmailVerification(_input: {
    email: string;
    token: string;
  }): Promise<void> {
    // Development delivery is intentionally a no-op; the token is returned only
    // by the registration service when NODE_ENV is development.
  }
}
