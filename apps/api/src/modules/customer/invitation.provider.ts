export const INVITATION_PROVIDER = Symbol("INVITATION_PROVIDER");

export interface InvitationProvider {
  send(input: { email: string; token: string }): Promise<void>;
}

export class DevelopmentInvitationProvider implements InvitationProvider {
  async send(_input: { email: string; token: string }): Promise<void> {}
}
